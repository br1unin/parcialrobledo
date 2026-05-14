## Context

`cartStore` y `uiStore` ya están implementados en `frontend/src/store/`. El catálogo público (`/catalogo`) muestra productos pero no tiene acción de "agregar al carrito". El `uiStore` ya expone `cartOpen`, `openCart()`, `closeCart()` listos para conectar al drawer. La personalización (exclusión de ingredientes) se representa como `personalizacion: number[]` (IDs de ingredientes excluidos).

## Goals / Non-Goals

**Goals**:
- Permitir al usuario agregar productos al carrito con cantidad y exclusiones desde el catálogo
- Mostrar carrito como drawer lateral accesible en todo momento
- Página `/carrito` como vista completa alternativa
- Badge en nav con conteo de ítems
- Persistencia ya garantizada por `cartStore` — no hay nada extra a implementar

**Non-Goals**:
- Checkout/pago (us-005, us-006)
- Validación de stock real al agregar (el stock se valida en backend al crear pedido)
- Backend endpoints — el carrito es 100% client-side

## Decisions

### D1: ProductoDetailModal como punto de entrada para agregar al carrito
El `ProductoCard` muestra un botón "Agregar"; al hacer click abre un modal que muestra nombre, precio, descripción, ingredientes con checkboxes de exclusión, y selector de cantidad. Al confirmar llama `cartStore.addItem()`.

**Alternativa descartada**: Botón directo en la card sin modal — no permite personalizar ingredientes (RN-CR04).

### D2: CartDrawer se controla vía uiStore
El drawer ya está previsto: `uiStore.cartOpen` + `uiStore.openCart/closeCart`. El icono en la barra de navegación llama `openCart()`. No se usa estado local para el drawer.

### D3: Estructura de carpetas — `features/carrito/ui/`
Componentes: `CartDrawer.tsx`, `CartItemRow.tsx`, `ProductoDetailModal.tsx`. La página `CarritoPage.tsx` vive en `pages/`.

### D4: Ingredientes en el modal vienen del producto ya cargado
`ProductoCard` recibe el `Producto` completo (con `ingredientes[]`). El modal usa esos datos directamente — sin fetch adicional. Solo se muestran ingredientes con `es_removible: true` como seleccionables para exclusión.

### D5: `personalizacion` como string serializado para unicidad del ítem
El `cartStore` ya usa `JSON.stringify(personalizacion)` para comparar ítems. Si el mismo producto se agrega con diferente personalización, crea un ítem separado. Esto es correcto según RN-CR03 (que habla de mismo producto sin personalización diferente).

## Risks / Trade-offs

- [No-auth carrito] El carrito persiste sin autenticación (localStorage). → Aceptado por diseño (RN-CR01, RN-CR02).
- [Stock stale] El stock mostrado en catálogo puede desincronizarse entre cuando el usuario lo ve y cuando crea el pedido. → Mitigación: la creación del pedido valida stock con SELECT FOR UPDATE (us-005).

## Migration Plan

Sin backend. Todos los cambios son frontend-only. No hay migración de datos. El `localStorage` existente de `food-store-cart` es backward-compatible con la nueva UI.

## Open Questions

Ninguna — diseño completamente derivable del estado actual del store y los user stories.
