from fastapi import APIRouter, Depends, status

from app.core.security import CurrentUser, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.pagos import service
from app.modules.pagos.schemas import EfectivoRequest, EfectivoResponse, PreferenceRequest, PreferenceResponse, TransferenciaRequest, TransferenciaResponse, WebhookPayload

router = APIRouter()


@router.post("/preference", response_model=PreferenceResponse, status_code=status.HTTP_200_OK)
async def create_preference(
    data: PreferenceRequest,
    current_user: CurrentUser = Depends(require_role(["CLIENT"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_preference(uow, current_user, data)


@router.post("/efectivo", response_model=EfectivoResponse, status_code=status.HTTP_200_OK)
async def pay_efectivo(
    data: EfectivoRequest,
    current_user: CurrentUser = Depends(require_role(["CLIENT"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_efectivo_payment(uow, current_user, data)


@router.post("/transferencia", response_model=TransferenciaResponse, status_code=status.HTTP_200_OK)
async def pay_transferencia(
    data: TransferenciaRequest,
    current_user: CurrentUser = Depends(require_role(["CLIENT"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.create_transferencia_payment(uow, current_user, data)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook(
    payload: WebhookPayload,
    uow: UnitOfWork = Depends(get_uow),
):
    await service.process_webhook(uow, payload)
    return {"status": "ok"}
