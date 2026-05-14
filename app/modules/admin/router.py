from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.admin.schemas import (
    DashboardStats,
    EstadoPedidoRead,
    FormaPagoRead,
    FormaPagoToggleRequest,
    RolRead,
)
from app.modules.admin.service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/roles", response_model=list[RolRead])
async def list_roles(
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    service = AdminService(uow)
    return await service.list_roles()


@router.get("/formas-pago", response_model=list[FormaPagoRead])
async def list_formas_pago(
    uow: UnitOfWork = Depends(get_uow),
):
    service = AdminService(uow)
    return await service.list_formas_pago()


@router.patch("/formas-pago/{codigo}/habilitado", response_model=FormaPagoRead)
async def toggle_forma_pago(
    codigo: str,
    body: FormaPagoToggleRequest,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    service = AdminService(uow)
    return await service.toggle_forma_pago(codigo, body.habilitado)


@router.get("/estados-pedido", response_model=list[EstadoPedidoRead])
async def list_estados_pedido(
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    service = AdminService(uow)
    return await service.list_estados_pedido()


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    service = AdminService(uow)
    return await service.get_dashboard_stats()
