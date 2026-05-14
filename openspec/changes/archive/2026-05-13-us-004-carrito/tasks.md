# Tasks: us-004-carrito

## Frontend — Cart Feature Components

- [x] Create `frontend/src/features/carrito/ui/ProductoDetailModal.tsx` — modal con nombre, precio, descripción, checkboxes de ingredientes removibles (es_removible=true), selector de cantidad (min 1), botón "Agregar al carrito" que llama `cartStore.addItem({ productoId, nombre, precio, cantidad, imagenUrl, personalizacion })` y cierra el modal
- [x] Create `frontend/src/features/carrito/ui/CartItemRow.tsx` — fila de ítem en carrito: imagen (o placeholder), nombre, exclusiones si las hay, controles +/- de cantidad, botón eliminar, subtotal del ítem
- [x] Create `frontend/src/features/carrito/ui/CartDrawer.tsx` — panel lateral derecho controlado por `uiStore.cartOpen`; renderiza lista de `CartItemRow`, vaciar carrito con confirmación via `uiStore.openConfirmModal`, muestra subtotal + costo de envío ($50.00) + total; si vacío muestra mensaje + link a `/catalogo`
- [x] Create `frontend/src/features/carrito/ui/CartIcon.tsx` — icono de carrito (SVG o emoji) con badge `cartStore.totalItems()` superpuesto; al click llama `uiStore.openCart()`

## Frontend — Pages and Routing

- [x] Create `frontend/src/pages/CarritoPage.tsx` — vista completa del carrito: lista de ítems con `CartItemRow`, vaciar, totales, botón "Ir al checkout" (si no autenticado redirige a `/login`, si autenticado lo muestra habilitado — funcionalidad de checkout se implementa en us-005)
- [x] Add route `/carrito` in `frontend/src/app/router.tsx` → `<CarritoPage />` (ruta pública)
- [x] Add `<CartDrawer />` render in `frontend/src/app/router.tsx` or `App.tsx` outside of `<Routes>` so it's always mounted
- [x] Add `<CartIcon />` in `HomePage` navigation bar and update `ProductoCard` to accept `onAgregar` callback (or handle internally) that opens `ProductoDetailModal`
- [x] Update `ProductoCard.tsx` — add "Agregar" button (disabled if `!disponible || stock_cantidad === 0`); clicking opens `ProductoDetailModal` with the producto
- [x] Add link to `/carrito` in `HomePage` nav for all users
