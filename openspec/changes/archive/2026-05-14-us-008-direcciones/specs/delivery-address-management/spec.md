# delivery-address-management Specification

## Purpose
CRUD de direcciones de entrega del cliente. Ownership estricto por JWT. Primera dirección es predeterminada automáticamente. Solo una predeterminada a la vez.

## Requirements

### Requirement: Crear dirección de entrega
El sistema SHALL crear una nueva `DireccionEntrega` asociada al `usuario_id` del JWT autenticado.

Si el usuario no tiene ninguna dirección activa, la nueva SHALL tener `es_principal = True` automáticamente (RN-DI01).

Si ya tiene direcciones activas, la nueva se crea con `es_principal = False`.

Campos requeridos: `calle`, `numero`, `comuna`, `ciudad`. Campos opcionales: `departamento`, `codigo_postal`.

#### Scenario: Primera dirección se marca como predeterminada
- **WHEN** un usuario sin direcciones activas crea una dirección
- **THEN** se crea con `es_principal = True` y retorna HTTP 201

#### Scenario: Dirección adicional no es predeterminada
- **WHEN** un usuario con al menos una dirección activa crea otra
- **THEN** se crea con `es_principal = False` y retorna HTTP 201

#### Scenario: Campos requeridos faltantes
- **WHEN** el request omite `calle`, `numero`, `comuna` o `ciudad`
- **THEN** retorna HTTP 422

### Requirement: Listar direcciones del usuario autenticado
El sistema SHALL retornar únicamente las direcciones activas (`deleted_at IS NULL`) del `usuario_id` del JWT. No expone direcciones de otros usuarios (RN-DI03).

La dirección predeterminada (`es_principal = True`) SHALL estar claramente identificada en el response.

#### Scenario: Cliente lista sus direcciones
- **WHEN** el usuario autenticado hace GET /api/v1/direcciones
- **THEN** recibe solo sus direcciones activas, con `es_principal` visible

#### Scenario: Usuario sin direcciones
- **WHEN** el usuario no tiene ninguna dirección activa
- **THEN** retorna HTTP 200 con lista vacía `[]`

### Requirement: Editar dirección de entrega
El sistema SHALL permitir modificar `calle`, `numero`, `departamento`, `comuna`, `ciudad`, `codigo_postal` de una dirección propia mediante PATCH parcial.

No se puede cambiar `es_principal` directamente desde este endpoint (usa el endpoint dedicado).

#### Scenario: Edición exitosa
- **WHEN** el usuario hace PATCH /api/v1/direcciones/{id} con campos válidos
- **THEN** retorna HTTP 200 con la dirección actualizada

#### Scenario: Dirección ajena o inexistente
- **WHEN** el id corresponde a una dirección de otro usuario o no existe
- **THEN** retorna HTTP 404

### Requirement: Eliminar dirección (soft delete)
El sistema SHALL realizar soft delete (`deleted_at = now()`) de una dirección propia.

Si la dirección eliminada era `es_principal = True` y el usuario tiene otras direcciones activas, el sistema SHALL asignar `es_principal = True` a la dirección activa más antigua (menor `created_at`).

#### Scenario: Eliminar dirección no predeterminada
- **WHEN** se elimina una dirección con `es_principal = False`
- **THEN** `deleted_at` se setea, las demás no cambian, retorna HTTP 204

#### Scenario: Eliminar la dirección predeterminada con otras disponibles
- **WHEN** se elimina la dirección `es_principal = True` y hay otras activas
- **THEN** la dirección activa más antigua se convierte en predeterminada; retorna HTTP 204

#### Scenario: Eliminar única dirección
- **WHEN** se elimina la única dirección activa del usuario
- **THEN** `deleted_at` se setea, ninguna queda como principal, retorna HTTP 204

#### Scenario: Dirección ajena o inexistente
- **WHEN** el id no pertenece al usuario o no existe
- **THEN** retorna HTTP 404

### Requirement: Establecer dirección predeterminada
El sistema SHALL marcar una dirección propia como `es_principal = True` y simultáneamente quitar `es_principal` de todas las demás direcciones del usuario, de forma atómica (RN-DI02).

#### Scenario: Cambiar predeterminada
- **WHEN** el usuario hace PATCH /api/v1/direcciones/{id}/predeterminada
- **THEN** la dirección indicada queda con `es_principal = True` y las demás con `es_principal = False`; retorna HTTP 200

#### Scenario: Dirección ya es predeterminada
- **WHEN** la dirección indicada ya tiene `es_principal = True`
- **THEN** retorna HTTP 200 sin cambios (idempotente)

#### Scenario: Dirección ajena o inexistente
- **WHEN** el id no pertenece al usuario o no existe
- **THEN** retorna HTTP 404
