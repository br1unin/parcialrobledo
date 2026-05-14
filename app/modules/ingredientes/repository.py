import uuid

from sqlalchemy import func, select

from app.core.repository import BaseRepository
from app.modules.productos.model import Ingrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    def __init__(self, session):
        super().__init__(session, Ingrediente)

    async def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        stmt = select(Ingrediente).where(Ingrediente.nombre == nombre)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_with_filters(
        self,
        es_alergeno: bool | None,
        skip: int,
        limit: int,
    ) -> list[Ingrediente]:
        stmt = select(Ingrediente)
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)
        stmt = stmt.offset(skip).limit(limit).order_by(Ingrediente.nombre)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_with_filters(self, es_alergeno: bool | None) -> int:
        stmt = select(func.count()).select_from(Ingrediente)
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def get_by_id_any(self, id: uuid.UUID) -> Ingrediente | None:
        """Get ingrediente by id without deleted_at filter (ingrediente has no soft delete)."""
        stmt = select(Ingrediente).where(Ingrediente.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
