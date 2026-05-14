## Context

The application already has three lookup/configuration models in `app/modules/admin/model.py`: `Rol`, `FormaPago`, and `EstadoPedido`. These are seed-data tables referenced by FKs across `usuarios`, `pedidos`, and `pagos` modules. Until now, no API layer exists for them — the module is a skeleton with only `model.py`.

The dashboard endpoint requires cross-module aggregation: user counts from `usuarios`, product counts from `productos`, order counts grouped by state from `pedidos`, and revenue totals from `pagos`. All queries are read-only and can be executed with direct repository calls through the UoW — no changes to other modules' public APIs.

Auth: the existing `require_role(["ADMIN"])` dependency from `app/core/security.py` is used as-is. No RBAC changes needed.

## Goals / Non-Goals

**Goals:**
- Complete the `app/modules/admin/` module with the standard 4-file pattern (`repository.py`, `schemas.py`, `service.py`, `router.py`)
- Expose 5 admin endpoints with proper role protection
- Provide a frontend admin panel with dashboard stats and tabbed config view
- Integrate admin router into `main.py` and admin repositories into `uow.py`

**Non-Goals:**
- Creating, updating, or deleting `Rol` or `EstadoPedido` records (seed-managed, not user-managed)
- Migrating the database — no schema changes
- Bulk operations on payment methods
- Paginated or filtered views (all lookup tables are small, full list is acceptable)
- Role assignment UI (belongs to user management, already in us-007-usuarios)

## Decisions

### D1: Repository pattern for cross-module dashboard queries

**Decision**: The dashboard service method (`get_dashboard_stats`) will call repositories from other modules via the UoW rather than issuing raw SQL joins.

**Rationale**: Keeps the admin service consistent with the rest of the codebase. The UoW already exposes `usuarios_repo`, `productos_repo`, `pedidos_repo`, and `pagos_repo`. Adding `count` convenience methods to each existing repository (if they don't exist) is preferable to raw queries in admin service — or alternatively, using SQLAlchemy `func.count` directly through the admin service with the session from UoW.

**Chosen approach**: Use `uow.session.execute(select(func.count(...)))` directly in `AdminService.get_dashboard_stats` to avoid modifying other modules' repositories. This is the minimal-footprint option and semantically correct for aggregate stats.

**Alternative considered**: Add `count_all()` methods to each module's repository — rejected because it adds public API surface to modules that don't need it for their own use cases.

---

### D2: `FormaPago` toggle endpoint — PATCH on sub-resource

**Decision**: Use `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` with body `{"habilitado": bool}` rather than a general `PATCH /api/v1/admin/formas-pago/{codigo}`.

**Rationale**: The only mutable field is `habilitado`. A sub-resource endpoint is semantically explicit and prevents accidental field updates. Consistent with how toggle patterns are handled elsewhere (e.g., user `is_active`).

---

### D3: `GET /api/v1/admin/formas-pago` — public access

**Decision**: List payment methods endpoint does NOT require authentication, so checkout forms in other modules can fetch available methods without needing admin credentials.

**Rationale**: The checkout flow needs to know which payment methods are enabled to present options to the client. Making this endpoint public avoids coupling the checkout frontend to admin auth state.

**Risk**: Leaks enabled/disabled state of payment methods. Acceptable because this is non-sensitive operational data.

---

### D4: Frontend page structure — two separate routes

**Decision**: Two routes: `/admin` (tabbed config panel) and `/admin/dashboard` (stats overview). Both wrapped in an `AdminRoute` guard component that checks `ADMIN` role via the auth Zustand store.

**Rationale**: Dashboard and config are distinct concerns. Separating them keeps each page focused and allows independent navigation. The existing auth Zustand store (`useAuthStore`) already exposes the user's roles array — the guard just checks `roles.includes("ADMIN")`.

---

### D5: No new Alembic migration

**Decision**: Skip migration generation for this change.

**Rationale**: All three models (`Rol`, `FormaPago`, `EstadoPedido`) already exist in the database from the initial seed migration. Adding the admin module files does not alter any table schema.

## Risks / Trade-offs

- **[Risk] Dashboard query performance**: Aggregating across 4 tables on every page load could be slow at scale. → **Mitigation**: All queries are simple `COUNT(*)` / `SUM()` with no joins across large result sets. Acceptable for an MVP admin panel. Cache layer can be added later if needed.
- **[Risk] FormaPago `habilitado=false` not enforced at checkout**: Disabling a payment method via admin doesn't automatically prevent its use in the pagos module. → **Mitigation**: The `pagos` service should validate `habilitado` before creating a payment. This is a cross-module concern — add a note in the tasks to check `pagos` service validation. Out of scope for this change to fix.
- **[Risk] Frontend admin guard bypass**: If the guard is frontend-only, a user with a valid ADMIN JWT but who manipulates local state could access the page. → **Mitigation**: All backend endpoints enforce `require_role(["ADMIN"])` independently. Frontend guard is UX-only.

## Migration Plan

1. Add files to `app/modules/admin/` — zero downtime, no schema changes
2. Register router in `app/main.py` — new routes, no breaking changes
3. Add admin repos to `uow.py` — additive change
4. Deploy frontend with new pages and routes — behind role guard, invisible to non-ADMIN users

No rollback complexity — all changes are additive.

## Open Questions

- Should `GET /api/v1/admin/formas-pago` return all methods (including disabled) or only enabled ones? **Assumption**: Return all, with `habilitado` field visible. The checkout frontend can filter client-side. If only enabled should be returned for non-admin callers, a query param `?solo_habilitados=true` could be added later.
- Dashboard revenue total: should it count all orders or only those in terminal states (paid/delivered)? **Assumption**: Sum revenue from `pagos` table where `estado = "aprobado"` — only confirmed payments count toward revenue.
