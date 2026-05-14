from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select

from app.core.uow import UnitOfWork
from app.modules.admin.schemas import (
    DashboardStats,
    EstadoPedidoRead,
    FormaPagoRead,
    PedidosPorEstado,
    RolRead,
)


class AdminService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

    async def list_roles(self) -> list[RolRead]:
        rows = await self.uow.roles_repo.get_all()
        return [RolRead.model_validate(r) for r in rows]

    async def list_formas_pago(self) -> list[FormaPagoRead]:
        rows = await self.uow.formas_pago_repo.get_all()
        return [FormaPagoRead.model_validate(r) for r in rows]

    async def toggle_forma_pago(self, codigo: str, habilitado: bool) -> FormaPagoRead:
        result = await self.uow.formas_pago_repo.toggle_habilitado(codigo, habilitado)
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Forma de pago '{codigo}' no encontrada",
            )
        await self.uow.commit()
        return FormaPagoRead.model_validate(result)

    async def list_estados_pedido(self) -> list[EstadoPedidoRead]:
        rows = await self.uow.estados_pedido_repo.get_all_ordered()
        return [EstadoPedidoRead.model_validate(r) for r in rows]

    async def get_dashboard_stats(self) -> DashboardStats:
        from app.modules.pagos.model import Pago
        from app.modules.pedidos.model import Pedido
        from app.modules.productos.model import Producto
        from app.modules.usuarios.model import Usuario

        # Count active (non-deleted) users
        stmt_usuarios = select(func.count()).select_from(Usuario).where(
            Usuario.deleted_at.is_(None)
        )
        total_usuarios = int(
            (await self.uow.session.execute(stmt_usuarios)).scalar_one()
        )

        # Count active products (not deleted, disponible)
        stmt_productos = select(func.count()).select_from(Producto).where(
            Producto.deleted_at.is_(None),
            Producto.disponible.is_(True),
        )
        total_productos = int(
            (await self.uow.session.execute(stmt_productos)).scalar_one()
        )

        # Count pedidos grouped by estado_codigo
        stmt_pedidos = (
            select(Pedido.estado_codigo, func.count().label("cantidad"))
            .where(Pedido.deleted_at.is_(None))
            .group_by(Pedido.estado_codigo)
        )
        pedidos_result = await self.uow.session.execute(stmt_pedidos)
        pedidos_por_estado = [
            PedidosPorEstado(estado=row.estado_codigo, cantidad=row.cantidad)
            for row in pedidos_result.all()
        ]

        # Sum approved payment amounts
        stmt_ingresos = select(func.coalesce(func.sum(Pago.monto), 0)).where(
            Pago.mp_status == "approved"
        )
        ingresos_totales = Decimal(
            str((await self.uow.session.execute(stmt_ingresos)).scalar_one())
        )

        return DashboardStats(
            total_usuarios=total_usuarios,
            total_productos=total_productos,
            pedidos_por_estado=pedidos_por_estado,
            ingresos_totales=ingresos_totales,
        )
