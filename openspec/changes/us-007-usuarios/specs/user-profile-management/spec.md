## ADDED Requirements

### Requirement: Get own profile
The system SHALL return the authenticated user's full profile (id, email, nombre, apellido, telefono, is_active, roles, created_at) when they call `GET /api/v1/usuarios/me`. The endpoint MUST require a valid, non-expired JWT.

#### Scenario: Authenticated user gets profile
- **WHEN** GET /api/v1/usuarios/me with a valid Bearer token
- **THEN** system returns HTTP 200 with UserResponse (id, email, nombre, apellido, telefono, is_active, roles, created_at)

#### Scenario: Unauthenticated request
- **WHEN** GET /api/v1/usuarios/me without Authorization header
- **THEN** system returns HTTP 401

---

### Requirement: Update own profile
The system SHALL allow an authenticated user to update their own `nombre`, `apellido`, and/or `telefono` via `PATCH /api/v1/usuarios/me`. Fields not included in the request MUST remain unchanged.

#### Scenario: Partial update
- **WHEN** PATCH /api/v1/usuarios/me with body `{ "telefono": "1234567890" }`
- **THEN** system updates only telefono, leaves nombre and apellido unchanged, returns HTTP 200 with updated UserResponse

#### Scenario: Full profile update
- **WHEN** PATCH /api/v1/usuarios/me with body `{ "nombre": "Juan", "apellido": "Perez", "telefono": null }`
- **THEN** system updates all three fields, returns HTTP 200 with updated UserResponse

#### Scenario: Empty body
- **WHEN** PATCH /api/v1/usuarios/me with body `{}`
- **THEN** system returns HTTP 200 with unchanged UserResponse (no-op is valid)

---

### Requirement: Change own password
The system SHALL allow an authenticated user to change their own password via `PATCH /api/v1/usuarios/me/password`. The request MUST include `current_password` and `new_password`. The system MUST verify `current_password` matches the stored hash before applying the change. `new_password` MUST be at least 8 characters.

#### Scenario: Successful password change
- **WHEN** PATCH /api/v1/usuarios/me/password with correct current_password and valid new_password (≥ 8 chars)
- **THEN** system hashes new_password, updates password_hash, returns HTTP 204

#### Scenario: Wrong current password
- **WHEN** PATCH /api/v1/usuarios/me/password with incorrect current_password
- **THEN** system returns HTTP 401 with detail "Contraseña actual incorrecta"

#### Scenario: New password too short
- **WHEN** PATCH /api/v1/usuarios/me/password with new_password shorter than 8 characters
- **THEN** system returns HTTP 422 with validation error

---

### Requirement: Soft-delete own account
The system SHALL allow an authenticated user to soft-delete their own account via `DELETE /api/v1/usuarios/me`. The system MUST set `deleted_at` to the current UTC timestamp and revoke all active refresh tokens for that user. Subsequent requests with that user's JWT MUST receive HTTP 401.

#### Scenario: Successful account deletion
- **WHEN** DELETE /api/v1/usuarios/me with valid Bearer token
- **THEN** system sets deleted_at = now(), revokes all refresh tokens, returns HTTP 204

#### Scenario: Deleted user attempts login
- **WHEN** POST /api/v1/auth/login with credentials of a soft-deleted user
- **THEN** system returns HTTP 401 with generic "Credenciales inválidas" (same error as wrong password)

#### Scenario: Deleted user uses valid JWT
- **WHEN** GET /api/v1/usuarios/me with a JWT that was valid before account deletion
- **THEN** system returns HTTP 401 Unauthorized

---

### Requirement: Admin — List all users
The system SHALL allow users with the ADMIN role to retrieve a paginated list of all users (including inactive, excluding hard-deleted which don't exist) via `GET /api/v1/usuarios`. The endpoint MUST accept `skip` (default 0) and `limit` (default 20, max 100) query parameters and return `{ items, total, skip, limit }`.

#### Scenario: Admin lists users
- **WHEN** GET /api/v1/usuarios?skip=0&limit=20 with ADMIN JWT
- **THEN** system returns HTTP 200 with `{ items: [...UserResponse], total: <int>, skip: 0, limit: 20 }`

#### Scenario: Non-admin blocked
- **WHEN** GET /api/v1/usuarios with CLIENT or STOCK JWT
- **THEN** system returns HTTP 403

---

### Requirement: Admin — Get any user by ID
The system SHALL allow users with the ADMIN role to retrieve any user's full profile by UUID via `GET /api/v1/usuarios/{id}`.

#### Scenario: Admin gets user
- **WHEN** GET /api/v1/usuarios/{id} with ADMIN JWT and a valid user UUID
- **THEN** system returns HTTP 200 with UserResponse for that user

#### Scenario: User not found
- **WHEN** GET /api/v1/usuarios/{id} with a UUID not in the database
- **THEN** system returns HTTP 404

---

### Requirement: Admin — Activate or deactivate user
The system SHALL allow users with the ADMIN role to set `is_active` on any user via `PATCH /api/v1/usuarios/{id}/activo`. The request body MUST include `is_active: bool`.

#### Scenario: Admin deactivates user
- **WHEN** PATCH /api/v1/usuarios/{id}/activo with body `{ "is_active": false }` with ADMIN JWT
- **THEN** system sets is_active = false on that user, returns HTTP 200 with updated UserResponse

#### Scenario: Admin activates user
- **WHEN** PATCH /api/v1/usuarios/{id}/activo with body `{ "is_active": true }` with ADMIN JWT
- **THEN** system sets is_active = true on that user, returns HTTP 200 with updated UserResponse

---

### Requirement: Admin — Assign role to user
The system SHALL allow users with the ADMIN role to assign a role to any user via `POST /api/v1/usuarios/{id}/roles`. The request body MUST include `rol_codigo`. The system MUST validate that `rol_codigo` exists in the `rol` table and that the user does not already have that role (idempotent: if already assigned, return 200 without error).

#### Scenario: Successful role assignment
- **WHEN** POST /api/v1/usuarios/{id}/roles with body `{ "rol_codigo": "STOCK" }` with ADMIN JWT
- **THEN** system creates UsuarioRol record, returns HTTP 200 with updated UserResponse

#### Scenario: Role already assigned
- **WHEN** POST /api/v1/usuarios/{id}/roles with a rol_codigo the user already has
- **THEN** system returns HTTP 200 without duplicate insertion

#### Scenario: Invalid rol_codigo
- **WHEN** POST /api/v1/usuarios/{id}/roles with a rol_codigo not in the rol table
- **THEN** system returns HTTP 404 with detail "Rol no encontrado"

---

### Requirement: Admin — Remove role from user
The system SHALL allow users with the ADMIN role to remove a role from any user via `DELETE /api/v1/usuarios/{id}/roles/{rol}`. The system MUST prevent removing the last ADMIN role assignment if it would leave no other ADMIN in the system.

#### Scenario: Successful role removal
- **WHEN** DELETE /api/v1/usuarios/{id}/roles/STOCK with ADMIN JWT
- **THEN** system removes UsuarioRol record, returns HTTP 204

#### Scenario: Removing last ADMIN blocked
- **WHEN** DELETE /api/v1/usuarios/{id}/roles/ADMIN with ADMIN JWT, and there is only one ADMIN user
- **THEN** system returns HTTP 409 with detail "No se puede eliminar el último administrador del sistema"

#### Scenario: Role not assigned — no error
- **WHEN** DELETE /api/v1/usuarios/{id}/roles/STOCK and user does not have STOCK role
- **THEN** system returns HTTP 204 (idempotent)
