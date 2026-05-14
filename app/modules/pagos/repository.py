from sqlalchemy import select

from app.core.repository import BaseRepository
from app.modules.pagos.model import Pago


class PagoRepository(BaseRepository[Pago]):
    def __init__(self, session):
        super().__init__(session, Pago)

    async def get_by_mp_payment_id(self, mp_payment_id: str) -> Pago | None:
        stmt = select(Pago).where(Pago.mp_payment_id == mp_payment_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_external_reference(self, external_reference: str) -> Pago | None:
        stmt = select(Pago).where(Pago.external_reference == external_reference)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
