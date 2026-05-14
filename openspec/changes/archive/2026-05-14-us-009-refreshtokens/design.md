## Context

The `refreshtokens` module was created in us-001-auth to support token rotation and reuse-detection. It already has a SQLAlchemy model (`RefreshToken`) and a repository with revocation methods. The `auth` module calls those methods internally, but no endpoint exposes session data to the user.

Users currently have no way to see what devices/sessions are active under their account and cannot remotely sign out a specific session. The only option is `/auth/logout`, which revokes the token they send — meaning they must be on the device they want to log out.

This change wires up the read-side and ownership-aware revocation that the data model already supports.

## Goals / Non-Goals

**Goals:**
- Expose a `GET /api/v1/auth/sessions` endpoint that returns the caller's active (non-revoked, non-expired) sessions without leaking token hashes.
- Expose `DELETE /api/v1/auth/sessions/{token_id}` for per-session revocation with ownership enforcement.
- Expose `DELETE /api/v1/auth/sessions` for bulk revocation of all own sessions (global logout).
- Provide admin-scoped variants to inspect/revoke sessions for any user.
- Add a "Sesiones activas" panel in `ProfilePage` with revoke-all and per-session revoke buttons.

**Non-Goals:**
- Storing device metadata (OS, browser, IP) — the current model has no such columns; adding them is a future change.
- Invalidating the caller's *access* token on bulk revoke — access tokens are short-lived JWTs and expire naturally.
- Paginating the sessions list — a user is unlikely to have more than a handful of active sessions.

## Decisions

### D1: Mount under `/api/v1/auth/sessions`, not `/api/v1/refreshtokens/sessions`

**Decision**: Use `/api/v1/auth/sessions`.

**Rationale**: From the client's perspective, sessions are an extension of the auth surface. Mounting under `/auth` keeps the auth-related routes co-located and avoids surfacing the internal module name `refreshtokens` in the public API.

**Alternative considered**: A separate `/refreshtokens` prefix — rejected because it exposes implementation details.

### D2: Ownership check in the service layer (not the repository)

**Decision**: `get_own_by_id(token_id, usuario_id)` returns `None` if the token does not belong to the caller; the service raises HTTP 404 — not 403 — to avoid confirming the existence of another user's token.

**Rationale**: 404 prevents enumeration of valid token IDs belonging to other users. The repository handles the SQL filter; the service maps `None` → `HTTPException(404)`.

### D3: `list_active_for_user` filters in SQL (not Python)

**Decision**: Pass `now` into the repository and filter `revoked_at IS NULL AND expires_at > now` in the WHERE clause.

**Rationale**: Fetching all tokens and filtering in Python would pull revoked/expired rows unnecessarily. The `expires_at` index (if present) makes this efficient.

### D4: Response omits `token_hash`

**Decision**: `SessionResponse` includes `id`, `created_at`, `expires_at` only — no `token_hash`, no `usuario_id`, no `revoked_at`.

**Rationale**: The token hash is a secret value. Exposing it even in hashed form in a list response widens the attack surface unnecessarily.

### D5: Frontend uses React Query (not a new Zustand store)

**Decision**: Implement sessions API calls as React Query hooks (`useActiveSessions`, `useRevokeSession`, `useRevokeAllSessions`) rather than a new Zustand store.

**Rationale**: Sessions data is server-side state — it should be fetched fresh. React Query already handles caching, invalidation, and loading/error states. A Zustand store would duplicate server state unnecessarily. The project already uses React Query for similar server-data concerns (cart, orders).

### D6: Admin endpoints prefixed with `/sessions/usuario/{id}`

**Decision**: `GET /api/v1/auth/sessions/usuario/{id}` and `DELETE /api/v1/auth/sessions/usuario/{id}`.

**Rationale**: Consistent with the existing admin pattern in `usuarios` routes. Clear separation between own-session routes and admin routes without requiring a separate prefix.

## Risks / Trade-offs

- **Token ID exposure** → An attacker who obtains a valid access token for user A can list A's session IDs. They cannot use those IDs to escalate (IDs are UUIDs, not hashes) — but they could revoke sessions. Mitigation: endpoint requires a valid JWT; IDs are UUIDs (not sequential).
- **Stale list on concurrent rotation** → If a rotation happens while the list is being fetched, one token may appear active then become revoked immediately after. Mitigation: this is a display race condition with no security impact; no mitigation needed.
- **No `revoked_at` on bulk-DELETE** → The current `revoke_all_for_user` already sets `revoked_at`; we reuse it. Caller's own current-session token is also revoked, so the frontend should redirect to login. This is intentional.

## Migration Plan

1. Add two methods to `RefreshTokenRepository` (non-breaking, additive).
2. Create `schemas.py`, `service.py`, `router.py` in `app/modules/refreshtokens/`.
3. Register router in `app/main.py` (additive, no path conflicts).
4. Add frontend hooks and ProfilePage section.
5. No database migrations needed — no schema changes.
6. Rollback: remove router registration from `main.py` to hide endpoints; frontend section can be feature-flagged.

## Open Questions

- Should `DELETE /sessions` (revoke all) also invalidate the caller's current refresh token and force a full re-login? (Current answer: yes — reuse `revoke_all_for_user` which revokes all tokens including the caller's. Frontend must handle 401 after this call and redirect to `/login`.)
- Should a future iteration store device fingerprint / IP / user-agent? (Out of scope for this change — tracked as future enhancement.)
