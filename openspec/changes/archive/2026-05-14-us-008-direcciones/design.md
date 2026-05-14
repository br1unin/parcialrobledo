## Context

El modelo `DireccionEntrega` ya existe en el scaffold (`app/modules/direcciones/model.py`) con campos: `id`, `usuario_id`, `calle`, `numero`, `departamento` (nullable), `comuna`, `ciudad`, `codigo_postal` (nullable), `es_principal` (bool), `deleted_at`, `created_at`, `updated_at`. No hay repository, schemas, service ni router todavía.

Reglas de negocio clave:
- **RN-DI01**: Primera dirección de un usuario → `es_principal = True` automáticamente
- **RN-DI02**: Solo una dirección puede ser `es_principal` a la vez (transacción: unset all + set one)
- **RN-DI03**: Ownership estricto — `usuario_id` del modelo debe coincidir con `id` del JWT; 404 si no existe o no es del usuario

## Goals / Non-Goals

**Goals**:
- CRUD completo con ownership por JWT
- `es_principal` auto-gestionado (primera = true, al eliminar la principal → buscar siguiente)
- Soft delete (deleted_at)

**Non-Goals**:
- ADMIN no gestiona direcciones ajenas en este módulo (eso es admin panel, us-007)
- Validación de dirección contra API externa (no en scope)
- Dirección embebida en pedido (snapshot, us-005)

## Decisions

### D1: Ownership via JWT en service, no en query filter
El servicio recibe `current_user.id` y valida `direccion.usuario_id == current_user.id`. Si no coincide, lanza 404 (no 403) para no revelar existencia de recursos ajenos.

### D2: es_principal auto al crear primera dirección
En `create_direccion`: si el usuario no tiene ninguna dirección activa, la nueva se crea con `es_principal=True`. Si ya tiene, `es_principal=False`.

### D3: set_predeterminada como operación atómica
`PATCH /{id}/predeterminada` ejecuta en la misma sesión:
1. `UPDATE direccion_entrega SET es_principal=False WHERE usuario_id=? AND deleted_at IS NULL`
2. `UPDATE direccion_entrega SET es_principal=True WHERE id=?`

### D4: Al eliminar la principal, promover la más antigua
Si `deleted_direccion.es_principal == True` y el usuario tiene otras direcciones activas, se asigna `es_principal=True` a la de menor `created_at`. Si no hay otras, no se hace nada.

### D5: Router prefix `/api/v1/direcciones`, auth obligatoria en todos los endpoints
No hay endpoints públicos — todas las rutas requieren `get_current_user`. No se usa `require_role` porque cualquier usuario autenticado puede tener direcciones, pero el ownership garantiza el aislamiento.

## Risks / Trade-offs

- [Race condition en set_predeterminada] Dos requests simultáneos podrían dejar dos principales. → Mitigación: la operación es atómica en una sola sesión; riesgo aceptable en v1.
- [Soft delete + FK en Pedido] Un pedido tiene FK a `direccion_entrega_id` pero también guarda snapshot. Si la dirección se elimina lógicamente, el pedido sigue apuntando a ella pero los datos están en el snapshot. → Correcto por diseño (RN-DA06).

## Migration Plan

Sin migraciones nuevas — tabla ya existe desde `0001_initial`.

## Open Questions

Ninguna.
