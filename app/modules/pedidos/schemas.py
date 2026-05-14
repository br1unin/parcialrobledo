import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import ConfigDict, BaseModel


class ItemCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    producto_id: uuid.UUID
    cantidad: int
    personalizacion: list[int] = []


class PedidoCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    direccion_entrega_id: uuid.UUID
    items: list[ItemCreate]
    notas: str | None = None


class DetalleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    producto_id: uuid.UUID
    nombre_snapshot: str
    precio_snapshot: Decimal
    cantidad: int
    personalizacion: list[int]
    subtotal: Decimal


class PedidoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usuario_id: uuid.UUID
    estado_codigo: str
    nombre_cliente_snapshot: str
    telefono_snapshot: str | None
    direccion_snapshot: str
    subtotal: Decimal
    costo_envio: Decimal
    total: Decimal
    notas: str | None
    created_at: datetime
    updated_at: datetime
    detalles: list[DetalleResponse] = []


class PedidoListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    estado_codigo: str
    total: Decimal
    created_at: datetime


class PedidoListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[PedidoListItem]
    total: int
    page: int
    limit: int


class EstadoUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    nuevo_estado: str
    observacion: str | None = None


class HistorialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    estado_codigo: str
    observacion: str | None
    created_at: datetime
