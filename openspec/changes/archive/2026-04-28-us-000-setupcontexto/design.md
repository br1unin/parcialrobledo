## Context

Food Store es un TPI full-stack (React + FastAPI + PostgreSQL). El repositorio existe pero no tiene código de aplicación — solo documentación. Este change establece toda la infraestructura base sobre la cual se implementarán los módulos de negocio (auth, productos, pedidos, pagos, admin).

La arquitectura está completamente definida en `docs/Descripcion.txt` y `docs/Integrador.txt`: backend en capas (Router → Service → UoW → Repository → Model) con módulos feature-first, frontend con Feature-Sliced Design y separación estricta Zustand/TanStack Query.

Stack backend: FastAPI + SQLModel + PostgreSQL + Alembic + slowapi  
Stack frontend: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + Zustand 4

## Goals / Non-Goals

**Goals:**
- Crear la estructura de carpetas backend feature-first completa (sin código de negocio, solo scaffolding)
- Crear la estructura FSD del frontend con archivos de configuración (vite, tsconfig, tailwind)
- Implementar `BaseRepository[T]` genérico en `app/core/repository.py`
- Implementar `UnitOfWork` como context manager async en `app/core/uow.py` con repositorios vacíos por módulo
- Implementar los 4 Zustand stores tipados con persistencia selectiva
- Configurar Alembic y crear la migración inicial `0001_initial` con todas las tablas del ERD v5
- Escribir `app/db/seed.py` con Roles, EstadoPedido, FormaPago y usuario admin
- Configurar `CORSMiddleware` y `slowapi.Limiter` en `app/main.py`
- Crear `app/core/config.py` con `Settings` (Pydantic BaseSettings) y `.env.example`

**Non-Goals:**
- Implementar lógica de negocio de ningún módulo (auth, productos, pedidos, etc.)
- Implementar endpoints REST (eso pertenece a cada US de feature)
- Crear tests (se realizan en US separadas o como bonus)
- Configurar CI/CD ni deploy

## Decisions

### D-01: Feature-first sobre N-tier clásico (backend)
**Decisión**: Módulos organizados por dominio (`app/modules/auth/`, `app/modules/productos/`, etc.) en lugar de carpetas técnicas (`routers/`, `services/`, `models/`).  
**Rationale**: La especificación lo define explícitamente. Facilita la cohesión, el onboarding y el trabajo paralelo por módulo.  
**Alternativa descartada**: N-tier clásico — aumenta el acoplamiento transversal y complica la navegación en codebases grandes.

### D-02: BaseRepository[T] genérico con generics de Python
**Decisión**: `BaseRepository[T]` usa `Generic[T]` de `typing` y recibe el `model_class` en el constructor.  
**Rationale**: Evita duplicar los 7 métodos CRUD en cada repositorio especializado. Los repositorios de módulo heredan y agregan métodos de dominio específico.  
**Alternativa descartada**: Mixin sin generics — pierde el tipado estático que PyRight/mypy pueden verificar.

### D-03: UoW como async context manager
**Decisión**: `UnitOfWork` implementa `__aenter__`/`__aexit__`. Se usa con `async with UnitOfWork() as uow:`.  
**Rationale**: FastAPI es ASGI; las sesiones de SQLModel/SQLAlchemy con `AsyncSession` requieren async. Mantiene la semántica de commit/rollback automático.  
**Nota**: En la implementación inicial el UoW expone repositorios placeholder; cada US de módulo agrega su repositorio.

### D-04: Alembic con autogenerate + metadata de SQLModel
**Decisión**: `env.py` importa `SQLModel.metadata` y usa `compare_type=True`.  
**Rationale**: Permite generar migraciones automáticas a partir de cambios en los modelos SQLModel. La migración inicial se genera manualmente para garantizar control total del schema inicial.

### D-05: Zustand stores independientes, no un único store global
**Decisión**: Cuatro archivos de store separados (`authStore.ts`, `cartStore.ts`, `paymentStore.ts`, `uiStore.ts`).  
**Rationale**: La especificación lo exige explícitamente. Permite suscripciones granulares y persistencia selectiva por store sin afectar los demás.  
**Alternativa descartada**: Un store monolítico con slices — dificulta el tree-shaking y mezcla responsabilidades.

### D-06: CORS vía variable de entorno CORS_ORIGINS (JSON array)
**Decisión**: `CORS_ORIGINS` se define como `list[str]` en `Settings`. En desarrollo: `["http://localhost:5173"]`.  
**Rationale**: Permite cambiar los orígenes sin modificar código. El valor se parsea automáticamente por Pydantic desde la variable de entorno.

### D-07: Rate limiting global en app + decorador por endpoint
**Decisión**: `Limiter` de slowapi se instancia globalmente en `app/core/config.py` o `app/main.py` y se monta con `app.state.limiter`. El decorador `@limiter.limit()` se aplica individualmente en el router de auth.  
**Rationale**: Permite límites distintos por endpoint sin afectar el rendimiento de endpoints no protegidos.

## Risks / Trade-offs

- **[Risk] Drift entre `.env.example` y `Settings`** → Mitigation: `.env.example` se genera como documentación del mismo `Settings` model; revisión manual antes de cada entrega.
- **[Risk] Migración inicial manual puede quedar desincronizada con modelos** → Mitigation: Después de definir todos los modelos SQLModel (en US posteriores), ejecutar `alembic revision --autogenerate` y comparar diff.
- **[Risk] `UnitOfWork` referencia repositorios no creados aún** → Mitigation: El UoW inicial tiene atributos comentados por módulo; cada US descomenta/agrega el repositorio correspondiente.
- **[Trade-off] Scaffold sin tests** → Se acepta en Sprint 0; los tests se agregan como bonus o en US específicas de testing.

## Migration Plan

1. Crear estructura de carpetas con `__init__.py` vacíos
2. Instalar dependencias (`requirements.txt`, `package.json`)
3. Crear `app/core/config.py` → `app/main.py`
4. Crear `app/core/repository.py` → `app/core/uow.py`
5. Configurar Alembic: `alembic init alembic` → editar `env.py` → `alembic revision -m "initial"`
6. Crear `app/db/seed.py`
7. Crear stores Zustand + configurar Vite/Tailwind/TypeScript
8. Verificar: `alembic upgrade head` + `python -m app.db.seed` + `uvicorn app.main:app` + `npm run dev`

## Open Questions

- ¿El UoW del Sprint 0 expone repositorios vacíos (como `produtos: ProductoRepository | None = None`) o solo el session? → **Decisión provisional**: expone solo `session` en Sprint 0; cada US agrega su repo.
- ¿La migración inicial incluye datos de seed (INSERT INTO) o solo DDL? → **Decisión**: solo DDL; seed corre por separado via `app/db/seed.py`.
