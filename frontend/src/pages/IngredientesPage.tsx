import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { ingredientesApi } from '@/features/ingredientes/api';
import type { Ingrediente } from '@/features/ingredientes/types';
import { IngredienteForm } from '@/features/ingredientes/ui/IngredienteForm';
import { IngredienteTable } from '@/features/ingredientes/ui/IngredienteTable';
import { useAuthStore } from '@/store/authStore';

export function IngredientesPage() {
  const user = useAuthStore((s) => s.user);
  const hasAccess = user?.roles.some((r) => r === 'ADMIN' || r === 'STOCK') ?? false;

  const [items, setItems] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingrediente | null>(null);

  if (!hasAccess) return <Navigate to="/" replace />;

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ingredientesApi.list({ limit: 100 });
      setItems(data.items);
    } catch {
      setError('No se pudieron cargar los ingredientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEdit = (item: Ingrediente) => {
    setEditing(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ingrediente?')) return;
    try {
      await ingredientesApi.delete(id);
      fetchItems();
    } catch {
      alert('Error al eliminar el ingrediente.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditing(null);
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
              Inicio
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Ingredientes</h1>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            + Nuevo ingrediente
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          {loading && <p className="text-sm text-slate-400 py-4">Cargando…</p>}
          {error && <p className="text-sm text-red-600 py-4">{error}</p>}
          {!loading && !error && (
            <IngredienteTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </div>
      </div>

      <IngredienteForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSuccess={handleFormSuccess}
        initialData={editing ?? undefined}
      />
    </div>
  );
}
