from datetime import datetime
from decimal import Decimal
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class Pago(SQLModel, table=True):
    __tablename__ = "pago"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    pedido_id: uuid.UUID = Field(sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("pedido.id"), nullable=False))
    forma_pago_codigo: str = Field(sa_column=Column(String(50), ForeignKey("forma_pago.codigo"), nullable=False))
    monto: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    mp_payment_id: str | None = Field(default=None, sa_column=Column(String(100), unique=True))
    mp_status: str | None = Field(default=None, sa_column=Column(String(50)))
    mp_status_detail: str | None = Field(default=None, sa_column=Column(String(100)))
    external_reference: str | None = Field(default=None, sa_column=Column(String(100), index=True))
    idempotency_key: str | None = Field(default=None, sa_column=Column(String(100), unique=True))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
    )
