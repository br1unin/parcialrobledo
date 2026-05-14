import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';

export function CartIcon() {
  const openCart = useUIStore((s) => s.openCart);
  const totalItems = useCartStore((s) => s.totalItems);
  const count = totalItems();

  return (
    <button
      onClick={openCart}
      className="relative px-3 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors flex items-center gap-1"
      aria-label={`Abrir carrito${count > 0 ? ` (${count} ítems)` : ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span>Carrito</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
