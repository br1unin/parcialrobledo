## ADDED Requirements

### Requirement: Create order from cart
The system SHALL create a server-side order from the client's submitted cart items inside a single atomic transaction. The order SHALL start in state `PENDIENTE` and a first `HistorialEstadoPedido` entry SHALL be created in the same transaction.

#### Scenario: Successful order creation
- **WHEN** an authenticated CLIENT sends `POST /api/v1/pedidos` with a valid `direccion_entrega_id`, a non-empty `items` list, and optional `notas`
- **THEN** the system returns `201 Created` with the full `PedidoResponse` including `id`, `estado_codigo: "PENDIENTE"`, price and address snapshots, and the list of `DetalleResponse` items

#### Scenario: First historial entry created on order creation
- **WHEN** a new order is successfully created
- **THEN** a `HistorialEstadoPedido` record with `estado_codigo: "PENDIENTE"` is inserted in the same transaction as the `Pedido` and `DetallePedido` records

#### Scenario: Cart items sent explicitly in request body
- **WHEN** the CLIENT submits an order
- **THEN** the price snapshots (`precio_snapshot`) are taken from the current database values, not from the client-supplied prices; `personalizacion` (excluded ingredient IDs) is stored as the submitted `INTEGER[]`

---

### Requirement: Validate stock at order creation
The system SHALL validate that sufficient stock is available for every item in the order before persisting anything.

#### Scenario: All products have sufficient stock
- **WHEN** every requested `cantidad` is less than or equal to the product's current `stock`
- **THEN** the order is created successfully (201)

#### Scenario: One or more products have insufficient stock
- **WHEN** any item's requested `cantidad` exceeds the product's current `stock`
- **THEN** the system returns `422 Unprocessable Entity` with an error indicating which product(s) lack stock, and nothing is persisted (atomic rollback)

#### Scenario: Stock locked during validation
- **WHEN** two concurrent requests attempt to create orders with overlapping products
- **THEN** the stock rows are locked via `SELECT FOR UPDATE` so only one request can proceed at a time, preventing overselling

---

### Requirement: Price snapshot immutability
The system SHALL capture `precio_snapshot` for each `DetallePedido` at creation time and SHALL NOT modify it thereafter.

#### Scenario: Price change after order creation
- **WHEN** a product's price is updated after an order is created
- **THEN** the existing `DetallePedido.precio_snapshot` remains unchanged and reflects the price at the time of order creation

---

### Requirement: Address snapshot immutability
The system SHALL capture `direccion_snapshot` as a formatted string at order creation time and SHALL NOT modify it thereafter.

#### Scenario: Address modified after order creation
- **WHEN** a user updates or deletes a `DireccionEntrega` record after placing an order
- **THEN** the `Pedido.direccion_snapshot` remains unchanged and continues to display the address as it was at order creation time

---

### Requirement: List orders — CLIENT (own orders only)
An authenticated CLIENT SHALL be able to retrieve a paginated list of their own orders only.

#### Scenario: CLIENT lists their orders
- **WHEN** a CLIENT sends `GET /api/v1/pedidos?page=1&limit=10`
- **THEN** the system returns a paginated list containing only orders where `usuario_id` matches the authenticated user, with `total`, `page`, and `limit` fields

#### Scenario: CLIENT cannot see other users' orders in the list
- **WHEN** a CLIENT retrieves the orders list
- **THEN** orders belonging to other users are never included in the response

---

### Requirement: List orders — PEDIDOS/ADMIN (all orders)
Authenticated users with role `PEDIDOS` or `ADMIN` SHALL be able to retrieve a paginated list of all orders in the system.

#### Scenario: PEDIDOS/ADMIN lists all orders
- **WHEN** a PEDIDOS or ADMIN user sends `GET /api/v1/pedidos?page=1&limit=10`
- **THEN** the system returns a paginated list of all orders regardless of `usuario_id`, with `total`, `page`, and `limit` fields

