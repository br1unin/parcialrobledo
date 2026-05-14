import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { direccionesApi } from '@/features/direcciones/api';
import { DireccionForm } from '@/features/direcciones/ui/DireccionForm';
import { DireccionList } from '@/features/direcciones/ui/DireccionList';
import type { DireccionCreate, DireccionEntrega } from '@/features/direcciones/types';

export function DireccionesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState<DireccionEntrega | null>(null);

  const handleEdit = (d: DireccionEntrega) => {
    setEditingDireccion(d);
    setShowForm(true);
  };

  const handleSubmit = async (data: DireccionCreate) => {
    if (editingDireccion) {
      await direccionesApi.update(editingDireccion.id, data);
    } else {
      await direccionesApi.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    setShowForm(false);
    setEditingDireccion(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingDireccion(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Mis Direcciones</h1>
          </div>
          <button
            onClick={() => {
              setEditingDireccion(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold"
          >
            + Nueva dirección
          </button>
        </div>

        <DireccionList onEdit={handleEdit} />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {editingDireccion ? 'Editar dirección' : 'Nueva dirección'}
            </h2>
            <DireccionForm
              onSubmit={handleSubmit}
              initialData={editingDireccion ?? undefined}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
