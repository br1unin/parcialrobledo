import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator


class ProductoCreate(BaseModel):
    nombre: str
    precio: Decimal
    stock_cantidad: int = 0
    disponible: bool = True
    descripcion: str | None = None
    imagen_url: str | None = None

    @field_validator("precio")
    @classmethod
    def precio_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El precio debe ser mayor que 0")
        return v

    @field_validator("stock_cantidad")
    @classmethod
    def stock_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    precio: Decimal | None = None
    stock_cantidad: int | None = None
    disponible: bool | None = None
    descripcion: str | None = None
    imagen_url: str | None = None

    @field_validator("precio")
    @classmethod
    def precio_must_be_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("El precio debe ser mayor que 0")
        return v

    @field_validator("stock_cantidad")
    @classmethod
    def stock_non_negative(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class StockAdjust(BaseModel):
    delta: int


class CategoriaIds(BaseModel):
    categoria_ids: list[uuid.UUID]


class IngredienteAsignado(BaseModel):
    ingrediente_id: uuid.UUID
    es_removible: bool = True


class IngredienteIds(BaseModel):
    ingredientes: list[IngredienteAsignado]


class CategoriaBasic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str


class IngredienteEnProducto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    es_alergeno: bool
    es_removible: bool


class ProductoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    descripcion: str | None
    precio: Decimal
    stock_cantidad: int
    disponible: bool
    imagen_url: str | None
    created_at: datetime
    categorias: list[CategoriaBasic] = []
    ingredientes: list[IngredienteEnProducto] = []


class ProductoListResponse(BaseModel):
    items: list[ProductoResponse]
    total: int
    page: int
    limit: int
