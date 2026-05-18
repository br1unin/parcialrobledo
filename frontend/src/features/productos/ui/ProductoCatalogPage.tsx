import { useEffect, useState } from 'react';

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

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
      <div className="w-full h-44 bg-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded-full w-3/4" />
        <div className="h-3 bg-slate-100 rounded-full w-full" />
        <div className="h-3 bg-slate-100 rounded-full w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-5 bg-slate-100 rounded-full w-16" />
          <div className="h-4 bg-slate-100 rounded-full w-12" />
        </div>
        <div className="h-9 bg-slate-100 rounded-xl w-full mt-1" />
      </div>
    </div>
  );
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

  useEffect(() => { fetchProductos(); }, [page, busqueda, categoriaId]);

  const totalPages = Math.ceil(total / limit);
  const flatCats = flattenCategories(categorias).filter((c) => !c.padre_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold mb-1">¿Qué querés comer hoy?</h1>
        <p className="text-orange-100 text-sm">Elegí entre nuestros productos frescos y deliciosos</p>

        {/* Search */}
        <div className="relative mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-300 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white placeholder-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition"
          />
        </div>
      </div>

      {/* Category chips */}
      {flatCats.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => { setCategoriaId(''); setPage(1); }}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              categoriaId === ''
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300 hover:text-orange-500'
            }`}
          >
            Todo
          </button>
          {flatCats.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategoriaId(c.id); setPage(1); }}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                categoriaId === c.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300 hover:text-orange-500'
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Results label */}
      {!loading && (
        <p className="text-xs text-slate-400">
          {total === 0 ? 'Sin resultados' : `${total} producto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <span className="text-6xl">🍽️</span>
          <p className="text-slate-500 font-medium">No encontramos productos</p>
          <p className="text-slate-400 text-sm">Probá con otra búsqueda o categoría</p>
          <button
            onClick={() => { setBusqueda(''); setCategoriaId(''); setPage(1); }}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-medium rounded-xl transition-colors"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {productos.map((p) => <ProductoCard key={p.id} producto={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>
          <span className="px-4 py-2 text-sm text-slate-500 bg-white rounded-xl border border-slate-100">
            {page} <span className="text-slate-300">/</span> {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Siguiente
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
