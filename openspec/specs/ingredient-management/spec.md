## ADDED Requirements

### Requirement: Create ingredient
STOCK or ADMIN can create an ingredient with name and allergen flag.

#### Scenario: Successful creation
- **WHEN** STOCK sends POST /api/v1/ingredientes with nombre and es_alergeno
- **THEN** ingredient is persisted and returned with 201; codigo auto-generated

#### Scenario: Duplicate nombre
- **WHEN** name already exists
- **THEN** HTTP 409

### Requirement: List ingredients
Public or authenticated users can list ingredients with optional allergen filter and pagination.

#### Scenario: List all
- **WHEN** GET /api/v1/ingredientes (no auth required)
- **THEN** returns { items, total, page, limit }

#### Scenario: Filter by allergen
- **WHEN** GET /api/v1/ingredientes?es_alergeno=true
- **THEN** returns only allergen ingredients

### Requirement: Update ingredient
STOCK or ADMIN can update nombre or es_alergeno.

#### Scenario: Successful update
- **WHEN** PATCH /api/v1/ingredientes/{id}
- **THEN** changes persisted, updated entity returned

#### Scenario: Name conflict on update
- **WHEN** new nombre matches another existing ingredient
- **THEN** HTTP 409

### Requirement: Soft delete ingredient
STOCK or ADMIN can soft-delete an ingredient.

#### Scenario: Successful soft delete
- **WHEN** DELETE /api/v1/ingredientes/{id}
- **THEN** deleted_at set, ingredient hidden from public list, HTTP 204

#### Scenario: Not found
- **WHEN** ingredient does not exist or already deleted
- **THEN** HTTP 404
