import uuid
from decimal import Decimal

from fastapi import HTTPException, status

from app.core.security import CurrentUser
from app.core.uow import UnitOfWork
from app.modules.pedidos.model import DetallePedido, Pedido
from app.modules.pedidos.schemas import (
    DetalleResponse,
    EstadoUpdate,
    HistorialResponse,
    PedidoCreate,
    PedidoListItem,
    PedidoListResponse,
    PedidoResponse,
)

# FSM constants
VALID_TRANSITIONS: dict[str, list[str]] = {
    "CONFIRMADO": ["EN_CAMINO"],
    "EN_CAMINO": ["ENTREGADO"],
}

TERMINAL_STATES: set[str] = {"ENTREGADO", "CANCELADO"}


def _build_detalle_response(detalle: DetallePedido) -> DetalleResponse:
    return DetalleResponse(
        id=detalle.id,
        producto_id=detalle.producto_id,
        nombre_snapshot=detalle.nombre_snapshot,
        precio_snapshot=detalle.precio_snapshot,
        cantidad=detalle.cantidad,
        personalizacion=detalle.personalizacion,
        subtotal=detalle.subtotal,
    )


def _build_pedido_response(pedido: Pedido, detalles: list[DetallePedido]) -> PedidoResponse:
    return PedidoResponse(
        id=pedido.id,
        usuario_id=pedido.usuario_id,
        estado_codigo=pedido.estado_codigo,
        nombre_cliente_snapshot=pedido.nombre_cliente_snapshot,
        telefono_snapshot=pedido.telefono_snapshot,
        direccion_snapshot=pedido.direccion_snapshot,
        subtotal=pedido.subtotal,
        costo_envio=pedido.costo_envio,
        total=pedido.total,
        notas=pedido.notas,
        created_at=pedido.created_at,
        updated_at=pedido.updated_at,
        detalles=[_build_detalle_response(d) for d in detalles],
    )


async def create_pedido(
    uow: UnitOfWork,
    current_user: CurrentUser,
    data: PedidoCreate,
) -> PedidoResponse:
    # Load and lock productos with SELECT FOR UPDATE
    producto_ids = [item.producto_id for item in data.items]
    productos = await uow.pedidos.get_productos_for_update(producto_ids)

    # Build lookup map
    producto_map = {p.id: p for p in productos}

    # Validate all requested products exist
    for item in data.items:
        if item.producto_id not in producto_map:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Producto {item.producto_id} no encontrado",
            )

    # Validate stock
    stock_errors = []
    for item in data.items:
        producto = producto_map[item.producto_id]
        if producto.stock_cantidad < item.cantidad:
            stock_errors.append(
                f"Stock insuficiente para '{producto.nombre}': "
                f"disponible={producto.stock_cantidad}, solicitado={item.cantidad}"
            )
    if stock_errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="; ".join(stock_errors),
        )

    # Load direccion and validate ownership
    direccion = await uow.direcciones.get_own(
        data.direccion_entrega_id, current_user.id
    )
    if direccion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dirección de entrega no encontrada",
        )

    # Build address snapshot
    direccion_snapshot = (
        f"{direccion.calle} {direccion.numero}, {direccion.comuna}, {direccion.ciudad}"
    )

    # Build detalle records and calculate totals
    detalle_records = []
    subtotal = Decimal("0.00")
    for item in data.items:
        producto = producto_map[item.producto_id]
        item_subtotal = producto.precio * item.cantidad
        subtotal += item_subtotal
        detalle_records.append(
            DetallePedido(
                producto_id=item.producto_id,
                nombre_snapshot=producto.nombre,
                precio_snapshot=producto.precio,
                cantidad=item.cantidad,
                personalizacion=item.personalizacion,
                subtotal=item_subtotal,
            )
        )

    costo_envio = Decimal("50.00")
    total = subtotal + costo_envio

    # Create the Pedido
    pedido = Pedido(
        usuario_id=current_user.id,
        direccion_entrega_id=data.direccion_entrega_id,
        estado_codigo="PENDIENTE",
        nombre_cliente_snapshot=f"{current_user.nombre} {current_user.apellido}",
        telefono_snapshot=getattr(current_user, "telefono", None),
        direccion_snapshot=direccion_snapshot,
        subtotal=subtotal,
        costo_envio=costo_envio,
        total=total,
        notas=data.notas,
    )
    pedido = await uow.pedidos.create(pedido)

    # Assign pedido_id and persist detalles
    created_detalles = []
    for detalle in detalle_records:
        detalle.pedido_id = pedido.id
        created = await uow.detalles_pedido.create(detalle)
        created_detalles.append(created)

    # Insert initial history entry
    await uow.historial_pedido.append(pedido.id, "PENDIENTE")

    # Decrement stock
    for item in data.items:
        producto = producto_map[item.producto_id]
        producto.stock_cantidad -= item.cantidad
        await uow.productos.update(producto)

    return _build_pedido_response(pedido, created_detalles)


