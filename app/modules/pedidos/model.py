from datetime import datetime
from decimal import Decimal
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Pedido(SQLModel, table=True):
    __tablename__ = "pedido"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    usuario_id: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False))
    direccion_entrega_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("direccion_entrega.id")),
    )
    estado_codigo: str = Field(sa_column=Column(String(50), ForeignKey("estado_pedido.codigo"), nullable=False))
    nombre_cliente_snapshot: str = Field(sa_column=Column(String(200), nullable=False))
    telefono_snapshot: str | None = Field(default=None, sa_column=Column(String(20)))
    direccion_snapshot: str = Field(sa_column=Column(Text, nullable=False))
    subtotal: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    costo_envio: Decimal = Field(default=Decimal("50.00"), sa_column=Column(Numeric(10, 2), nullable=False))
    total: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    notas: str | None = Field(default=None, sa_column=Column(Text))
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedido"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    pedido_id: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("pedido.id"), nullable=False))
    producto_id: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("producto.id"), nullable=False))
    nombre_snapshot: str = Field(sa_column=Column(String(200), nullable=False))
    precio_snapshot: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    cantidad: int = Field(sa_column=Column(Integer, nullable=False))
    personalizacion: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(Text), nullable=False))
    subtotal: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )


class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estado_pedido"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    pedido_id: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("pedido.id"), nullable=False))
    estado_codigo: str = Field(sa_column=Column(String(50), ForeignKey("estado_pedido.codigo"), nullable=False))
    observacion: str | None = Field(default=None, sa_column=Column(Text))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
