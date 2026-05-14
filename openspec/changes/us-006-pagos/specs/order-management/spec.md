## MODIFIED Requirements

### Requirement: Order state machine enforces valid transitions
The system SHALL enforce a well-defined FSM for pedido state. Valid transitions are: PENDIENTE → CONFIRMADO (via payment webhook only), CONFIRMADO → EN_CAMINO (PEDIDOS/ADMIN), EN_CAMINO → ENTREGADO (PEDIDOS/ADMIN). Cancellation is allowed from PENDIENTE (CLIENT/PEDIDOS/ADMIN) or CONFIRMADO (PEDIDOS/ADMIN only). ENTREGADO and CANCELADO are terminal states.

#### Scenario: PENDIENTE to CONFIRMADO transition triggered by payment webhook
- **WHEN** the MercadoPago webhook service calls `confirm_pedido` for a pedido in PENDIENTE state
- **THEN** the system SHALL set `estado_codigo = "CONFIRMADO"`, append a history entry with `observacion = "Pago confirmado por MercadoPago"`, and commit atomically

#### Scenario: PENDIENTE to CONFIRMADO not allowed via staff transition endpoint
- **WHEN** a PEDIDOS or ADMIN user calls `PATCH /api/v1/pedidos/:id/estado` with `nuevo_estado = "CONFIRMADO"`
- **THEN** the system SHALL return HTTP 422 indicating the transition is not valid via this endpoint (CONFIRMADO is set by payment only)

#### Scenario: Already confirmed pedido receives duplicate webhook confirmation
- **WHEN** `confirm_pedido` is called for a pedido already in CONFIRMADO state
- **THEN** the system SHALL return without error or state change (idempotent)

#### Scenario: CONFIRMADO to EN_CAMINO transition
- **WHEN** a PEDIDOS or ADMIN user calls `PATCH /api/v1/pedidos/:id/estado` with `nuevo_estado = "EN_CAMINO"` and the pedido is in CONFIRMADO state
- **THEN** the system SHALL transition to EN_CAMINO and append a history entry

#### Scenario: EN_CAMINO to ENTREGADO transition
- **WHEN** a PEDIDOS or ADMIN user calls `PATCH /api/v1/pedidos/:id/estado` with `nuevo_estado = "ENTREGADO"` and the pedido is in EN_CAMINO state
- **THEN** the system SHALL transition to ENTREGADO and append a history entry

#### Scenario: Cancellation from PENDIENTE by client
- **WHEN** a CLIENT cancels their own pedido in PENDIENTE state
- **THEN** the system SHALL transition to CANCELADO and append a history entry

#### Scenario: Cancellation from CONFIRMADO restricted to staff
- **WHEN** a CLIENT attempts to cancel a pedido in CONFIRMADO state
- **THEN** the system SHALL return HTTP 403
