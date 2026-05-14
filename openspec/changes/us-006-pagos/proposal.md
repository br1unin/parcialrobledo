## Why

Orders created in us-005 remain permanently in `PENDIENTE` state because there is no payment mechanism to confirm them. This change wires MercadoPago Checkout Pro into the order flow so clients can pay, the webhook can confirm the order, and the business can start fulfilling it.

## What Changes

- New backend module `app/modules/pagos/` — `PagoRepository`, schemas, service, and router (model already exists from us-005 scaffold)
- `app/core/uow.py` extended with a `pagos` repository property
- New webhook endpoint `POST /api/v1/pagos/webhook` to receive MercadoPago IPN/webhook notifications
- New endpoint `POST /api/v1/pagos/preference` (CLIENT) to create a MercadoPago Checkout Pro preference for a given `pedido_id`
- `PedidoService` updated: `PENDIENTE → CONFIRMADO` FSM transition enabled (was explicitly excluded from us-005)
- Stock decrement on `CONFIRMADO` (deducted atomically when the webhook confirms the order)
- Frontend `PaymentPage` — redirect target after MercadoPago returns; shows payment status and navigates to order detail
- `CheckoutPage` updated — "Pay with MercadoPago" button replaces the plain submit; calls preference endpoint and redirects
- Idempotency handling for webhook events using `idempotency_key` already present on `Pago` model
- Environment variables: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`

## Capabilities

### New Capabilities

- `mercadopago-checkout`: MercadoPago Checkout Pro integration — preference creation, payment record persistence, IPN webhook handling, idempotency, and PENDIENTE→CONFIRMADO order confirmation triggered by a successful payment notification.

### Modified Capabilities

- `order-management`: The `PENDIENTE → CONFIRMADO` transition is now enabled via the payment webhook. Stock decrement on CONFIRMADO is added. CheckoutPage now triggers a payment redirect rather than directly confirming.

## Impact

- **Backend**: New files in `app/modules/pagos/` (repository.py, schemas.py, service.py, router.py). Changes to `app/core/uow.py`, `app/modules/pedidos/service.py`, and `app/main.py`.
- **Frontend**: New page `frontend/src/pages/PaymentPage.tsx`. Updated `frontend/src/pages/CheckoutPage.tsx`. New API helper in `frontend/src/features/pagos/api.ts`. Router updated with `/payment` route.
- **Database**: `pago` table already exists. No new migration required. Stock decrement updates `producto.stock` — same table, existing column.
- **External dependency**: MercadoPago Python SDK (`mercadopago`) must be added to `requirements.txt`.
- **Config**: Two new env vars — `MP_ACCESS_TOKEN` (required) and `MP_WEBHOOK_SECRET` (optional, for signature verification). Added to `.env.example` and `app/core/config.py`.
- **Requires**: us-005-pedidos complete (order creation, pedido FSM, frontend checkout skeleton).
