import asyncio

import bcrypt
from sqlalchemy import select

from app.core.uow import AsyncSessionLocal
from app.modules.admin.model import EstadoPedido, FormaPago, Rol
from app.modules.usuarios.model import Usuario, UsuarioRol


ROLES = [
    Rol(codigo="ADMIN", nombre="Administrador", descripcion="Acceso total al sistema"),
    Rol(codigo="STOCK", nombre="Gestor de Stock", descripcion="Gestión de inventario y catálogo"),
    Rol(codigo="PEDIDOS", nombre="Gestor de Pedidos", descripcion="Gestión del flujo operativo de pedidos"),
    Rol(codigo="CLIENT", nombre="Cliente", descripcion="Usuario final de la tienda"),
]

ESTADOS_PEDIDO = [
    EstadoPedido(codigo="PENDIENTE", descripcion="Pedido creado, pago pendiente", orden=1, es_terminal=False),
    EstadoPedido(codigo="CONFIRMADO", descripcion="Pago procesado y confirmado", orden=2, es_terminal=False),
    EstadoPedido(codigo="EN_PREP", descripcion="En preparación en cocina", orden=3, es_terminal=False),
    EstadoPedido(codigo="EN_CAMINO", descripcion="Despachado al cliente", orden=4, es_terminal=False),
    EstadoPedido(codigo="ENTREGADO", descripcion="Entrega confirmada", orden=5, es_terminal=True),
    EstadoPedido(codigo="CANCELADO", descripcion="Pedido cancelado", orden=6, es_terminal=True),
]

FORMAS_PAGO = [
    FormaPago(codigo="MERCADOPAGO", nombre="MercadoPago", habilitado=True),
    FormaPago(codigo="EFECTIVO", nombre="Efectivo", habilitado=True),
    FormaPago(codigo="TRANSFERENCIA", nombre="Transferencia bancaria", habilitado=True),
]


async def upsert_by_codigo(session, model_class, rows) -> None:
    for row in rows:
        existing = await session.get(model_class, row.codigo)
        if existing is None:
            session.add(row)


async def seed_admin_user(session) -> None:
    result = await session.execute(select(Usuario).where(Usuario.email == "admin@foodstore.com"))
    admin = result.scalar_one_or_none()

    if admin is None:
        admin = Usuario(
            nombre="Admin",
            apellido="FoodStore",
            email="admin@foodstore.com",
            password_hash=bcrypt.hashpw("Admin1234!".encode("utf-8"), bcrypt.gensalt(rounds=12)).decode(
                "utf-8"
            ),
            is_active=True,
        )
        session.add(admin)
        await session.flush()

    existing_link = await session.get(UsuarioRol, (admin.id, "ADMIN"))
    if existing_link is None:
        session.add(UsuarioRol(usuario_id=admin.id, rol_codigo="ADMIN"))


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        await upsert_by_codigo(session, Rol, ROLES)
        await upsert_by_codigo(session, EstadoPedido, ESTADOS_PEDIDO)
        await upsert_by_codigo(session, FormaPago, FORMAS_PAGO)
        await session.flush()
        await seed_admin_user(session)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
