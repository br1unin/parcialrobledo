# jwt-authentication Specification

## Purpose
TBD - created by archiving change us-001-auth. Update Purpose after archive.
## Requirements
### Requirement: User registration
The system SHALL create a new user account when valid registration data is provided. The password MUST be hashed with bcrypt (cost factor ≥ 10). The role CLIENT (id: 4) MUST be auto-assigned regardless of request body. The response MUST include an access token (30 min), a refresh token (7 days UUID v4), and the user data with roles.

#### Scenario: Successful registration
- **WHEN** POST /api/v1/auth/register with valid nombre, email, and password (≥ 8 chars)
- **THEN** system creates user, assigns CLIENT role, and returns 201 with TokenResponse (access_token, refresh_token, token_type="Bearer", user)

#### Scenario: Duplicate email
- **WHEN** POST /api/v1/auth/register with an email already registered
- **THEN** system returns HTTP 409 with detail "El email ya está registrado"

#### Scenario: Password not stored in plaintext
- **WHEN** a user is created
- **THEN** the `hashed_password` column in BD contains a bcrypt hash, never the plaintext password

---

### Requirement: User login with double token
The system SHALL authenticate users via email and password, returning an access token (JWT, 30 min, HS256) and a refresh token (UUID v4, stored in BD, 7 days). The error response MUST be identical for "email not found", "wrong password", and "soft-deleted user" to prevent user enumeration.

#### Scenario: Successful login
- **WHEN** POST /api/v1/auth/login with valid email and password
- **THEN** system returns 200 with access_token (JWT), refresh_token (UUID), token_type="Bearer", and UserResponse with roles list

#### Scenario: Invalid credentials — wrong password
- **WHEN** POST /api/v1/auth/login with existing email but wrong password
- **THEN** system returns HTTP 401 with generic message "Credenciales inválidas"

#### Scenario: Invalid credentials — unknown email
- **WHEN** POST /api/v1/auth/login with an email not in the system
- **THEN** system returns HTTP 401 with generic message "Credenciales inválidas" (same as wrong password)

#### Scenario: Soft-deleted user attempts login
- **WHEN** POST /api/v1/auth/login with credentials of a user whose deleted_at is not null
- **THEN** system returns HTTP 401 with generic message "Credenciales inválidas" (same as invalid credentials)

#### Scenario: Rate limit exceeded
- **WHEN** the same IP makes more than 5 login requests within 15 minutes
- **THEN** system returns HTTP 429 with Retry-After header

### Requirement: Refresh token rotation
The system SHALL issue a new access/refresh token pair when a valid, non-revoked refresh token is provided. The used token MUST be revoked immediately (rotación). A replay attack MUST revoke all refresh tokens for that user.

#### Scenario: Successful token refresh
- **WHEN** POST /api/v1/auth/refresh with a valid, non-revoked, non-expired refresh token
- **THEN** system marks the old token as revoked, creates a new refresh token, returns new access_token and refresh_token with 200

#### Scenario: Replay attack detected
- **WHEN** POST /api/v1/auth/refresh with a refresh token that exists in BD but has revocado_en set (already used)
- **THEN** system revokes ALL RefreshToken records for that user and returns HTTP 401

#### Scenario: Expired refresh token
- **WHEN** POST /api/v1/auth/refresh with a refresh token past its expiration date
- **THEN** system returns HTTP 401

---

### Requirement: Logout
The system SHALL revoke the active refresh token on logout. The access token expires naturally.

#### Scenario: Successful logout
- **WHEN** POST /api/v1/auth/logout with a valid refresh token in the request body
- **THEN** system sets revocado_en on that RefreshToken record and returns HTTP 204

#### Scenario: Logout with unknown token
- **WHEN** POST /api/v1/auth/logout with a token not found in BD
- **THEN** system returns HTTP 204 (idempotent — no error exposed)

### Requirement: RefreshTokenRepository supports active-session queries
The `RefreshTokenRepository` SHALL expose two additional query methods beyond revocation: `list_active_for_user(usuario_id, now)` returning all tokens where `revoked_at IS NULL AND expires_at > now`, and `get_own_by_id(token_id, usuario_id)` returning a single token only if it is both active and owned by the given user.

#### Scenario: list_active_for_user returns only non-expired, non-revoked tokens
- **WHEN** `list_active_for_user(usuario_id=X, now=T)` is called
- **THEN** the result includes only RefreshToken records where revoked_at IS NULL and expires_at > T for usuario_id X

#### Scenario: get_own_by_id returns None for mismatched owner
- **WHEN** `get_own_by_id(token_id=ID, usuario_id=Y)` is called and ID belongs to user Z (Z ≠ Y)
- **THEN** the method returns None

