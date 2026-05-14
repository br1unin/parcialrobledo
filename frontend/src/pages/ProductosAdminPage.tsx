import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { productosApi } from '@/features/productos/api';
import type { Producto } from '@/features/productos/types';
import { ProductoForm } from '@/features/productos/ui/ProductoForm';
import { ProductoTable } from '@/features/productos/ui/ProductoTable';
import { useAuthStore } from '@/store/authStore';

export function ProductosAdminPage() {
  const user = useAuthStore((s) => s.user);
  const hasAccess = user?.roles.some((r) => r === 'ADMIN' || r === 'STOCK') ?? false;

  const [items, setItems] = useState<Producto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const limit = 20;

  if (!hasAccess) return <Navigate to="/" replace />;

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productosApi.list({ page, limit });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page]);

  const handleEdit = (item: Producto) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await productosApi.delete(id);
      fetchItems();
    } catch {
      alert('Error al eliminar el producto.');
    }
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      await productosApi.adjustStock(id, delta);
      fetchItems();
    } catch {
      alert('Error al ajustar el stock.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditing(null);
    fetchItems();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
              Inicio
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Productos</h1>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Nuevo producto
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          {loading && <p className="text-sm text-slate-400 py-4">Cargando…</p>}
          {error && <p className="text-sm text-red-600 py-4">{error}</p>}
          {!loading && !error && (
            <ProductoTable
              items={items}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdjustStock={handleAdjustStock}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
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

      <ProductoForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSuccess={handleFormSuccess}
        initialData={editing ?? undefined}
      />
    </div>
  );
}
