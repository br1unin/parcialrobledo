## 1. Dependencies and Configuration

- [x] 1.1 Add `mercadopago` to `requirements.txt`
- [x] 1.2 Verify `app/core/config.py` exposes `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, and `MP_NOTIFICATION_URL` (already present — confirm and add `MP_WEBHOOK_SECRET: str = ""` optional field)
- [x] 1.3 Update `.env.example` with `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_NOTIFICATION_URL`, and `MP_WEBHOOK_SECRET` with placeholder values and ngrok note

## 2. Backend — Pagos Module

- [x] 2.1 Create `app/modules/pagos/repository.py` — `PagoRepository` extending `BaseRepository[Pago]` with methods: `get_by_mp_payment_id(mp_payment_id: str) -> Pago | None` and `get_by_external_reference(external_reference: str) -> Pago | None`
- [x] 2.2 Create `app/modules/pagos/schemas.py` — `PreferenceRequest(pedido_id: UUID)`, `PreferenceResponse(init_point: str, preference_id: str)`, `WebhookPayload(type: str, data: dict)`, `PagoResponse`
- [x] 2.3 Create `app/modules/pagos/service.py` — `create_preference(uow, current_user, pedido_id)` that validates pedido ownership + PENDIENTE state, builds MercadoPago preference (wrap SDK with `asyncio.to_thread`), returns `PreferenceResponse`
- [x] 2.4 Add `process_webhook(uow, payload: WebhookPayload)` function in `app/modules/pagos/service.py` — handles type-check, fetches payment via SDK, idempotency check, creates `Pago` record, calls `confirm_pedido`
- [x] 2.5 Create `app/modules/pagos/router.py` — `POST /preference` (requires CLIENT auth) and `POST /webhook` (no auth) using the service functions

## 3. Backend — PedidoService Update

- [x] 3.1 Add `confirm_pedido(uow: UnitOfWork, pedido_id: UUID) -> None` to `app/modules/pedidos/service.py` — loads pedido, skips if already CONFIRMADO, transitions to CONFIRMADO, appends history entry "Pago confirmado por MercadoPago"
- [x] 3.2 Ensure `VALID_TRANSITIONS` dict in `pedidos/service.py` does NOT include `PENDIENTE → CONFIRMADO` (confirm it's handled only via `confirm_pedido`)

## 4. Backend — Unit of Work and Router Registration

- [x] 4.1 Add `pagos` property to `UnitOfWork` in `app/core/uow.py` returning `PagoRepository(self.session)`
- [x] 4.2 Import and register the pagos router in `app/main.py` at prefix `/api/v1/pagos` with tag `"pagos"`

## 5. Frontend — Pagos API Feature

- [x] 5.1 Create `frontend/src/features/pagos/api.ts` — `pagosApi.createPreference(pedido_id: string): Promise<PreferenceResponse>` calling `POST /api/v1/pagos/preference`
- [x] 5.2 Create `frontend/src/features/pagos/types.ts` — `PreferenceResponse` interface

## 6. Frontend — CheckoutPage Update

- [x] 6.1 Update `frontend/src/pages/CheckoutPage.tsx` — after successful `pedidosApi.create()`, call `pagosApi.createPreference(pedido.id)` and redirect to `init_point` via `window.location.href`
- [x] 6.2 Remove the `clearCart()` call from the checkout submit handler (cart is cleared on `PaymentPage` after confirmed success)
- [x] 6.3 Update submit button label to "Pagar con MercadoPago" and show appropriate loading states

## 7. Frontend — PaymentPage

- [x] 7.1 Create `frontend/src/pages/PaymentPage.tsx` — reads `status`, `external_reference`, `payment_id` from URL search params
- [x] 7.2 Implement `approved` state: clear cart, show success message, render link to `/mis-pedidos/:external_reference`
- [x] 7.3 Implement `pending` state: show pending message, poll `GET /api/v1/pedidos/:external_reference` every 3s for up to 30s; on `CONFIRMADO` transition to approved view; on timeout show "En proceso" message
- [x] 7.4 Implement `failure` (and all other) state: show failure message and "Volver al carrito" link to `/carrito`
- [x] 7.5 Register `/payment` route in `frontend/src/router/` (PrivateRoute — CLIENT role)

## 8. Verification

- [x] 8.1 Verify `POST /api/v1/pagos/preference` returns `init_point` for a valid PENDIENTE pedido (sandbox credentials)
- [x] 8.2 Verify webhook endpoint returns HTTP 200 for non-payment type events
- [x] 8.3 Verify webhook endpoint creates Pago record and transitions pedido to CONFIRMADO for approved payment payload (use MercadoPago sandbox test data or manual payload)
- [x] 8.4 Verify duplicate webhook events for the same `mp_payment_id` are idempotent (second request returns 200, no duplicate Pago row)
- [x] 8.5 Verify CheckoutPage redirects to MercadoPago `init_point` after order creation
- [x] 8.6 Verify PaymentPage shows correct state for `approved`, `pending`, and `failure` URL params
- [x] 8.7 Verify `uow.pagos` property is accessible and `PagoRepository` correctly queries by `mp_payment_id`
