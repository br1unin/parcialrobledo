import uuid
from datetime import datetime, timezone

from sqlalchemy import update
from sqlmodel import select

from app.core.repository import BaseRepository
from app.modules.refreshtokens.model import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session):
        super().__init__(session, RefreshToken)

    async def list_active_for_user(self, usuario_id: uuid.UUID, now: datetime) -> list[RefreshToken]:
        stmt = select(RefreshToken).where(
            RefreshToken.usuario_id == usuario_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_own_by_id(self, token_id: uuid.UUID, usuario_id: uuid.UUID) -> RefreshToken | None:
        stmt = select(RefreshToken).where(
            RefreshToken.id == token_id,
            RefreshToken.usuario_id == usuario_id,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_all_for_user(self, usuario_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            update(RefreshToken)
            .where(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await self.session.execute(stmt)

    async def revoke_token(self, token_id: uuid.UUID) -> None:
        token = await self.get_by_id(token_id)
        if token and token.revoked_at is None:
            token.revoked_at = datetime.now(timezone.utc)
            self.session.add(token)
            await self.session.flush()
