# unit-of-work Specification

## Purpose
TBD - created by archiving change us-000-setupcontexto. Update Purpose after archive.
## Requirements
### Requirement: UnitOfWork async context manager
El sistema SHALL proveer una clase `UnitOfWork` en `app/core/uow.py` que gestione la sesión de base de datos y garantice atomicidad transaccional mediante un context manager async.

Comportamiento:
- `__aenter__`: crea una `AsyncSession` desde el engine configurado y la asigna a `self.session`
- `__aexit__` sin excepción: ejecuta `await self.session.commit()` y cierra la sesión
- `__aexit__` con excepción: ejecuta `await self.session.rollback()` y cierra la sesión

La clase DEBE exponer `self.session` para que los repositorios puedan inyectarse.

#### Scenario: Commit automático al salir sin excepción
- **WHEN** se usa `async with UnitOfWork() as uow:` y el bloque termina sin excepción
- **THEN** se ejecuta `session.commit()` y los cambios se persisten

#### Scenario: Rollback automático ante excepción
- **WHEN** se usa `async with UnitOfWork() as uow:` y se lanza una excepción dentro del bloque
- **THEN** se ejecuta `session.rollback()` y ningún cambio parcial persiste en la base de datos

#### Scenario: La excepción se propaga al llamador
- **WHEN** se lanza una excepción dentro del contexto UoW
- **THEN** la excepción es re-lanzada después del rollback para que FastAPI la maneje como HTTPException o error 500

### Requirement: Ningún service ejecuta commit directamente
El sistema SHALL garantizar que la capa de Service no ejecute `session.commit()` ni `session.rollback()` directamente. El commit es responsabilidad exclusiva del UoW.

#### Scenario: Service delega el commit al UoW
- **WHEN** un Service necesita persistir datos en múltiples tablas
- **THEN** el Service invoca los repositorios a través del `uow` recibido por parámetro, y el UoW ejecuta el commit al finalizar

#### Scenario: Router abre el contexto UoW
- **WHEN** un endpoint recibe una petición que requiere escritura en base de datos
- **THEN** el Router (o una dependencia FastAPI) abre el contexto `async with UnitOfWork() as uow:` y pasa `uow` al Service

### Requirement: UoW como dependencia FastAPI inyectable
El sistema SHALL proveer una función generadora `get_uow()` utilizable como `Depends(get_uow)` en los routers de FastAPI, que produce instancias de UoW correctamente abiertas y cerradas.

#### Scenario: Dependencia inyectada por FastAPI
- **WHEN** un endpoint declara `uow: UnitOfWork = Depends(get_uow)`
- **THEN** FastAPI inyecta un UoW con sesión activa y garantiza el cierre de la sesión al finalizar la request

