## 1. Backend — Pedidos Repository

- [ ] 1.1 Create `app/modules/pedidos/repository.py` with `PedidoRepository(BaseRepository[Pedido])`
- [ ] 1.2 Implement `list_by_usuario(session, usuario_id, skip, limit)` — returns list of Pedido for a single user
- [ ] 1.3 Implement `list_all(session, skip, limit)` — returns all Pedido (PEDIDOS/ADMIN use)
- [ ] 1.4 Implement `count_by_usuario(session, usuario_id)` and `count_all(session)` — for pagination totals
- [ ] 1.5 Implement `get_own(session, pedido_id, usuario_id)` — returns Pedido or raises 404; ownership-safe
- [ ] 1.6 Create `DetallePedidoRepository(BaseRepository[DetallePedido])` (same file or `detalle_repository.py`) with `list_by_pedido(session, pedido_id)`
- [ ] 1.7 Create `HistorialRepository(BaseRepository[HistorialEstadoPedido])` with `list_by_pedido(session, pedido_id)` and `append(session, pedido_id, estado_codigo, observacion)`
- [ ] 1.8 Add `get_productos_for_update(session, producto_ids: list[UUID])` using `SELECT FOR UPDATE` on `Producto` model (can live in producto repository or as a helper in pedidos service)

## 2. Backend — Schemas

- [ ] 2.1 Create `app/modules/pedidos/schemas.py`
- [ ] 2.2 Define `ItemCreate(producto_id: UUID, cantidad: int, personalizacion: list[int])`
- [ ] 2.3 Define `PedidoCreate(direccion_entrega_id: UUID, items: list[ItemCreate], notas: str | None)`
- [ ] 2.4 Define `DetalleResponse(id, producto_id, nombre_snapshot, precio_snapshot, cantidad, personalizacion, subtotal)`
- [ ] 2.5 Define `PedidoResponse(id, usuario_id, estado_codigo, nombre_cliente_snapshot, telefono_snapshot, direccion_snapshot, subtotal, costo_envio, total, notas, created_at, updated_at, detalles: list[DetalleResponse])`
- [ ] 2.6 Define `PedidoListItem(id, estado_codigo, total, created_at)` — lightweight schema for list endpoints
- [ ] 2.7 Define `PedidoListResponse(items: list[PedidoListItem], total: int, page: int, limit: int)`
- [ ] 2.8 Define `EstadoUpdate(nuevo_estado: str, observacion: str | None)`
- [ ] 2.9 Define `HistorialResponse(id, estado_codigo, observacion, created_at)`

## 3. Backend — Service

- [ ] 3.1 Create `app/modules/pedidos/service.py`
- [ ] 3.2 Define FSM constants: `VALID_TRANSITIONS` dict and `TERMINAL_STATES` set
- [ ] 3.3 Implement `create_pedido(uow, current_user, data: PedidoCreate) -> PedidoResponse`:
  - Load and lock producto rows with `SELECT FOR UPDATE`
  - Validate stock for every item; raise 422 if any insufficient
  - Build `Pedido` with price/address snapshots and `nombre_cliente_snapshot`/`telefono_snapshot` from user
  - Create all `DetallePedido` records (precio_snapshot, subtotal, personalizacion)
  - Calculate subtotal and total (subtotal + 50.00)
  - Insert first `HistorialEstadoPedido(estado_codigo="PENDIENTE")`
  - All inside a single UoW commit
- [ ] 3.4 Implement `list_pedidos_cliente(uow, usuario_id, page, limit) -> PedidoListResponse`
- [ ] 3.5 Implement `list_pedidos_admin(uow, page, limit) -> PedidoListResponse`
- [ ] 3.6 Implement `get_pedido(uow, pedido_id, current_user) -> PedidoResponse`:
  - CLIENT: use `get_own()` (404 if not theirs)
  - PEDIDOS/ADMIN: plain get by id (404 if not exists)
  - Load detalles separately and attach to response
- [ ] 3.7 Implement `get_historial(uow, pedido_id, current_user) -> list[HistorialResponse]` with same ownership logic
- [ ] 3.8 Implement `advance_estado(uow, pedido_id, current_user, data: EstadoUpdate) -> PedidoResponse`:
  - Validate not terminal
  - For CANCELADO: check role/state permissions per RN-FS08
  - For other transitions: look up in `VALID_TRANSITIONS`; raise 422 on invalid
  - Update `pedido.estado_codigo`; insert `HistorialEstadoPedido`

