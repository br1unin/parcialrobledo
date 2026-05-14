import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { pedidosApi } from '@/features/pedidos/api';
import type { PedidoListItem } from '@/features/pedidos/types';

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EN_CAMINO: 'bg-purple-100 text-purple-800',
  ENTREGADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

function EstadoBadge({ estado }: { estado: string }) {
  const cls = ESTADO_COLORS[estado] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{estado}</span>
  );
}

function PedidoCard({ item }: { item: PedidoListItem }) {
  const shortId = item.id.slice(0, 8).toUpperCase();
  const fecha = new Date(item.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      to={`/mis-pedidos/${item.id}`}
      className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-mono text-slate-500">#{shortId}…</p>
          <p className="text-xs text-slate-400">{fecha}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-bold text-slate-900">${Number(item.total).toFixed(2)}</span>
          <EstadoBadge estado={item.estado_codigo} />
        </div>
      </div>
    </Link>
  );
}

export function MisPedidosPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mis-pedidos', page],
    queryFn: () => pedidosApi.list(page, limit),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link to="/" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Mis Pedidos</h1>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-slate-400">Cargando pedidos…</div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-500">
            Error al cargar pedidos. Intenta de nuevo.
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="bg-white rounded-xl shadow p-12 text-center space-y-4">
            <p className="text-slate-500">No tienes pedidos aún</p>
            <Link
              to="/catalogo"
              className="inline-block px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="space-y-3">
              {data.items.map((item) => (
                <PedidoCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1.5 text-sm text-slate-500">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
