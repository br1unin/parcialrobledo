from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


async_engine = create_async_engine(settings.DATABASE_URL, future=True)
AsyncSessionLocal = async_sessionmaker(bind=async_engine, class_=AsyncSession, expire_on_commit=False)


class UnitOfWork:
    def __init__(self):
        self.session: AsyncSession | None = None

    async def __aenter__(self):
        self.session = AsyncSessionLocal()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
        else:
            await self.session.commit()
        await self.session.close()

    async def commit(self):
        await self.session.commit()

    async def rollback(self):
        await self.session.rollback()


async def get_uow() -> AsyncGenerator[UnitOfWork, None]:
    async with UnitOfWork() as uow:
        yield uow
