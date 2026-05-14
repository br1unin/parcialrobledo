import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminApi } from '@/api/admin';
import type { EstadoPedido, FormaPago, Rol } from '@/types/admin';

// ─── Roles Tab ───────────────────────────────────────────────────────────────

function RolesTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminApi.getRoles,
  });

  if (isLoading) return <TabLoader />;
  if (isError) return <TabError message="Error al cargar roles." />;
  if (!data || data.length === 0) return <TabEmpty message="No hay roles registrados." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Código
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Descripción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((rol: Rol) => (
            <tr key={rol.codigo}>
              <td className="px-4 py-3 text-sm font-mono text-slate-700">{rol.codigo}</td>
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{rol.nombre}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{rol.descripcion ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Formas de Pago Tab ───────────────────────────────────────────────────────

function FormasPagoTab() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'formas-pago'],
    queryFn: adminApi.getFormasPago,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ codigo, habilitado }: { codigo: string; habilitado: boolean }) =>
      adminApi.toggleFormaPago(codigo, habilitado),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'formas-pago'] });
    },
  });

  if (isLoading) return <TabLoader />;
  if (isError) return <TabError message="Error al cargar formas de pago." />;
  if (!data || data.length === 0) return <TabEmpty message="No hay formas de pago registradas." />;

  return (
    <div className="space-y-3">
      {data.map((fp: FormaPago) => (
        <div
          key={fp.codigo}
          className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">{fp.nombre}</p>
            <p className="text-xs text-slate-400 font-mono">{fp.codigo}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={fp.habilitado}
            disabled={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate({ codigo: fp.codigo, habilitado: !fp.habilitado })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 ${
              fp.habilitado ? 'bg-orange-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                fp.habilitado ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
      {toggleMutation.isError && (
        <p className="text-xs text-red-500 mt-1">Error al cambiar estado. Intenta de nuevo.</p>
      )}
    </div>
  );
}

// ─── Estados de Pedido Tab ────────────────────────────────────────────────────

function EstadosPedidoTab() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'estados-pedido'],
    queryFn: adminApi.getEstadosPedido,
  });

  if (isLoading) return <TabLoader />;
  if (isError) return <TabError message="Error al cargar estados de pedido." />;
  if (!data || data.length === 0)
    return <TabEmpty message="No hay estados de pedido registrados." />;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Código
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Descripción
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Orden
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Terminal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((e: EstadoPedido) => (
            <tr key={e.codigo}>
              <td className="px-4 py-3 text-sm font-mono text-slate-700">{e.codigo}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{e.descripcion}</td>
              <td className="px-4 py-3 text-sm text-slate-500 text-right">{e.orden}</td>
              <td className="px-4 py-3 text-center">
                {e.es_terminal ? (
                  <span className="text-green-600 text-xs font-semibold">Si</span>
                ) : (
                  <span className="text-slate-400 text-xs">No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function TabLoader() {
  return <div className="py-10 text-center text-slate-400 text-sm">Cargando…</div>;
}

function TabError({ message }: { message: string }) {
  return <div className="py-10 text-center text-red-500 text-sm">{message}</div>;
}

function TabEmpty({ message }: { message: string }) {
  return <div className="py-10 text-center text-slate-400 text-sm">{message}</div>;
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

const TABS = ['Roles', 'Formas de Pago', 'Estados de Pedido'] as const;
type Tab = (typeof TABS)[number];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Roles');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link to="/" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
              ← Volver
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Panel de Administración</h1>
            <p className="text-sm text-slate-500 mt-1">Configuración del sistema</p>
          </div>
          <Link
            to="/admin/usuarios"
            className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Gestión de Usuarios
          </Link>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white border border-b-white border-slate-200 text-orange-600 -mb-px'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow">
          {activeTab === 'Roles' && <RolesTab />}
          {activeTab === 'Formas de Pago' && <FormasPagoTab />}
          {activeTab === 'Estados de Pedido' && <EstadosPedidoTab />}
        </div>
      </div>
    </div>
  );
}
