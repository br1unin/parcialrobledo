## 1. Backend — Estructura de carpetas y configuración

- [x] 1.1 Crear estructura de carpetas `app/` con `__init__.py` en cada directorio (`core/`, `db/`, `modules/` y sus 9 subdirectorios)
- [x] 1.2 Crear `requirements.txt` con todas las dependencias del stack backend (fastapi, sqlmodel, alembic, asyncpg, passlib[bcrypt], python-jose, slowapi, mercadopago, pydantic-settings)
- [x] 1.3 Crear `app/core/config.py` con clase `Settings` (Pydantic BaseSettings) con todas las variables de entorno definidas en la spec `cors-rate-limiting`
- [x] 1.4 Crear `.env.example` con todas las variables de `Settings` documentadas y valores de ejemplo
- [x] 1.5 Crear `app/main.py` con instancia FastAPI, `CORSMiddleware` configurado desde `settings.CORS_ORIGINS`, `slowapi.Limiter` montado en `app.state.limiter` y handler `RateLimitExceeded`

## 2. Backend — BaseRepository y UnitOfWork

- [x] 2.1 Crear `app/core/repository.py` con `BaseRepository[T]` genérico (7 métodos: `get_by_id`, `list_all`, `count`, `create`, `update`, `soft_delete`, `hard_delete`) — todos async, con filtro soft-delete automático
- [x] 2.2 Crear `app/core/uow.py` con `UnitOfWork` como async context manager (`__aenter__`/`__aexit__`), commit en éxito, rollback en excepción, y la función generadora `get_uow()` para `Depends()`

## 3. Backend — Alembic y migraciones

- [x] 3.1 Inicializar Alembic: `alembic init app/db/migrations` y editar `alembic.ini` para apuntar al directorio correcto
- [x] 3.2 Editar `app/db/migrations/env.py`: importar `SQLModel.metadata`, configurar `AsyncEngine`, habilitar `compare_type=True` y `run_async_migrations()`
- [x] 3.3 Definir todos los modelos SQLModel del ERD v5 en `app/modules/<modulo>/model.py` (16 tablas): `Usuario`, `Rol`, `UsuarioRol`, `RefreshToken`, `DireccionEntrega`, `Categoria`, `Producto`, `Ingrediente`, `ProductoCategoria`, `ProductoIngrediente`, `FormaPago`, `EstadoPedido`, `Pedido`, `DetallePedido`, `HistorialEstadoPedido`, `Pago`
- [x] 3.4 Generar migración inicial: `alembic revision --autogenerate -m "0001_initial"` y verificar que incluye las 16 tablas con tipos correctos (incluyendo `INTEGER[]` para `personalizacion`)
- [x] 3.5 Verificar: `alembic upgrade head` y `alembic downgrade -1` ejecutan sin errores

## 4. Backend — Seed data

- [x] 4.1 Crear `app/db/seed.py` con función idempotente que inserta los 4 Roles (ADMIN, STOCK, PEDIDOS, CLIENT)
- [x] 4.2 Agregar al seed los 6 EstadoPedido con `es_terminal` correcto (ENTREGADO y CANCELADO = true)
- [x] 4.3 Agregar al seed las 3 FormaPago (MERCADOPAGO, EFECTIVO, TRANSFERENCIA)
- [x] 4.4 Agregar al seed el usuario admin (`admin@foodstore.com` / `Admin1234!` hasheado con bcrypt cost≥12) con rol ADMIN asignado en `usuario_rol`
- [x] 4.5 Verificar: `python -m app.db.seed` ejecuta dos veces sin errores ni duplicados

## 5. Frontend — Estructura y configuración de herramientas

- [x] 5.1 Crear proyecto Vite con plantilla React-TS: `npm create vite@latest frontend -- --template react-ts` y reorganizar bajo `src/`
- [x] 5.2 Crear `package.json` con todas las dependencias: react, typescript, vite, tailwindcss, zustand, @tanstack/react-query, @tanstack/react-form, axios, recharts, @mercadopago/sdk-react
- [x] 5.3 Configurar Tailwind CSS: `tailwind.config.ts` con `content` apuntando a `src/**/*.{ts,tsx}` y `postcss.config.js`
- [x] 5.4 Configurar `tsconfig.json` con `"strict": true`, sin `any` implícito, y paths alias `@/` → `src/`
- [x] 5.5 Crear estructura de carpetas FSD: `src/app/`, `src/pages/`, `src/widgets/`, `src/features/`, `src/entities/`, `src/shared/api/`, `src/shared/ui/`, `src/shared/types/`, `src/store/`

## 6. Frontend — Zustand stores

- [x] 6.1 Crear `src/store/authStore.ts` con estado (`accessToken`, `user`, `isAuthenticated`), acciones (`login`, `logout`, `updateTokens`), selector `hasRole()` y persistencia en localStorage (`food-store-auth`) solo para `accessToken`
- [x] 6.2 Crear `src/store/cartStore.ts` con tipo `CartItem`, estado `items`, acciones (`addItem` con merge si existe, `removeItem`, `updateCantidad`, `clearCart`), selectores computados (`totalItems`, `subtotal`, `costoEnvio` = 50, `total`) y persistencia completa de `items` (`food-store-cart`)
- [x] 6.3 Crear `src/store/paymentStore.ts` con estado `status`, `mpPaymentId`, `statusDetail`, acciones `setPaymentStatus()` y `reset()` — sin middleware persist
- [x] 6.4 Crear `src/store/uiStore.ts` con estado `cartOpen`, `sidebarOpen`, `confirmModal`, acciones correspondientes — sin middleware persist

## 7. Frontend — Axios y configuración base

- [x] 7.1 Crear `src/shared/api/axiosInstance.ts` con instancia Axios configurada con `baseURL` desde `import.meta.env.VITE_API_URL`
- [x] 7.2 Agregar interceptor de request que adjunta `Authorization: Bearer <token>` desde `useAuthStore.getState().accessToken`
- [x] 7.3 Agregar interceptor de response que detecta HTTP 401 y llama `POST /api/v1/auth/refresh` para renovar el token automáticamente antes de reintentar la petición original
- [x] 7.4 Crear `src/app/App.tsx` con `QueryClientProvider` de TanStack Query envolviendo el árbol de la aplicación

## 8. Verificación integral

- [x] 8.1 Verificar que `uvicorn app.main:app --reload` arranca sin errores de importación
- [x] 8.2 Verificar que Swagger UI está accesible en `http://localhost:8000/docs`
- [x] 8.3 Verificar que `npm run dev` arranca sin errores y `http://localhost:5173` carga
- [x] 8.4 Verificar que `npm run build` compila sin errores de TypeScript
- [x] 8.5 Verificar CORS: hacer request desde `http://localhost:5173` al backend y confirmar headers CORS presentes
- [x] 8.6 Confirmar que `alembic upgrade head` + `python -m app.db.seed` ejecutan de forma limpia en secuencia
