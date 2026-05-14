import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminUsuariosApi } from '@/api/usuarios';
import type { UserResponse } from '@/shared/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 20;
const ALL_ROLES = ['ADMIN', 'STOCK', 'PEDIDOS', 'CLIENT'] as const;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function TabLoader() {
  return <div className="py-10 text-center text-slate-400 text-sm">Cargando…</div>;
}

// ─── UserRow ─────────────────────────────────────────────────────────────────

function UserRow({ user }: { user: UserResponse }) {
  const queryClient = useQueryClient();
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Activate / deactivate mutation
  const toggleMutation = useMutation({
    mutationFn: () => adminUsuariosApi.setActive(user.id, !user.is_active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });

  // Remove role mutation
  const removeMutation = useMutation({
    mutationFn: (rol: string) => adminUsuariosApi.removeRole(user.id, rol),
    onSuccess: () => {
      setRemoveError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setRemoveError('No se puede eliminar el último administrador');
      } else {
        setRemoveError('Error al eliminar rol. Intenta de nuevo.');
      }
    },
  });

  // Assign role mutation
  const assignMutation = useMutation({
    mutationFn: (rol_codigo: string) => adminUsuariosApi.assignRole(user.id, rol_codigo),
    onSuccess: () => {
      setSelectedRole('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
    },
  });

  const availableRoles = ALL_ROLES.filter((r) => !user.roles.includes(r));

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-AR')
    : '—';

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Email */}
      <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{user.email}</td>

      {/* Nombre */}
      <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{user.nombre}</td>

      {/* Apellido */}
      <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{user.apellido}</td>

      {/* Roles */}
      <td className="px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-1 items-center">
          {/* Role badges with remove button */}
          {user.roles.map((rol) => (
            <span
              key={rol}
              className="inline-flex items-center gap-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {rol}
              <button
                type="button"
                aria-label={`Eliminar rol ${rol}`}
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(rol)}
                className="ml-0.5 text-indigo-400 hover:text-indigo-700 disabled:opacity-50 leading-none"
              >
                ×
              </button>
            </span>
          ))}

          {/* Add role dropdown + button */}
          {availableRoles.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-xs border border-slate-300 rounded px-1 py-0.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-orange-400"
              >
                <option value="">Agregar rol…</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedRole || assignMutation.isPending}
                onClick={() => selectedRole && assignMutation.mutate(selectedRole)}
                className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 rounded disabled:opacity-50 transition-colors"
              >
                Agregar
              </button>
            </div>
          )}
        </div>

        {/* Inline error for remove role */}
        {removeError && (
          <p className="text-xs text-red-500 mt-1">{removeError}</p>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            user.is_active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {user.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      {/* Fecha Registro */}
      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formattedDate}</td>

      {/* Toggle action */}
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <button
          type="button"
          disabled={toggleMutation.isPending}
          onClick={() => toggleMutation.mutate()}
          className={`text-xs font-medium px-3 py-1 rounded transition-colors disabled:opacity-50 ${
            user.is_active
              ? 'bg-red-100 hover:bg-red-200 text-red-700'
              : 'bg-green-100 hover:bg-green-200 text-green-700'
          }`}
        >
          {user.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </td>
    </tr>
  );
}

// ─── AdminUsuariosPage ────────────────────────────────────────────────────────

export function AdminUsuariosPage() {
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'usuarios', skip],
    queryFn: () => adminUsuariosApi.listUsers(skip, LIMIT),
  });

  // Client-side search filter
  const filteredItems = (data?.items ?? []).filter((user) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(q) ||
      user.nombre.toLowerCase().includes(q) ||
      user.apellido.toLowerCase().includes(q)
    );
  });

  const total = data?.total ?? 0;
  const limit = data?.limit ?? LIMIT;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to="/admin" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500 mt-1">Administra usuarios, roles y estados</p>
        </div>

        {/* Search input */}
        <div>
          <input
            type="text"
            placeholder="Buscar por email, nombre o apellido…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          />
        </div>

        {/* Content */}
        {isLoading && <TabLoader />}

        {isError && (
          <div className="py-10 text-center text-red-500 text-sm">
            Error al cargar usuarios. Intenta de nuevo.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Apellido
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Roles
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Fecha Registro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-slate-400 text-sm"
                      >
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((user) => <UserRow key={user.id} user={user} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Mostrando {skip + 1}–{Math.min(skip + limit, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={skip === 0}
                  onClick={() => setSkip((s) => Math.max(0, s - limit))}
                  className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={skip + limit >= total}
                  onClick={() => setSkip((s) => s + limit)}
                  className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
