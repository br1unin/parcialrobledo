import { useState } from 'react';

import { categoriasApi } from '../api';
import type { CategoriaNode } from '../types';

interface Props {
  node: CategoriaNode;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteCategoryDialog({ node, onSuccess, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await categoriasApi.delete(node.id);
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'No se pudo eliminar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Eliminar categoría</h2>
        <p className="text-sm text-slate-600">
          ¿Seguro que querés eliminar <span className="font-medium">{node.nombre}</span>? Esta acción no se puede deshacer.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
