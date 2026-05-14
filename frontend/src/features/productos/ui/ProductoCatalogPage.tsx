import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { categoriasApi } from '@/features/categorias/api';
import type { CategoriaNode } from '@/features/categorias/types';
import { productosApi } from '../api';
import type { Producto } from '../types';
import { ProductoCard } from './ProductoCard';

function flattenCategories(nodes: CategoriaNode[]): CategoriaNode[] {
  const result: CategoriaNode[] = [];
  for (const n of nodes) {
    result.push(n);
    result.push(...flattenCategories(n.children));
  }
  return result;
}

export function ProductoCatalogPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaNode[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 12;

  useEffect(() => {
    categoriasApi.getTree().then((data) => setCategorias(data)).catch(() => {});
  }, []);

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit };
      if (busqueda) params.busqueda = busqueda;
      if (categoriaId) params.categoria_id = categoriaId;
      const data = await productosApi.list(params as Parameters<typeof productosApi.list>[0]);
      setProductos(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [page, busqueda, categoriaId]);

  const totalPages = Math.ceil(total / limit);
  const flatCats = flattenCategories(categorias);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Catálogo</h1>
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
            Inicio
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <select
            value={categoriaId}
            onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Todas las categorías</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 py-8 text-center">Cargando…</p>
        ) : productos.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No hay productos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productos.map((p) => (
              <ProductoCard key={p.id} producto={p} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 transition-colors"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-40 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
