import { Link, useNavigate } from 'react-router-dom';

import { CartItemRow } from '@/features/carrito/ui/CartItemRow';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

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
    navigate(isAuthenticated ? '/checkout' : '/login');
  };

  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/catalogo"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-orange-500 hover:border-orange-300 transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mi Carrito</h1>
          {items.length > 0 && (
            <p className="text-xs text-slate-400">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-4xl">
            🛒
          </div>
          <div>
            <p className="font-semibold text-slate-800">Tu carrito está vacío</p>
            <p className="text-slate-400 text-sm mt-1">Agregá productos desde el catálogo</p>
          </div>
          <Link
            to="/catalogo"
            className="mt-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
            {items.map((item) => (
              <div key={`${item.productoId}-${JSON.stringify(item.personalizacion)}`} className="px-5 py-1">
                <CartItemRow item={item} />
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Resumen del pedido</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal())}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Costo de envío</span>
                <span>{costoEnvio() === 0 ? <span className="text-emerald-500 font-medium">Gratis</span> : formatPrice(costoEnvio())}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-xl font-bold text-orange-500">{formatPrice(total())}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isAuthenticated ? (
                <>
                  Confirmar pedido
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : 'Iniciar sesión para continuar'}
            </button>
            <button
              onClick={handleVaciar}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 hover:border-red-200 hover:text-red-500 rounded-xl text-sm font-medium text-slate-500 transition-all"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
