import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.refreshtokens.schemas import SessionResponse


async def list_own_sessions(uow: UnitOfWork, usuario_id: uuid.UUID) -> list[SessionResponse]:
    now = datetime.now(timezone.utc)
    tokens = await uow.refresh_tokens.list_active_for_user(usuario_id, now)
    return [SessionResponse.model_validate(t) for t in tokens]


async def revoke_own_session(uow: UnitOfWork, token_id: uuid.UUID, usuario_id: uuid.UUID) -> None:
    token = await uow.refresh_tokens.get_own_by_id(token_id, usuario_id)
    if token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    await uow.refresh_tokens.revoke_token(token.id)


async def revoke_all_own_sessions(uow: UnitOfWork, usuario_id: uuid.UUID) -> None:
    await uow.refresh_tokens.revoke_all_for_user(usuario_id)


async def admin_list_sessions(uow: UnitOfWork, target_usuario_id: uuid.UUID) -> list[SessionResponse]:
    now = datetime.now(timezone.utc)
    tokens = await uow.refresh_tokens.list_active_for_user(target_usuario_id, now)
    return [SessionResponse.model_validate(t) for t in tokens]


async def admin_revoke_all_sessions(uow: UnitOfWork, target_usuario_id: uuid.UUID) -> None:
    await uow.refresh_tokens.revoke_all_for_user(target_usuario_id)
