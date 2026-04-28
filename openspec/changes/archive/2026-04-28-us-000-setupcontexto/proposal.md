## Why

El proyecto Food Store (TPI — stack React + FastAPI + PostgreSQL) necesita una infraestructura fundacional antes de poder implementar cualquier feature de negocio. Sin esta base, no existe estructura de carpetas, ni patrones de acceso a datos, ni estado global del cliente, ni base de datos inicializada, ni configuración de seguridad perimetral (CORS, rate limiting).

## What Changes

- Scaffold completo de carpetas backend con arquitectura **feature-first** por módulo (`auth`, `usuarios`, `productos`, `pedidos`, `pagos`, `admin`, etc.) y núcleo compartido en `app/core/`
- Scaffold completo de carpetas frontend con **Feature-Sliced Design** (layers: `app`, `pages`, `widgets`, `features`, `entities`, `shared`)
- Implementación de `BaseRepository[T]` genérico con métodos CRUD + soft-delete
- Implementación del **Unit of Work** como context manager async con commit/rollback automático
- Cuatro **Zustand stores** tipados: `authStore`, `cartStore`, `paymentStore`, `uiStore` con persistencia selectiva por store
- Configuración **Alembic** con `env.py` y migración inicial (revision `0001_initial`)
- Script `app/db/seed.py` que inserta Roles, EstadoPedido, FormaPago y usuario admin
- **CORS** configurado con `CORSMiddleware` usando `CORS_ORIGINS` desde `.env`
- **Rate limiting** global con `slowapi`: `Limiter` montado en `app/main.py`, decorador `@limiter.limit("5/15minutes")` listo para el router de auth
- Archivo `.env.example` completo y `app/core/config.py` con `Settings` (Pydantic BaseSettings)

## Capabilities

### New Capabilities

- `project-scaffold`: Estructura de directorios backend (feature-first) y frontend (FSD), archivos `__init__.py`, `main.py`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`
- `base-repository`: `BaseRepository[T]` genérico en `app/core/repository.py` — `get_by_id`, `list_all`, `count`, `create`, `update`, `soft_delete`, `hard_delete`
- `unit-of-work`: `UnitOfWork` en `app/core/uow.py` — context manager async, instancias de todos los repositorios, commit/rollback automático
- `zustand-stores`: Cuatro stores en `src/store/` tipados con TypeScript — `authStore` (persist: accessToken), `cartStore` (persist: items), `paymentStore` (no persist), `uiStore` (no persist)
- `database-setup`: `alembic.ini`, `app/db/migrations/env.py`, migración `0001_initial` con todas las tablas del ERD v5, script `app/db/seed.py`
- `cors-rate-limiting`: `CORSMiddleware` y `slowapi.Limiter` configurados en `app/main.py`; `app/core/config.py` con todas las variables de entorno

### Modified Capabilities

<!-- Sin capabilities previas — es el primer change del proyecto -->

## Impact

- **Backend**: Se crea desde cero toda la estructura `app/` — ningún código de negocio existe aún, por lo que no hay breaking changes
- **Frontend**: Se crea desde cero toda la estructura `src/` con FSD
- **Base de datos**: Requiere PostgreSQL corriendo con las credenciales de `DATABASE_URL`; el comando `alembic upgrade head` crea todas las tablas
- **Seguridad**: CORS permite únicamente los orígenes definidos en `CORS_ORIGINS`; rate limiting protege el endpoint de login (5 req / 15 min por IP)
- **Dependencias backend**: `fastapi`, `sqlmodel`, `alembic`, `passlib[bcrypt]`, `python-jose`, `slowapi`, `mercadopago`, `pydantic-settings`
- **Dependencias frontend**: `react`, `typescript`, `vite`, `tailwindcss`, `zustand`, `@tanstack/react-query`, `@tanstack/react-form`, `axios`, `recharts`, `@mercadopago/sdk-react`
