## ADDED Requirements

### Requirement: Create product
STOCK or ADMIN creates a product.

#### Scenario: Successful creation
- **WHEN** POST /api/v1/productos with nombre, precio (>0), stock_cantidad (>=0), disponible, descripcion?, imagen_url?
- **THEN** product persisted, returns 201 with full ProductoResponse

#### Scenario: Negative stock rejected
- **WHEN** stock_cantidad < 0
- **THEN** HTTP 422

### Requirement: Public product catalog
Public endpoint with pagination, filters, and search.

#### Scenario: Default listing
- **WHEN** GET /api/v1/productos (public, no auth)
- **THEN** returns only disponible=true AND deleted_at IS NULL; { items, total, page, limit }

#### Scenario: Filter by category
- **WHEN** GET /api/v1/productos?categoria_id=<uuid>
- **THEN** only products linked to that category

#### Scenario: Search by name
- **WHEN** GET /api/v1/productos?busqueda=pizza
- **THEN** ILIKE filter on nombre

#### Scenario: Exclude allergens
- **WHEN** GET /api/v1/productos?excluir_alergenos=<id1>,<id2>
- **THEN** products that contain any of those ingredients are excluded

### Requirement: Product detail (public)
Returns full product detail including categories and ingredients.

#### Scenario: Available product
- **WHEN** GET /api/v1/productos/{id}
- **THEN** returns nombre, descripcion, precio, imagen_url, disponible, categorias[], ingredientes[] (with es_alergeno, es_removible)

#### Scenario: Not available or deleted
- **WHEN** disponible=false or deleted_at IS NOT NULL
- **THEN** HTTP 404

### Requirement: Update product
STOCK or ADMIN can update product fields.

#### Scenario: Successful update
- **WHEN** PATCH /api/v1/productos/{id} with any subset of fields
- **THEN** changes persisted, updated entity returned

### Requirement: Stock management
STOCK or ADMIN can adjust stock via delta.

#### Scenario: Increment stock
- **WHEN** PATCH /api/v1/productos/{id}/stock with { delta: 10 }
- **THEN** stock_cantidad increases by 10

#### Scenario: Stock cannot go negative
- **WHEN** delta would make stock_cantidad < 0
- **THEN** HTTP 422

### Requirement: Soft delete product
STOCK or ADMIN can soft-delete a product.

#### Scenario: Successful delete
- **WHEN** DELETE /api/v1/productos/{id}
- **THEN** deleted_at set, product hidden from catalog, HTTP 204

### Requirement: Assign categories to product
Replace all categories for a product atomically.

#### Scenario: Full replace
- **WHEN** PUT /api/v1/productos/{id}/categorias with { categoria_ids: [...] }
- **THEN** old associations deleted, new ones created; returns updated product

### Requirement: Assign ingredients to product
Replace all ingredients for a product atomically.

#### Scenario: Full replace
- **WHEN** PUT /api/v1/productos/{id}/ingredientes with { ingredientes: [{ingrediente_id, es_removible}] }
- **THEN** old associations deleted, new ones created; returns updated product