async def list_pedidos_cliente(
    uow: UnitOfWork,
    usuario_id: uuid.UUID,
    page: int = 1,
    limit: int = 10,
) -> PedidoListResponse:
    skip = (page - 1) * limit
    pedidos = await uow.pedidos.list_by_usuario(usuario_id, skip, limit)
    total = await uow.pedidos.count_by_usuario(usuario_id)
    items = [
        PedidoListItem(
            id=p.id,
            estado_codigo=p.estado_codigo,
            total=p.total,
            created_at=p.created_at,
        )
        for p in pedidos
    ]
    return PedidoListResponse(items=items, total=total, page=page, limit=limit)


async def list_pedidos_admin(
    uow: UnitOfWork,
    page: int = 1,
    limit: int = 10,
) -> PedidoListResponse:
    skip = (page - 1) * limit
    pedidos = await uow.pedidos.list_all(skip, limit)
    total = await uow.pedidos.count_all()
    items = [
        PedidoListItem(
            id=p.id,
            estado_codigo=p.estado_codigo,
            nombre_cliente_snapshot=p.nombre_cliente_snapshot,
            total=p.total,
            created_at=p.created_at,
        )
        for p in pedidos
    ]
    return PedidoListResponse(items=items, total=total, page=page, limit=limit)


async def get_pedido(
    uow: UnitOfWork,
    pedido_id: uuid.UUID,
    current_user: CurrentUser,
) -> PedidoResponse:
    if "CLIENT" in current_user.roles:
        pedido = await uow.pedidos.get_own(pedido_id, current_user.id)
        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )
    else:
        pedido = await uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )

    detalles = await uow.detalles_pedido.list_by_pedido(pedido_id)
    return _build_pedido_response(pedido, detalles)


async def get_historial(
    uow: UnitOfWork,
    pedido_id: uuid.UUID,
    current_user: CurrentUser,
) -> list[HistorialResponse]:
    if "CLIENT" in current_user.roles:
        pedido = await uow.pedidos.get_own(pedido_id, current_user.id)
        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )
    else:
        pedido = await uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )

    historial = await uow.historial_pedido.list_by_pedido(pedido_id)
    return [
        HistorialResponse(
            id=h.id,
            estado_codigo=h.estado_codigo,
            observacion=h.observacion,
            created_at=h.created_at,
        )
        for h in historial
    ]


async def confirm_pedido(uow: UnitOfWork, pedido_id: uuid.UUID) -> None:
    """Transition a PENDIENTE pedido to CONFIRMADO, called exclusively by the payment webhook."""
    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        return

    # Idempotent: already confirmed, nothing to do
    if pedido.estado_codigo == "CONFIRMADO":
        return

    pedido.estado_codigo = "CONFIRMADO"
    await uow.pedidos.update(pedido)
    await uow.historial_pedido.append(pedido_id, "CONFIRMADO", "Pago confirmado por MercadoPago")


async def advance_estado(
    uow: UnitOfWork,
    pedido_id: uuid.UUID,
    current_user: CurrentUser,
    data: EstadoUpdate,
) -> PedidoResponse:
    # Load pedido with ownership check for CLIENT
    if "CLIENT" in current_user.roles:
        pedido = await uow.pedidos.get_own(pedido_id, current_user.id)
        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )
    else:
        pedido = await uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )

    current_estado = pedido.estado_codigo
    nuevo_estado = data.nuevo_estado

    # Check terminal state
    if current_estado in TERMINAL_STATES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"El pedido está en estado terminal '{current_estado}' y no puede cambiar",
        )

    # Handle CANCELADO transition
    if nuevo_estado == "CANCELADO":
        if current_estado == "PENDIENTE":
            # CLIENT, PEDIDOS, ADMIN all allowed
            pass
        elif current_estado == "CONFIRMADO":
            # Only PEDIDOS and ADMIN
            if not any(r in current_user.roles for r in ["PEDIDOS", "ADMIN"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Solo PEDIDOS o ADMIN pueden cancelar un pedido confirmado",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"No se puede cancelar un pedido en estado '{current_estado}'",
            )
    else:
        # Check FSM valid transitions
        valid_next = VALID_TRANSITIONS.get(current_estado, [])
        if nuevo_estado not in valid_next:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Transición inválida: '{current_estado}' → '{nuevo_estado}'. "
                    f"Transiciones válidas: {valid_next}"
                ),
            )

    # Apply transition
    pedido.estado_codigo = nuevo_estado
    pedido = await uow.pedidos.update(pedido)

    # Insert history entry
    await uow.historial_pedido.append(pedido_id, nuevo_estado, data.observacion)

    detalles = await uow.detalles_pedido.list_by_pedido(pedido_id)
    return _build_pedido_response(pedido, detalles)
