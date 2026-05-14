import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PreferenceRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pedido_id: uuid.UUID


class PreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    init_point: str
    preference_id: str


class WebhookPayload(BaseModel):
    type: str
    data: dict


class PagoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    pedido_id: uuid.UUID
    forma_pago_codigo: str
    monto: Decimal
    mp_payment_id: str | None
    mp_status: str | None
    mp_status_detail: str | None
    external_reference: str | None
    idempotency_key: str | None
    created_at: datetime
    updated_at: datetime
