# zustand-stores Specification

## Purpose
TBD - created by archiving change us-000-setupcontexto. Update Purpose after archive.
## Requirements
### Requirement: authStore gestiona la sesión del usuario
El sistema SHALL proveer un store Zustand `authStore` en `src/store/authStore.ts` que gestione el estado de autenticación del cliente.

Estado que almacena: `accessToken: string | null`, `user: UserResponse | null`, `isAuthenticated: boolean`

Acciones: `login(accessToken: string, user: UserResponse): void`, `logout(): void`, `updateTokens(accessToken: string): void`

Selectores: `hasRole(role: string): boolean`

**Persistencia**: DEBE usar el middleware `persist` de Zustand. Solo se persiste `accessToken` (no `user` — se reconstruye via `GET /api/v1/auth/me` al rehidratar). La clave en localStorage es `food-store-auth`.

#### Scenario: Login persiste el accessToken
- **WHEN** se ejecuta `authStore.login(token, user)`
- **THEN** `accessToken` se almacena en localStorage bajo la clave `food-store-auth`

#### Scenario: Logout limpia el estado
- **WHEN** se ejecuta `authStore.logout()`
- **THEN** `accessToken` es `null`, `user` es `null`, `isAuthenticated` es `false`

#### Scenario: hasRole retorna false para usuario no autenticado
- **WHEN** `user` es `null` y se llama `hasRole("ADMIN")`
- **THEN** retorna `false`

#### Scenario: Acceso fuera de React para interceptor Axios
- **WHEN** el interceptor de Axios necesita el token
- **THEN** puede obtenerlo via `useAuthStore.getState().accessToken` sin usar un hook

### Requirement: cartStore gestiona el carrito de compras
El sistema SHALL proveer un store Zustand `cartStore` en `src/store/cartStore.ts` que gestione los ítems del carrito con persistencia completa.

Estado: `items: CartItem[]` donde `CartItem = { productoId: number, nombre: string, precio: number, cantidad: number, imagenUrl: string | null, personalizacion: number[] }`

Acciones: `addItem(item: CartItem): void`, `removeItem(productoId: number): void`, `updateCantidad(productoId: number, cantidad: number): void`, `clearCart(): void`

Selectores (computados): `totalItems(): number`, `subtotal(): number`, `costoEnvio(): number` (valor fijo 50.00 en v1), `total(): number`

**Persistencia**: DEBE persistir `items` completos. La clave en localStorage es `food-store-cart`.

#### Scenario: addItem agrega producto nuevo al carrito
- **WHEN** se llama `addItem` con un producto que no existe en `items`
- **THEN** el producto se agrega con la cantidad especificada

#### Scenario: addItem incrementa cantidad si el producto ya existe
- **WHEN** se llama `addItem` con un `productoId` ya presente en `items`
- **THEN** la cantidad del ítem existente se incrementa (no se duplica el ítem)

#### Scenario: Carrito persiste entre recargas de página
- **WHEN** el usuario recarga la página o cierra y reabre el navegador
- **THEN** los ítems del carrito están disponibles desde localStorage

#### Scenario: total incluye costo de envío
- **WHEN** `subtotal()` retorna 1000.00
- **THEN** `total()` retorna 1050.00 (subtotal + 50.00 de envío)

### Requirement: paymentStore gestiona el proceso de pago
El sistema SHALL proveer un store Zustand `paymentStore` en `src/store/paymentStore.ts` sin persistencia que gestione el estado del flujo de checkout con MercadoPago.

Estado: `status: 'idle' | 'processing' | 'approved' | 'rejected' | 'error'`, `mpPaymentId: string | null`, `statusDetail: string | null`

Acciones: `setPaymentStatus(status, mpPaymentId?, statusDetail?): void`, `reset(): void`

**Sin persistencia** — el estado se resetea al recargar la página.

#### Scenario: Estado inicial es idle
- **WHEN** se accede al store por primera vez o después de reset()
- **THEN** `status` es `'idle'` y `mpPaymentId` es `null`

#### Scenario: Estado se pierde al recargar
- **WHEN** el usuario recarga la página con un pago en `'processing'`
- **THEN** el store vuelve al estado `'idle'` (no persiste)

### Requirement: uiStore gestiona estado de interfaz
El sistema SHALL proveer un store Zustand `uiStore` en `src/store/uiStore.ts` sin persistencia que gestione el estado efímero de la interfaz de usuario.

Estado: `cartOpen: boolean`, `sidebarOpen: boolean`, `confirmModal: { open: boolean, message: string, onConfirm: (() => void) | null }`

Acciones: `openCart(): void`, `closeCart(): void`, `toggleSidebar(): void`, `openConfirmModal(message: string, onConfirm: () => void): void`, `closeConfirmModal(): void`

**Sin persistencia**.

#### Scenario: openCart y closeCart alternan el estado
- **WHEN** se llama `openCart()` seguido de `closeCart()`
- **THEN** `cartOpen` pasa de `false` a `true` y luego a `false`

### Requirement: Suscripción por slice en todos los stores
Todos los consumidores de stores Zustand SHALL usar selectores granulares para evitar re-renders innecesarios.

#### Scenario: Componente solo se re-renderiza cuando cambia su slice
- **WHEN** un componente usa `useCartStore(s => s.items.length)`
- **THEN** el componente NO se re-renderiza cuando cambia `cartOpen` en `uiStore` u otro campo no relacionado del `cartStore`