## 4. Backend — Router

- [ ] 4.1 Create `app/modules/pedidos/router.py` with `APIRouter(prefix="/pedidos", tags=["pedidos"])`
- [ ] 4.2 `POST /` (requires CLIENT) — calls `create_pedido`, returns 201
- [ ] 4.3 `GET /` (CLIENT: own list; PEDIDOS/ADMIN: all) — query params `page: int = 1`, `limit: int = 10`; dispatch to correct service method based on role
- [ ] 4.4 `GET /{pedido_id}` (CLIENT: own; PEDIDOS/ADMIN: any) — calls `get_pedido`
- [ ] 4.5 `GET /{pedido_id}/historial` (CLIENT: own; PEDIDOS/ADMIN: any) — calls `get_historial`
- [ ] 4.6 `PATCH /{pedido_id}/estado` (all authenticated roles) — calls `advance_estado`; returns 200 with updated PedidoResponse

## 5. Backend — Wiring

- [ ] 5.1 Add `pedidos: PedidoRepository`, `detalles_pedido: DetallePedidoRepository`, and `historial_pedido: HistorialRepository` properties to `app/core/uow.py`
- [ ] 5.2 Register pedidos router in `app/main.py` at prefix `/api/v1/pedidos`

## 6. Frontend — Types & API

- [ ] 6.1 Create `frontend/src/features/pedidos/types.ts` with:
  - `ItemCreate`, `PedidoCreate`
  - `DetalleResponse`, `PedidoResponse`, `PedidoListItem`, `PedidoListResponse`
  - `EstadoUpdate`, `HistorialResponse`
- [ ] 6.2 Create `frontend/src/features/pedidos/api.ts` with `pedidosApi`:
  - `list(page, limit)` — GET `/api/v1/pedidos`
  - `get(id)` — GET `/api/v1/pedidos/{id}`
  - `create(data: PedidoCreate)` — POST `/api/v1/pedidos`
  - `updateEstado(id, data: EstadoUpdate)` — PATCH `/api/v1/pedidos/{id}/estado`
  - `getHistorial(id)` — GET `/api/v1/pedidos/{id}/historial`

## 7. Frontend — Checkout Page

- [ ] 7.1 Create `frontend/src/pages/CheckoutPage.tsx`:
  - Load user's direcciones via `direccionesApi.list()`
  - Display cart summary from `cartStore` (items, subtotal, costoEnvio, total)
  - Address selector (dropdown or radio list)
  - Optional notas textarea
  - "Confirmar pedido" submit button (disabled if cart is empty or no address selected)
  - On success: `cartStore.clearCart()` + navigate to `/mis-pedidos/:id`
  - On 422 error: display inline error message
  - Guard: if `cartStore.items.length === 0` redirect to `/carrito`
- [ ] 7.2 Add route `/checkout` in `frontend/src/app/router.tsx` (PrivateRoute, CLIENT role)
- [ ] 7.3 Add "Ir al checkout" navigation from `CarritoPage` (replace or activate existing placeholder button)

## 8. Frontend — Mis Pedidos & Detail Pages

- [ ] 8.1 Create `frontend/src/pages/MisPedidosPage.tsx`:
  - Fetch orders via `pedidosApi.list()` with pagination
  - Render each order as a card/row with: short ID, total, created_at, color-coded `estado_codigo` badge
  - Link each item to `/mis-pedidos/:id`
- [ ] 8.2 Create `frontend/src/pages/PedidoDetailPage.tsx`:
  - Fetch order via `pedidosApi.get(id)` and historial via `pedidosApi.getHistorial(id)`
  - Display order metadata: total, `direccion_snapshot`, `notas`, `estado_codigo` badge
  - Render `detalles` table: nombre_snapshot, precio_snapshot, cantidad, personalizacion (excluded ingredients), subtotal
  - Render `historial` timeline: estado_codigo + observacion + created_at, ordered ascending
  - Show "Cancelar pedido" button if `estado_codigo === "PENDIENTE"` (calls `pedidosApi.updateEstado` with `CANCELADO`)
- [ ] 8.3 Add route `/mis-pedidos` in `frontend/src/app/router.tsx` (PrivateRoute, CLIENT role)
- [ ] 8.4 Add route `/mis-pedidos/:id` in `frontend/src/app/router.tsx` (PrivateRoute, CLIENT role)
- [ ] 8.5 Add "Mis Pedidos" nav link in `HomePage` or shared navigation component
