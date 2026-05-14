## 1. Base de datos y migración

- [x] 1.1 Crear migración Alembic: tabla `categoria` (id UUID PK, nombre str, padre_id UUID FK nullable self-ref, created_at)
- [x] 1.2 Crear migración Alembic: tabla `producto_categoria` (producto_id UUID FK, categoria_id UUID FK, PK compuesta)
- [x] 1.3 Verificar que `alembic upgrade head` aplica sin errores

## 2. Modelos SQLModel

- [x] 2.1 Crear `app/modules/categorias/model.py` con modelo `Categoria` (self-referential FK `padre_id`)
- [x] 2.2 Crear modelo `ProductoCategoria` como link model M2M en `app/modules/categorias/model.py`
- [x] 2.3 Importar ambos modelos en `app/main.py` para resolución de FK en startup

## 3. Repositorio y UoW

- [x] 3.1 Crear `app/modules/categorias/repository.py` con `CategoriaRepository`
- [x] 3.2 Implementar método `get_tree()` usando CTE recursiva SQL nativa
- [x] 3.3 Implementar métodos `create`, `get_by_id`, `update`, `delete`
- [x] 3.4 Implementar `get_ancestors(id)` para validación de ciclos
- [x] 3.5 Implementar `count_productos(categoria_id)` para RN-CA03
- [x] 3.6 Implementar `count_children(categoria_id)` para bloqueo de borrado con hijos
- [x] 3.7 Agregar propiedad `categorias` en `app/core/uow.py`

## 4. Schemas Pydantic

- [x] 4.1 Crear `app/modules/categorias/schemas.py`: `CategoriaCreate`, `CategoriaUpdate`, `CategoriaResponse` (con campo `children: list[CategoriaResponse]` para árbol recursivo)

## 5. Service

- [x] 5.1 Crear `app/modules/categorias/service.py` con función `get_tree(uow)`
- [x] 5.2 Implementar `create_categoria(uow, data)` con validación de `padre_id` existente
- [x] 5.3 Implementar `update_categoria(uow, id, data)` con validación de ciclos (RN-CA02)
- [x] 5.4 Implementar `delete_categoria(uow, id)` con validaciones RN-CA03 (productos activos y hijos)

## 6. Router y endpoints

- [x] 6.1 Crear `app/modules/categorias/router.py` con los endpoints:
  - `GET /` → árbol completo (cualquier autenticado)
  - `POST /` → crear (ADMIN)
  - `PATCH /{id}` → actualizar (ADMIN)
  - `DELETE /{id}` → eliminar (ADMIN)
- [x] 6.2 Registrar el router en `app/main.py` con prefix `/api/v1/categorias`

## 7. Frontend — API y store

- [x] 7.1 Crear `src/features/categorias/api.ts` con funciones `getTree`, `createCategoria`, `updateCategoria`, `deleteCategoria`
- [x] 7.2 Crear `src/features/categorias/types.ts` con tipos `CategoriaNode`, `CategoriaCreate`, `CategoriaUpdate`

## 8. Frontend — Componentes UI

- [x] 8.1 Crear componente `CategoryTree` que renderiza el árbol colapsable (`src/features/categorias/ui/CategoryTree.tsx`)
- [x] 8.2 Crear componente `CategoryForm` (modal/drawer) para crear y editar (`src/features/categorias/ui/CategoryForm.tsx`)
- [x] 8.3 Crear componente `DeleteCategoryDialog` con confirmación (`src/features/categorias/ui/DeleteCategoryDialog.tsx`)
- [x] 8.4 Crear página `CategoriasPage` que compone los tres componentes (`src/pages/CategoriasPage.tsx`)

## 9. Routing y navegación

- [x] 9.1 Agregar ruta `/categorias` en `src/app/router.tsx` (PrivateRoute, solo ADMIN ve los botones de acción)
- [x] 9.2 Agregar enlace "Categorías" en la navegación de `HomePage`

## 10. Verificación manual

- [x] 10.1 Crear categoría raíz "Bebidas" como ADMIN → verifica 201
- [x] 10.2 Crear subcategoría "Aguas" con padre "Bebidas" → verifica árbol anidado
- [x] 10.3 Intentar crear ciclo (A → B → A) → verifica 409
- [x] 10.4 Intentar borrar categoría con hijos → verifica 409
- [x] 10.5 Eliminar hoja vacía → verifica 204 y desaparece del árbol en UI
