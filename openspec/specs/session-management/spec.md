# session-management Specification

## Purpose
TBD - created by archiving change us-009-refreshtokens. Update Purpose after archive.
## Requirements
### Requirement: User can list own active sessions
The system SHALL return all active (non-revoked, non-expired) refresh token records for the authenticated user. The response MUST NOT include the token hash. Each session SHALL include: `id`, `created_at`, `expires_at`.

#### Scenario: Authenticated user lists sessions
- **WHEN** GET /api/v1/auth/sessions with a valid Bearer token
- **THEN** system returns HTTP 200 with a JSON array of SessionResponse objects, each containing id, created_at, and expires_at — no token_hash

#### Scenario: No active sessions
- **WHEN** GET /api/v1/auth/sessions and the user has no active tokens (all revoked or expired)
- **THEN** system returns HTTP 200 with an empty array

#### Scenario: Unauthenticated request
- **WHEN** GET /api/v1/auth/sessions without a Bearer token
- **THEN** system returns HTTP 401

---

### Requirement: User can revoke a specific session by ID
The system SHALL revoke a single refresh token identified by its UUID, provided it belongs to the authenticated user. If the token does not exist or belongs to another user, the system SHALL return HTTP 404 to avoid confirming the existence of other users' tokens.

#### Scenario: Successful single-session revocation
- **WHEN** DELETE /api/v1/auth/sessions/{token_id} and the token exists, is owned by the caller, and is not yet revoked
- **THEN** system sets revoked_at on that token and returns HTTP 204

#### Scenario: Token belongs to another user
- **WHEN** DELETE /api/v1/auth/sessions/{token_id} and the token_id belongs to a different user
- **THEN** system returns HTTP 404 (not 403 — ownership must not be confirmed)

#### Scenario: Token not found
- **WHEN** DELETE /api/v1/auth/sessions/{token_id} and the token_id does not exist in the database
- **THEN** system returns HTTP 404

#### Scenario: Already revoked token
- **WHEN** DELETE /api/v1/auth/sessions/{token_id} and the token is already revoked
- **THEN** system returns HTTP 404 (token not visible in own active sessions)

---

### Requirement: User can revoke all own sessions (global logout)
The system SHALL revoke all refresh tokens belonging to the authenticated user, including the one used in the current request. This operation SHALL be idempotent.

#### Scenario: Successful global logout
- **WHEN** DELETE /api/v1/auth/sessions with a valid Bearer token
- **THEN** system sets revoked_at on all RefreshToken records for that user and returns HTTP 204

#### Scenario: No active sessions to revoke
- **WHEN** DELETE /api/v1/auth/sessions and the user has no active tokens
- **THEN** system returns HTTP 204 (idempotent — no error)

#### Scenario: Subsequent requests rejected
- **WHEN** DELETE /api/v1/auth/sessions is called and then a refresh is attempted with any previously active token
- **THEN** system returns HTTP 401 on the refresh attempt (token is revoked)

---

### Requirement: Admin can list sessions for any user
The system SHALL allow users with ADMIN role to list all active sessions for any user by their usuario_id.

#### Scenario: Admin lists sessions for a user
- **WHEN** GET /api/v1/auth/sessions/usuario/{id} with a valid ADMIN Bearer token
- **THEN** system returns HTTP 200 with the active sessions array for that user

#### Scenario: Non-admin user attempts admin endpoint
- **WHEN** GET /api/v1/auth/sessions/usuario/{id} with a non-admin Bearer token
- **THEN** system returns HTTP 403

#### Scenario: Admin lists sessions for a user with no active sessions
- **WHEN** GET /api/v1/auth/sessions/usuario/{id} and the target user has no active sessions
- **THEN** system returns HTTP 200 with an empty array

---

### Requirement: Admin can revoke all sessions for any user
The system SHALL allow users with ADMIN role to revoke all active sessions for any user by their usuario_id.

#### Scenario: Admin revokes all sessions for a user
- **WHEN** DELETE /api/v1/auth/sessions/usuario/{id} with a valid ADMIN Bearer token
- **THEN** system sets revoked_at on all active RefreshToken records for that user and returns HTTP 204

#### Scenario: Non-admin user attempts admin revoke endpoint
- **WHEN** DELETE /api/v1/auth/sessions/usuario/{id} with a non-admin Bearer token
- **THEN** system returns HTTP 403

---

### Requirement: Frontend displays active sessions with revoke actions
The frontend ProfilePage SHALL display a "Sesiones activas" section listing the user's active sessions and providing revoke controls.

#### Scenario: Sessions section renders in ProfilePage
- **WHEN** an authenticated user navigates to the profile page
- **THEN** the page displays a "Sesiones activas" section with a list of active sessions (created_at, expires_at) and a revoke button per session

#### Scenario: User revokes individual session
- **WHEN** user clicks the revoke button for a specific session
- **THEN** frontend calls DELETE /api/v1/auth/sessions/{token_id} and removes the session from the list on success

#### Scenario: User clicks "Cerrar todas las sesiones"
- **WHEN** user clicks the "Cerrar todas las sesiones" button
- **THEN** frontend calls DELETE /api/v1/auth/sessions, clears auth state, and redirects to /login

