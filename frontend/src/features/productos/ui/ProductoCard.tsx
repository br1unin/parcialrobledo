import { useState } from 'react';

import { ProductoDetailModal } from '@/features/carrito/ui/ProductoDetailModal';
import type { Producto } from '../types';

const CATEGORY_EMOJI: Record<string, string> = {
  hamburguesa: '🍔', burger: '🍔',
  pizza: '🍕',
  empanada: '🥟',
  bebida: '🥤', jugo: '🍊', agua: '💧', coca: '🥤',
  postre: '🍰', torta: '🎂', brownie: '🍫', cheesecake: '🍰', tiramisu: '🍮',
  ensalada: '🥗',
  sushi: '🍣',
  pasta: '🍝',
};

function getEmoji(nombre: string): string {
  const lower = nombre.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
}

interface Props {
  producto: Producto;
}

export function ProductoCard({ producto }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const canAdd = producto.disponible && producto.stock_cantidad > 0;
  const precio = Number(producto.precio);

  return (
    <>
      <div
        className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group transition-all duration-200 ${
          canAdd ? 'hover:shadow-md hover:-translate-y-1 cursor-pointer' : 'opacity-75'
        }`}
        onClick={() => canAdd && setModalOpen(true)}
      >
        {/* Image */}
        <div className="relative w-full h-44 overflow-hidden">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-50 via-amber-50 to-slate-100 flex items-center justify-center">
              <span className="text-6xl drop-shadow-sm">{getEmoji(producto.nombre)}</span>
            </div>
          )}

          {/* Agotado badge */}
          {!canAdd && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                Agotado
              </span>
            </div>
          )}

          {/* Stock bajo */}
          {canAdd && producto.stock_cantidad <= 5 && (
            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              ¡Últimos!
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-1 flex-1">
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-1">
            {producto.nombre}
          </h3>
          {producto.descripcion && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {producto.descripcion}
            </p>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-xl font-bold text-orange-500 tracking-tight">
              {formatPrice(precio)}
            </span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); if (canAdd) setModalOpen(true); }}
            disabled={!canAdd}
            className={`mt-1 w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              canAdd
                ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canAdd ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Agregar
              </>
            ) : (
              'No disponible'
            )}
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
