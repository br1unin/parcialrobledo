import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    padre_id: uuid.UUID | None = None
    imagen_url: str | None = None


class CategoriaUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    padre_id: uuid.UUID | None = None
    imagen_url: str | None = None


class CategoriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    descripcion: str | None
    padre_id: uuid.UUID | None
    imagen_url: str | None
    created_at: datetime
    children: list["CategoriaResponse"] = []


CategoriaResponse.model_rebuild()
