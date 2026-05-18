import { useState } from 'react';

import { useCartStore } from '@/store/cartStore';
import type { Producto } from '@/features/productos/types';

interface Props {
  producto: Producto;
  open: boolean;
  onClose: () => void;
}

export function ProductoDetailModal({ producto, open, onClose }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [selectedExclusiones, setSelectedExclusiones] = useState<string[]>([]);

  if (!open) return null;

  const removibles = producto.ingredientes.filter((ing) => ing.es_removible);

  const toggleExclusion = (id: string) => {
    setSelectedExclusiones((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAgregar = () => {
    const nombresExcluidos = removibles
      .filter((ing) => selectedExclusiones.includes(ing.id))
      .map((ing) => ing.nombre);

    useCartStore.getState().addItem({
      productoId: producto.id as unknown as number,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad,
      imagenUrl: producto.imagen_url,
      personalizacion: selectedExclusiones as unknown as number[],
      personalizacionNombres: nombresExcluidos,
    });
    setCantidad(1);
    setSelectedExclusiones([]);
    onClose();
  };

  const handleClose = () => {
    setCantidad(1);
    setSelectedExclusiones([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{producto.nombre}</h2>
          <button
            onClick={handleClose}
            className="ml-4 text-slate-400 hover:text-slate-600 text-2xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Price */}
        <p className="text-2xl font-bold text-orange-600 mb-3">
          ${Number(producto.precio).toFixed(2)}
        </p>

        {/* Description */}
        {producto.descripcion && (
          <p className="text-sm text-slate-500 mb-4">{producto.descripcion}</p>
        )}

        {/* Removable ingredients */}
        {removibles.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Quitar ingredientes:</p>
            <div className="space-y-2">
              {removibles.map((ing) => (
                <label
                  key={ing.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedExclusiones.includes(ing.id)}
                    onChange={() => toggleExclusion(ing.id)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                  />
                  {ing.nombre}
                  {ing.es_alergeno && (
                    <span className="text-xs text-red-500 font-medium">(alérgeno)</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity selector */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-slate-700 mb-2">Cantidad:</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCantidad((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              aria-label="Reducir cantidad"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold text-slate-900">{cantidad}</span>
            <button
              onClick={() => setCantidad((q) => q + 1)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAgregar}
            className="flex-1 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  );
}
