## 1. Backend — Protección de endpoint de cambio de estado

- [x] 1.1 Agregar `require_role(["CLIENT", "PEDIDOS", "ADMIN"])` al endpoint `PATCH /pedidos/{id}/estado` en `app/modules/pedidos/router.py`
- [x] 1.2 Verificar en `service.advance_estado` que CLIENT solo puede transicionar a CANCELADO desde PENDIENTE (ya implementado, confirmar cobertura)

## 2. Backend — Ingredientes: endpoint con filtro de alérgenos

- [x] 2.1 Verificar que `GET /api/v1/ingredientes` acepta parámetro `es_alergeno=true` y lo filtra correctamente
- [x] 2.2 Si no existe el filtro, agregarlo en `app/modules/ingredientes/router.py` y `service.py`

## 3. Frontend — Cancelación de pedido (cliente)

- [x] 3.1 Agregar botón "Cancelar pedido" en `MisPedidosPage.tsx` visible solo cuando `estado === 'PENDIENTE'`
- [x] 3.2 Al hacer click, abrir modal de confirmación usando `useUIStore.openConfirmModal`
- [x] 3.3 Al confirmar, llamar `PATCH /api/v1/pedidos/{id}/estado` con `{ nuevo_estado: "CANCELADO" }` via `pedidosApi`
- [x] 3.4 Agregar método `updateEstado(pedidoId, nuevoEstado)` en `frontend/src/features/pedidos/api.ts` si no existe
- [x] 3.5 Refrescar la lista de pedidos después de cancelar (invalidar React Query cache)

## 4. Frontend — Filtro por alérgenos en el catálogo

- [x] 4.1 Agregar función `listAlergenos()` en `frontend/src/features/ingredientes/api.ts` que llama `GET /api/v1/ingredientes?es_alergeno=true`
- [x] 4.2 Cargar la lista de alérgenos en `ProductoCatalogPage` con `useEffect` (una sola vez al montar)
- [x] 4.3 Agregar estado `excluirAlergenos: string[]` en `ProductoCatalogPage`
- [x] 4.4 Renderizar chips de alérgenos debajo de los chips de categoría (solo si hay alérgenos disponibles)
- [x] 4.5 Al seleccionar/deseleccionar un chip, actualizar `excluirAlergenos` y resetear a `page = 1`
- [x] 4.6 Pasar `excluir_alergenos` como parámetro CSV al llamar `productosApi.list()`
- [x] 4.7 Diferenciar visualmente los chips de alérgenos (color rojo/amber) para distinguirlos de los de categoría

## 5. Frontend — Página Gestor de Pedidos

- [x] 5.1 Crear `frontend/src/pages/GestorPedidosPage.tsx` con tabla/lista de todos los pedidos
- [x] 5.2 Mostrar columnas: nro. de pedido, cliente (nombre snapshot), estado (badge de color), total, fecha, acciones
- [x] 5.3 Implementar paginación usando el mismo patrón que `MisPedidosPage`
- [x] 5.4 Agregar badge de color por estado: PENDIENTE (amarillo), CONFIRMADO (azul), EN_CAMINO (naranja), ENTREGADO (verde), CANCELADO (rojo)
- [x] 5.5 Agregar botón de acción contextual según estado:
  - CONFIRMADO → botón "En camino"
  - EN_CAMINO → botón "Entregado"
  - ENTREGADO / CANCELADO → sin botón
- [x] 5.6 Agregar botón "Cancelar" visible para CONFIRMADO (con confirmación)
- [x] 5.7 Al hacer click en acción, llamar `pedidosApi.updateEstado()` e invalidar cache

## 6. Frontend — Router y Sidebar

- [x] 6.1 Agregar ruta `/gestor-pedidos` en `frontend/src/app/router.tsx` protegida para roles PEDIDOS y ADMIN
- [x] 6.2 Agregar entrada "Gestión de Pedidos" en `Sidebar.tsx` bajo la sección "Gestión", visible solo para `isPedidosOrAdmin`
- [x] 6.3 Agregar ícono adecuado para la entrada del sidebar (usar ícono de lista/clipboard de Heroicons)

## 7. Verificación

- [x] 7.1 Login como CLIENT: verificar que puede cancelar pedido en PENDIENTE y que el botón no aparece en otros estados
- [x] 7.2 Login como admin: verificar que el filtro de alérgenos aparece en el catálogo y filtra correctamente
- [x] 7.3 Login como admin: navegar a `/gestor-pedidos`, avanzar un pedido de CONFIRMADO a EN_CAMINO y luego a ENTREGADO
- [x] 7.4 Verificar que la ruta `/gestor-pedidos` no es accesible con rol CLIENT
