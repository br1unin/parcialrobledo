## Why

El catálogo de productos (us-003) está operativo pero el usuario no tiene forma de seleccionar productos, personalizar exclusiones de ingredientes, ni revisar su carrito antes de continuar al checkout. El `cartStore` y el `uiStore` ya existen con la lógica completa; falta toda la capa de UI.

## What Changes

- Nuevo componente `CartDrawer` que se abre desde `uiStore.openCart()`, muestra ítems, permite cambiar cantidad, eliminar y vaciar
- Nuevo componente `ProductoDetailModal` que se abre al hacer click en un `ProductoCard`, permite seleccionar cantidad y marcar exclusiones de ingredientes, y llama a `cartStore.addItem()`
- `ProductoCard` recibe un botón "Agregar" que abre el `ProductoDetailModal`
- Nueva página `/carrito` (`CarritoPage`) con vista completa del carrito (alternativa al drawer)
- Icono de carrito con badge en la barra de navegación; al hacer click abre el `CartDrawer`
- Link al carrito en `HomePage` para usuarios CLIENT

## Capabilities

### New Capabilities
- `cart-ui`: Capa de interfaz de usuario del carrito — drawer lateral, modal de detalle de producto, página de carrito, badge de items en navegación

### Modified Capabilities
<!-- ninguna — cartStore y uiStore ya están implementados y sus specs son correctas -->

## Impact

- Frontend únicamente — sin cambios de backend ni migraciones
- Archivos afectados: `router.tsx`, `ProductoCard.tsx`, nueva página `CarritoPage.tsx`, nuevos componentes bajo `features/carrito/ui/`
- Dependencias: `cartStore`, `uiStore` (ya existen); `productosApi` (ya existe)
- No se requieren nuevas dependencias npm
