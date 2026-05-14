import uuid

from fastapi import APIRouter, Depends, status

from app.core.security import CurrentUser, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.productos import service
from app.modules.productos.schemas import (
    CategoriaIds,
    IngredienteIds,
    ProductoCreate,
    ProductoListResponse,
    ProductoResponse,
    ProductoUpdate,
    StockAdjust,
)

router = APIRouter()


@router.get("/", response_model=ProductoListResponse)
async def list_catalog(
    page: int = 1,
    limit: int = 20,
    categoria_id: uuid.UUID | None = None,
    busqueda: str | None = None,
    excluir_alergenos: str | None = None,
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.list_catalog(uow, page, limit, categoria_id, busqueda, excluir_alergenos)


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
async def create_producto(
    data: ProductoCreate,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_producto(uow, data)


@router.get("/{producto_id}", response_model=ProductoResponse)
async def get_producto(
    producto_id: uuid.UUID,
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.get_producto(uow, producto_id)


@router.patch("/{producto_id}", response_model=ProductoResponse)
async def update_producto(
    producto_id: uuid.UUID,
    data: ProductoUpdate,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.update_producto(uow, producto_id, data)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_producto(
    producto_id: uuid.UUID,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    await service.delete_producto(uow, producto_id)


@router.patch("/{producto_id}/stock", response_model=ProductoResponse)
async def adjust_stock(
    producto_id: uuid.UUID,
    data: StockAdjust,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.adjust_stock(uow, producto_id, data)


@router.put("/{producto_id}/categorias", response_model=ProductoResponse)
async def set_categorias(
    producto_id: uuid.UUID,
    data: CategoriaIds,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.set_categorias(uow, producto_id, data)


@router.put("/{producto_id}/ingredientes", response_model=ProductoResponse)
async def set_ingredientes(
    producto_id: uuid.UUID,
    data: IngredienteIds,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.set_ingredientes(uow, producto_id, data)
