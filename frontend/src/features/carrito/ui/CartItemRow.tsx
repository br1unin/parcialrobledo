import { useCartStore, type CartItem } from '@/store/cartStore';

interface Props {
  item: CartItem;
}

export function CartItemRow({ item }: Props) {
  const updateCantidad = useCartStore((s) => s.updateCantidad);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {/* Image / placeholder */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center text-2xl">
        {item.imagenUrl ? (
          <img
            src={item.imagenUrl}
            alt={item.nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>🍽</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{item.nombre}</p>
        {item.personalizacion.length > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">Personalizado</p>
        )}
        <p className="text-sm font-bold text-orange-600 mt-1">
          ${(item.precio * item.cantidad).toFixed(2)}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => updateCantidad(item.productoId, item.cantidad - 1)}
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
          aria-label="Reducir cantidad"
        >
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold text-slate-800">
          {item.cantidad}
        </span>
        <button
          onClick={() => updateCantidad(item.productoId, item.cantidad + 1)}
          className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>

      {/* Delete */}
      <button
        onClick={() => removeItem(item.productoId)}
        className="flex-shrink-0 text-slate-300 hover:text-red-400 transition-colors ml-1"
        aria-label="Eliminar ítem"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
