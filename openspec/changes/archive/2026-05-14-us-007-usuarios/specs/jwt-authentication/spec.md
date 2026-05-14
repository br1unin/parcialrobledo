## MODIFIED Requirements

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
