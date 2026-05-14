# Tasks: us-003-productos

## Backend — Ingredientes Module

- [x] Create `app/modules/ingredientes/__init__.py` (empty)
- [x] Create `app/modules/ingredientes/repository.py` — `IngredienteRepository(BaseRepository[Ingrediente])` with `get_by_nombre(nombre)` and `list_with_filters(es_alergeno, skip, limit)` methods
- [x] Create `app/modules/ingredientes/schemas.py` — `IngredienteCreate(nombre, es_alergeno)`, `IngredienteUpdate(nombre?, es_alergeno?)`, `IngredienteResponse(id, nombre, es_alergeno, created_at)`, `IngredienteListResponse(items, total, page, limit)`
- [x] Create `app/modules/ingredientes/service.py` — `create_ingrediente`, `list_ingredientes`, `update_ingrediente`, `delete_ingrediente`; auto-generate `codigo` as `str(uuid4())[:8]`; 409 on duplicate nombre
- [x] Create `app/modules/ingredientes/router.py` — `GET /` (public), `POST /` (ADMIN|STOCK), `PATCH /{id}` (ADMIN|STOCK), `DELETE /{id}` (ADMIN|STOCK)
- [x] Add `ingredientes` property to `app/core/uow.py`
- [x] Register ingredientes router in `app/main.py` at prefix `/api/v1/ingredientes`

## Backend — Productos Module

- [x] Create `app/modules/productos/repository.py` — `ProductoRepository(BaseRepository[Producto])` with:
  - `list_catalog(skip, limit, categoria_id?, busqueda?, excluir_alergenos?)` — public, disponible+not deleted
  - `count_catalog(categoria_id?, busqueda?, excluir_alergenos?)` — for pagination total
  - `get_full(id)` — fetches producto + eagerly loads categorias and ingredientes via JOIN
  - `get_categorias(producto_id)` — list ProductoCategoria rows
  - `replace_categorias(producto_id, categoria_ids)` — delete all + insert new
  - `get_ingredientes(producto_id)` — list ProductoIngrediente rows
  - `replace_ingredientes(producto_id, items)` — delete all + insert new
  - `adjust_stock(producto_id, delta)` — atomic UPDATE with validation
- [x] Create `app/modules/productos/schemas.py`:
  - `ProductoCreate(nombre, precio, stock_cantidad, disponible, descripcion?, imagen_url?)`
  - `ProductoUpdate(nombre?, precio?, stock_cantidad?, disponible?, descripcion?, imagen_url?)`
  - `StockAdjust(delta: int)`
  - `CategoriaIds(categoria_ids: list[uuid])`
  - `IngredienteAsignado(ingrediente_id: uuid, es_removible: bool = True)`
  - `IngredienteIds(ingredientes: list[IngredienteAsignado])`
  - `CategoriaBasic(id, nombre)` — lightweight for embedding
  - `IngredienteEnProducto(id, nombre, es_alergeno, es_removible)` — for embedding
  - `ProductoResponse(id, nombre, descripcion, precio, stock_cantidad, disponible, imagen_url, created_at, categorias, ingredientes)`
  - `ProductoListResponse(items, total, page, limit)`
- [x] Create `app/modules/productos/service.py` — `create_producto`, `list_catalog`, `get_producto`, `update_producto`, `delete_producto`, `adjust_stock`, `set_categorias`, `set_ingredientes`
- [x] Create `app/modules/productos/router.py` — endpoints:
  - `GET /` (public) — catalog with query params: page, limit, categoria_id, busqueda, excluir_alergenos
  - `POST /` (ADMIN|STOCK)
  - `GET /{id}` (public)
  - `PATCH /{id}` (ADMIN|STOCK)
  - `DELETE /{id}` (ADMIN|STOCK)
  - `PATCH /{id}/stock` (ADMIN|STOCK)
  - `PUT /{id}/categorias` (ADMIN|STOCK)
  - `PUT /{id}/ingredientes` (ADMIN|STOCK)
- [x] Add `productos` property to `app/core/uow.py`
- [x] Register productos router in `app/main.py` at prefix `/api/v1/productos`

## Frontend — Ingredientes Feature

- [x] Create `frontend/src/features/ingredientes/types.ts` — `Ingrediente`, `IngredienteCreate`, `IngredienteUpdate`, `IngredienteListResponse`
- [x] Create `frontend/src/features/ingredientes/api.ts` — `ingredientesApi` with `list(params?)`, `create(data)`, `update(id, data)`, `delete(id)`
- [x] Create `frontend/src/features/ingredientes/ui/IngredienteForm.tsx` — modal form (nombre + es_alergeno checkbox)
- [x] Create `frontend/src/features/ingredientes/ui/IngredienteTable.tsx` — table with edit/delete actions; badge for alergeno
- [x] Create `frontend/src/pages/IngredientesPage.tsx` — STOCK/ADMIN only; compose table + form

## Frontend — Productos Feature

- [x] Create `frontend/src/features/productos/types.ts` — `Producto`, `ProductoCreate`, `ProductoUpdate`, `ProductoListResponse`, `CategoriaBasic`, `IngredienteEnProducto`
- [x] Create `frontend/src/features/productos/api.ts` — `productosApi` with `list(params?)`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `adjustStock(id, delta)`, `setCategorias(id, categoria_ids)`, `setIngredientes(id, ingredientes)`
- [x] Create `frontend/src/features/productos/ui/ProductoCard.tsx` — card for public catalog (imagen, nombre, precio, stock badge, disponible badge)
- [x] Create `frontend/src/features/productos/ui/ProductoCatalogPage.tsx` — public catalog grid; search input, category filter select, pagination
- [x] Create `frontend/src/features/productos/ui/ProductoForm.tsx` — STOCK/ADMIN form (all fields + multi-select categories + multi-select ingredients with es_removible toggle)
- [x] Create `frontend/src/features/productos/ui/ProductoTable.tsx` — STOCK/ADMIN table with edit/delete/stock-adjust actions
- [x] Create `frontend/src/pages/ProductosAdminPage.tsx` — STOCK/ADMIN page composing table + form
- [x] Add routes in `frontend/src/app/router.tsx`:
  - `/catalogo` → `ProductoCatalogPage` (public)
  - `/admin/ingredientes` → `IngredientesPage` (ADMIN|STOCK)
  - `/admin/productos` → `ProductosAdminPage` (ADMIN|STOCK)
- [x] Add navigation links in `HomePage` or nav component for new routes
