## ADDED Requirements

### Requirement: Gestor de pedidos — lista completa
El sistema SHALL mostrar una página `GestorPedidosPage` accesible para roles PEDIDOS y ADMIN que lista todos los pedidos del sistema con paginación.

#### Scenario: Acceso con rol PEDIDOS
- **WHEN** un usuario con rol PEDIDOS navega a `/gestor-pedidos`
- **THEN** ve la lista de todos los pedidos con columnas: cliente, dirección, estado, total, fecha, y botones de acción

#### Scenario: Acceso denegado a CLIENT
- **WHEN** un usuario con rol CLIENT intenta acceder a `/gestor-pedidos`
- **THEN** es redirigido o ve un mensaje de acceso denegado

#### Scenario: Paginación
- **WHEN** hay más de 10 pedidos
- **THEN** se muestran controles de paginación funcionales

---

### Requirement: Gestor de pedidos — avance de estado
El sistema SHALL permitir avanzar el estado de un pedido desde la vista del gestor.

#### Scenario: Avanzar CONFIRMADO → EN_CAMINO
- **WHEN** el gestor hace click en "En camino" sobre un pedido CONFIRMADO
- **THEN** el pedido pasa a EN_CAMINO y la fila se actualiza sin recargar la página

#### Scenario: Avanzar EN_CAMINO → ENTREGADO
- **WHEN** el gestor hace click en "Entregado" sobre un pedido EN_CAMINO
- **THEN** el pedido pasa a ENTREGADO y el botón de acción desaparece (estado terminal)

#### Scenario: Pedido en estado terminal no tiene acciones de avance
- **WHEN** un pedido está en estado ENTREGADO o CANCELADO
- **THEN** no se muestran botones de avance de estado

---

### Requirement: Gestor de pedidos — cancelación
El sistema SHALL permitir cancelar pedidos desde la vista del gestor.

#### Scenario: Cancelar desde CONFIRMADO
- **WHEN** el gestor hace click en "Cancelar" sobre un pedido CONFIRMADO y confirma el diálogo
- **THEN** el pedido pasa a CANCELADO y la fila se actualiza

#### Scenario: Confirmación antes de cancelar
- **WHEN** el gestor hace click en "Cancelar"
- **THEN** se muestra un diálogo de confirmación antes de ejecutar la acción

---

### Requirement: Sidebar — entrada Gestión de Pedidos
El sistema SHALL mostrar una entrada "Gestión de Pedidos" en el sidebar visible únicamente para roles PEDIDOS y ADMIN.

#### Scenario: Visible para PEDIDOS y ADMIN
- **WHEN** el usuario tiene rol PEDIDOS o ADMIN
- **THEN** ve la entrada "Gestión de Pedidos" en el sidebar bajo la sección "Gestión"

#### Scenario: Oculta para CLIENT
- **WHEN** el usuario tiene solo rol CLIENT
- **THEN** la entrada "Gestión de Pedidos" no aparece en el sidebar
