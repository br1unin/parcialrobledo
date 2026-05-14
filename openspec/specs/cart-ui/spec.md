# cart-ui Specification

## Purpose
Capa de interfaz de usuario del carrito de compras: drawer lateral, modal de detalle/personalización de producto, página de carrito, y badge de navegación. Puramente frontend — sin endpoints de backend.

## Requirements

### Requirement: ProductoDetailModal permite agregar al carrito con personalización
Al hacer click en "Agregar" en un ProductoCard, el sistema SHALL mostrar un modal con los detalles del producto, un selector de cantidad y checkboxes de exclusión de ingredientes removibles.

El modal SHALL llamar a `cartStore.addItem()` con `{ productoId, nombre, precio, cantidad, imagenUrl, personalizacion }` donde `personalizacion` es el array de IDs de ingredientes excluidos.

Solo los ingredientes con `es_removible: true` SHALL mostrarse como opciones de exclusión.

#### Scenario: Abrir modal desde ProductoCard
- **WHEN** el usuario hace click en el botón "Agregar" de un ProductoCard
- **THEN** se muestra el modal con nombre, precio, descripción, ingredientes removibles (checkboxes), y selector de cantidad (mínimo 1)

#### Scenario: Agregar sin personalización
- **WHEN** el usuario confirma sin marcar exclusiones
- **THEN** `cartStore.addItem()` se llama con `personalizacion: []`

#### Scenario: Agregar con exclusiones seleccionadas
- **WHEN** el usuario marca 2 ingredientes y confirma
- **THEN** `cartStore.addItem()` se llama con `personalizacion: [id1, id2]`

#### Scenario: Producto no disponible
- **WHEN** `producto.disponible === false` o `stock_cantidad === 0`
- **THEN** el botón "Agregar" en ProductoCard está deshabilitado y el modal no se abre

### Requirement: CartDrawer muestra el contenido del carrito como panel lateral
El sistema SHALL proveer un componente `CartDrawer` que se muestra cuando `uiStore.cartOpen === true`. El drawer SHALL mostrar todos los ítems del carrito, controles de cantidad, botón de eliminar, subtotal, costo de envío y total.

#### Scenario: Abrir y cerrar drawer
- **WHEN** `uiStore.openCart()` es llamado
- **THEN** el drawer se muestra desde el lado derecho con los ítems actuales del carrito
- **WHEN** `uiStore.closeCart()` es llamado o el usuario hace click fuera
- **THEN** el drawer se cierra

#### Scenario: Carrito vacío en drawer
- **WHEN** `cartStore.items` es `[]`
- **THEN** el drawer muestra "Tu carrito está vacío" y un link al catálogo

#### Scenario: Cambiar cantidad en drawer
- **WHEN** el usuario cambia la cantidad de un ítem (input numérico o +/-)
- **THEN** `cartStore.updateCantidad(productoId, nuevaCantidad)` es llamado y el subtotal se recalcula
- **WHEN** la cantidad llega a 0
- **THEN** el ítem se elimina (comportamiento ya en updateCantidad del store)

#### Scenario: Eliminar ítem del drawer
- **WHEN** el usuario hace click en el botón eliminar de un ítem
- **THEN** `cartStore.removeItem(productoId)` es llamado y el ítem desaparece del drawer

#### Scenario: Vaciar carrito desde drawer
- **WHEN** el usuario hace click en "Vaciar carrito"
- **THEN** se muestra confirmación; al confirmar `cartStore.clearCart()` es llamado

#### Scenario: Total en drawer
- **WHEN** el drawer está abierto con ítems
- **THEN** se muestra: subtotal, costo de envío ($50.00), y total final con 2 decimales

### Requirement: Icono de carrito en navegación con badge
El sistema SHALL mostrar un icono de carrito en la barra de navegación/header con un badge que indica el número total de ítems (`cartStore.totalItems()`).

#### Scenario: Badge con ítems
- **WHEN** `cartStore.totalItems() > 0`
- **THEN** el badge muestra el conteo; al hacer click llama `uiStore.openCart()`

#### Scenario: Badge vacío
- **WHEN** `cartStore.totalItems() === 0`
- **THEN** el badge no se muestra (o muestra 0) pero el icono sigue visible

### Requirement: CarritoPage en /carrito como vista completa del carrito
El sistema SHALL proveer una ruta pública `/carrito` que muestra el contenido del carrito en una página completa con los mismos controles que el drawer.

#### Scenario: Acceder a /carrito
- **WHEN** el usuario navega a `/carrito`
- **THEN** ve la lista completa de ítems, totales y un botón "Ir al checkout" (deshabilitado si no autenticado)

#### Scenario: Carrito vacío en página
- **WHEN** `cartStore.items` es `[]`
- **THEN** la página muestra "Tu carrito está vacío" con link al catálogo

#### Scenario: Botón checkout requiere autenticación
- **WHEN** el usuario no está autenticado y hace click en "Ir al checkout"
- **THEN** es redirigido a `/login`
