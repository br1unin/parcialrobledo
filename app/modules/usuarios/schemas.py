import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    nombre: str
    apellido: str
    telefono: str | None = None
    is_active: bool
    created_at: datetime
    roles: list[str]

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    nombre: str | None = None
    apellido: str | None = None
    telefono: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class SetActivoRequest(BaseModel):
    is_active: bool


class AssignRolRequest(BaseModel):
    rol_codigo: str
