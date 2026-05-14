## Why

El módulo de pedidos (us-005) requiere que el cliente seleccione una dirección de entrega al crear un pedido. Sin este módulo no es posible avanzar al checkout. Además, los clientes necesitan gestionar sus propias direcciones de forma autónoma.

## What Changes

- Nuevo módulo backend `app/modules/direcciones/` con repository, schemas, service y router
- CRUD completo: crear, listar, editar, eliminar (soft), marcar predeterminada
- Propiedad `direcciones` agregada a `UnitOfWork`
- Router registrado en `app/main.py` en `/api/v1/direcciones`
- Frontend: feature `direcciones` con formulario, lista y página `/mis-direcciones`

## Capabilities

### New Capabilities
- `delivery-address-management`: CRUD de direcciones de entrega del cliente — crear, listar, editar, soft-delete, marcar predeterminada

### Modified Capabilities
<!-- ninguna -->

## Impact

- Backend: `app/modules/direcciones/` (4 archivos nuevos), `app/core/uow.py` (+1 property), `app/main.py` (+1 router)
- Frontend: `frontend/src/features/direcciones/` (types, api, ui), `frontend/src/pages/DireccionesPage.tsx`, `router.tsx` (+1 ruta `/mis-direcciones`)
- Sin migraciones nuevas — tabla `direccion_entrega` ya existe en 0001_initial
- Depende de: auth (JWT para ownership), modelo `DireccionEntrega` (scaffold)
