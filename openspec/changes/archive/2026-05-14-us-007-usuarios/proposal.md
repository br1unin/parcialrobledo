## Why

The authentication system (us-001-auth) allows users to register and log in, but provides no way for them to view or update their own profile, change their password, or deactivate their account. Administrators have no API to list, inspect, or manage users. This change closes that gap by delivering a complete user-profile management surface for both regular users and admins.

## What Changes

- New `service.py` in `app/modules/usuarios/` — business logic for profile reads, updates, password changes, soft-deletes, and admin operations
- New `router.py` in `app/modules/usuarios/` — HTTP endpoints registered at `/api/v1/usuarios`
- Extended `UsuarioRepository` — `list_all`, `get_by_id_active`, `count_all`, `deactivate`, `delete_role` helpers
- Extended `schemas.py` — `UpdateProfileRequest`, `ChangePasswordRequest`, `SetActivoRequest`, `AssignRolRequest` schemas
- `app/core/uow.py` updated — expose `usuarios` repository property
- `app/main.py` updated — include `usuarios` router at `/api/v1`
- New frontend `ProfilePage` — view/edit own profile, change password, delete own account
- Alembic migration not required (no schema changes; `deleted_at` already in model)

## Capabilities

### New Capabilities
- `user-profile-management`: Self-service endpoints for authenticated users to read, update, change password, and soft-delete their own account; admin endpoints to list, inspect, activate/deactivate users, and manage role assignments

### Modified Capabilities
- `jwt-authentication`: Token validation must now also check `deleted_at IS NULL`; soft-deleted users must be rejected even with a valid token
- `rbac`: Admin-only guard applied to `GET /api/v1/usuarios`, `GET /api/v1/usuarios/{id}`, `PATCH /api/v1/usuarios/{id}/activo`, `POST /api/v1/usuarios/{id}/roles`, `DELETE /api/v1/usuarios/{id}/roles/{rol}`

## Impact

- **Backend**: `app/modules/usuarios/` (service.py, router.py, repository.py, schemas.py), `app/core/uow.py`, `app/main.py`
- **Frontend**: `frontend/src/pages/ProfilePage.tsx`, `frontend/src/stores/authStore.ts` (profile sync), `frontend/src/api/usuarios.ts`
- **Auth flow**: `get_current_user` dependency in `app/core/security.py` — must reject soft-deleted users
- **No new external dependencies** — password re-hashing uses existing bcrypt via `passlib`
- **No DB migration** — `deleted_at`, `is_active`, all FK columns already present in model
