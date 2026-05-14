## ADDED Requirements

### Requirement: Client can initiate MercadoPago Checkout Pro payment
A CLIENT SHALL be able to request a MercadoPago Checkout Pro preference for an existing pedido in PENDIENTE state, receiving a redirect URL to the hosted payment page.

#### Scenario: Successful preference creation
- **WHEN** an authenticated CLIENT sends `POST /api/v1/pagos/preference` with a valid `pedido_id` belonging to them in PENDIENTE state
- **THEN** the system SHALL create a MercadoPago preference with the pedido items and total, store `external_reference = pedido_id`, and return `{ "init_point": "<url>", "preference_id": "<id>" }` with HTTP 200

#### Scenario: Pedido not found or not owned by client
- **WHEN** a CLIENT sends `POST /api/v1/pagos/preference` with a `pedido_id` that does not exist or belongs to another user
- **THEN** the system SHALL return HTTP 404

#### Scenario: Pedido not in PENDIENTE state
- **WHEN** a CLIENT sends `POST /api/v1/pagos/preference` for a pedido that is not in PENDIENTE state
- **THEN** the system SHALL return HTTP 422 with an error message indicating the pedido cannot be paid in its current state

### Requirement: System processes MercadoPago webhook notifications
The system SHALL expose a public endpoint `POST /api/v1/pagos/webhook` that receives IPN notifications from MercadoPago and confirms orders on successful payment.

#### Scenario: Successful payment webhook received
- **WHEN** MercadoPago sends a webhook with `type = "payment"` and the fetched payment has `status = "approved"` and a valid `external_reference` pointing to a PENDIENTE pedido
- **THEN** the system SHALL create a `Pago` record with `mp_payment_id`, `mp_status`, `mp_status_detail`, `monto`, and `external_reference`, transition the pedido to CONFIRMADO, append a history entry, and return HTTP 200

#### Scenario: Duplicate webhook for already-processed payment
- **WHEN** MercadoPago sends a webhook for a payment whose `mp_payment_id` already exists in the `pago` table
- **THEN** the system SHALL return HTTP 200 without creating duplicate records or re-transitioning the pedido

#### Scenario: Webhook with non-payment type
- **WHEN** MercadoPago sends a webhook with `type` other than `"payment"` (e.g., `"merchant_order"`)
- **THEN** the system SHALL return HTTP 200 immediately without any processing

#### Scenario: Webhook for non-approved payment
- **WHEN** MercadoPago sends a webhook for a payment with `status` other than `"approved"` (e.g., `"pending"`, `"rejected"`)
- **THEN** the system SHALL return HTTP 200 without changing the pedido state or creating a Pago record

### Requirement: System enforces idempotency on payment processing
The system SHALL use `mp_payment_id` as an idempotency key to prevent duplicate payment records.

#### Scenario: Concurrent duplicate webhooks
- **WHEN** two identical webhook events for the same `mp_payment_id` are processed concurrently
- **THEN** the system SHALL create exactly one `Pago` record (unique constraint on `mp_payment_id`) and return HTTP 200 for both requests

### Requirement: Frontend redirects user to MercadoPago after checkout
The CheckoutPage SHALL create the pedido and then redirect the user to MercadoPago Checkout Pro, preserving the cart until payment is confirmed.

#### Scenario: Client submits checkout form
- **WHEN** a CLIENT fills the checkout form (address + optional notes) and submits
- **THEN** the frontend SHALL call `POST /api/v1/pedidos` to create the order, then call `POST /api/v1/pagos/preference`, and redirect the browser to the returned `init_point` URL

#### Scenario: Cart is preserved during payment
- **WHEN** the user is redirected to MercadoPago and has not yet completed payment
- **THEN** the cart SHALL remain in localStorage so the user can return and retry if payment is abandoned

### Requirement: Frontend PaymentPage handles MercadoPago return
The system SHALL provide a `PaymentPage` that handles all MercadoPago return URL states and guides the user to the appropriate next action.

#### Scenario: User returns after successful payment
- **WHEN** the user lands on `/payment?status=approved&external_reference=<pedido_id>`
- **THEN** the frontend SHALL display a success message, clear the cart, and show a link to `/mis-pedidos/<pedido_id>`

#### Scenario: User returns after pending payment
- **WHEN** the user lands on `/payment?status=pending&external_reference=<pedido_id>`
- **THEN** the frontend SHALL display a pending message and poll `GET /api/v1/pedidos/<pedido_id>` every 3 seconds for up to 30 seconds until `estado_codigo` changes from `PENDIENTE`

#### Scenario: User returns after failed payment
- **WHEN** the user lands on `/payment?status=failure` (or any non-approved, non-pending status)
- **THEN** the frontend SHALL display a failure message and show a "Volver al carrito" link
