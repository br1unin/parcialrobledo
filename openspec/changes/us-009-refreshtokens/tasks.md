## 1. Repository — Extend RefreshTokenRepository

- [x] 1.1 Add method `list_active_for_user(self, usuario_id: int, now: datetime) -> list[RefreshToken]` to `app/modules/refreshtokens/repository.py` — filters `revoked_at IS NULL AND expires_at > now AND usuario_id = usuario_id`
- [x] 1.2 Add method `get_own_by_id(self, token_id: int, usuario_id: int) -> RefreshToken | None` to `app/modules/refreshtokens/repository.py` — returns token only if it is active (not revoked, not expired) and belongs to the caller
- [x] 1.3 Verify UoW already exposes `uow.refresh_tokens` (no changes needed if so)

## 2. Backend — Schemas

- [x] 2.1 Create `app/modules/refreshtokens/schemas.py`
- [x] 2.2 Define `SessionResponse(BaseModel)` with fields: `id: int`, `created_at: datetime`, `expires_at: datetime`
- [x] 2.3 Verify `SessionResponse` does NOT include `token_hash`, `usuario_id`, or `revoked_at`

## 3. Backend — Service

- [x] 3.1 Create `app/modules/refreshtokens/service.py`
- [x] 3.2 Implement `list_own_sessions(uow, usuario_id) -> list[SessionResponse]` — calls `uow.refresh_tokens.list_active_for_user(usuario_id, datetime.utcnow())`
- [x] 3.3 Implement `revoke_own_session(uow, token_id, usuario_id) -> None` — calls `get_own_by_id`; raises `HTTPException(404)` if None; calls `revoke_token(token.id)` if found
- [x] 3.4 Implement `revoke_all_own_sessions(uow, usuario_id) -> None` — calls `uow.refresh_tokens.revoke_all_for_user(usuario_id)`
- [x] 3.5 Implement `admin_list_sessions(uow, target_usuario_id) -> list[SessionResponse]` — same as 3.2 but for any user
- [x] 3.6 Implement `admin_revoke_all_sessions(uow, target_usuario_id) -> None` — same as 3.4 but for any user

## 4. Backend — Router

- [x] 4.1 Create `app/modules/refreshtokens/router.py` with `APIRouter(prefix="/auth/sessions", tags=["sessions"])`
- [x] 4.2 Implement `GET /` → calls `list_own_sessions`; returns `list[SessionResponse]`; requires `get_current_user`
- [x] 4.3 Implement `DELETE /{token_id}` → calls `revoke_own_session`; returns HTTP 204; requires `get_current_user`
- [x] 4.4 Implement `DELETE /` → calls `revoke_all_own_sessions`; returns HTTP 204; requires `get_current_user`
- [x] 4.5 Implement `GET /usuario/{id}` → calls `admin_list_sessions`; returns `list[SessionResponse]`; requires `require_role("ADMIN")`
- [x] 4.6 Implement `DELETE /usuario/{id}` → calls `admin_revoke_all_sessions`; returns HTTP 204; requires `require_role("ADMIN")`
- [x] 4.7 Ensure route ordering places `/usuario/{id}` before `/{token_id}` to avoid path conflicts in FastAPI

## 5. Backend — Registration

- [x] 5.1 Import and include `refreshtokens.router` in `app/main.py` under prefix `/api/v1`
- [x] 5.2 Start FastAPI server and verify no import errors or router conflicts

## 6. Backend — Verification

- [x] 6.1 With a valid token, call `GET /api/v1/auth/sessions` and confirm response contains active sessions without token_hash
- [x] 6.2 Call `DELETE /api/v1/auth/sessions/{token_id}` for an owned session and confirm HTTP 204 + session disappears from GET list
- [x] 6.3 Call `DELETE /api/v1/auth/sessions/{token_id}` with a token_id belonging to another user and confirm HTTP 404
- [x] 6.4 Call `DELETE /api/v1/auth/sessions` and confirm HTTP 204; confirm subsequent `POST /auth/refresh` with the old token returns HTTP 401
- [x] 6.5 As ADMIN, call `GET /api/v1/auth/sessions/usuario/{id}` and confirm correct response
- [x] 6.6 As non-ADMIN, call `GET /api/v1/auth/sessions/usuario/{id}` and confirm HTTP 403

## 7. Frontend — API Client

- [x] 7.1 Create `frontend/src/api/sessions.ts` with typed functions: `getActiveSessions()`, `revokeSession(tokenId: number)`, `revokeAllSessions()`
- [x] 7.2 Use the existing Axios instance (or fetch wrapper) with Bearer token header from auth store

## 8. Frontend — React Query Hooks

- [x] 8.1 Create `frontend/src/hooks/useSessions.ts` (or add to existing hooks file)
- [x] 8.2 Implement `useActiveSessions()` hook — `useQuery` calling `getActiveSessions()`
- [x] 8.3 Implement `useRevokeSession()` hook — `useMutation` calling `revokeSession(tokenId)`, invalidates sessions query on success
- [x] 8.4 Implement `useRevokeAllSessions()` hook — `useMutation` calling `revokeAllSessions()`, clears auth state and redirects to `/login` on success

## 9. Frontend — ProfilePage Integration

- [x] 9.1 Add "Sesiones activas" section to `frontend/src/pages/ProfilePage.tsx` below existing profile content
- [x] 9.2 Display loading state while sessions are fetching
- [x] 9.3 Render a list item per session showing `created_at` (formatted) and `expires_at` (formatted) with a "Revocar" button
- [x] 9.4 Wire "Revocar" button to `useRevokeSession` mutation; show loading state on the button while mutation is in flight
- [x] 9.5 Add "Cerrar todas las sesiones" button; wire to `useRevokeAllSessions` mutation
- [x] 9.6 Show empty state message when no active sessions are returned

## 10. Frontend — Verification

- [x] 10.1 Navigate to ProfilePage and verify "Sesiones activas" section appears with active sessions listed
- [x] 10.2 Click "Revocar" on one session and verify it disappears from the list without a full page reload
- [x] 10.3 Click "Cerrar todas las sesiones" and verify redirect to /login occurs
- [x] 10.4 Verify no token_hash is ever displayed in the UI or logged to console
