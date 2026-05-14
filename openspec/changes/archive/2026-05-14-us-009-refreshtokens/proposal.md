## Why

The `refreshtokens` module already stores token records and the `auth` module already handles rotation, revocation, and reuse-detection — but users have no visibility into their own active sessions and no way to remotely revoke individual ones. This change exposes that data through a session-management API and a frontend "Sesiones activas" panel, completing the security story started in us-001-auth.

## What Changes

- Add `schemas.py` to `app/modules/refreshtokens/` with Pydantic response/request models for session data.
- Add `service.py` to `app/modules/refreshtokens/` with business logic for listing and revoking sessions.
- Add `router.py` to `app/modules/refreshtokens/` with the `/api/v1/auth/sessions` endpoints.
- Extend `RefreshTokenRepository` with two new query methods: `list_active_for_user` and `get_own_by_id`.
- Register the new router in `app/main.py`.
- Add "Sesiones activas" section to the frontend `ProfilePage` with per-session revoke and global logout buttons.
- Add a `useSessionsStore` Zustand store (or React Query hooks) to manage session state on the frontend.

## Capabilities

### New Capabilities

- `session-management`: REST endpoints and frontend UI for listing, individually revoking, and bulk-revoking active refresh-token sessions for authenticated users and admins.

### Modified Capabilities

- `jwt-authentication`: Repository gains two new methods (`list_active_for_user`, `get_own_by_id`) and the `RefreshTokenRepository` is now used outside the auth flow for read/revoke operations.

## Impact

- **Backend**: `app/modules/refreshtokens/` (new files); `app/modules/refreshtokens/repository.py` (two new methods); `app/main.py` (router registration).
- **Frontend**: `frontend/src/pages/ProfilePage.tsx` (new section); new `frontend/src/stores/sessionsStore.ts` or React Query hooks; new `frontend/src/api/sessions.ts` API client.
- **No breaking changes** — existing `/auth/refresh`, `/auth/logout`, and `/usuarios` endpoints are unaffected.
- **Dependencies**: None new — uses existing SQLAlchemy models, JWT utilities, and UoW pattern already in place.
