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
      <div className="bg-white rounded-2xl shadow overflow-hidden flex flex-col">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-4xl text-slate-300">
            🍽
          </div>
        )}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-semibold text-slate-900 text-base leading-tight">{producto.nombre}</h3>
          {producto.descripcion && (
            <p className="text-xs text-slate-500 line-clamp-2">{producto.descripcion}</p>
          )}
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-lg font-bold text-orange-600">
              ${Number(producto.precio).toFixed(2)}
            </span>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                Stock: {producto.stock_cantidad}
              </span>
              {producto.disponible ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                  Disponible
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium">
                  Agotado
                </span>
              )}
            </div>
          </div>

          {/* Agregar button */}
          <button
            onClick={() => setModalOpen(true)}
            disabled={!canAdd}
            className={`mt-2 w-full py-2 rounded-xl text-sm font-semibold transition-colors ${
              canAdd
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canAdd ? 'Agregar' : 'No disponible'}
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
