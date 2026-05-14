import { useForm } from '@tanstack/react-form';
import { useState } from 'react';

import { categoriasApi } from '../api';
import type { CategoriaNode } from '../types';

interface Props {
  allNodes: CategoriaNode[];
  editing: CategoriaNode | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function flattenNodes(nodes: CategoriaNode[], result: CategoriaNode[] = []): CategoriaNode[] {
  for (const n of nodes) {
    result.push(n);
    flattenNodes(n.children, result);
  }
  return result;
}

export function CategoryForm({ allNodes, editing, onSuccess, onCancel }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const flat = flattenNodes(allNodes).filter((n) => n.id !== editing?.id);

  const form = useForm({
    defaultValues: {
      nombre: editing?.nombre ?? '',
      descripcion: editing?.descripcion ?? '',
      padre_id: editing?.padre_id ?? '',
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const nombre = value.nombre || undefined;
      const descripcion = value.descripcion || undefined;
      const padre_id = value.padre_id || undefined;
      try {
        if (editing) {
          await categoriasApi.update(editing.id, { nombre, descripcion, padre_id });
        } else {
          await categoriasApi.create({ nombre: value.nombre, descripcion, padre_id });
        }
        onSuccess();
      } catch (err: unknown) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setServerError(detail ?? 'Error al guardar la categoría.');
      }
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {editing ? 'Editar categoría' : 'Nueva categoría'}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-3"
        >
          <form.Field name="nombre">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required={!editing}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="descripcion">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="padre_id">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría padre (opcional)</label>
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">— Raíz —</option>
                  {flat.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form.Field>

          {serverError && <p className="text-sm text-red-600">{serverError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              {editing ? 'Guardar' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={onCancel}
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
