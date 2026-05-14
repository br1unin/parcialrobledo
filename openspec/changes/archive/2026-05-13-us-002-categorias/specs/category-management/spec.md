## ADDED Requirements

### Requirement: List categories as tree
The system SHALL return the complete category tree in a single query using a recursive CTE. Each node SHALL include its children nested. The root nodes are those with `padre_id IS NULL`.

#### Scenario: Get full tree
- **WHEN** any authenticated user sends `GET /api/v1/categorias`
- **THEN** the system returns 200 with a list of root categories, each containing a `children` array (recursively nested)

#### Scenario: Empty catalog
- **WHEN** no categories exist and an authenticated user requests the tree
- **THEN** the system returns 200 with an empty array `[]`

### Requirement: Create category
The system SHALL allow ADMIN users to create a new category. The `padre_id` field is optional; when omitted, the category becomes a root node.

#### Scenario: Create root category
- **WHEN** an ADMIN sends `POST /api/v1/categorias` with `{"nombre": "Bebidas"}`
- **THEN** the system returns 201 with the new category including its generated `id` and `padre_id: null`

#### Scenario: Create child category
- **WHEN** an ADMIN sends `POST /api/v1/categorias` with `{"nombre": "Aguas", "padre_id": "<existing-id>"}`
- **THEN** the system returns 201 with the category linked to its parent

#### Scenario: Non-admin cannot create
- **WHEN** a user without ADMIN role sends `POST /api/v1/categorias`
- **THEN** the system returns 403

#### Scenario: Parent not found
- **WHEN** an ADMIN provides a `padre_id` that does not exist
- **THEN** the system returns 404

### Requirement: Update category
The system SHALL allow ADMIN users to update a category's `nombre` or `padre_id`.

#### Scenario: Rename category
- **WHEN** an ADMIN sends `PATCH /api/v1/categorias/{id}` with `{"nombre": "Nuevo nombre"}`
- **THEN** the system returns 200 with the updated category

#### Scenario: Move category (change parent)
- **WHEN** an ADMIN sends `PATCH /api/v1/categorias/{id}` with a valid new `padre_id`
- **THEN** the system returns 200 with the updated parent link

#### Scenario: Category not found on update
- **WHEN** an ADMIN updates a non-existent `id`
- **THEN** the system returns 404

### Requirement: Delete category
The system SHALL allow ADMIN users to delete a category. A category with associated active products or with children MUST NOT be deletable.

#### Scenario: Delete empty leaf category
- **WHEN** an ADMIN deletes a category with no children and no associated products
- **THEN** the system returns 204

#### Scenario: Cannot delete category with children (RN-CA03b)
- **WHEN** an ADMIN attempts to delete a category that has child categories
- **THEN** the system returns 409 with a descriptive error

#### Scenario: Cannot delete category with active products (RN-CA03)
- **WHEN** an ADMIN attempts to delete a category linked to one or more products
- **THEN** the system returns 409 with a descriptive error

#### Scenario: Non-admin cannot delete
- **WHEN** a user without ADMIN role sends `DELETE /api/v1/categorias/{id}`
- **THEN** the system returns 403

### Requirement: Cycle prevention in hierarchy (RN-CA02)
The system SHALL reject any update that would create a cycle in the category hierarchy. Before persisting a new `padre_id`, the system MUST verify that the node being updated is not an ancestor of the proposed parent.

#### Scenario: Detect direct cycle
- **WHEN** an ADMIN sets category A's `padre_id` to category B, and category B's current `padre_id` is A
- **THEN** the system returns 409 with message indicating a cycle would be created

#### Scenario: Detect indirect cycle
- **WHEN** an ADMIN sets category A's `padre_id` to category C, where C is a descendant of A
- **THEN** the system returns 409 with message indicating a cycle would be created

#### Scenario: Valid reparenting allowed
- **WHEN** an ADMIN sets a `padre_id` that does not create any cycle
- **THEN** the system persists the change and returns 200
