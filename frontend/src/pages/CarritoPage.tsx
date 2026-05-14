import { Link, useNavigate } from 'react-router-dom';

import { CartItemRow } from '@/features/carrito/ui/CartItemRow';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export function CarritoPage() {
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const costoEnvio = useCartStore((s) => s.costoEnvio);
  const total = useCartStore((s) => s.total);

  const openConfirmModal = useUIStore((s) => s.openConfirmModal);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleVaciar = () => {
    openConfirmModal('¿Vaciar el carrito?', () => {
      useCartStore.getState().clearCart();
    });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    // Checkout functionality implemented in us-005
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver al catálogo
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">Mi Carrito</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 flex flex-col items-center gap-4 text-center">
            <span className="text-6xl">🛒</span>
            <p className="text-slate-500">Tu carrito está vacío</p>
            <Link
              to="/catalogo"
              className="px-5 py-2 bg-orange-100 hover:bg-orange-200 rounded-xl text-sm font-medium text-orange-700 transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Items */}
            <div className="bg-white rounded-2xl shadow p-5">
              {items.map((item) => (
                <CartItemRow
                  key={`${item.productoId}-${JSON.stringify(item.personalizacion)}`}
                  item={item}
                />
              ))}
            </div>

            {/* Totals */}
            <div className="bg-white rounded-2xl shadow p-5 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Envío</span>
                <span>${costoEnvio().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCheckout}
                className="w-full px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
              >
                {isAuthenticated ? 'Ir al checkout' : 'Iniciar sesión para continuar'}
              </button>
              <button
                onClick={handleVaciar}
                className="w-full px-5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
