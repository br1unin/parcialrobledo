from datetime import datetime
from decimal import Decimal
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Producto(SQLModel, table=True):
    __tablename__ = "producto"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    codigo: str = Field(sa_column=Column(String(50), unique=True, nullable=False, index=True))
    nombre: str = Field(sa_column=Column(String(200), nullable=False))
    descripcion: str | None = Field(default=None, sa_column=Column(Text))
    precio: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    stock_cantidad: int = Field(default=0, sa_column=Column(Integer, nullable=False, default=0))
    imagen_url: str | None = Field(default=None, sa_column=Column(String(500)))
    disponible: bool = Field(default=True, nullable=False)
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )


class Ingrediente(SQLModel, table=True):
    __tablename__ = "ingrediente"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    codigo: str = Field(sa_column=Column(String(50), unique=True, nullable=False, index=True))
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    es_alergeno: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )


class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "producto_categoria"

    producto_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("producto.id", ondelete="CASCADE"), primary_key=True)
    )
    categoria_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("categoria.id", ondelete="CASCADE"), primary_key=True)
    )


class ProductoIngrediente(SQLModel, table=True):
    __tablename__ = "producto_ingrediente"

    producto_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("producto.id", ondelete="CASCADE"), primary_key=True)
    )
    ingrediente_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("ingrediente.id", ondelete="CASCADE"), primary_key=True)
    )
    es_removible: bool = Field(default=True, nullable=False)
