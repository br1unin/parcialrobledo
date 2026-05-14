## ADDED Requirements

### Requirement: Admin API — list users
The system SHALL expose a frontend API function `adminUsuariosApi.listUsers(skip, limit)` that calls `GET /api/v1/usuarios/?skip={skip}&limit={limit}` with the authenticated bearer token and returns `AdminUserListResponse` (`{ items: UserResponse[], total: number, skip: number, limit: number }`).

#### Scenario: Successful list call
- **WHEN** an ADMIN user's browser calls `adminUsuariosApi.listUsers(0, 20)`
- **THEN** the function resolves with the paginated list from the server (HTTP 200)

#### Scenario: Unauthorized call
- **WHEN** `listUsers` is called without a valid bearer token
- **THEN** the function rejects with the HTTP 401 error from the server

---

### Requirement: Admin API — get single user
The system SHALL expose a frontend API function `adminUsuariosApi.getUser(id)` that calls `GET /api/v1/usuarios/{id}` and returns `UserResponse`.

#### Scenario: User found
- **WHEN** a valid UUID is passed to `getUser`
- **THEN** the function resolves with the full `UserResponse` for that user

#### Scenario: User not found
- **WHEN** a non-existent UUID is passed to `getUser`
- **THEN** the function rejects with the HTTP 404 error from the server

---

### Requirement: Admin API — activate/deactivate user
The system SHALL expose a frontend API function `adminUsuariosApi.setActive(id, is_active)` that calls `PATCH /api/v1/usuarios/{id}/activo` with body `{ is_active }` and returns the updated `UserResponse`.

#### Scenario: Deactivate user
- **WHEN** `setActive(id, false)` is called with ADMIN credentials
- **THEN** the function sends PATCH with `{ is_active: false }` and resolves with updated UserResponse where `is_active` is `false`

#### Scenario: Activate user
- **WHEN** `setActive(id, true)` is called with ADMIN credentials
- **THEN** the function sends PATCH with `{ is_active: true }` and resolves with updated UserResponse where `is_active` is `true`

---

### Requirement: Admin API — assign role
The system SHALL expose a frontend API function `adminUsuariosApi.assignRole(id, rol_codigo)` that calls `POST /api/v1/usuarios/{id}/roles` with body `{ rol_codigo }` and returns the updated `UserResponse`.

#### Scenario: Role assigned successfully
- **WHEN** `assignRole(id, "STOCK")` is called with ADMIN credentials
- **THEN** the function sends POST with `{ rol_codigo: "STOCK" }` and resolves with updated UserResponse including the new role

#### Scenario: Role already assigned — idempotent
- **WHEN** `assignRole(id, "STOCK")` is called and the user already has STOCK role
- **THEN** the function resolves with HTTP 200 (no error)

#### Scenario: Invalid role code
- **WHEN** `assignRole(id, "INVALID")` is called
- **THEN** the function rejects with the HTTP 404 error from the server

---

### Requirement: Admin API — remove role
The system SHALL expose a frontend API function `adminUsuariosApi.removeRole(id, rol)` that calls `DELETE /api/v1/usuarios/{id}/roles/{rol}` and returns the updated `UserResponse`.

#### Scenario: Role removed successfully
- **WHEN** `removeRole(id, "STOCK")` is called with ADMIN credentials and the user has STOCK role
- **THEN** the function sends DELETE and resolves with updated UserResponse without the STOCK role

#### Scenario: Last ADMIN removal blocked
- **WHEN** `removeRole(id, "ADMIN")` is called and there is only one ADMIN in the system
- **THEN** the function rejects with the HTTP 409 error from the server

---

### Requirement: Admin Usuarios page — paginated user table
The system SHALL provide a frontend page at route `/admin/usuarios` that displays a paginated table of all registered users. The route MUST be protected by `AdminRoute`. The table MUST display: email, nombre, apellido, roles (as badges), is_active status, and created_at. The page MUST support pagination via Prev/Next controls using `skip` and `limit=20`.

