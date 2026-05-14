"""Seed initial data: roles, estados, formas de pago, and admin user."""
import asyncio
import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.security import hash_password
from app.modules.admin.model import EstadoPedido, FormaPago, Rol
from app.modules.usuarios.model import Usuario, UsuarioRol

engine = create_async_engine(settings.DATABASE_URL, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            roles = [
                Rol(codigo="ADMIN", nombre="Administrador", descripcion="Acceso total al sistema"),
                Rol(codigo="STOCK", nombre="Encargado de stock", descripcion="Gestión de productos"),
                Rol(codigo="PEDIDOS", nombre="Encargado de pedidos", descripcion="Gestión de pedidos"),
                Rol(codigo="CLIENT", nombre="Cliente", descripcion="Usuario final"),
            ]
            for r in roles:
                existing = await session.get(Rol, r.codigo)
                if not existing:
                    session.add(r)

            formas_pago = [
                FormaPago(codigo="MERCADOPAGO", nombre="MercadoPago"),
                FormaPago(codigo="EFECTIVO", nombre="Efectivo en local"),
            ]
            for fp in formas_pago:
                existing = await session.get(FormaPago, fp.codigo)
                if not existing:
                    session.add(fp)

            estados = [
                EstadoPedido(codigo="PENDIENTE", descripcion="Pedido recibido, pendiente de confirmación", orden=1),
                EstadoPedido(codigo="CONFIRMADO", descripcion="Pedido confirmado, en preparación", orden=2),
                EstadoPedido(codigo="EN_CAMINO", descripcion="Pedido en camino al cliente", orden=3),
                EstadoPedido(codigo="ENTREGADO", descripcion="Pedido entregado", orden=4, es_terminal=True),
                EstadoPedido(codigo="CANCELADO", descripcion="Pedido cancelado", orden=5, es_terminal=True),
            ]
            for e in estados:
                existing = await session.get(EstadoPedido, e.codigo)
                if not existing:
                    session.add(e)

            from sqlmodel import select
            result = await session.execute(select(Usuario).where(Usuario.email == "admin@foodstore.com"))
            admin = result.scalar_one_or_none()
            if not admin:
                password_hash = await hash_password("Admin1234!")
                admin = Usuario(
                    id=uuid.uuid4(),
                    email="admin@foodstore.com",
                    password_hash=password_hash,
                    nombre="Admin",
                    apellido="FoodStore",
                )
                session.add(admin)
                await session.flush()
                session.add(UsuarioRol(usuario_id=admin.id, rol_codigo="ADMIN"))

    await engine.dispose()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
