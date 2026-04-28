from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field, SQLModel


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(PG_UUID(as_uuid=True), primary_key=True),
    )
    usuario_id: uuid.UUID = Field(
        sa_column=Column(PG_UUID(as_uuid=True), ForeignKey("usuario.id"), nullable=False, index=True)
    )
    token_hash: str = Field(sa_column=Column(String(255), unique=True, nullable=False, index=True))
    expires_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    revoked_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), nullable=False),
    )