#### Scenario: Admin views users list
- **WHEN** an authenticated ADMIN user navigates to `/admin/usuarios`
- **THEN** the page renders a table with one row per user showing email, nombre, apellido, role badges, active status indicator, and created_at date

#### Scenario: Non-admin redirected
- **WHEN** a user without the ADMIN role navigates to `/admin/usuarios`
- **THEN** `AdminRoute` redirects them to the home page

#### Scenario: Loading state
- **WHEN** the user list is being fetched
- **THEN** the page shows a loading indicator in place of the table

#### Scenario: Error state
- **WHEN** the fetch fails
- **THEN** the page shows an error message in place of the table

#### Scenario: Pagination — next page
- **WHEN** the user clicks "Siguiente" and there are more users beyond the current page
- **THEN** the page fetches and displays the next set of users (skip increments by limit)

#### Scenario: Pagination — previous page
- **WHEN** the user clicks "Anterior" and skip > 0
- **THEN** the page fetches and displays the previous set of users (skip decrements by limit, min 0)

---

### Requirement: Admin Usuarios page — search/filter
The system SHALL provide a text input on the AdminUsuariosPage that filters the currently displayed user list by email or nombre (case-insensitive, client-side). The filter MUST apply without a new server request.

#### Scenario: Filter by email
- **WHEN** the admin types a partial email string in the search field
- **THEN** only rows whose email contains that string (case-insensitive) are shown in the table

#### Scenario: Filter by nombre
- **WHEN** the admin types a partial name string in the search field
- **THEN** only rows whose nombre or apellido contains that string (case-insensitive) are shown

#### Scenario: Empty filter
- **WHEN** the search field is cleared
- **THEN** all fetched users are shown again

---

### Requirement: Admin Usuarios page — toggle active/inactive
The system SHALL provide a toggle button on each user row in AdminUsuariosPage that calls `setActive` to flip the user's `is_active` state. The button MUST be disabled while the mutation is pending. On success, the user list MUST be refreshed.

#### Scenario: Admin deactivates an active user
- **WHEN** the admin clicks the toggle button on an active user's row
- **THEN** the button sends PATCH with `is_active: false` and the row updates to show inactive status on success

#### Scenario: Admin activates an inactive user
- **WHEN** the admin clicks the toggle button on an inactive user's row
- **THEN** the button sends PATCH with `is_active: true` and the row updates to show active status on success

#### Scenario: Mutation pending — button disabled
- **WHEN** a toggle mutation is in-flight for a row
- **THEN** the toggle button for that row is disabled and shows a visual loading cue

---

### Requirement: Admin Usuarios page — role management
The system SHALL provide inline role management on each user row in AdminUsuariosPage. Each row MUST display current roles as removable badges (each with an × button that calls `removeRole`). Each row MUST include a `<select>` dropdown of available roles (ADMIN, STOCK, PEDIDOS, CLIENT) and an "Agregar" button that calls `assignRole` with the selected value. On success, the user list MUST be refreshed.

#### Scenario: Admin adds a role
- **WHEN** the admin selects "STOCK" in the role dropdown for a user and clicks "Agregar"
- **THEN** `assignRole` is called and on success the row badge list updates to include STOCK

#### Scenario: Admin removes a role
- **WHEN** the admin clicks the × button on a role badge
- **THEN** `removeRole` is called and on success the badge is removed from the row

#### Scenario: Last ADMIN removal shows error
- **WHEN** the admin attempts to remove the ADMIN role badge from the only ADMIN user
- **THEN** the mutation fails with HTTP 409 and an inline error message is shown on that row

#### Scenario: Role already present — no duplicate badge
- **WHEN** `assignRole` is called with a role the user already has
- **THEN** the server returns 200 (idempotent) and no duplicate badge appears in the row
