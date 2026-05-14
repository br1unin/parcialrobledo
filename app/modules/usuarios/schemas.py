import uuid

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    nombre: str
    apellido: str
    roles: list[str]

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserResponse
