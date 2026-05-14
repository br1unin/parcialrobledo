## MODIFIED Requirements

### Requirement: get_current_user dependency
The system SHALL provide a FastAPI dependency `get_current_user` that decodes the JWT from the `Authorization: Bearer <token>` header, verifies its signature and expiration, and returns the authenticated Usuario object. The dependency MUST also verify that `deleted_at IS NULL` and `is_active IS TRUE` on the loaded user. Unauthenticated, deleted, or inactive users MUST receive HTTP 401.

#### Scenario: Valid token
- **WHEN** a request includes a valid, non-expired JWT in Authorization header for an active, non-deleted user
- **THEN** `get_current_user` returns the Usuario with their roles loaded

#### Scenario: Missing or malformed token
- **WHEN** a request has no Authorization header or a malformed JWT
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Expired access token
- **WHEN** a request includes an expired JWT (past exp claim)
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Soft-deleted user with valid JWT
- **WHEN** a request includes a valid, non-expired JWT but the user's deleted_at is not null
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Deactivated user with valid JWT
- **WHEN** a request includes a valid, non-expired JWT but the user's is_active is false
- **THEN** system returns HTTP 401 Unauthorized
