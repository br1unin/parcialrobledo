## Why

El sistema carece de un módulo de categorías, impidiendo clasificar productos en jerarquías navegables (ej. "Bebidas > Sin alcohol > Aguas"). Sin categorías, los usuarios no pueden filtrar ni explorar el catálogo de forma estructurada.

## What Changes

- CRUD completo de categorías con soporte jerárquico (padre opcional, profundidad ilimitada vía self-join)
- Validación de ciclos en la jerarquía (RN-CA02): no se puede asignar un ancestro como hijo
- Protección ante eliminación de categorías con productos activos (RN-CA03)
- Asociación M2M entre productos y categorías (`ProductoCategoria`)
- Consulta de árbol completo con CTE recursiva en PostgreSQL
- Endpoints REST bajo `/api/v1/categorias`, acceso diferenciado por rol (ADMIN escribe, todos leen)
- Componentes React: lista de categorías en árbol, formulario de creación/edición, selector en ProductoForm

## Capabilities

### New Capabilities

- `category-management`: CRUD de categorías con jerarquía self-referential, validaciones de negocio (ciclos, productos activos), y CTE recursiva para árbol completo
- `category-frontend`: UI para gestión y visualización de categorías (árbol, formulario, selector)

### Modified Capabilities

*(ninguna — no cambia ningún spec existente)*

## Impact

- **Backend**: nuevo módulo `app/modules/categorias/` (model, schemas, repository, service, router); migración Alembic para tabla `categoria` y `producto_categoria`; `app/main.py` incluye el nuevo router
- **Frontend**: nuevas páginas/componentes bajo `src/features/categorias/`; router actualizado con rutas de categorías
- **Base de datos**: tablas `categoria` (self-referential FK `padre_id`) y `producto_categoria` (FK a `producto` y `categoria`)
- **Dependencias**: sin dependencias nuevas (CTE es SQL nativo PostgreSQL)
