import uuid

from fastapi import APIRouter, Depends, status

from app.core.security import CurrentUser, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.ingredientes import service
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteListResponse,
    IngredienteResponse,
    IngredienteUpdate,
)

router = APIRouter()


@router.get("/", response_model=IngredienteListResponse)
async def list_ingredientes(
    es_alergeno: bool | None = None,
    page: int = 1,
    limit: int = 20,
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.list_ingredientes(uow, es_alergeno, page, limit)


@router.post("/", response_model=IngredienteResponse, status_code=status.HTTP_201_CREATED)
async def create_ingrediente(
    data: IngredienteCreate,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_ingrediente(uow, data)


@router.patch("/{ingrediente_id}", response_model=IngredienteResponse)
async def update_ingrediente(
    ingrediente_id: uuid.UUID,
    data: IngredienteUpdate,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.update_ingrediente(uow, ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingrediente(
    ingrediente_id: uuid.UUID,
    _: CurrentUser = Depends(require_role(["ADMIN", "STOCK"])),
    uow: UnitOfWork = Depends(get_uow),
):
    await service.delete_ingrediente(uow, ingrediente_id)
