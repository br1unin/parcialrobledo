## 1. Backend — Schemas

- [x] 1.1 Create `app/modules/admin/schemas.py` with Pydantic response schema `RolRead` (codigo, nombre, descripcion)
- [x] 1.2 Add `FormaPagoRead` schema (codigo, nombre, habilitado) to `schemas.py`
- [x] 1.3 Add `FormaPagoToggleRequest` schema (habilitado: bool) to `schemas.py`
- [x] 1.4 Add `EstadoPedidoRead` schema (codigo, descripcion, orden, es_terminal) to `schemas.py`
- [x] 1.5 Add `PedidosPorEstado` schema (estado: str, cantidad: int) to `schemas.py`
- [x] 1.6 Add `DashboardStats` schema (total_usuarios, total_productos, pedidos_por_estado: list[PedidosPorEstado], ingresos_totales: Decimal) to `schemas.py`

## 2. Backend — Repositories

- [x] 2.1 Create `app/modules/admin/repository.py` with `RolRepository` extending `BaseRepository`; add `get_all()` returning all Rol rows
- [x] 2.2 Add `FormaPagoRepository` to `repository.py`; implement `get_all()` and `toggle_habilitado(codigo: str, habilitado: bool) -> FormaPago | None`
- [x] 2.3 Add `EstadoPedidoRepository` to `repository.py`; implement `get_all_ordered()` returning rows sorted by `orden` ascending

## 3. Backend — Service

- [x] 3.1 Create `app/modules/admin/service.py` with `AdminService.__init__(uow: UnitOfWork)`
- [x] 3.2 Implement `AdminService.list_roles()` — delegates to `RolRepository.get_all()`
- [x] 3.3 Implement `AdminService.list_formas_pago()` — delegates to `FormaPagoRepository.get_all()`
- [x] 3.4 Implement `AdminService.toggle_forma_pago(codigo, habilitado)` — calls `FormaPagoRepository.toggle_habilitado`; raises `HTTPException(404)` if not found; commits via UoW
- [x] 3.5 Implement `AdminService.list_estados_pedido()` — delegates to `EstadoPedidoRepository.get_all_ordered()`
- [x] 3.6 Implement `AdminService.get_dashboard_stats()` — runs four aggregate queries via `uow.session`: count usuarios, count productos activos, count pedidos grouped by estado_codigo, sum monto from pagos where estado="aprobado"; returns `DashboardStats`

## 4. Backend — Router

- [x] 4.1 Create `app/modules/admin/router.py` with `APIRouter(prefix="/admin", tags=["admin"])`
- [x] 4.2 Add `GET /roles` endpoint — requires `ADMIN` role; calls `service.list_roles()`; returns `list[RolRead]`
- [x] 4.3 Add `GET /formas-pago` endpoint — no auth required; calls `service.list_formas_pago()`; returns `list[FormaPagoRead]`
- [x] 4.4 Add `PATCH /formas-pago/{codigo}/habilitado` endpoint — requires `ADMIN` role; body `FormaPagoToggleRequest`; calls `service.toggle_forma_pago()`; returns `FormaPagoRead`
- [x] 4.5 Add `GET /estados-pedido` endpoint — requires `ADMIN` role; calls `service.list_estados_pedido()`; returns `list[EstadoPedidoRead]`
- [x] 4.6 Add `GET /dashboard` endpoint — requires `ADMIN` role; calls `service.get_dashboard_stats()`; returns `DashboardStats`

## 5. Backend — Integration

- [x] 5.1 Open `app/core/uow.py` and import `RolRepository`, `FormaPagoRepository`, `EstadoPedidoRepository`
- [x] 5.2 Add `roles_repo`, `formas_pago_repo`, and `estados_pedido_repo` attributes to `UnitOfWork`, initialized with the session in `__enter__` / `__init__`
- [x] 5.3 Open `app/main.py` and import the admin router from `app.modules.admin.router`
- [x] 5.4 Register the admin router in `app/main.py` with `app.include_router(admin_router, prefix="/api/v1")`

## 6. Backend — Verification

- [x] 6.1 Start the dev server and confirm `GET /api/v1/admin/roles` returns 200 for an ADMIN JWT and 403 for a CLIENT JWT
- [x] 6.2 Confirm `GET /api/v1/admin/formas-pago` returns 200 with no auth token
- [x] 6.3 Confirm `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` toggles correctly and returns 404 for unknown codigo
- [x] 6.4 Confirm `GET /api/v1/admin/estados-pedido` returns rows sorted by `orden`
- [x] 6.5 Confirm `GET /api/v1/admin/dashboard` returns correct shape with `total_usuarios`, `total_productos`, `pedidos_por_estado`, `ingresos_totales`

## 7. Frontend — Types and API Client

- [x] 7.1 Add TypeScript types `Rol`, `FormaPago`, `EstadoPedido`, `DashboardStats`, `PedidosPorEstado` to `frontend/src/types/admin.ts` (create file)
- [x] 7.2 Create `frontend/src/api/admin.ts` with functions: `getRoles()`, `getFormasPago()`, `toggleFormaPago(codigo, habilitado)`, `getEstadosPedido()`, `getDashboardStats()` — all using the existing axios/fetch client

## 8. Frontend — AdminRoute Guard

- [x] 8.1 Create `frontend/src/components/AdminRoute.tsx` — wraps `<Outlet />` or children; reads roles from `useAuthStore`; redirects to `/` if user does not have `ADMIN` role or is not authenticated

## 9. Frontend — AdminDashboardPage

- [x] 9.1 Create `frontend/src/pages/admin/AdminDashboardPage.tsx` with React Query `useQuery` calling `getDashboardStats()`
- [x] 9.2 Render four stat cards: "Total Usuarios", "Total Productos", "Ingresos Totales", and a breakdown of orders by state
- [x] 9.3 Add loading and error states to the dashboard page

## 10. Frontend — AdminPage (Tabbed Panel)

- [x] 10.1 Create `frontend/src/pages/admin/AdminPage.tsx` with a tab bar for "Roles", "Formas de Pago", "Estados de Pedido"
- [x] 10.2 Implement Roles tab — React Query `useQuery` for `getRoles()`; render a read-only table with codigo, nombre, descripcion
- [x] 10.3 Implement Formas de Pago tab — React Query `useQuery` for `getFormasPago()`; render each method with a toggle switch; `useMutation` calling `toggleFormaPago()` on change; invalidate query on success
- [x] 10.4 Implement Estados de Pedido tab — React Query `useQuery` for `getEstadosPedido()`; render a read-only table with codigo, descripcion, orden, es_terminal
- [x] 10.5 Add loading and error states to each tab

## 11. Frontend — Routing

- [x] 11.1 Open the app router (`frontend/src/App.tsx` or `frontend/src/router/index.tsx`) and add `/admin` route using `AdminRoute` guard, rendering `AdminPage`
- [x] 11.2 Add `/admin/dashboard` route using `AdminRoute` guard, rendering `AdminDashboardPage`
- [x] 11.3 Add a navigation link to the admin panel visible only to ADMIN users in the navbar or sidebar

## 12. Frontend — Verification

- [x] 12.1 Verify navigating to `/admin` as ADMIN shows the tabbed config panel
- [x] 12.2 Verify navigating to `/admin` as CLIENT or unauthenticated redirects to home
- [x] 12.3 Verify toggling a payment method in the UI updates the toggle state and persists after page refresh
- [x] 12.4 Verify `/admin/dashboard` displays all four stat cards with real data
