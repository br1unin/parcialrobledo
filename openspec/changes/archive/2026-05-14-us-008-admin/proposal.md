## Why

The application has lookup/configuration tables (`Rol`, `FormaPago`, `EstadoPedido`) that are referenced as foreign keys across multiple modules but have no management interface. Administrators currently have no way to view system configuration, toggle payment methods on or off, or see a high-level operational overview of the store.

## What Changes

- **New admin backend module**: Add `repository.py`, `schemas.py`, `service.py`, and `router.py` to the existing `app/modules/admin/` directory, completing the module skeleton that already has only `model.py`.
- **Admin REST endpoints** (all require `ADMIN` role except where noted):
  - `GET /api/v1/admin/roles` — list all system roles
  - `GET /api/v1/admin/formas-pago` — list all payment methods (accessible publicly for checkout forms)
  - `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` — toggle a payment method enabled/disabled
  - `GET /api/v1/admin/estados-pedido` — list all order states
  - `GET /api/v1/admin/dashboard` — aggregate stats: total users, total products, total orders (grouped by state), total revenue
- **Admin frontend pages**:
  - `AdminDashboardPage.tsx` — stats cards and store overview at `/admin/dashboard`
  - `AdminPage.tsx` — tabbed management view (Roles, Formas de Pago, Estados de Pedido) at `/admin`
  - Both routes protected with ADMIN role guard
- **Integration points**: Register the admin router in `app/main.py` and add admin repositories to `app/core/uow.py`.

## Capabilities

### New Capabilities

- `admin-management`: CRUD-lite management of lookup/config entities (Rol, FormaPago, EstadoPedido) and a dashboard stats aggregation endpoint, restricted to ADMIN role. Includes the complete backend module and frontend admin panel.

### Modified Capabilities

- `rbac`: Admin endpoints will consume the existing `require_role("ADMIN")` guard — no new RBAC rules, but the admin-management spec references this capability as a dependency.

## Impact

- **Backend**: `app/modules/admin/` (new files), `app/core/uow.py` (add admin repos), `app/main.py` (register router)
- **Frontend**: `frontend/src/pages/admin/` (new pages), `frontend/src/router/` or `App.tsx` (add protected routes)
- **Database**: No schema migrations — models already exist and are seeded
- **Dependencies**: Dashboard endpoint aggregates data from `usuarios`, `productos`, `pedidos`, and `pagos` modules — read-only cross-module queries
- **No breaking changes** — adds new endpoints, does not modify existing ones
