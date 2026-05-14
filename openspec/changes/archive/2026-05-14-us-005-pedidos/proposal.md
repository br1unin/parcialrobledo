## Why

The cart and address modules are complete, but there is no mechanism to convert a client-side cart into a server-side order or to manage that order through its lifecycle. This change introduces the full order module so clients can place orders, staff can manage them, and the system can enforce a well-defined FSM.

## What Changes

- New backend module `app/modules/pedidos/` — repository, schemas, service, and router for `Pedido`, `DetallePedido`, and `HistorialEstadoPedido`
- New backend skeleton for `app/modules/pagos/` — model only; no MercadoPago integration (reserved for us-006)
- `app/core/uow.py` extended with `pedidos`, `detalles_pedido`, and `historial_pedido` repository properties
- `app/main.py` registers the pedidos router at `/api/v1/pedidos`
- New frontend pages: CheckoutPage, MisPedidosPage, PedidoDetailPage
- Router updated with `/checkout`, `/mis-pedidos`, and `/mis-pedidos/:id` routes (PrivateRoute — CLIENT)

## Capabilities

### New Capabilities

- `order-management`: Full order lifecycle — creation with atomic stock validation and price/address snapshots, listing (CLIENT: own; PEDIDOS/ADMIN: all), detail, FSM state transitions (CONFIRMADO→EN_CAMINO→ENTREGADO, cancellation), and append-only history log. Includes frontend checkout page, mis-pedidos list, and pedido detail page.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. The cart-ui, delivery-address-management, zustand-stores, and rbac specs remain valid as-is. -->

## Impact

- **Backend**: New files in `app/modules/pedidos/` (repository, schemas, service, router). Changes to `app/core/uow.py` and `app/main.py`.
- **Frontend**: New pages in `frontend/src/pages/` (CheckoutPage, MisPedidosPage, PedidoDetailPage). New feature folder `frontend/src/features/pedidos/` (types, api). Router updated.
- **Database**: Tables `pedido`, `detalle_pedido`, `historial_estado_pedido` already exist in the schema (model scaffold present). No new migration needed for this change; `pago` table also exists.
- **Dependencies**: Requires `cart-ui` (cartStore), `delivery-address-management` (direcciones endpoint), `jwt-authentication` (auth), and `rbac` (role guards) — all complete.
- **Out of scope**: MercadoPago payment processing and PENDIENTE→CONFIRMADO transition (us-006). Admin dashboards and metrics.
