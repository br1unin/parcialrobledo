# rbac Specification

## Purpose
TBD - created by archiving change us-001-auth. Update Purpose after archive.
## Requirements
### Requirement: get_current_user dependency
The system SHALL provide a FastAPI dependency `get_current_user` that decodes the JWT from the `Authorization: Bearer <token>` header, verifies its signature and expiration, and returns the authenticated Usuario object. Unauthenticated requests MUST receive HTTP 401.

#### Scenario: Valid token
- **WHEN** a request includes a valid, non-expired JWT in Authorization header
- **THEN** `get_current_user` returns the Usuario with their roles loaded

#### Scenario: Missing or malformed token
- **WHEN** a request has no Authorization header or a malformed JWT
- **THEN** system returns HTTP 401 Unauthorized

#### Scenario: Expired access token
- **WHEN** a request includes an expired JWT (past exp claim)
- **THEN** system returns HTTP 401 Unauthorized

---

### Requirement: require_role dependency factory
The system SHALL provide a `require_role(roles: list[str])` factory that returns a FastAPI dependency. It MUST use `get_current_user` internally. If the authenticated user does not hold any of the required roles, the system MUST return HTTP 403 Forbidden.

#### Scenario: User has required role
- **WHEN** an endpoint declares `require_role(["ADMIN"])` and the authenticated user has ADMIN role
- **THEN** the request proceeds normally

#### Scenario: User missing required role
- **WHEN** an endpoint declares `require_role(["ADMIN"])` and the authenticated user only has CLIENT role
- **THEN** system returns HTTP 403 Forbidden

#### Scenario: Multiple allowed roles
- **WHEN** an endpoint declares `require_role(["ADMIN", "PEDIDOS"])` and the user has PEDIDOS role
- **THEN** the request proceeds normally

---

### Requirement: Stable role IDs
The system SHALL maintain 4 roles with stable IDs: ADMIN (1), STOCK (2), PEDIDOS (3), CLIENT (4). These IDs are loaded by seed and referenced by role name string in `require_role`.

#### Scenario: CLIENT auto-assigned on register
- **WHEN** a new user registers
- **THEN** the role with nombre="CLIENT" is assigned via UsuarioRol; no other roles are assigned

#### Scenario: Role verification by name
- **WHEN** `require_role(["ADMIN"])` is evaluated
- **THEN** the check compares role names (strings), not IDs, for readability and resilience

---

### Requirement: STOCK and PEDIDOS access boundaries
Gestor de Stock MUST NOT access pedidos, usuarios, or métricas endpoints. Gestor de Pedidos MUST NOT access catálogo or user management endpoints.

#### Scenario: STOCK blocked from pedidos
- **WHEN** a user with only STOCK role calls GET /api/v1/pedidos
- **THEN** system returns HTTP 403

#### Scenario: PEDIDOS blocked from productos management
- **WHEN** a user with only PEDIDOS role calls POST /api/v1/productos
- **THEN** system returns HTTP 403

