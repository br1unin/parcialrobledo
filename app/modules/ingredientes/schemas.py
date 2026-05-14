import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class IngredienteCreate(BaseModel):
    nombre: str
    es_alergeno: bool = False


class IngredienteUpdate(BaseModel):
    nombre: str | None = None
    es_alergeno: bool | None = None


class IngredienteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    es_alergeno: bool
    created_at: datetime


class IngredienteListResponse(BaseModel):
    items: list[IngredienteResponse]
    total: int
    page: int
    limit: int
