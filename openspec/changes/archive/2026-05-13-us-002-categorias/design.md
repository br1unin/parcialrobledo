## Context

El stack ya cuenta con FastAPI + SQLModel + asyncpg, UoW + BaseRepository, RBAC con `require_role`, y Alembic para migraciones. No hay ningún modelo de categoría; los productos existentes (modelo `Producto`) no tienen asociación de categorías todavía.

La jerarquía de categorías es un requisito de negocio: el árbol puede tener profundidad arbitraria (ej. "Alimentos > Lácteos > Quesos"). Las consultas de árbol deben ser eficientes sin incurrir en N+1 queries.

## Goals / Non-Goals

**Goals:**
- Modelo `Categoria` con self-join nullable (`padre_id → id`)
- CRUD vía endpoints REST con autorización RBAC (ADMIN escribe, todos leen)
- Consulta de árbol completo con CTE recursiva en una sola query SQL
- Validación de ciclos antes de persistir (RN-CA02)
- Bloqueo de eliminación cuando la categoría tiene productos activos (RN-CA03)
- Tabla junction `ProductoCategoria` (M2M con `Producto`)
- Frontend: árbol colapsable, formulario de categoría, selector para ProductoForm

**Non-Goals:**
- Cache de árbol o materialización de paths (complejidad innecesaria ahora)
- Búsqueda full-text dentro de categorías
- Reordenamiento drag-and-drop
- Integración con el módulo de Productos (la asociación M2M se define aquí pero el formulario de Producto es fuera de scope de esta US)

## Decisions

### 1. Self-referential FK vs. Nested Sets vs. Materialized Path

**Decisión**: self-referential FK con `padre_id UUID NULLABLE → categoria.id`.

**Rationale**: es el diseño más simple de mantener para una jerarquía de profundidad variable con PostgreSQL. Nested sets tienen escrituras costosas; materialized paths agregan lógica de string manipulation. Con CTE recursiva, la lectura del árbol completo sigue siendo O(n) en una query.

**Alternativa descartada**: nested sets (intervals), porque las inserciones requieren renumerar el árbol y añaden complejidad operacional sin beneficio observable al tamaño de catálogo esperado (<1000 categorías).

### 2. CTE recursiva para árbol vs. ORM lazy-load

**Decisión**: CTE recursiva en SQL puro dentro del repository.

```sql
WITH RECURSIVE tree AS (
  SELECT * FROM categoria WHERE padre_id IS NULL
  UNION ALL
  SELECT c.* FROM categoria c JOIN tree t ON c.padre_id = t.id
)
SELECT * FROM tree ORDER BY id;
```

**Rationale**: una sola round-trip a la DB. El ORM lazy-load generaría N+1 queries para un árbol de profundidad N. SQLModel/SQLAlchemy async no soporta lazy-loading; eager-load con `selectinload` requiere múltiples queries igualmente. La CTE es idiomática en PostgreSQL.

### 3. Validación de ciclos en service layer

**Decisión**: antes de actualizar `padre_id`, recorrer los ancestros del nuevo padre en la DB; si el nodo actual aparece como ancestro, rechazar con 409.

**Alternativa descartada**: trigger en PostgreSQL — más difícil de testear, el error llegaría como excepción genérica de DB sin mensaje de negocio legible.

### 4. Protección ante eliminación (RN-CA03)

**Decisión**: el service verifica con `SELECT COUNT(*) FROM producto_categoria WHERE categoria_id = ?` antes de ejecutar el DELETE. Si count > 0, lanza 409.

### 5. M2M con tabla junction explícita

**Decisión**: tabla `producto_categoria(producto_id, categoria_id)` con PK compuesta; relación declarada como SQLModel con `link_model`.

**Rationale**: FK integrity garantizada; permite añadir atributos a la relación en el futuro (ej. categoría principal).

## Risks / Trade-offs

- **Árbol muy profundo**: CTE sin límite de profundidad puede ser lenta para árboles de cientos de niveles → mitigación: añadir `CYCLE id SET is_cycle USING path` en PostgreSQL 14+ si se necesita; para ahora la validación de ciclos previene el problema práctico.
- **Race condition en validación de ciclos**: dos requests concurrentes podrían pasar la validación simultáneamente → mitigación: constraint UNIQUE en la relación padre-hijo no existe, pero la ventana de race es pequeña y aceptable para el volumen esperado.
- **Borrado en cascada**: si se elimina un padre, los hijos quedan con `padre_id` huérfano → mitigación: FK con `ON DELETE RESTRICT` (no CASCADE); el service debe validar que la categoría no tenga hijos activos antes de borrar.

## Migration Plan

1. Crear migración Alembic: tabla `categoria` + tabla `producto_categoria`
2. No hay datos existentes para migrar
3. Rollback: `alembic downgrade -1` elimina ambas tablas (sin datos de producción todavía)
4. El router se registra en `app/main.py`; si falla, rollback del commit

## Open Questions

- *(ninguna — el scope está claro y acotado)*
