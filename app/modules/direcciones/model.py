from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class DireccionEntrega(SQLModel, table=True):
    __tablename__ = "direccion_entrega"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    usuario_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False, index=True)
    )
    calle: str = Field(sa_column=Column(String(255), nullable=False))
    numero: str = Field(sa_column=Column(String(20), nullable=False))
    departamento: str | None = Field(default=None, sa_column=Column(String(50)))
    comuna: str = Field(sa_column=Column(String(100), nullable=False))
    ciudad: str = Field(sa_column=Column(String(100), nullable=False))
    codigo_postal: str | None = Field(default=None, sa_column=Column(String(20)))
    es_principal: bool = Field(default=False, nullable=False)
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )
