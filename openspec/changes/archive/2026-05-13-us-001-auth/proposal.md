## Why

El sistema tiene la infraestructura base (modelos, UoW, BaseRepository, stores) pero ningún endpoint funcional. Auth es la primera pieza necesaria porque todos los módulos posteriores dependen de `get_current_user` y `require_role` para proteger sus rutas.

## What Changes

- **POST /api/v1/auth/register** — registro de clientes con auto-asignación de rol CLIENT
- **POST /api/v1/auth/login** — login con doble token (access 30min + refresh 7 días), rate limiting 5/15min/IP
- **POST /api/v1/auth/refresh** — rotación de refresh token; detección de replay attack revoca todos los tokens del usuario
- **POST /api/v1/auth/logout** — revocación del refresh token activo
- **Dependencias FastAPI** — `get_current_user` y `require_role([...])` reutilizables por todos los módulos futuros
- **Frontend** — páginas Login y Register, rutas protegidas, integración con authStore + interceptor Axios ya existente

## Capabilities

### New Capabilities

- `jwt-authentication`: Endpoints de auth (register, login, refresh, logout), ciclo de vida del JWT, rotación y revocación de refresh tokens, detección de replay attack
- `rbac`: Dependencias `get_current_user` y `require_role` para FastAPI; modelo de 4 roles con verificación granular por endpoint
- `auth-frontend`: Páginas Login y Register con TanStack Form, rutas protegidas con React Router, integración con authStore

### Modified Capabilities

<!-- ninguna -->

## Impact

- **Backend**: `app/modules/auth/` y `app/modules/usuarios/` (schemas, service, router, repository); `app/core/security.py` (get_current_user, require_role)
- **Frontend**: `src/features/auth/`, `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`, `src/app/router.tsx` (rutas protegidas)
- **Dependencias**: python-jose (JWT), passlib[bcrypt] (hashing) — ya en requirements.txt; react-router-dom (ya en package.json)
- **Todos los módulos futuros** dependen de `require_role` definido aquí
