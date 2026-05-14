# admin-management Specification

## Purpose
TBD - created by archiving change us-008-admin. Update Purpose after archive.
## Requirements
### Requirement: List all roles
The system SHALL provide an endpoint `GET /api/v1/admin/roles` that returns all rows from the `rol` table. The endpoint MUST require the ADMIN role.

#### Scenario: Admin retrieves roles list
- **WHEN** an ADMIN user sends `GET /api/v1/admin/roles`
- **THEN** the system returns HTTP 200 with an array of role objects, each containing `codigo`, `nombre`, and `descripcion`

#### Scenario: Non-admin blocked from roles list
- **WHEN** a non-ADMIN user sends `GET /api/v1/admin/roles`
- **THEN** the system returns HTTP 403 Forbidden

---

### Requirement: List payment methods
The system SHALL provide an endpoint `GET /api/v1/admin/formas-pago` that returns all rows from the `forma_pago` table including their `habilitado` status. This endpoint SHALL be publicly accessible (no authentication required).

#### Scenario: Any caller retrieves all payment methods
- **WHEN** any caller sends `GET /api/v1/admin/formas-pago`
- **THEN** the system returns HTTP 200 with an array of payment method objects, each containing `codigo`, `nombre`, and `habilitado`

#### Scenario: Disabled payment methods are included
- **WHEN** a payment method has `habilitado = false`
- **THEN** it is still returned in the list with `habilitado: false`

---

### Requirement: Toggle payment method enabled state
The system SHALL provide an endpoint `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` that sets the `habilitado` field of the specified `FormaPago` to the provided boolean value. The endpoint MUST require the ADMIN role.

#### Scenario: Admin enables a disabled payment method
- **WHEN** an ADMIN user sends `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` with body `{"habilitado": true}` and the method exists
- **THEN** the system updates `habilitado` to `true` and returns HTTP 200 with the updated payment method object

#### Scenario: Admin disables an enabled payment method
- **WHEN** an ADMIN user sends `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` with body `{"habilitado": false}` and the method exists
- **THEN** the system updates `habilitado` to `false` and returns HTTP 200 with the updated payment method object

#### Scenario: Toggle on non-existent payment method
- **WHEN** an ADMIN user sends `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` and `codigo` does not exist
- **THEN** the system returns HTTP 404 Not Found

#### Scenario: Non-admin blocked from toggling
- **WHEN** a non-ADMIN user sends `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado`
- **THEN** the system returns HTTP 403 Forbidden

---

### Requirement: List order states
The system SHALL provide an endpoint `GET /api/v1/admin/estados-pedido` that returns all rows from the `estado_pedido` table ordered by the `orden` field. The endpoint MUST require the ADMIN role.

#### Scenario: Admin retrieves order states
- **WHEN** an ADMIN user sends `GET /api/v1/admin/estados-pedido`
- **THEN** the system returns HTTP 200 with an array of order state objects, each containing `codigo`, `descripcion`, `orden`, and `es_terminal`, sorted ascending by `orden`

#### Scenario: Non-admin blocked from order states
- **WHEN** a non-ADMIN user sends `GET /api/v1/admin/estados-pedido`
- **THEN** the system returns HTTP 403 Forbidden

---

### Requirement: Admin dashboard stats
The system SHALL provide an endpoint `GET /api/v1/admin/dashboard` that returns aggregate store statistics. The endpoint MUST require the ADMIN role. Stats MUST include: total registered users, total active products, total orders grouped by state (code + count per state), and total confirmed revenue (sum of approved payments).

#### Scenario: Admin retrieves dashboard stats
- **WHEN** an ADMIN user sends `GET /api/v1/admin/dashboard`
- **THEN** the system returns HTTP 200 with an object containing `total_usuarios`, `total_productos`, `pedidos_por_estado` (array of `{estado, cantidad}`), and `ingresos_totales` (decimal)

#### Scenario: Revenue counts only approved payments
- **WHEN** calculating `ingresos_totales`
- **THEN** only payments with `estado = "aprobado"` are summed; pending or rejected payments are excluded

#### Scenario: Non-admin blocked from dashboard
- **WHEN** a non-ADMIN user sends `GET /api/v1/admin/dashboard`
- **THEN** the system returns HTTP 403 Forbidden

---

### Requirement: Admin frontend dashboard page
The system SHALL provide a frontend page at route `/admin/dashboard` that displays the dashboard stats as visual cards. The route MUST be protected — only authenticated users with the ADMIN role can access it; others are redirected to home.

#### Scenario: Admin views dashboard page
- **WHEN** an authenticated ADMIN user navigates to `/admin/dashboard`
- **THEN** the page renders stats cards showing total users, total products, orders by state, and total revenue

#### Scenario: Non-admin redirected from dashboard
- **WHEN** a user without the ADMIN role navigates to `/admin/dashboard`
- **THEN** the user is redirected to the home page

---

### Requirement: Admin frontend configuration panel
The system SHALL provide a frontend page at route `/admin` that displays a tabbed view with three tabs: Roles, Formas de Pago, and Estados de Pedido. The route MUST be protected — only ADMIN users can access it. The Formas de Pago tab MUST include a toggle control to enable/disable each payment method. The page MUST include a navigation link labelled "Gestión de Usuarios" that navigates to `/admin/usuarios`.

#### Scenario: Admin views configuration panel
- **WHEN** an authenticated ADMIN user navigates to `/admin`
- **THEN** the page renders with three tabs; the default active tab shows Roles

#### Scenario: Admin toggles payment method
- **WHEN** an ADMIN user clicks the toggle for a payment method in the Formas de Pago tab
- **THEN** the frontend sends `PATCH /api/v1/admin/formas-pago/{codigo}/habilitado` and updates the toggle state on success

#### Scenario: Non-admin redirected from config panel
- **WHEN** a user without the ADMIN role navigates to `/admin`
- **THEN** the user is redirected to the home page

#### Scenario: Admin navigates to user management
- **WHEN** an authenticated ADMIN user clicks the "Gestión de Usuarios" link on the AdminPage
- **THEN** the browser navigates to `/admin/usuarios`

