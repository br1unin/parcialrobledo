import uuid
from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.categorias.model import Categoria
from app.modules.productos.model import Ingrediente, Producto
from app.modules.productos.schemas import (
    CategoriaBasic,
    CategoriaIds,
    IngredienteEnProducto,
    IngredienteIds,
    ProductoCreate,
    ProductoListResponse,
    ProductoResponse,
    ProductoUpdate,
    StockAdjust,
)


async def _build_response(uow: UnitOfWork, producto: Producto) -> ProductoResponse:
    pc_rows = await uow.productos.get_categorias(producto.id)
    pi_rows = await uow.productos.get_ingredientes(producto.id)

    categorias: list[CategoriaBasic] = []
    for pc in pc_rows:
        from sqlalchemy import select
        stmt = select(Categoria).where(Categoria.id == pc.categoria_id)
        result = await uow.session.execute(stmt)
        cat = result.scalar_one_or_none()
        if cat:
            categorias.append(CategoriaBasic.model_validate(cat))

    ingredientes: list[IngredienteEnProducto] = []
    for pi in pi_rows:
        from sqlalchemy import select as sel
        stmt = sel(Ingrediente).where(Ingrediente.id == pi.ingrediente_id)
        result = await uow.session.execute(stmt)
        ing = result.scalar_one_or_none()
        if ing:
            ingredientes.append(
                IngredienteEnProducto(
                    id=ing.id,
                    nombre=ing.nombre,
                    es_alergeno=ing.es_alergeno,
                    es_removible=pi.es_removible,
                )
            )

    return ProductoResponse(
        id=producto.id,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio=producto.precio,
        stock_cantidad=producto.stock_cantidad,
        disponible=producto.disponible,
        imagen_url=producto.imagen_url,
        created_at=producto.created_at,
        categorias=categorias,
        ingredientes=ingredientes,
    )


async def create_producto(uow: UnitOfWork, data: ProductoCreate) -> ProductoResponse:
    producto = Producto(
        codigo=str(uuid4())[:8],
        nombre=data.nombre,
        precio=data.precio,
        stock_cantidad=data.stock_cantidad,
        disponible=data.disponible,
        descripcion=data.descripcion,
        imagen_url=data.imagen_url,
    )
    created = await uow.productos.create(producto)
    return await _build_response(uow, created)


async def list_catalog(
    uow: UnitOfWork,
    page: int,
    limit: int,
    categoria_id: uuid.UUID | None = None,
    busqueda: str | None = None,
    excluir_alergenos: str | None = None,
) -> ProductoListResponse:
    alergeno_ids: list[uuid.UUID] | None = None
    if excluir_alergenos:
        alergeno_ids = [uuid.UUID(x.strip()) for x in excluir_alergenos.split(",") if x.strip()]

    skip = (page - 1) * limit
    items = await uow.productos.list_catalog(skip, limit, categoria_id, busqueda, alergeno_ids)
    total = await uow.productos.count_catalog(categoria_id, busqueda, alergeno_ids)

    responses = [await _build_response(uow, p) for p in items]
    return ProductoListResponse(items=responses, total=total, page=page, limit=limit)


async def get_producto(uow: UnitOfWork, producto_id: uuid.UUID) -> ProductoResponse:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return await _build_response(uow, producto)


async def update_producto(
    uow: UnitOfWork,
    producto_id: uuid.UUID,
    data: ProductoUpdate,
) -> ProductoResponse:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    if data.nombre is not None:
        producto.nombre = data.nombre
    if data.precio is not None:
        producto.precio = data.precio
    if data.stock_cantidad is not None:
        producto.stock_cantidad = data.stock_cantidad
    if data.disponible is not None:
        producto.disponible = data.disponible
    if data.descripcion is not None:
        producto.descripcion = data.descripcion
    if data.imagen_url is not None:
        producto.imagen_url = data.imagen_url
    producto.updated_at = datetime.utcnow()

    updated = await uow.productos.update(producto)
    return await _build_response(uow, updated)


async def delete_producto(uow: UnitOfWork, producto_id: uuid.UUID) -> None:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    await uow.productos.soft_delete(producto)


async def adjust_stock(
    uow: UnitOfWork,
    producto_id: uuid.UUID,
    data: StockAdjust,
) -> ProductoResponse:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    new_stock = producto.stock_cantidad + data.delta
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El stock no puede quedar negativo",
        )
    producto.stock_cantidad = new_stock
    producto.updated_at = datetime.utcnow()
    updated = await uow.productos.update(producto)
    return await _build_response(uow, updated)


async def set_categorias(
    uow: UnitOfWork,
    producto_id: uuid.UUID,
    data: CategoriaIds,
) -> ProductoResponse:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    await uow.productos.replace_categorias(producto_id, data.categoria_ids)
    return await _build_response(uow, producto)


async def set_ingredientes(
    uow: UnitOfWork,
    producto_id: uuid.UUID,
    data: IngredienteIds,
) -> ProductoResponse:
    producto = await uow.productos.get_by_id(producto_id)
    if producto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    items = [{"ingrediente_id": i.ingrediente_id, "es_removible": i.es_removible} for i in data.ingredientes]
    await uow.productos.replace_ingredientes(producto_id, items)
    return await _build_response(uow, producto)
