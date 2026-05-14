import uuid
from datetime import datetime

from sqlalchemy import func, select
from sqlmodel import select as sm_select

from app.core.repository import BaseRepository
from app.modules.pedidos.model import DetallePedido, HistorialEstadoPedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session):
        super().__init__(session, Pedido)

    async def list_by_usuario(
        self, usuario_id: uuid.UUID, skip: int = 0, limit: int = 10
    ) -> list[Pedido]:
        stmt = (
            select(Pedido)
            .where(Pedido.usuario_id == usuario_id, Pedido.deleted_at.is_(None))
            .order_by(Pedido.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self, skip: int = 0, limit: int = 10) -> list[Pedido]:
        stmt = (
            select(Pedido)
            .where(Pedido.deleted_at.is_(None))
            .order_by(Pedido.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_usuario(self, usuario_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Pedido)
            .where(Pedido.usuario_id == usuario_id, Pedido.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def count_all(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Pedido)
            .where(Pedido.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def get_own(
        self, pedido_id: uuid.UUID, usuario_id: uuid.UUID
    ) -> Pedido | None:
        stmt = select(Pedido).where(
            Pedido.id == pedido_id,
            Pedido.usuario_id == usuario_id,
            Pedido.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_productos_for_update(self, producto_ids: list[uuid.UUID]):
        """Load and lock producto rows with SELECT FOR UPDATE."""
        from app.modules.productos.model import Producto

        stmt = (
            select(Producto)
            .where(Producto.id.in_(producto_ids))
            .with_for_update()
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    def __init__(self, session):
        super().__init__(session, DetallePedido)

    async def list_by_pedido(self, pedido_id: uuid.UUID) -> list[DetallePedido]:
        stmt = (
            select(DetallePedido)
            .where(DetallePedido.pedido_id == pedido_id)
            .order_by(DetallePedido.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class HistorialRepository(BaseRepository[HistorialEstadoPedido]):
    def __init__(self, session):
        super().__init__(session, HistorialEstadoPedido)

    async def list_by_pedido(
        self, pedido_id: uuid.UUID
    ) -> list[HistorialEstadoPedido]:
        stmt = (
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id == pedido_id)
            .order_by(HistorialEstadoPedido.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def append(
        self,
        pedido_id: uuid.UUID,
        estado_codigo: str,
        observacion: str | None = None,
    ) -> HistorialEstadoPedido:
        entry = HistorialEstadoPedido(
            pedido_id=pedido_id,
            estado_codigo=estado_codigo,
            observacion=observacion,
        )
        self.session.add(entry)
        await self.session.flush()
        await self.session.refresh(entry)
        return entry
