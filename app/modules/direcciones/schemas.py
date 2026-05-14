import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DireccionCreate(BaseModel):
    calle: str
    numero: str
    departamento: str | None = None
    comuna: str
    ciudad: str
    codigo_postal: str | None = None


class DireccionUpdate(BaseModel):
    calle: str | None = None
    numero: str | None = None
    departamento: str | None = None
    comuna: str | None = None
    ciudad: str | None = None
    codigo_postal: str | None = None


class DireccionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    calle: str
    numero: str
    departamento: str | None
    comuna: str
    ciudad: str
    codigo_postal: str | None
    es_principal: bool
    created_at: datetime
