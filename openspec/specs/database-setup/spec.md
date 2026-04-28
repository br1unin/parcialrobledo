# database-setup Specification

## Purpose
TBD - created by archiving change us-000-setupcontexto. Update Purpose after archive.
## Requirements
### Requirement: Configuración de Alembic funcional
El sistema SHALL tener Alembic configurado con `alembic.ini` y `app/db/migrations/env.py` que importe `SQLModel.metadata` y soporte migraciones async con `asyncpg`.

`env.py` DEBE:
- Importar `SQLModel` y todos los modelos del proyecto para que Alembic los detecte
- Usar `run_async_migrations()` con `AsyncEngine`
- Configurar `compare_type=True` en el contexto de migración

#### Scenario: Comando upgrade head exitoso en BD vacía
- **WHEN** la base de datos PostgreSQL existe y está vacía, y se ejecuta `alembic upgrade head`
- **THEN** todas las tablas se crean sin errores y la tabla `alembic_version` registra la revisión actual

#### Scenario: Comando downgrade revierte la migración
- **WHEN** se ejecuta `alembic downgrade -1` después de `alembic upgrade head`
- **THEN** las tablas creadas en la migración inicial son eliminadas

### Requirement: Migración inicial con schema ERD v5
El sistema SHALL tener una migración inicial `0001_initial` que cree todas las tablas definidas en el ERD v5 de Food Store.

Tablas que DEBEN existir después de `alembic upgrade head`:
- `usuario` (con `deleted_at`, `created_at`, `updated_at`)
- `rol` (tabla catálogo, PK semántica `codigo`)
- `usuario_rol` (pivot N:M con PK compuesta)
- `refresh_token` (con `token_hash`, `expires_at`, `revoked_at`)
- `direccion_entrega` (con `es_principal`, soft-delete)
- `categoria` (con `parent_id` auto-referencial, soft-delete)
- `producto` (con `stock_cantidad`, `disponible`, `deleted_at`)
- `ingrediente` (con `es_alergeno`)
- `producto_categoria` (pivot N:M)
- `producto_ingrediente` (con `es_removible`)
- `forma_pago` (tabla catálogo, PK semántica `codigo`)
- `estado_pedido` (tabla catálogo, PK semántica `codigo`, `es_terminal`)
- `pedido` (con snapshots, `costo_envio`, soft-delete)
- `detalle_pedido` (con `nombre_snapshot`, `precio_snapshot`, `personalizacion INTEGER[]`)
- `historial_estado_pedido` (append-only, sin `updated_at`)
- `pago` (con `mp_payment_id`, `mp_status`, `external_reference`, `idempotency_key`)

#### Scenario: Todas las tablas ERD v5 existen post-migración
- **WHEN** se ejecuta `alembic upgrade head` en BD vacía
- **THEN** las 16 tablas listadas existen en el schema público de PostgreSQL

#### Scenario: Tabla historial sin updated_at
- **WHEN** se inspecciona la tabla `historial_estado_pedido`
- **THEN** no existe la columna `updated_at` (solo `created_at` — append-only)

#### Scenario: personalizacion es tipo ARRAY de INTEGER
- **WHEN** se inspecciona la columna `personalizacion` de `detalle_pedido`
- **THEN** el tipo de dato es `INTEGER[]` (array de PostgreSQL)

### Requirement: Script de seed data
El sistema SHALL proveer un script `app/db/seed.py` ejecutable como módulo (`python -m app.db.seed`) que inserte los datos catálogo iniciales de forma idempotente.

Datos que DEBEN insertarse:

**Roles** (tabla `rol`):
| codigo | nombre | descripcion |
|--------|--------|-------------|
| ADMIN | Administrador | Acceso total al sistema |
| STOCK | Gestor de Stock | Gestión de inventario y catálogo |
| PEDIDOS | Gestor de Pedidos | Gestión del flujo operativo de pedidos |
| CLIENT | Cliente | Usuario final de la tienda |

**EstadoPedido** (tabla `estado_pedido`):
| codigo | descripcion | orden | es_terminal |
|--------|-------------|-------|-------------|
| PENDIENTE | Pedido creado, pago pendiente | 1 | false |
| CONFIRMADO | Pago procesado y confirmado | 2 | false |
| EN_PREP | En preparación en cocina | 3 | false |
| EN_CAMINO | Despachado al cliente | 4 | false |
| ENTREGADO | Entrega confirmada | 5 | true |
| CANCELADO | Pedido cancelado | 6 | true |

**FormaPago** (tabla `forma_pago`):
| codigo | nombre | habilitado |
|--------|--------|-----------|
| MERCADOPAGO | MercadoPago | true |
| EFECTIVO | Efectivo | true |
| TRANSFERENCIA | Transferencia bancaria | true |

**Usuario admin** (tabla `usuario` + `usuario_rol`):
| campo | valor |
|-------|-------|
| nombre | Admin |
| apellido | FoodStore |
| email | admin@foodstore.com |
| password | Admin1234! (hasheado con bcrypt cost≥12) |
| rol | ADMIN |

El script DEBE ser idempotente: si los registros ya existen, no falla ni duplica.

#### Scenario: Seed exitoso en BD recién migrada
- **WHEN** se ejecuta `python -m app.db.seed` después de `alembic upgrade head`
- **THEN** los 4 roles, 6 estados, 3 formas de pago y 1 usuario admin existen en la BD

#### Scenario: Seed idempotente
- **WHEN** se ejecuta `python -m app.db.seed` dos veces consecutivas
- **THEN** la segunda ejecución no falla ni duplica registros

#### Scenario: Usuario admin puede hacer login
- **WHEN** se envía `POST /api/v1/auth/login` con `email: "admin@foodstore.com"` y `password: "Admin1234!"`
- **THEN** el servidor retorna HTTP 200 con access token (este escenario se verifica en la US de auth)

