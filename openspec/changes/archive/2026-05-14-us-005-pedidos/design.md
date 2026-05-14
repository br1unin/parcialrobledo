## Context

The cart UI (cartStore + all cart pages) and delivery address management are complete. The next missing piece is the server-side order module: persisting a cart as an immutable order, enforcing a well-defined state machine, and exposing management interfaces to both clients and staff.

The backend already contains model scaffolds for `Pedido`, `DetallePedido`, `HistorialEstadoPedido`, and `Pago` (no service/repo yet). The seeded states are `PENDIENTE`, `CONFIRMADO`, `EN_CAMINO`, `ENTREGADO`, and `CANCELADO`. The frontend already has `cartStore` (Zustand + localStorage) and `paymentStore`.

Stack constraints:
- FastAPI + SQLModel + async SQLAlchemy (all I/O must be async)
- `BaseRepository[T]` + `UnitOfWork` pattern already established
- Role codes: `ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT` (strings)
- JWT auth with `require_roles` dependency

## Goals / Non-Goals

**Goals:**
- Atomic order creation with price snapshots, address snapshot, and stock validation
- FSM for order state transitions with an append-only history log
- CLIENT-scoped listing and detail (own orders only)
- PEDIDOS/ADMIN full listing, detail, and state management
- Frontend: checkout page, mis-pedidos list, pedido detail + historial

**Non-Goals:**
- MercadoPago integration (us-006): Pago model exists but no repo/service/router
- PENDIENTE→CONFIRMADO transition (triggered by payment webhook in us-006)
- Stock decrement on CONFIRMADO (also us-006)
- Admin dashboards or order metrics

## Decisions

### D1: Stock validation with SELECT FOR UPDATE

Lock `Producto` rows during order creation to prevent race conditions when two concurrent requests try to create orders with the same product.

```python
stmt = select(Producto).where(Producto.id.in_(producto_ids)).with_for_update()
result = await session.execute(stmt)
productos = result.scalars().all()
```

For each product, check `producto.stock >= requested_cantidad`. If any fails → raise `HTTPException(422)`. The `UnitOfWork` context manager rolls back the transaction automatically.

**Alternative considered**: Optimistic locking with a version column. Rejected because it requires a retry loop on the client side and adds schema complexity. Pessimistic locking is simpler given our low concurrency expectations.

---

### D2: Address snapshot as formatted string

At creation time, load the `DireccionEntrega` record and serialize it:

```python
direccion_snapshot = f"{dir.calle} {dir.numero}, {dir.localidad}, {dir.provincia}"
```

Stored in `Pedido.direccion_snapshot`. The FK `direccion_entrega_id` is also stored for reference, but the snapshot is immutable after creation. If the user later modifies or deletes their address, the order record is unaffected.

**Alternative considered**: Storing a JSON blob of the address fields. Rejected in favor of a human-readable string that can be displayed directly without parsing.

---

### D3: FSM validation table in service

Define valid non-cancellation transitions as a constant dict in the service:

```python
VALID_TRANSITIONS: dict[str, list[str]] = {
    "CONFIRMADO": ["EN_CAMINO"],
    "EN_CAMINO":  ["ENTREGADO"],
}
TERMINAL_STATES = {"ENTREGADO", "CANCELADO"}
```

Cancellation is a separate code path: allowed from `PENDIENTE` (CLIENT/PEDIDOS/ADMIN) or `CONFIRMADO` (PEDIDOS/ADMIN only). The service validates the transition, inserts a `HistorialEstadoPedido` row, and updates `Pedido.estado_codigo` in a single UoW commit.

**Alternative considered**: A full state-machine library. Rejected as over-engineering for five states.

---

### D4: HistorialEstadoPedido is strictly append-only

Every state change (including the initial PENDIENTE on creation) results in an `INSERT` into `historial_estado_pedido`. No `UPDATE` or `DELETE` is ever performed on this table. The service's `historial_repository.append()` method is the only write path.

---

### D5: CLIENT ownership enforced as 404 (not 403)

When a CLIENT requests an order that does not belong to them, the service raises `404 Not Found` rather than `403 Forbidden`. This avoids leaking the existence of orders belonging to other users.

PEDIDOS and ADMIN roles bypass the ownership check entirely and receive the real 404 only when the `pedido_id` does not exist.

---

### D6: Order items sent by the client in the request body

The frontend sends the cart contents explicitly in `POST /api/v1/pedidos` rather than having the backend re-read cartStore (which lives only in the browser). Schema:

```
PedidoCreate:
  direccion_entrega_id: UUID
  items: list[ItemCreate]   # [{ producto_id, cantidad, personalizacion }]
  notas: str | None
```

Price snapshots are captured server-side from the DB, not trusted from the client.

---

### D7: Checkout page flow

1. Load user's `direcciones` via `direccionesApi.list()`
2. Display cart summary from `cartStore`
3. User selects address and optionally adds notes
4. On submit: `pedidosApi.create(payload)` where payload is built from `cartStore.items`
5. On success: `cartStore.clearCart()` + redirect to `/mis-pedidos/:id`
6. On error: display validation message (e.g., insufficient stock)

PaymentStore is not used in this change; payment UI is us-006.

---

### D8: Pago model — no service or router in this change

`app/modules/pagos/model.py` exists in the scaffold. No `PagoRepository`, service, or router is created here. The `Pago` table will be written by the MercadoPago webhook handler in us-006. `UnitOfWork` does NOT need a `pagos` property for this change.

## Risks / Trade-offs

- **SELECT FOR UPDATE with async SQLAlchemy**: Must ensure the session is inside an explicit transaction block (UoW context manager handles this). If mistakenly used outside a transaction, the lock has no effect. → Mitigation: All mutation paths go through the UoW; the service layer never holds a bare session.
- **Snapshot drift**: The address snapshot is a simple string; if the formatting logic changes later, existing orders show the old format and new orders show the new format. → Acceptable trade-off; the snapshot is for display only.
- **Cart/server price mismatch**: A product price could change between the time the user loads the cart and the time they submit. The server always uses the current DB price as the snapshot. → The frontend should display the snapshotted price from the response, not the pre-submit cart price.
- **personalizacion as INTEGER[]**: PostgreSQL native array type. The SQLModel column must use `sa_column=Column(ARRAY(Integer))`. If the project ever moves to SQLite for tests, this type is unsupported. → Mitigation: Use PostgreSQL for all environments; documented in database-setup spec.
