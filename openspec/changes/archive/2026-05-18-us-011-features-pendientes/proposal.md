## Why

El sistema tiene funcionalidad de backend completa para gestión de pedidos, filtrado por alérgenos y cancelación de pedidos, pero carece de las interfaces de frontend correspondientes. El rol PEDIDOS no tiene ninguna pantalla operativa, los clientes no pueden cancelar pedidos propios, y el catálogo no expone el filtro de alérgenos ya implementado en la API.

## What Changes

- **Nueva página Gestor de Pedidos**: pantalla exclusiva para el rol PEDIDOS que lista todos los pedidos del sistema y permite avanzar su estado (CONFIRMADO → EN_CAMINO → ENTREGADO) y cancelarlos.
- **Filtro por alérgenos en el catálogo**: selector de ingredientes alérgenos en la página de catálogo que llama al parámetro `excluir_alergenos` ya disponible en la API.
- **Cancelación de pedido desde Mis Pedidos**: botón de cancelar en la vista de pedido del cliente, disponible solo cuando el pedido está en estado PENDIENTE.
- **Sidebar actualizado**: agregar entrada "Gestión de Pedidos" visible solo para los roles PEDIDOS y ADMIN.

## Capabilities

### New Capabilities

- `order-manager-ui`: Interfaz de gestión operativa de pedidos para el rol PEDIDOS — lista completa, avance de estados, cancelación con confirmación.

### Modified Capabilities

- `product-catalog`: Agregar soporte de filtrado por alérgenos en la UI del catálogo (el backend ya lo soporta).
- `order-management`: Agregar endpoint y lógica de cancelación accesible para el cliente desde PENDIENTE.

## Impact

- **Frontend**: nuevas páginas y componentes en `frontend/src/pages/` y `frontend/src/features/pedidos/`
- **Backend**: nuevo endpoint `PATCH /pedidos/{id}/estado` ya existe; puede necesitar validación de rol PEDIDOS explícita
- **Sidebar**: nuevo ítem condicional por rol
- **API**: el parámetro `excluir_alergenos` ya existe en `GET /productos/catalog`
