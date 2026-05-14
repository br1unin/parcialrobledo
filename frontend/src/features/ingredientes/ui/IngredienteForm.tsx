import { useState } from 'react';

import { ingredientesApi } from '../api';
import type { Ingrediente } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Ingrediente;
}

export function IngredienteForm({ open, onClose, onSuccess, initialData }: Props) {
  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [esAlergeno, setEsAlergeno] = useState(initialData?.es_alergeno ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (initialData) {
        await ingredientesApi.update(initialData.id, { nombre, es_alergeno: esAlergeno });
      } else {
        await ingredientesApi.create({ nombre, es_alergeno: esAlergeno });
      }
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Error al guardar el ingrediente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {initialData ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="es_alergeno"
              type="checkbox"
              checked={esAlergeno}
              onChange={(e) => setEsAlergeno(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="es_alergeno" className="text-sm font-medium text-slate-700">
              Es alérgeno
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {initialData ? 'Guardar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
