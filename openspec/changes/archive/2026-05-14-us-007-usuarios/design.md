## Context

us-001-auth delivered JWT authentication and RBAC guards. The `usuarios` module already has a `model.py` (Usuario + UsuarioRol) and a thin `repository.py` with `get_by_email`, `get_roles`, and `assign_role`. No service layer or HTTP router exists. This change builds the missing service + router and extends the repository, giving authenticated users self-service profile management and giving admins full user-management control.

Current state of `app/modules/usuarios/`:
- `model.py` — complete; no schema changes needed
- `repository.py` — partial; missing `list_all`, `get_by_id_active`, `count_all`, `deactivate`, `delete_role`
- `schemas.py` — has `UserResponse`, `TokenResponse`; missing write schemas
- No `service.py`, no `router.py`

`app/core/uow.py` exposes one `UsuarioRepository` usage for auth but has no `usuarios` property. `app/main.py` does not include a usuarios router.

## Goals / Non-Goals

**Goals:**
- Self-service profile endpoints for authenticated users (`/me` routes)
- Admin user-management endpoints (list, get, activate/deactivate, role assign/revoke)
- Extend repository and schemas to support the above
- Register router in main app
- Frontend `ProfilePage` with view, edit, password change, and account deletion
- Soft-delete propagates to auth: deleted users get 401 on every subsequent request

**Non-Goals:**
- Email change (requires email verification flow — out of scope)
- Admin ability to reset passwords (out of scope; admins can deactivate instead)
- Pagination UI on frontend (backend paginates; frontend renders first page only for now)
- User registration is already covered by us-001-auth — not touched here

## Decisions

### 1. Soft-delete via `deleted_at` only — no hard delete

**Decision**: `DELETE /api/v1/usuarios/me` sets `deleted_at = now()`. The row is never removed.

**Why**: Referential integrity (orders, payments reference `usuario_id`). Preserving history is required for audit. Hard delete would cascade-break order history.

**Alternatives considered**:
- Hard delete with cascade: rejected — destroys payment/order history
- Separate `deleted` boolean: redundant; `deleted_at` carries both status and timestamp

### 2. `get_current_user` extended to reject soft-deleted users

**Decision**: `app/core/security.py` — `get_current_user` adds `if usuario.deleted_at is not None: raise 401`.

**Why**: A user who deletes their account should immediately lose access even if their JWT hasn't expired yet. This is the single enforcement point — no per-endpoint check needed.

**Alternatives considered**:
- Check `deleted_at` in every endpoint: repetitive, easy to forget
- Revoke all refresh tokens on delete: done in addition (defense in depth), but not sufficient alone since access token is stateless

### 3. `is_active` is admin-only; soft-delete is user-initiated

**Decision**: Regular users call `DELETE /me` → sets `deleted_at`. Admins call `PATCH /{id}/activo` → toggles `is_active`. Both conditions checked in `get_current_user`.

**Why**: Distinguishes "account suspended by admin" from "user voluntarily left". Both result in 401, but for different operational reasons.

### 4. Password change requires `current_password` verification

**Decision**: `PATCH /api/v1/usuarios/me/password` requires `current_password` and `new_password`. Service verifies current before hashing new.

**Why**: Prevents account takeover if an access token is stolen — attacker can't change password without knowing the current one.

**Alternatives considered**:
- Token-based password reset (email link): more secure for forgotten passwords, but out of scope for this change

### 5. Admin pagination via `skip`/`limit` query params

**Decision**: `GET /api/v1/usuarios` accepts `skip` (default 0) and `limit` (default 20, max 100). Returns `{ items, total, skip, limit }`.

**Why**: Simple offset pagination is sufficient for an admin panel. Keyset pagination is unnecessary at current scale.

### 6. Role management via dedicated sub-routes

**Decision**: `POST /api/v1/usuarios/{id}/roles` assigns a role; `DELETE /api/v1/usuarios/{id}/roles/{rol}` removes it.

**Why**: RESTful resource model — roles are a sub-resource of a user. Avoids PUT semantics that would require sending the full role list on every update.

### 7. Frontend ProfilePage uses React Query mutations

**Decision**: The frontend uses `useMutation` (React Query) for all write operations and `useQuery` for fetching profile. Optimistic updates are not used — wait for server confirmation before updating store.

**Why**: Profile operations are infrequent; correctness over perceived speed. Reduces risk of stale state in Zustand auth store.

## Risks / Trade-offs

- **Soft-delete leaves orphan refresh tokens**: When a user soft-deletes, their refresh tokens remain in the DB until they expire (7 days). Mitigation: service layer revokes all refresh tokens on soft-delete (reuse `RefreshTokenRepository.revoke_all_for_user`).
- **Race condition on role delete**: If the only ADMIN role assignment is removed, the system has no admin. Mitigation: service checks that at least one other ADMIN user exists before allowing the last ADMIN assignment to be removed.
- **`updated_at` auto-update via SQLAlchemy `onupdate`**: Relies on SQLAlchemy ORM updates, not raw SQL. If bulk updates bypass ORM, `updated_at` won't change. Mitigation: always use ORM through the repository.
- **Token still valid after `is_active = False`**: The access JWT is stateless — it remains valid until expiry (30 min). Mitigation: `get_current_user` checks `is_active` (already does per existing spec); no additional change needed.

## Migration Plan

1. Extend `UsuarioRepository` (no migration — no schema changes)
2. Add write schemas to `schemas.py`
3. Implement `UsuarioService`
4. Add `UsuarioRouter`, register in `main.py`
5. Add `usuarios` property to `UnitOfWork`
6. Update `get_current_user` in `security.py` to check `deleted_at`
7. Build `ProfilePage` frontend
8. Manual test: register → login → view profile → update → change password → delete account

Rollback: Remove the router include from `main.py` to disable all new endpoints. No DB migration to revert.

## Open Questions

- Should `DELETE /me` also immediately invalidate the access token (token blocklist)? Currently, the 30-min window is accepted as tolerable. If security requirements tighten, a Redis blocklist can be added in a follow-up change.
- Should admin role-assignment validate that `rol_codigo` exists in the `rol` table at the service layer, or rely on the FK constraint? Current decision: service validates with a lookup before insert to return a meaningful 404 instead of a cryptic DB error.
