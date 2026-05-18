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
  const [busqueda, setBusqueda] = useState('');
  const [soloAlergenos, setSoloAlergenos] = useState(false);
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

  const filteredItems = items.filter((i) => {
    const matchNombre = i.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchAlergeno = soloAlergenos ? i.es_alergeno : true;
    return matchNombre && matchAlergeno;
  });

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

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
          <button
            onClick={() => setSoloAlergenos((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              soloAlergenos
                ? 'bg-red-500 text-white border-red-500'
                : 'bg-white text-red-600 border-red-200 hover:border-red-400'
            }`}
          >
            Solo alérgenos
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          {loading && <p className="text-sm text-slate-400 py-4">Cargando…</p>}
          {error && <p className="text-sm text-red-600 py-4">{error}</p>}
          {!loading && !error && (
            <IngredienteTable items={filteredItems} onEdit={handleEdit} onDelete={handleDelete} />
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
