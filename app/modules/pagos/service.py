import asyncio
import uuid

import mercadopago
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import CurrentUser
from app.core.uow import UnitOfWork
from app.modules.pagos.model import Pago
from app.modules.pagos.schemas import EfectivoRequest, EfectivoResponse, PreferenceRequest, PreferenceResponse, TransferenciaRequest, TransferenciaResponse, WebhookPayload


def _get_sdk() -> mercadopago.SDK:
    return mercadopago.SDK(settings.MP_ACCESS_TOKEN)


async def create_preference(
    uow: UnitOfWork,
    current_user: CurrentUser,
    data: PreferenceRequest,
) -> PreferenceResponse:
    # Validate pedido exists and belongs to current user
    pedido = await uow.pedidos.get_own(data.pedido_id, current_user.id)
    if pedido is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado",
        )

    # Validate pedido is in PENDIENTE state
    if pedido.estado_codigo != "PENDIENTE":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"El pedido está en estado '{pedido.estado_codigo}' y no puede ser pagado en este estado",
        )

    # Load detalles for preference items
    detalles = await uow.detalles_pedido.list_by_pedido(data.pedido_id)

    # Build preference payload
    preference_data = {
        "items": [
            {
                "title": detalle.nombre_snapshot,
                "quantity": detalle.cantidad,
                "unit_price": float(detalle.precio_snapshot),
                "currency_id": "ARS",
            }
            for detalle in detalles
        ],
        "external_reference": str(data.pedido_id),
        "notification_url": settings.MP_NOTIFICATION_URL,
        "back_urls": {
            "success": f"{settings.MP_NOTIFICATION_URL.replace('/api/v1/pagos/webhook', '')}/payment",
            "failure": f"{settings.MP_NOTIFICATION_URL.replace('/api/v1/pagos/webhook', '')}/payment",
            "pending": f"{settings.MP_NOTIFICATION_URL.replace('/api/v1/pagos/webhook', '')}/payment",
        },
        "auto_return": "approved",
    }

    # Wrap synchronous SDK call with asyncio.to_thread
    sdk = _get_sdk()
    result = await asyncio.to_thread(
        lambda: sdk.preference().create(preference_data)
    )

    if result["status"] not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Error al crear preferencia en MercadoPago",
        )

    response_body = result["response"]
    return PreferenceResponse(
        init_point=response_body["init_point"],
        preference_id=response_body["id"],
    )


async def create_efectivo_payment(
    uow: UnitOfWork,
    current_user: CurrentUser,
    data: EfectivoRequest,
) -> EfectivoResponse:
    pedido = await uow.pedidos.get_own(data.pedido_id, current_user.id)
    if pedido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    if pedido.estado_codigo != "PENDIENTE":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"El pedido está en estado '{pedido.estado_codigo}' y no puede ser pagado",
        )

    pago = Pago(
        pedido_id=data.pedido_id,
        forma_pago_codigo="EFECTIVO",
        monto=pedido.total,
        idempotency_key=f"efectivo-{data.pedido_id}",
    )
    await uow.pagos.create(pago)

    from app.modules.pedidos.service import confirm_pedido
    await confirm_pedido(uow, data.pedido_id)

    return EfectivoResponse(
        pedido_id=data.pedido_id,
        forma_pago="EFECTIVO",
        mensaje="Pedido confirmado. Abonás en efectivo al momento de la entrega.",
    )


async def create_transferencia_payment(
    uow: UnitOfWork,
    current_user: CurrentUser,
    data: TransferenciaRequest,
) -> TransferenciaResponse:
    pedido = await uow.pedidos.get_own(data.pedido_id, current_user.id)
    if pedido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido no encontrado")

    if pedido.estado_codigo != "PENDIENTE":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"El pedido está en estado '{pedido.estado_codigo}' y no puede ser pagado",
        )

    pago = Pago(
        pedido_id=data.pedido_id,
        forma_pago_codigo="TRANSFERENCIA",
        monto=pedido.total,
        idempotency_key=f"transferencia-{data.pedido_id}",
    )
    await uow.pagos.create(pago)

    # Pedido queda en PENDIENTE hasta que el admin confirme la transferencia

    return TransferenciaResponse(
        pedido_id=data.pedido_id,
        forma_pago="TRANSFERENCIA",
        mensaje="Pedido registrado. Realizá la transferencia y nos comunicaremos para confirmarlo.",
        cbu=settings.BANK_CBU,
        alias=settings.BANK_ALIAS,
        titular=settings.BANK_TITULAR,
        banco=settings.BANK_BANCO,
        monto=pedido.total,
    )


async def process_webhook(
    uow: UnitOfWork,
    payload: WebhookPayload,
) -> None:
    # Short-circuit for non-payment events
    if payload.type != "payment":
        return

    payment_id = payload.data.get("id")
    if not payment_id:
        return

    payment_id_str = str(payment_id)

    # Idempotency check — if already processed, return early
    existing = await uow.pagos.get_by_mp_payment_id(payment_id_str)
    if existing is not None:
        return

    # Fetch full payment details from MercadoPago
    sdk = _get_sdk()
    payment_result = await asyncio.to_thread(
        lambda: sdk.payment().get(payment_id_str)
    )

    if payment_result["status"] != 200:
        # Cannot fetch payment details — return 200 to avoid MercadoPago retries on transient errors
        return

    payment_data = payment_result["response"]
    mp_status = payment_data.get("status")
    mp_status_detail = payment_data.get("status_detail")
    external_reference = payment_data.get("external_reference")
    transaction_amount = payment_data.get("transaction_amount", 0)

    # Only process approved payments
    if mp_status != "approved":
        return

    if not external_reference:
        return

    # Find the pedido by external_reference (which equals pedido_id)
    try:
        pedido_id = uuid.UUID(external_reference)
    except (ValueError, AttributeError):
        return

    pedido = await uow.pedidos.get_by_id(pedido_id)
    if pedido is None:
        return

    # Create Pago record
    pago = Pago(
        pedido_id=pedido_id,
        forma_pago_codigo="MERCADOPAGO",
        monto=transaction_amount,
        mp_payment_id=payment_id_str,
        mp_status=mp_status,
        mp_status_detail=mp_status_detail,
        external_reference=external_reference,
        idempotency_key=payment_id_str,
    )
    await uow.pagos.create(pago)

    # Confirm the pedido via confirm_pedido (imported here to avoid circular imports)
    from app.modules.pedidos.service import confirm_pedido
    await confirm_pedido(uow, pedido_id)
