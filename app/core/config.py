import json

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str | None = None
    SECRET_KEY: str = "development-secret-key-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: list[str] = []
    MP_ACCESS_TOKEN: str = "test"
    MP_PUBLIC_KEY: str = "test"
    MP_NOTIFICATION_URL: str = "http://localhost:8000/api/v1/pagos/webhook"
    MP_WEBHOOK_SECRET: str = ""

    esquema_base_de_datos: str | None = Field(default=None, exclude=True)
    usuario_base_de_datos: str | None = Field(default=None, exclude=True)
    contrasena_base_de_datos: str | None = Field(default=None, exclude=True)
    password_base_de_datos: str | None = Field(default=None, exclude=True)
    host_base_de_datos: str | None = Field(default=None, exclude=True)
    puerto_base_de_datos: int | None = Field(default=None, exclude=True)
    nombre_base_de_datos: str | None = Field(default=None, exclude=True)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if value.startswith("["):
            parsed = json.loads(value)
            return [str(origin) for origin in parsed]
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @model_validator(mode="after")
    def build_database_url_from_parts(self) -> "Settings":
        if self.DATABASE_URL:
            return self

        if not all(
            [
                self.esquema_base_de_datos,
                self.usuario_base_de_datos,
                self.host_base_de_datos,
                self.puerto_base_de_datos,
                self.nombre_base_de_datos,
            ]
        ):
            raise ValueError("DATABASE_URL is required or database connection parts must be provided")

        password = self.contrasena_base_de_datos or self.password_base_de_datos
        credentials = self.usuario_base_de_datos
        if password:
            credentials = f"{credentials}:{password}"

        scheme = self.esquema_base_de_datos
        if scheme == "postgresql":
            scheme = "postgresql+asyncpg"

        self.DATABASE_URL = (
            f"{scheme}://{credentials}@{self.host_base_de_datos}:"
            f"{self.puerto_base_de_datos}/{self.nombre_base_de_datos}"
        )
        return self


settings = Settings()
