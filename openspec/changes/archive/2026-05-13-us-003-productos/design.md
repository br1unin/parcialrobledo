## Context

DB already has `ingrediente`, `producto`, `producto_categoria`, `producto_ingrediente` tables from migration 0001_initial. The scaffold model at `app/modules/productos/model.py` includes `Ingrediente`, `Producto`, `ProductoCategoria`, `ProductoIngrediente`. Both models have a `codigo` field (VARCHAR 50, UNIQUE NOT NULL) in the DB — not user-facing; auto-generated in service layer.

## Goals / Non-Goals

**Goals:**
- Complete ingredientes CRUD (STOCK or ADMIN role)
- Product CRUD with soft delete (STOCK or ADMIN role)
- Public catalog endpoint with pagination, category filter, name search, allergen exclusion
- Product detail endpoint (public)
- Stock management endpoint (PATCH /productos/{id}/stock)
- Replace M2M associations via dedicated PUT endpoints

**Non-Goals:**
- Image upload (URL only)
- Frontend carrito integration
- Admin metrics

## Decisions

**Ingredientes as separate module**: `app/modules/ingredientes/` with its own router, service, repository. Keeps separation clean despite sharing modelo file with productos for now. The model stays in `app/modules/productos/model.py` (already there), but the business logic lives in `app/modules/ingredientes/`.

**codigo auto-generation**: `codigo` is UNIQUE NOT NULL in DB but not user-facing. Service generates it as first 8 chars of UUID4 (collision probability negligible for catalog sizes). This avoids exposing an internal field in the API.

**M2M association via replace-all**: `PUT /productos/{id}/categorias` and `PUT /productos/{id}/ingredientes` replace the full list atomically (delete existing + insert new) within the same UoW. Simple and idempotent.

**Public catalog pagination**: Returns `{ items: [...], total: int, page: int, limit: int }`. Uses `skip/limit` internally.

**Allergen exclusion**: `excluir_alergenos` query param accepts comma-separated ingredient IDs. Query uses `NOT EXISTS` subquery on `producto_ingrediente`.

**ProductoResponse**: Includes full `categorias: list[CategoriaBasic]` and `ingredientes: list[IngredienteEnProducto]` (includes `es_removible` flag). Loaded with explicit JOINs in repository, no lazy loading.

**Stock update**: `PATCH /productos/{id}/stock` with body `{ delta: int }`. Service validates `stock_cantidad + delta >= 0` before persisting. Returns updated product.

**Roles**: ADMIN and STOCK can write. Public (no auth) can read catalog and detail.

## Risks / Trade-offs

- `codigo` auto-gen could theoretically collide; acceptable for catalog sizes (< 10k products)
- Full M2M replace on large associations is O(n) deletes + inserts; acceptable for expected catalog size
