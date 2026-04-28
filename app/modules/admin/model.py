from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, func
from sqlmodel import Field, SQLModel


class Rol(SQLModel, table=True):
    __tablename__ = "rol"

    codigo: str = Field(sa_column=Column(String(50), primary_key=True))
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    descripcion: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )


class FormaPago(SQLModel, table=True):
    __tablename__ = "forma_pago"

    codigo: str = Field(sa_column=Column(String(50), primary_key=True))
    nombre: str = Field(sa_column=Column(String(100), nullable=False))
    habilitado: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estado_pedido"

    codigo: str = Field(sa_column=Column(String(50), primary_key=True))
    descripcion: str = Field(sa_column=Column(String(255), nullable=False))
    orden: int = Field(sa_column=Column(Integer, nullable=False))
    es_terminal: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
