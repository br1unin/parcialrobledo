from datetime import datetime
from typing import Any, Generic, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel, func, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    def __init__(self, session: AsyncSession, model_class: type[T]):
        self.session = session
        self.model_class = model_class

    async def get_by_id(self, id: Any) -> T | None:
        stmt = select(self.model_class).where(self.model_class.id == id)
        if hasattr(self.model_class, "deleted_at"):
            stmt = stmt.where(self.model_class.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 20) -> list[T]:
        stmt = select(self.model_class).offset(skip).limit(limit)
        if hasattr(self.model_class, "deleted_at"):
            stmt = stmt.where(self.model_class.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self) -> int:
        stmt = select(func.count()).select_from(self.model_class)
        if hasattr(self.model_class, "deleted_at"):
            stmt = stmt.where(self.model_class.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def create(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def soft_delete(self, entity: T) -> None:
        if not hasattr(entity, "deleted_at"):
            raise AttributeError("Model does not support soft delete")
        entity.deleted_at = datetime.utcnow()
        self.session.add(entity)
        await self.session.flush()

    async def hard_delete(self, entity: T) -> None:
        await self.session.delete(entity)
        await self.session.flush()
