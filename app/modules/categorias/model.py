from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Categoria(SQLModel, table=True):
    __tablename__ = "categoria"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    codigo: str = Field(sa_column=Column(String(50), unique=True, nullable=False, index=True))
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    descripcion: str | None = Field(default=None, sa_column=Column(Text))
    parent_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("categoria.id")),
    )
    imagen_url: str | None = Field(default=None, sa_column=Column(String(500)))
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )
