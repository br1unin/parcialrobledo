import uuid

from fastapi import APIRouter, Depends, status

from app.core.security import CurrentUser, get_current_user, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.refreshtokens.schemas import SessionResponse
from app.modules.refreshtokens import service

router = APIRouter(prefix="/auth/sessions", tags=["sessions"])


# ── Own-session routes ──────────────────────────────────────────────────────

@router.get("/", response_model=list[SessionResponse])
async def get_own_sessions(
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> list[SessionResponse]:
    return await service.list_own_sessions(uow, current_user.id)


# IMPORTANT: /usuario/{id} MUST be declared before /{token_id} to avoid
# FastAPI treating "usuario" as a token_id path segment.

@router.get("/usuario/{id}", response_model=list[SessionResponse])
async def admin_get_sessions(
    id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
) -> list[SessionResponse]:
    return await service.admin_list_sessions(uow, id)


@router.delete("/usuario/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_revoke_all(
    id: uuid.UUID,
    current_user: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    await service.admin_revoke_all_sessions(uow, id)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_all_own_sessions(
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    await service.revoke_all_own_sessions(uow, current_user.id)


@router.delete("/{token_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_own_session(
    token_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> None:
    await service.revoke_own_session(uow, token_id, current_user.id)
