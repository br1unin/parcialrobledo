from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine
from alembic import context
from app.core.config import settings

# Import all models to register them with SQLModel metadata
from app.modules.usuarios.model import *
from app.modules.admin.model import *
from app.modules.auth.model import *
from app.modules.refreshtokens.model import *
from app.modules.direcciones.model import *
from app.modules.categorias.model import *
from app.modules.productos.model import *
from app.modules.pedidos.model import *
from app.modules.pagos.model import *

from sqlmodel import SQLModel

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations():
    from sqlalchemy.ext.asyncio import create_async_engine
    connectable = create_async_engine(settings.DATABASE_URL, poolclass=pool.NullPool)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    import asyncio
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
