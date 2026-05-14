## Context

El backend tiene los modelos `Usuario`, `Rol`, `UsuarioRol` y `RefreshToken` definidos en SQLModel, la seed data cargada (4 roles con IDs estables), y `UnitOfWork` + `BaseRepository[T]` disponibles. El frontend tiene `authStore` con persistencia en localStorage y el interceptor de Axios que ya maneja renovación automática de tokens 401. Lo que falta es la capa de lógica: schemas, servicios, router y las dependencias FastAPI reutilizables.

## Goals / Non-Goals

**Goals:**
- Endpoints `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` funcionales
- `get_current_user` y `require_role` disponibles para todos los módulos futuros
- Cumplimiento de todas las reglas de negocio RN-AU01 a RN-AU10 y RN-RB01 a RN-RB10
- Páginas Login y Register en el frontend integradas con authStore

**Non-Goals:**
- Gestión de usuarios por ADMIN (CRUD de usuarios → us-007-admin)
- OAuth / social login
- Verificación de email por correo

## Decisions

### D1 — Dependencias en `app/core/security.py`

`get_current_user` y `require_role` viven en `app/core/security.py`, no dentro del módulo `auth/`. Esto permite que cualquier módulo los importe sin crear dependencias circulares. `require_role` es un factory: `require_role(["ADMIN", "STOCK"])` retorna una dependencia FastAPI que verifica roles del usuario inyectado.

Alternativa descartada: poner en `auth/dependencies.py` — genera importación cruzada cuando `productos` importa desde `auth`.

### D2 — Replay attack (RN-AU05): consulta por token + estado revocado

Flujo de detección:
1. Cliente envía refresh token
2. Se busca en BD por token string
3. Si existe y `revocado_en IS NOT NULL` → **replay detectado** → revocar TODOS los RefreshToken del usuario → retornar 401
4. Si no existe → 401 normal
5. Si existe y activo → rotar normalmente

Esto cubre el caso donde un token robado se usa después de que el usuario legítimo ya lo rotó.

### D3 — bcrypt en contexto async

`passlib` es síncrono. Llamarlo directamente en un handler `async def` bloquea el event loop. Se usará `asyncio.get_event_loop().run_in_executor(None, ...)` para hash y verify. El servicio expone `async def hash_password` y `async def verify_password` que envuelven las llamadas síncronas de passlib.

### D4 — UsuarioRepository en `app/modules/usuarios/repository.py`

Auth necesita `get_by_email()` para login y `get_by_id()` para `get_current_user`. Estos métodos van en `UsuarioRepository`, no en el servicio de auth. El `AuthService` recibe el UoW y accede a `uow.usuarios` (repositorio) y `uow.refresh_tokens`.

### D5 — Respuesta de login idéntica para email inexistente y contraseña incorrecta (RN-AU08)

El servicio siempre retorna HTTP 401 con mensaje genérico `"Credenciales inválidas"` tanto si el email no existe como si la contraseña es incorrecta. Se hace el lookup por email primero; si no existe, se ejecuta igualmente un hash dummy para evitar timing attacks.

### D6 — Frontend: TanStack Form + React Router

- Login y Register usan `useForm` de TanStack Form con validación inline
- React Router con rutas `<PrivateRoute>` que leen `isAuthenticated` del authStore
- Al login exitoso: guardar tokens en authStore y navegar a `/`
- El interceptor Axios 401 ya está implementado en `axiosInstance.ts` — no requiere cambios

## Risks / Trade-offs

- **Tokens en localStorage** → vulnerable a XSS. Mitigación: los access tokens duran 30min; el refresh store no expone el token a scripts de terceros. Alternativa httpOnly cookie fue descartada por complejidad en el contexto del proyecto.
- **Revocación de TODOS los tokens en replay** → cierra sesión en todos los dispositivos del usuario. Es agresivo pero es el comportamiento correcto según RN-AU05.
- **IDs de roles hardcodeados en seed** → si la seed no corrió, `require_role` falla silenciosamente. Mitigación: validar en startup que los 4 roles existan (opcional, baja prioridad).

## Migration Plan

1. Ejecutar la seed si aún no corrió: `python -m app.db.seed`
2. No requiere nueva migración Alembic (todos los modelos ya están en `0001_initial`)
3. El router se registra en `app/main.py` con `app.include_router(..., prefix="/api/v1")`
4. Rollback: remover el `include_router` — no hay cambios destructivos en BD

## Open Questions

- ¿El frontend de auth incluye la página de perfil/cambio de contraseña, o va en un change posterior? → Se deja fuera de este change (non-goal).
- ¿Agregar campo `ALGORITHM` configurable en Settings o hardcodear HS256? → Hardcodear HS256 por simplicidad; puede parametrizarse luego si se necesita.
