import uuid

from fastapi import APIRouter, Depends
from starlette.responses import Response

from app.core.security import CurrentUser, get_current_user
from app.core.uow import UnitOfWork, get_uow
from app.modules.direcciones.schemas import DireccionCreate, DireccionResponse, DireccionUpdate
from app.modules.direcciones.service import (
    create_direccion,
    delete_direccion,
    list_direcciones,
    set_predeterminada,
    update_direccion,
)

router = APIRouter()


@router.post("/", response_model=DireccionResponse, status_code=201)
async def create(
    data: DireccionCreate,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await create_direccion(uow, current_user.id, data)


@router.get("/", response_model=list[DireccionResponse])
async def list_all(
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await list_direcciones(uow, current_user.id)


@router.patch("/{id}", response_model=DireccionResponse)
async def update(
    id: uuid.UUID,
    data: DireccionUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await update_direccion(uow, id, current_user.id, data)


@router.delete("/{id}", status_code=204)
async def delete(
    id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    await delete_direccion(uow, id, current_user.id)
    return Response(status_code=204)


@router.patch("/{id}/predeterminada", response_model=DireccionResponse)
async def set_default(
    id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await set_predeterminada(uow, id, current_user.id)
