import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { pedidosApi } from '@/features/pedidos/api';
import type { PedidoListItem } from '@/features/pedidos/types';
import { useUIStore } from '@/store/uiStore';

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EN_CAMINO:  'bg-purple-100 text-purple-800',
  ENTREGADO:  'bg-green-100 text-green-800',
  CANCELADO:  'bg-red-100 text-red-800',
};

function EstadoBadge({ estado }: { estado: string }) {
  const cls = ESTADO_COLORS[estado] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{estado}</span>
  );
}

function PedidoCard({ item, onCancel }: { item: PedidoListItem; onCancel: (id: string) => void }) {
  const shortId = item.id.slice(0, 8).toUpperCase();
  const fecha = new Date(item.created_at).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-center justify-between">
        <Link to={`/mis-pedidos/${item.id}`} className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-mono text-slate-500">#{shortId}…</p>
          <p className="text-xs text-slate-400">{fecha}</p>
        </Link>
        <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
          <span className="font-bold text-slate-900">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(item.total))}
          </span>
          <EstadoBadge estado={item.estado_codigo} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Link
          to={`/mis-pedidos/${item.id}`}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          Ver detalle →
        </Link>
        {item.estado_codigo === 'PENDIENTE' && (
          <button
            onClick={() => onCancel(item.id)}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  );
}

export function MisPedidosPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();
  const openConfirmModal = useUIStore((s) => s.openConfirmModal);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['mis-pedidos', page],
    queryFn: () => pedidosApi.list(page, limit),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const handleCancel = (id: string) => {
    openConfirmModal('¿Cancelar este pedido?', async () => {
      await pedidosApi.updateEstado(id, { nuevo_estado: 'CANCELADO' });
      queryClient.invalidateQueries({ queryKey: ['mis-pedidos'] });
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Mis Pedidos</h1>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          Error al cargar pedidos. Intentá de nuevo.
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-3xl mx-auto">📦</div>
          <p className="text-slate-500 font-medium">No tenés pedidos aún</p>
          <Link
            to="/catalogo"
            className="inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="space-y-3">
            {data.items.map((item) => (
              <PedidoCard key={item.id} item={item} onCancel={handleCancel} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-all"
              >
                ← Anterior
              </button>
              <span className="px-3 py-2 text-sm text-slate-500">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 hover:border-orange-300 hover:text-orange-500 disabled:opacity-40 transition-all"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
