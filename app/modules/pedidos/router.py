import uuid

from fastapi import APIRouter, Depends, status

from app.core.security import CurrentUser, get_current_user, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.pedidos import service
from app.modules.pedidos.schemas import (
    EstadoUpdate,
    HistorialResponse,
    PedidoCreate,
    PedidoListResponse,
    PedidoResponse,
)

router = APIRouter()


@router.post("/", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
async def create_pedido(
    data: PedidoCreate,
    current_user: CurrentUser = Depends(require_role(["CLIENT"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_pedido(uow, current_user, data)


@router.get("/", response_model=PedidoListResponse)
async def list_pedidos(
    page: int = 1,
    limit: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    if "CLIENT" in current_user.roles:
        return await service.list_pedidos_cliente(uow, current_user.id, page, limit)
    return await service.list_pedidos_admin(uow, page, limit)


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def get_pedido(
    pedido_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.get_pedido(uow, pedido_id, current_user)


@router.get("/{pedido_id}/historial", response_model=list[HistorialResponse])
async def get_historial(
    pedido_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.get_historial(uow, pedido_id, current_user)


@router.patch("/{pedido_id}/estado", response_model=PedidoResponse)
async def advance_estado(
    pedido_id: uuid.UUID,
    data: EstadoUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.advance_estado(uow, pedido_id, current_user, data)
