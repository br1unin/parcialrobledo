## Context

The order module (us-005) is complete. Orders are created in `PENDIENTE` state and remain there indefinitely because no payment mechanism exists. The `Pago` model is already scaffolded with all necessary columns (`mp_payment_id`, `mp_status`, `mp_status_detail`, `external_reference`, `idempotency_key`). `config.py` already declares `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, and `MP_NOTIFICATION_URL`. The pagos model import is already in `main.py`.

The `PENDIENTE → CONFIRMADO` FSM transition was explicitly excluded from `VALID_TRANSITIONS` in `PedidoService` and is reserved for this change. Stock decrement already happens at order creation time in `create_pedido()` — this is intentional and is NOT reversed or moved.

Stack constraints:
- FastAPI + SQLModel + async SQLAlchemy
- `BaseRepository[T]` + `UnitOfWork` pattern
- MercadoPago Python SDK (`mercadopago`)
- Webhook arrives as unauthenticated POST; signature verification via `MP_WEBHOOK_SECRET` (optional in dev)

## Goals / Non-Goals

**Goals:**
- MercadoPago Checkout Pro flow: preference creation → client redirect → webhook confirmation
- `POST /api/v1/pagos/preference` — CLIENT creates a Checkout Pro preference for their pedido
- `POST /api/v1/pagos/webhook` — public endpoint; receives IPN notifications from MercadoPago
- On successful webhook: create `Pago` record, transition pedido `PENDIENTE → CONFIRMADO`, append history
- Idempotency: duplicate webhook events for the same payment are silently ignored
- Frontend: `CheckoutPage` updated to call preference API and redirect to MercadoPago; `PaymentPage` handles the return URL
- `UnitOfWork` gets a `pagos` repository property
- `mercadopago` SDK added to `requirements.txt`

**Non-Goals:**
- Stock reversal on cancellation (out of scope — stock is decremented at order creation, not at CONFIRMADO)
- Refund flows
- Admin payment dashboard or payment history listing
- Subscription or recurring payments
- MercadoPago HMAC signature verification in production (deferred; `MP_WEBHOOK_SECRET` optional)

## Decisions

### D1: Checkout Pro preference created per-pedido on demand

When the client submits the checkout form, the frontend:
1. Calls `POST /api/v1/pedidos` → receives `pedido_id`
2. Calls `POST /api/v1/pagos/preference` with `{ pedido_id }` → receives `{ init_point }`
3. Redirects the browser to `init_point` (MercadoPago hosted page)

The preference stores `external_reference = str(pedido_id)` so the webhook can link the payment back to the order without storing a preference ID.

**Alternative considered**: Combined endpoint that creates pedido + preference atomically. Rejected to keep pedidos and pagos modules decoupled and to preserve the existing `POST /api/v1/pedidos` contract.

---

### D2: Webhook uses `external_reference` as the link

MercadoPago sends a webhook notification containing a `data.id` (payment ID). The handler:
1. Queries MercadoPago API to get the full payment object (contains `external_reference`, `status`, `status_detail`, `transaction_amount`)
2. Looks up `Pedido` by `external_reference` (which equals `pedido_id`)
3. If `mp_status == "approved"` and pedido is still `PENDIENTE` → transition + create Pago record

**Alternative considered**: Store preference ID and look up via it. Rejected because `external_reference` is set by us and is more reliable than the preference ID chain.

---

### D3: Idempotency via `idempotency_key` = `mp_payment_id`

Before writing a `Pago` record, the service checks `PagoRepository.get_by_mp_payment_id(mp_payment_id)`. If a row already exists, the webhook handler returns HTTP 200 immediately without re-processing. This handles MercadoPago's at-least-once delivery guarantee.

---

### D4: PENDIENTE → CONFIRMADO transition added to PedidoService

A new internal method `confirm_pedido(uow, pedido_id)` is added to `pedidos/service.py`. It:
- Loads the pedido
- Validates state is `PENDIENTE` (idempotent if already `CONFIRMADO`)
- Sets `estado_codigo = "CONFIRMADO"`
- Appends history entry with `observacion = "Pago confirmado por MercadoPago"`

`VALID_TRANSITIONS` dict is NOT modified (that dict governs staff-initiated transitions). The `confirm_pedido` function is the only code path that writes `CONFIRMADO`, called exclusively from the webhook service.

---

### D5: Webhook endpoint is unauthenticated — no JWT required

MercadoPago sends webhooks from its servers. The endpoint must be publicly accessible without `Authorization` header. It is protected by:
- Checking `MP_WEBHOOK_SECRET` (optional HMAC header `x-signature`) in production
- Short-circuiting on any `type` other than `"payment"`
- Looking up and verifying payment status from MercadoPago's API (not trusting webhook payload alone)

---

### D6: Frontend PaymentPage handles success/failure/pending

MercadoPago appends `?payment_id=...&status=...&external_reference=...` to the return URLs. `PaymentPage` reads these params, displays the appropriate message, and offers navigation:
- `approved` → "Pago exitoso" + link to `/mis-pedidos/:external_reference`
- `pending` → "Pago pendiente" message
- `failure`/other → "Pago fallido" + "Volver al carrito" link

The frontend does NOT call the backend to re-query state on this page; it uses the URL params only. A full state sync happens when the user navigates to the order detail page.

---

### D7: CheckoutPage split into two steps

Current flow: fill form → create pedido → navigate to `/mis-pedidos/:id`.
New flow: fill form → create pedido → call preference API → redirect to MercadoPago.

The `clearCart()` call is deferred: cart is cleared AFTER the user lands on `PaymentPage` with `status=approved` (or when they navigate to the order detail). This avoids losing cart contents if the user abandons the MercadoPago page.

**Alternative considered**: Clear cart immediately after pedido creation (before redirect). Rejected because if the user cancels payment and returns, the cart is gone and they cannot retry without re-adding items.

## Risks / Trade-offs

- **Webhook delivery lag**: MercadoPago may take seconds or minutes to deliver a webhook. The pedido stays `PENDIENTE` until then. Frontend should show a "Waiting for payment confirmation" state on `PaymentPage`. → Mitigation: `PaymentPage` polls `GET /api/v1/pedidos/:id` every 3 seconds for up to 30 seconds when `status=pending`.
- **Double transition**: If two webhook events arrive simultaneously for the same payment, both could race to call `confirm_pedido`. → Mitigation: `idempotency_key` uniqueness constraint on `pago.mp_payment_id` means one INSERT will fail with a unique constraint error; the handler catches `IntegrityError` and returns 200.
- **`external_reference` reuse**: If a client creates two pedidos and only one is paid, the webhook must correctly match by `pedido_id`. Since `external_reference = str(pedido_id)` and pedido IDs are UUIDs, collisions are impossible.
- **Local webhook testing**: MercadoPago cannot reach `localhost`. Developers must use `ngrok` or MercadoPago's sandbox. → Mitigation: documented in `.env.example`.
- **MP SDK is synchronous**: The `mercadopago` Python SDK uses blocking HTTP calls. Wrap SDK calls with `asyncio.to_thread()` to avoid blocking the async event loop.
