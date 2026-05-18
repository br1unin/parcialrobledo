## Context

El backend de pedidos está completo: FSM con transiciones `CONFIRMADO → EN_CAMINO → ENTREGADO`, cancelación con validación por rol, y endpoint `GET /pedidos/` que ya discrimina por rol (CLIENT ve solo los suyos, otros ven todos). El catálogo soporta `?excluir_alergenos=uuid1,uuid2`. Lo que falta es exclusivamente superficie de frontend.

Estado actual del FSM:
```
PENDIENTE ──(pago aprobado)──▶ CONFIRMADO ──▶ EN_CAMINO ──▶ ENTREGADO
    │                               │
    └──(cliente/gestor/admin)       └──(gestor/admin)
         CANCELADO ◀────────────────┘
```

## Goals / Non-Goals

**Goals:**
- Página `GestorPedidosPage` para rol PEDIDOS/ADMIN: lista todos los pedidos, avanza estados, cancela
- Filtro de alérgenos en el catálogo: multiselect de ingredientes marcados `es_alergeno=true`
- Botón cancelar en `MisPedidosPage` / `PedidoDetailPage` para clientes en estado PENDIENTE
- Entrada en sidebar visible para PEDIDOS y ADMIN

**Non-Goals:**
- Agregar estado EN_PREPARACION (no existe en el seed ni en la FSM actual — cambio de modelo)
- Notificaciones en tiempo real (requiere WebSocket)
- Cambiar contraseña (queda fuera de este change)

## Decisions

**1. Gestor de pedidos como página nueva, no reutilizar MisPedidosPage**

`MisPedidosPage` está pensada para el cliente (solo sus pedidos, vista compacta). El gestor necesita columnas distintas (cliente, dirección, método de pago), acciones de avance de estado, y paginación pensada para volumen. Componente separado evita contaminar la vista del cliente.

**2. Filtro de alérgenos con multiselect de chips, no dropdown**

Consistente con los filtros de categoría ya implementados como chips. La API ya recibe `excluir_alergenos` como string CSV de UUIDs — el frontend construye ese string desde la selección.

**3. Cancelación desde el cliente sin nuevo endpoint**

El endpoint `PATCH /{id}/estado` con `nuevo_estado: "CANCELADO"` ya valida que CLIENT solo puede cancelar desde PENDIENTE. No se necesita endpoint nuevo — solo exponer el botón en la UI con la llamada correcta.

**4. Ingredientes alérgenos se cargan una sola vez al montar el catálogo**

`GET /ingredientes?es_alergeno=true` — lista corta, no pagina. Se cachea en React Query con `staleTime` alto para no re-fetchear en cada filtro.

## Risks / Trade-offs

- [Riesgo] El endpoint de avance de estado no valida explícitamente rol PEDIDOS para avanzar (solo para cancelar confirmado) → el gestor puede avanzar estados aunque no tenga rol correcto en backend. **Mitigación**: agregar `require_role(["PEDIDOS", "ADMIN"])` al endpoint `PATCH /estado` en backend.
- [Trade-off] Chips de alérgenos en el catálogo agregan ruido visual si hay muchos ingredientes → limitar a los 8-10 más comunes o colapsar en un desplegable si hay más de 6.
- [Riesgo] Cliente ve botón cancelar y lo presiona en un pedido ya en preparación → el backend lo rechaza con 422. **Mitigación**: ocultar el botón si el estado no es PENDIENTE (ya resuelto por condición en UI).
