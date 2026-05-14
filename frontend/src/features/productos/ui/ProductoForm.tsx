import { useEffect, useState } from 'react';

import { categoriasApi } from '@/features/categorias/api';
import type { CategoriaNode } from '@/features/categorias/types';
import { ingredientesApi } from '@/features/ingredientes/api';
import type { Ingrediente } from '@/features/ingredientes/types';
import { productosApi } from '../api';
import type { IngredienteAsignado, Producto } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Producto;
}

function flattenCategories(nodes: CategoriaNode[]): CategoriaNode[] {
  const result: CategoriaNode[] = [];
  for (const n of nodes) {
    result.push(n);
    result.push(...flattenCategories(n.children));
  }
  return result;
}

export function ProductoForm({ open, onClose, onSuccess, initialData }: Props) {
  const [nombre, setNombre] = useState(initialData?.nombre ?? '');
  const [precio, setPrecio] = useState(String(initialData?.precio ?? ''));
  const [stockCantidad, setStockCantidad] = useState(String(initialData?.stock_cantidad ?? '0'));
  const [disponible, setDisponible] = useState(initialData?.disponible ?? true);
  const [descripcion, setDescripcion] = useState(initialData?.descripcion ?? '');
  const [imagenUrl, setImagenUrl] = useState(initialData?.imagen_url ?? '');

  const [allCategorias, setAllCategorias] = useState<CategoriaNode[]>([]);
  const [allIngredientes, setAllIngredientes] = useState<Ingrediente[]>([]);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>(
    initialData?.categorias.map((c) => c.id) ?? [],
  );
  const [selectedIngredientes, setSelectedIngredientes] = useState<IngredienteAsignado[]>(
    initialData?.ingredientes.map((i) => ({ ingrediente_id: i.id, es_removible: i.es_removible })) ?? [],
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    categoriasApi.getTree().then((data) => setAllCategorias(data)).catch(() => {});
    ingredientesApi.list({ limit: 200 }).then((data) => setAllIngredientes(data.items)).catch(() => {});
  }, [open]);

  if (!open) return null;

  const flatCats = flattenCategories(allCategorias);

  const toggleCategoria = (id: string) => {
    setSelectedCategorias((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleIngrediente = (id: string) => {
    setSelectedIngredientes((prev) => {
      const exists = prev.find((i) => i.ingrediente_id === id);
      if (exists) return prev.filter((i) => i.ingrediente_id !== id);
      return [...prev, { ingrediente_id: id, es_removible: true }];
    });
  };

  const toggleRemovible = (id: string) => {
    setSelectedIngredientes((prev) =>
      prev.map((i) =>
        i.ingrediente_id === id ? { ...i, es_removible: !i.es_removible } : i,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let producto: Producto;
      const payload = {
        nombre,
        precio: parseFloat(precio),
        stock_cantidad: parseInt(stockCantidad, 10),
        disponible,
        descripcion: descripcion || undefined,
        imagen_url: imagenUrl || undefined,
      };
      if (initialData) {
        producto = await productosApi.update(initialData.id, payload);
      } else {
        producto = await productosApi.create(payload);
      }
      await productosApi.setCategorias(producto.id, selectedCategorias);
      await productosApi.setIngredientes(producto.id, selectedIngredientes);
      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {initialData ? 'Editar producto' : 'Nuevo producto'}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input
                type="number"
                min="0"
                value={stockCantidad}
                onChange={(e) => setStockCantidad(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">URL de imagen</label>
            <input
              type="text"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="disponible"
              type="checkbox"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <label htmlFor="disponible" className="text-sm font-medium text-slate-700">
              Disponible
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Categorías</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
              {flatCats.map((c) => (
                <label key={c.id} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategorias.includes(c.id)}
                    onChange={() => toggleCategoria(c.id)}
                    className="w-3.5 h-3.5 accent-orange-500"
                  />
                  <span className="text-xs text-slate-700">{c.nombre}</span>
                </label>
              ))}
              {flatCats.length === 0 && (
                <span className="text-xs text-slate-400">Sin categorías</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Ingredientes</p>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
              {allIngredientes.map((ing) => {
                const selected = selectedIngredientes.find((i) => i.ingrediente_id === ing.id);
                return (
                  <div key={ing.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selected}
                      onChange={() => toggleIngrediente(ing.id)}
                      className="w-3.5 h-3.5 accent-orange-500"
                    />
                    <span className="text-xs text-slate-700 flex-1">{ing.nombre}</span>
                    {ing.es_alergeno && (
                      <span className="text-xs text-red-500 font-medium">alérgeno</span>
                    )}
                    {selected && (
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        <input
                          type="checkbox"
                          checked={selected.es_removible}
                          onChange={() => toggleRemovible(ing.id)}
                          className="w-3 h-3 accent-slate-500"
                        />
                        removible
                      </label>
                    )}
                  </div>
                );
              })}
              {allIngredientes.length === 0 && (
                <span className="text-xs text-slate-400">Sin ingredientes</span>
              )}
            </div>
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
