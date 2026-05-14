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

    @property
    def usuarios(self):
        from app.modules.usuarios.repository import UsuarioRepository
        return UsuarioRepository(self.session)

    @property
    def refresh_tokens(self):
        from app.modules.refreshtokens.repository import RefreshTokenRepository
        return RefreshTokenRepository(self.session)

    @property
    def categorias(self):
        from app.modules.categorias.repository import CategoriaRepository
        return CategoriaRepository(self.session)

    @property
    def ingredientes(self):
        from app.modules.ingredientes.repository import IngredienteRepository
        return IngredienteRepository(self.session)

    @property
    def productos(self):
        from app.modules.productos.repository import ProductoRepository
        return ProductoRepository(self.session)

    @property
    def direcciones(self):
        from app.modules.direcciones.repository import DireccionRepository
        return DireccionRepository(self.session)

    @property
    def pedidos(self):
        from app.modules.pedidos.repository import PedidoRepository
        return PedidoRepository(self.session)

    @property
    def detalles_pedido(self):
        from app.modules.pedidos.repository import DetallePedidoRepository
        return DetallePedidoRepository(self.session)

    @property
    def historial_pedido(self):
        from app.modules.pedidos.repository import HistorialRepository
        return HistorialRepository(self.session)

    @property
    def pagos(self):
        from app.modules.pagos.repository import PagoRepository
        return PagoRepository(self.session)

    @property
    def roles_repo(self):
        from app.modules.admin.repository import RolRepository
        return RolRepository(self.session)

    @property
    def formas_pago_repo(self):
        from app.modules.admin.repository import FormaPagoRepository
        return FormaPagoRepository(self.session)

    @property
    def estados_pedido_repo(self):
        from app.modules.admin.repository import EstadoPedidoRepository
        return EstadoPedidoRepository(self.session)


async def get_uow() -> AsyncGenerator[UnitOfWork, None]:
    async with UnitOfWork() as uow:
        yield uow
