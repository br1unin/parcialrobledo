## 1. Backend — Seguridad y dependencias core

- [x] 1.1 Crear `app/core/security.py` con función `async def hash_password(plain: str) -> str` y `async def verify_password(plain: str, hashed: str) -> bool` usando passlib[bcrypt] en executor (asyncio.get_event_loop().run_in_executor)
- [x] 1.2 Crear función `create_access_token(data: dict) -> str` en `app/core/security.py` usando python-jose con algoritmo HS256 y expiración configurable desde Settings
- [x] 1.3 Crear dependencia `async def get_current_user(token: str = Depends(oauth2_scheme), uow: UnitOfWork = Depends(get_uow)) -> Usuario` en `app/core/security.py` — decodifica JWT, busca usuario por ID del payload, retorna 401 si inválido/expirado
- [x] 1.4 Crear factory `require_role(roles: list[str])` en `app/core/security.py` que retorna una dependencia FastAPI; retorna 403 si el usuario autenticado no tiene ningún rol de la lista

## 2. Backend — Repositories

- [x] 2.1 Crear `app/modules/usuarios/repository.py` con `UsuarioRepository(BaseRepository[Usuario])` que agrega `get_by_email(email: str) -> Usuario | None`
- [x] 2.2 Crear `app/modules/refreshtokens/repository.py` con `RefreshTokenRepository(BaseRepository[RefreshToken])` con métodos: `get_by_token(token: str) -> RefreshToken | None`, `revoke_all_for_user(usuario_id: int) -> None`, `revoke_token(token_id: int) -> None`
- [x] 2.3 Actualizar `app/core/uow.py` para exponer `uow.usuarios: UsuarioRepository` y `uow.refresh_tokens: RefreshTokenRepository` como atributos del UnitOfWork

## 3. Backend — Schemas

- [x] 3.1 Crear `app/modules/auth/schemas.py` con `RegisterRequest` (nombre, email, password ≥ 8 chars), `LoginRequest` (email, password), `RefreshRequest` (refresh_token), `LogoutRequest` (refresh_token)
- [x] 3.2 Crear `app/modules/usuarios/schemas.py` con `UserResponse` (id, nombre, email, telefono, roles: list[str], creado_en) y `TokenResponse` (access_token, refresh_token, token_type="Bearer", user: UserResponse)

## 4. Backend — Auth Service

- [x] 4.1 Crear `app/modules/auth/service.py` con `async def register(uow, data: RegisterRequest) -> TokenResponse` — verifica email único (409 si existe), hashea contraseña, crea Usuario, asigna rol CLIENT, genera tokens, almacena RefreshToken en BD
- [x] 4.2 Crear `async def login(uow, data: LoginRequest, request: Request) -> TokenResponse` — busca usuario por email, verifica contraseña (retorna 401 genérico si falla cualquier paso), genera tokens, almacena RefreshToken
- [x] 4.3 Crear `async def refresh_tokens(uow, refresh_token: str) -> TokenResponse` — implementa flujo de rotación con detección de replay attack (D2 del design): si token revocado → revocar todos → 401; si activo → rotar
- [x] 4.4 Crear `async def logout(uow, refresh_token: str) -> None` — revoca el refresh token dado; idempotente (no error si no existe)

## 5. Backend — Router y registro

- [x] 5.1 Crear `app/modules/auth/router.py` con los 4 endpoints: `POST /register` (201), `POST /login` (con rate limit `@limiter.limit("5/15minutes")`), `POST /refresh` (200), `POST /logout` (204)
- [x] 5.2 Registrar el router en `app/main.py` con `app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])`

## 6. Backend — Verificación

- [x] 6.1 Verificar: `uvicorn app.main:app --reload` arranca sin errores
- [x] 6.2 Verificar en Swagger (`/docs`): los 4 endpoints aparecen y el schema de entrada/salida es correcto
- [x] 6.3 Verificar flujo completo via Swagger: register → login → refresh → logout
- [x] 6.4 Verificar detección de replay attack: usar el mismo refresh token dos veces → segundo intento debe revocar todos y retornar 401
- [x] 6.5 Verificar rate limiting: >5 requests al login desde misma IP → 429

## 7. Frontend — Páginas de autenticación

- [x] 7.1 Crear `src/features/auth/api.ts` con funciones `login(data)`, `register(data)`, `refresh(token)`, `logout(token)` que llaman a los endpoints usando `axiosInstance`
- [x] 7.2 Crear `src/pages/LoginPage.tsx` con formulario TanStack Form (email, password), manejo de error 401 y 429, y submit que llama a `login()` y actualiza authStore
- [x] 7.3 Crear `src/pages/RegisterPage.tsx` con formulario TanStack Form (nombre, email, password), manejo de error 409, y submit que llama a `register()` y actualiza authStore
- [x] 7.4 Crear `src/shared/ui/PrivateRoute.tsx` que lee `isAuthenticated` de authStore: si falso redirige a `/login`, si verdadero renderiza los children

## 8. Frontend — Router y logout

- [x] 8.1 Actualizar `src/app/router.tsx` para agregar rutas `/login` y `/register` (públicas) y envolver las rutas privadas con `<PrivateRoute>`. Redirigir usuarios autenticados en `/login` y `/register` hacia `/`
- [x] 8.2 Actualizar interceptor 401 en `src/shared/api/axiosInstance.ts` para llamar a `refresh()`, actualizar authStore con nuevos tokens, y reintentar la petición; si el refresh también falla, llamar `authStore.logout()` y redirigir a `/login`
- [x] 8.3 Agregar acción de logout en authStore (si no existe) que llama a `logout(refreshToken)` vía API, limpia el estado y navega a `/login`

## 9. Frontend — Verificación

- [x] 9.1 Verificar: `npm run dev` arranca sin errores de TypeScript
- [ ] 9.2 Verificar flujo completo en navegador: register → login → refresh automático (simular 401) → logout
- [ ] 9.3 Verificar rutas protegidas: acceder a `/` sin sesión redirige a `/login`
- [ ] 9.4 Verificar persistencia: hacer login, cerrar y reabrir el navegador, confirmar que la sesión se mantiene
