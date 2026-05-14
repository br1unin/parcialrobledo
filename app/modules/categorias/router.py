import uuid

from fastapi import APIRouter, Depends, status

from app.core.security import CurrentUser, get_current_user, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.categorias import service
from app.modules.categorias.schemas import CategoriaCreate, CategoriaResponse, CategoriaUpdate

router = APIRouter()


@router.get("/", response_model=list[CategoriaResponse])
async def list_categories(
    _: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.get_tree(uow)


@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoriaCreate,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_categoria(uow, data)


@router.patch("/{categoria_id}", response_model=CategoriaResponse)
async def update_category(
    categoria_id: uuid.UUID,
    data: CategoriaUpdate,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.update_categoria(uow, categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    categoria_id: uuid.UUID,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    await service.delete_categoria(uow, categoria_id)
