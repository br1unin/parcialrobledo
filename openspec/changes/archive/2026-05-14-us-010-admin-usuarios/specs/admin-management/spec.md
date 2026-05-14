## MODIFIED Requirements

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
