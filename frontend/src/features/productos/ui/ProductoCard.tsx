import { useState } from 'react';

import { ProductoDetailModal } from '@/features/carrito/ui/ProductoDetailModal';
import type { Producto } from '../types';

interface Props {
  producto: Producto;
}

export function ProductoCard({ producto }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const canAdd = producto.disponible && producto.stock_cantidad > 0;

  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        onClick={() => canAdd && setModalOpen(true)}
      >
        {/* Image */}
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
            <span className="text-5xl opacity-40">🍽</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 flex flex-col gap-1.5 flex-1">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {producto.descripcion}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-lg font-bold text-orange-500">
              ${Number(producto.precio).toFixed(2)}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                canAdd
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {canAdd ? `Stock: ${producto.stock_cantidad}` : 'Agotado'}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            disabled={!canAdd}
            className={`mt-1 w-full py-2 rounded-xl text-sm font-semibold transition-all ${
              canAdd
                ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canAdd ? 'Agregar al carrito' : 'No disponible'}
          </button>
        </div>
      </div>

      <ProductoDetailModal
        producto={producto}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
