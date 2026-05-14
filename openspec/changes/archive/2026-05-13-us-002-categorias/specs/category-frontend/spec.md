## ADDED Requirements

### Requirement: Category tree view
The system SHALL display all categories in a collapsible tree structure. Each node shows its name and, for ADMIN users, action buttons (edit, delete).

#### Scenario: Render tree for authenticated user
- **WHEN** an authenticated user navigates to `/categorias`
- **THEN** the page fetches `GET /api/v1/categorias` and renders root categories with nested children

#### Scenario: Expand/collapse node
- **WHEN** a user clicks on a category node that has children
- **THEN** the children toggle visibility (collapsed by default if depth > 1)

#### Scenario: ADMIN sees action buttons
- **WHEN** an ADMIN views the tree
- **THEN** each node shows "Editar" and "Eliminar" buttons

#### Scenario: Non-admin sees read-only tree
- **WHEN** a non-ADMIN user views the tree
- **THEN** no action buttons are rendered

### Requirement: Category form (create / edit)
The system SHALL provide a form to create a new category or edit an existing one. The form includes a `nombre` text field and an optional parent selector (dropdown of existing categories).

#### Scenario: Create new root category
- **WHEN** an ADMIN submits the form with `nombre` filled and no parent selected
- **THEN** a POST request is sent and the tree refreshes showing the new root node

#### Scenario: Create child category
- **WHEN** an ADMIN selects a parent and submits the form
- **THEN** the new category appears under the selected parent in the tree

#### Scenario: Edit existing category
- **WHEN** an ADMIN clicks "Editar" on a node and modifies the name or parent
- **THEN** a PATCH request is sent and the tree updates in place

#### Scenario: Server error on conflict
- **WHEN** the server returns 409 (cycle or product conflict)
- **THEN** the form displays the error message returned by the server without closing

### Requirement: Delete confirmation
The system SHALL require explicit confirmation before deleting a category to prevent accidental data loss.

#### Scenario: Confirm and delete
- **WHEN** an ADMIN clicks "Eliminar" and confirms the dialog
- **THEN** a DELETE request is sent; on 204, the node is removed from the tree

#### Scenario: Cancel deletion
- **WHEN** an ADMIN clicks "Eliminar" but cancels the confirmation dialog
- **THEN** no request is sent and the tree remains unchanged

#### Scenario: Server rejects deletion
- **WHEN** the server returns 409 (category has children or products)
- **THEN** the dialog closes and an inline error is shown explaining why deletion was blocked
