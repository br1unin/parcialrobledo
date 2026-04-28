from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Usuario(SQLModel, table=True):
    __tablename__ = "usuario"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    email: str = Field(sa_column=Column(String(255), unique=True, nullable=False, index=True))
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    apellido: str = Field(sa_column=Column(String(100), nullable=False))
    telefono: str | None = Field(default=None, sa_column=Column(String(20)))
    is_active: bool = Field(default=True, nullable=False)
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        ),
    )


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuario_rol"

    usuario_id: uuid.UUID = Field(
        sa_column=Column(
            PG_UUID(as_uuid=True),
            ForeignKey("usuario.id", ondelete="CASCADE"),
            primary_key=True,
        )
    )
    rol_codigo: str = Field(
        sa_column=Column(
            String(50),
            ForeignKey("rol.codigo", ondelete="CASCADE"),
            primary_key=True,
        )
    )
