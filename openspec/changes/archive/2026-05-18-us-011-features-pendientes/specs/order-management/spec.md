## ADDED Requirements

### Requirement: Cancelación de pedido por el cliente
El sistema SHALL permitir que un CLIENT cancele su propio pedido cuando está en estado PENDIENTE.

#### Scenario: Cancelación exitosa desde PENDIENTE
- **WHEN** un CLIENT autenticado llama `PATCH /api/v1/pedidos/{id}/estado` con `nuevo_estado: "CANCELADO"` sobre un pedido propio en estado PENDIENTE
- **THEN** el pedido pasa a CANCELADO, se registra en HistorialEstadoPedido, y el sistema retorna 200 con el pedido actualizado

#### Scenario: Cancelación bloqueada desde CONFIRMADO por CLIENT
- **WHEN** un CLIENT intenta cancelar un pedido en estado CONFIRMADO
- **THEN** el sistema retorna 403 Forbidden

#### Scenario: Botón cancelar visible en MisPedidosPage
- **WHEN** el cliente ve un pedido propio en estado PENDIENTE
- **THEN** se muestra un botón "Cancelar pedido" con diálogo de confirmación

#### Scenario: Botón cancelar oculto en otros estados
- **WHEN** el pedido está en estado CONFIRMADO, EN_CAMINO, ENTREGADO o CANCELADO
- **THEN** el botón de cancelar no aparece en la vista del cliente

---

### Requirement: Protección de endpoint de cambio de estado por rol
El sistema SHALL restringir el endpoint `PATCH /pedidos/{id}/estado` a usuarios autenticados con roles autorizados.

#### Scenario: Avance de estado rechazado para CLIENT
- **WHEN** un CLIENT intenta avanzar el estado de un pedido a EN_CAMINO o ENTREGADO
- **THEN** el sistema retorna 403 Forbidden

#### Scenario: Avance de estado permitido para PEDIDOS y ADMIN
- **WHEN** un usuario con rol PEDIDOS o ADMIN avanza el estado de un pedido dentro de las transiciones válidas
- **THEN** el sistema acepta la transición y retorna 200