---

### Requirement: Get order detail
The system SHALL allow retrieving the full detail of a single order including its `DetallePedido` items.

#### Scenario: CLIENT retrieves their own order detail
- **WHEN** a CLIENT sends `GET /api/v1/pedidos/{id}` where the order belongs to them
- **THEN** the system returns `200 OK` with the full `PedidoResponse` including all `DetalleResponse` items

#### Scenario: CLIENT attempts to access another user's order
- **WHEN** a CLIENT sends `GET /api/v1/pedidos/{id}` where the order belongs to a different user
- **THEN** the system returns `404 Not Found` (does not reveal the order's existence)

#### Scenario: PEDIDOS/ADMIN retrieves any order detail
- **WHEN** a PEDIDOS or ADMIN user sends `GET /api/v1/pedidos/{id}`
- **THEN** the system returns `200 OK` with the full `PedidoResponse` regardless of which user placed the order

#### Scenario: Order not found
- **WHEN** any authenticated user requests a `pedido_id` that does not exist
- **THEN** the system returns `404 Not Found`

---

### Requirement: Get order history
The system SHALL expose an append-only log of all state transitions for a given order.

#### Scenario: CLIENT retrieves historial of their own order
- **WHEN** a CLIENT sends `GET /api/v1/pedidos/{id}/historial`
- **THEN** the system returns a list of `HistorialResponse` records (`id`, `estado_codigo`, `observacion`, `created_at`) ordered by `created_at` ascending

#### Scenario: CLIENT cannot access historial of another user's order
- **WHEN** a CLIENT sends `GET /api/v1/pedidos/{id}/historial` for an order that is not theirs
- **THEN** the system returns `404 Not Found`

#### Scenario: PEDIDOS/ADMIN retrieves historial of any order
- **WHEN** a PEDIDOS or ADMIN user sends `GET /api/v1/pedidos/{id}/historial`
- **THEN** the system returns the full historial list for that order

---

### Requirement: FSM — advance order to EN_CAMINO
The system SHALL allow PEDIDOS/ADMIN users to transition an order from `CONFIRMADO` to `EN_CAMINO`.

#### Scenario: Valid advance to EN_CAMINO
- **WHEN** a PEDIDOS or ADMIN user sends `PATCH /api/v1/pedidos/{id}/estado` with `nuevo_estado: "EN_CAMINO"` and the order is in `CONFIRMADO`
- **THEN** the system updates `Pedido.estado_codigo` to `EN_CAMINO`, inserts a new `HistorialEstadoPedido` record, and returns `200 OK` with the updated `PedidoResponse`

#### Scenario: Invalid advance to EN_CAMINO from wrong state
- **WHEN** a PEDIDOS or ADMIN user attempts to set `EN_CAMINO` on an order that is not in `CONFIRMADO`
- **THEN** the system returns `422 Unprocessable Entity` with an error describing the invalid transition

---

### Requirement: FSM — advance order to ENTREGADO
The system SHALL allow PEDIDOS/ADMIN users to transition an order from `EN_CAMINO` to `ENTREGADO`.

#### Scenario: Valid advance to ENTREGADO
- **WHEN** a PEDIDOS or ADMIN user sends `PATCH /api/v1/pedidos/{id}/estado` with `nuevo_estado: "ENTREGADO"` and the order is in `EN_CAMINO`
- **THEN** the system updates `Pedido.estado_codigo` to `ENTREGADO`, inserts a `HistorialEstadoPedido` record, and returns `200 OK`

#### Scenario: Invalid advance to ENTREGADO from wrong state
- **WHEN** a PEDIDOS or ADMIN user attempts to set `ENTREGADO` on an order that is not in `EN_CAMINO`
- **THEN** the system returns `422 Unprocessable Entity`

---

### Requirement: FSM — cancel order
The system SHALL allow order cancellation from `PENDIENTE` (CLIENT, PEDIDOS, ADMIN) or from `CONFIRMADO` (PEDIDOS, ADMIN only).

#### Scenario: CLIENT cancels their own PENDIENTE order
- **WHEN** a CLIENT sends `PATCH /api/v1/pedidos/{id}/estado` with `nuevo_estado: "CANCELADO"` and their order is in `PENDIENTE`
- **THEN** the system updates `estado_codigo` to `CANCELADO`, inserts a `HistorialEstadoPedido` record, and returns `200 OK`

#### Scenario: CLIENT cannot cancel a CONFIRMADO order
- **WHEN** a CLIENT attempts to cancel an order that is in `CONFIRMADO`
- **THEN** the system returns `422 Unprocessable Entity` (CLIENT is not permitted to cancel from this state)

#### Scenario: PEDIDOS/ADMIN cancels a CONFIRMADO order
- **WHEN** a PEDIDOS or ADMIN user sends `PATCH /api/v1/pedidos/{id}/estado` with `nuevo_estado: "CANCELADO"` and the order is in `CONFIRMADO`
- **THEN** the system updates `estado_codigo` to `CANCELADO`, inserts a `HistorialEstadoPedido` record, and returns `200 OK`

#### Scenario: Cancellation from terminal state
- **WHEN** any user attempts to cancel an order that is already in `ENTREGADO` or `CANCELADO`
- **THEN** the system returns `422 Unprocessable Entity`

---

### Requirement: Terminal state enforcement
The system SHALL prevent any state transition from a terminal state.

#### Scenario: Transition attempted from ENTREGADO
- **WHEN** any user attempts a state change on an order in `ENTREGADO`
- **THEN** the system returns `422 Unprocessable Entity`

#### Scenario: Transition attempted from CANCELADO
- **WHEN** any user attempts a state change on an order in `CANCELADO`
- **THEN** the system returns `422 Unprocessable Entity`

---

### Requirement: Checkout page — create order from cart
The frontend SHALL provide a checkout page where a CLIENT can select a delivery address, review the cart, and submit the order.

#### Scenario: Successful checkout
- **WHEN** a CLIENT on the checkout page selects an address and clicks "Confirmar pedido"
- **THEN** the system calls `POST /api/v1/pedidos`, and on `201` success it clears `cartStore` and redirects to `/mis-pedidos/:id`

#### Scenario: Checkout with insufficient stock
- **WHEN** the API returns `422` due to insufficient stock
- **THEN** the checkout page displays an error message without clearing the cart

#### Scenario: Empty cart navigation guard
- **WHEN** a CLIENT navigates to `/checkout` with an empty cart
- **THEN** the page redirects to `/carrito` or displays a message indicating the cart is empty

---

### Requirement: Mis Pedidos page — list own orders
The frontend SHALL provide a page where a CLIENT can view all their past and current orders with status badges.

#### Scenario: Orders displayed with estado badge
- **WHEN** a CLIENT navigates to `/mis-pedidos`
- **THEN** the page displays a list of the user's orders, each showing order ID (short), total, date, and a color-coded `estado_codigo` badge

---

### Requirement: Pedido Detail page — view order and historial
The frontend SHALL provide a detail page showing the full order information and state history.

#### Scenario: Detail page shows detalles and historial
- **WHEN** a CLIENT navigates to `/mis-pedidos/:id`
- **THEN** the page displays order metadata (total, address snapshot, notas), all `DetallePedido` items (with nombre_snapshot, precio_snapshot, cantidad, personalizacion), and the `HistorialEstadoPedido` timeline

#### Scenario: Cancel button available for PENDIENTE orders
- **WHEN** the order's `estado_codigo` is `PENDIENTE` and the viewer is the CLIENT owner
- **THEN** a "Cancelar pedido" button is visible and sends `PATCH /{id}/estado` with `CANCELADO` on click
