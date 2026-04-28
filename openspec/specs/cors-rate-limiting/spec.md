# cors-rate-limiting Specification

## Purpose
TBD - created by archiving change us-000-setupcontexto. Update Purpose after archive.
## Requirements
### Requirement: CORS configurado con CORSMiddleware
El sistema SHALL tener `CORSMiddleware` de Starlette configurado en `app/main.py` usando la lista de orígenes definida en la variable de entorno `CORS_ORIGINS`.

Configuración mínima:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # list[str] desde .env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`settings.CORS_ORIGINS` DEBE ser de tipo `list[str]` y parsearse automáticamente desde la variable de entorno `CORS_ORIGINS` (JSON array o string separado por coma).

Valor de desarrollo: `["http://localhost:5173"]`

#### Scenario: Request desde origen permitido no es bloqueado por CORS
- **WHEN** el frontend en `http://localhost:5173` hace una petición a `http://localhost:8000/api/v1/productos`
- **THEN** la respuesta incluye el header `Access-Control-Allow-Origin: http://localhost:5173` y no es bloqueada por el browser

#### Scenario: Preflight OPTIONS responde correctamente
- **WHEN** el browser envía un preflight `OPTIONS` con `Origin: http://localhost:5173`
- **THEN** el servidor responde HTTP 200 con los headers CORS apropiados

#### Scenario: Request desde origen no permitido es bloqueado
- **WHEN** una petición proviene de `http://evil.com` que no está en `CORS_ORIGINS`
- **THEN** la respuesta NO incluye `Access-Control-Allow-Origin` para ese origen

#### Scenario: CORS_ORIGINS configurable por entorno
- **WHEN** se define `CORS_ORIGINS=["https://foodstore.com","https://www.foodstore.com"]` en producción
- **THEN** solo esos orígenes son permitidos sin modificar el código

### Requirement: Rate limiting con slowapi para endpoint de login
El sistema SHALL tener `slowapi.Limiter` configurado globalmente en `app/main.py` listo para ser aplicado con el decorador `@limiter.limit()` en el router de autenticación.

Configuración requerida:
- `limiter = Limiter(key_func=get_remote_address)` en `app/core/config.py` o `app/main.py`
- `app.state.limiter = limiter` montado en la aplicación FastAPI
- `app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)` registrado

El decorador `@limiter.limit("5/15minutes")` se aplica sobre el endpoint `POST /api/v1/auth/login` en el router de auth (implementado en la US de autenticación).

#### Scenario: Limiter montado en app.state
- **WHEN** la aplicación FastAPI arranca
- **THEN** `app.state.limiter` es una instancia de `slowapi.Limiter` con `key_func=get_remote_address`

#### Scenario: Superación del límite retorna HTTP 429
- **WHEN** una misma IP realiza 6 peticiones a `POST /api/v1/auth/login` en menos de 15 minutos
- **THEN** la sexta petición recibe HTTP 429 Too Many Requests con header `Retry-After`

#### Scenario: Límite se aplica por IP
- **WHEN** dos IPs distintas realizan 5 peticiones cada una al endpoint de login
- **THEN** ambas reciben HTTP 200 (o el error de credenciales) sin verse afectadas mutuamente por el rate limit

### Requirement: Settings centralizado con Pydantic BaseSettings
El sistema SHALL tener una clase `Settings` en `app/core/config.py` que cargue todas las variables de entorno del proyecto usando `pydantic-settings`.

Variables MUST estar definidas en `Settings`:
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `DATABASE_URL` | `str` | Conexión a PostgreSQL |
| `SECRET_KEY` | `str` | Clave para firmar JWT (mín. 32 chars) |
| `ALGORITHM` | `str` | Algoritmo JWT (default: `"HS256"`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | Expiración access token (default: `30`) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `int` | Expiración refresh token (default: `7`) |
| `CORS_ORIGINS` | `list[str]` | Orígenes CORS permitidos |
| `MP_ACCESS_TOKEN` | `str` | Token MercadoPago backend |
| `MP_PUBLIC_KEY` | `str` | Clave pública MercadoPago |
| `MP_NOTIFICATION_URL` | `str` | URL webhook IPN de MercadoPago |

Se DEBE proveer un archivo `.env.example` con todas las variables documentadas y valores de ejemplo.

#### Scenario: Aplicación falla con error descriptivo si falta variable obligatoria
- **WHEN** la aplicación arranca sin `DATABASE_URL` definida en el entorno
- **THEN** Pydantic lanza `ValidationError` con un mensaje claro indicando qué variable falta

#### Scenario: .env.example cubre todas las variables de Settings
- **WHEN** se compara `.env.example` con los campos de `Settings`
- **THEN** cada campo de `Settings` tiene una entrada correspondiente en `.env.example`

