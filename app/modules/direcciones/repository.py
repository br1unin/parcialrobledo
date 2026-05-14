import uuid

from sqlalchemy import update
from sqlmodel import func, select

from app.core.repository import BaseRepository
from app.modules.direcciones.model import DireccionEntrega


class DireccionRepository(BaseRepository[DireccionEntrega]):
    def __init__(self, session):
        super().__init__(session, DireccionEntrega)

    async def list_by_usuario(self, usuario_id: uuid.UUID) -> list[DireccionEntrega]:
        stmt = (
            select(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id, DireccionEntrega.deleted_at.is_(None))
            .order_by(DireccionEntrega.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_own(self, id: uuid.UUID, usuario_id: uuid.UUID) -> DireccionEntrega | None:
        stmt = select(DireccionEntrega).where(
            DireccionEntrega.id == id,
            DireccionEntrega.usuario_id == usuario_id,
            DireccionEntrega.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_activas(self, usuario_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id, DireccionEntrega.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def get_oldest_activa(self, usuario_id: uuid.UUID, exclude_id: uuid.UUID) -> DireccionEntrega | None:
        stmt = (
            select(DireccionEntrega)
            .where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
                DireccionEntrega.id != exclude_id,
            )
            .order_by(DireccionEntrega.created_at.asc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def unset_all_principal(self, usuario_id: uuid.UUID) -> None:
        stmt = (
            update(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id, DireccionEntrega.deleted_at.is_(None))
            .values(es_principal=False)
        )
        await self.session.execute(stmt)

    async def set_principal(self, id: uuid.UUID) -> None:
        stmt = update(DireccionEntrega).where(DireccionEntrega.id == id).values(es_principal=True)
        await self.session.execute(stmt)
