from sqlmodel import select

from app.core.repository import BaseRepository
from app.modules.admin.model import EstadoPedido, FormaPago, Rol


class RolRepository(BaseRepository[Rol]):
    def __init__(self, session):
        super().__init__(session, Rol)

    async def get_all(self) -> list[Rol]:
        stmt = select(Rol)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())


class FormaPagoRepository(BaseRepository[FormaPago]):
    def __init__(self, session):
        super().__init__(session, FormaPago)

    async def get_all(self) -> list[FormaPago]:
        stmt = select(FormaPago)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def toggle_habilitado(self, codigo: str, habilitado: bool) -> FormaPago | None:
        stmt = select(FormaPago).where(FormaPago.codigo == codigo)
        result = await self.session.execute(stmt)
        forma_pago = result.scalar_one_or_none()
        if forma_pago is None:
            return None
        forma_pago.habilitado = habilitado
        self.session.add(forma_pago)
        await self.session.flush()
        await self.session.refresh(forma_pago)
        return forma_pago


class EstadoPedidoRepository(BaseRepository[EstadoPedido]):
    def __init__(self, session):
        super().__init__(session, EstadoPedido)

    async def get_all_ordered(self) -> list[EstadoPedido]:
        stmt = select(EstadoPedido).order_by(EstadoPedido.orden.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
