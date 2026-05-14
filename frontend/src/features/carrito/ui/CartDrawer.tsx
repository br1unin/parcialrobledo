import { Link } from 'react-router-dom';

import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { CartItemRow } from './CartItemRow';

export function CartDrawer() {
  const cartOpen = useUIStore((s) => s.cartOpen);
  const closeCart = useUIStore((s) => s.closeCart);
  const openConfirmModal = useUIStore((s) => s.openConfirmModal);

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const costoEnvio = useCartStore((s) => s.costoEnvio);
  const total = useCartStore((s) => s.total);

  if (!cartOpen) return null;

  const handleVaciar = () => {
    openConfirmModal('¿Vaciar el carrito?', () => {
      useCartStore.getState().clearCart();
    });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tu Carrito</h2>
          <button
            onClick={closeCart}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <span className="text-5xl">🛒</span>
              <p className="text-slate-500 text-sm">Tu carrito está vacío</p>
              <Link
                to="/catalogo"
                onClick={closeCart}
                className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItemRow key={`${item.productoId}-${JSON.stringify(item.personalizacion)}`} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío</span>
                <span>${costoEnvio().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>

            <Link
              to="/carrito"
              onClick={closeCart}
              className="block w-full text-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Ver carrito completo
            </Link>

            <button
              onClick={handleVaciar}
              className="w-full px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </>
  );
}
