# base-repository Specification

## Purpose
TBD - created by archiving change us-000-setupcontexto. Update Purpose after archive.
## Requirements
### Requirement: BaseRepository generic class
El sistema SHALL proveer una clase `BaseRepository[T]` en `app/core/repository.py` que encapsule las operaciones CRUD comunes para cualquier entidad SQLModel, parametrizada con el tipo del modelo.

La clase recibe `session: AsyncSession` y `model_class: type[T]` en su constructor. Todos sus métodos deben ser `async`.

Métodos obligatorios:
| Método | Firma | Comportamiento |
|--------|-------|----------------|
| `get_by_id` | `(id: int) → T \| None` | SELECT por PK; retorna None si no existe o si `deleted_at IS NOT NULL` |
| `list_all` | `(skip: int = 0, limit: int = 20) → list[T]` | SELECT paginado; filtra `deleted_at IS NULL` cuando el modelo tiene ese campo |
| `count` | `() → int` | COUNT(*) con mismo filtro de soft-delete |
| `create` | `(entity: T) → T` | `session.add(entity)` + `await session.flush()` + `await session.refresh(entity)` |
| `update` | `(entity: T) → T` | `session.add(entity)` + `await session.flush()` + `await session.refresh(entity)` |
| `soft_delete` | `(entity: T) → None` | Asigna `entity.deleted_at = datetime.utcnow()` + flush |
| `hard_delete` | `(entity: T) → None` | `await session.delete(entity)` + flush |

#### Scenario: get_by_id retorna None para registro inexistente
- **WHEN** se llama `get_by_id(999)` y no existe un registro con ese ID
- **THEN** el método retorna `None` sin lanzar excepción

#### Scenario: get_by_id excluye registros soft-deleted
- **WHEN** existe un registro con `deleted_at` no nulo y se llama `get_by_id` con su ID
- **THEN** el método retorna `None`

#### Scenario: create retorna entidad con ID asignado
- **WHEN** se llama `create(entity)` con una entidad sin ID
- **THEN** el método retorna la misma entidad con el campo `id` populado por la base de datos

#### Scenario: soft_delete asigna deleted_at
- **WHEN** se llama `soft_delete(entity)` sobre una entidad que tiene el campo `deleted_at`
- **THEN** `entity.deleted_at` tiene un valor de tipo `datetime` no nulo

#### Scenario: list_all respeta paginación
- **WHEN** existen 50 registros activos y se llama `list_all(skip=10, limit=5)`
- **THEN** se retornan exactamente 5 registros a partir del undécimo

### Requirement: Repositorios especializados heredan de BaseRepository
Cada repositorio de módulo SHALL heredar de `BaseRepository[ModelType]` y agregar únicamente los métodos de query específicos del dominio que no están cubiertos por la clase base.

#### Scenario: Herencia sin duplicación de CRUD
- **WHEN** se define `class UsuarioRepository(BaseRepository[Usuario])`
- **THEN** la clase dispone de `get_by_id`, `create`, `update`, `soft_delete` sin redefinirlos

