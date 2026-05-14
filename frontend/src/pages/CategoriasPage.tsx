import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { categoriasApi } from '@/features/categorias/api';
import type { CategoriaNode } from '@/features/categorias/types';
import { CategoryForm } from '@/features/categorias/ui/CategoryForm';
import { CategoryTree } from '@/features/categorias/ui/CategoryTree';
import { DeleteCategoryDialog } from '@/features/categorias/ui/DeleteCategoryDialog';
import { useAuthStore } from '@/store/authStore';

export function CategoriasPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles.includes('ADMIN') ?? false;

  const [tree, setTree] = useState<CategoriaNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingNode, setEditingNode] = useState<CategoriaNode | null>(null);
  const [deletingNode, setDeletingNode] = useState<CategoriaNode | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriasApi.getTree();
      setTree(data);
    } catch {
      setError('No se pudo cargar el árbol de categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleEdit = (node: CategoriaNode) => {
    setEditingNode(node);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingNode(null);
    fetchTree();
  };

  const handleDeleteSuccess = () => {
    setDeletingNode(null);
    fetchTree();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">
              ← Inicio
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Categorías</h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditingNode(null); setShowForm(true); }}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Nueva categoría
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          {loading && <p className="text-sm text-slate-400 py-4">Cargando…</p>}
          {error && <p className="text-sm text-red-600 py-4">{error}</p>}
          {!loading && !error && (
            <CategoryTree
              nodes={tree}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={setDeletingNode}
            />
          )}
        </div>
      </div>

      {showForm && (
        <CategoryForm
          allNodes={tree}
          editing={editingNode}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingNode(null); }}
        />
      )}

      {deletingNode && (
        <DeleteCategoryDialog
          node={deletingNode}
          onSuccess={handleDeleteSuccess}
          onCancel={() => setDeletingNode(null)}
        />
      )}
    </div>
  );
}
