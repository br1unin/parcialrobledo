import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { pedidosApi } from '@/features/pedidos/api';
import type { PedidoListItem } from '@/features/pedidos/types';
import { useUIStore } from '@/store/uiStore';

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'] as const;

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
  CONFIRMADO: 'bg-blue-100 text-blue-800',
  EN_CAMINO:  'bg-orange-100 text-orange-800',
  ENTREGADO:  'bg-green-100 text-green-800',
  CANCELADO:  'bg-red-100 text-red-800',
};

function EstadoBadge({ estado }: { estado: string }) {
  const cls = ESTADO_COLORS[estado] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{estado}</span>
  );
}

function PedidoRow({
  item,
  onAvanzar,
  onCancelar,
}: {
  item: PedidoListItem;
  onAvanzar: (id: string, estado: string) => void;
  onCancelar: (id: string) => void;
}) {
  const shortId = item.id.slice(0, 8).toUpperCase();
  const fecha = new Date(item.created_at).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const nextAction: { label: string; estado: string } | null =
    item.estado_codigo === 'CONFIRMADO' ? { label: 'En camino', estado: 'EN_CAMINO' } :
    item.estado_codigo === 'EN_CAMINO' ? { label: 'Entregado', estado: 'ENTREGADO' } :
    null;

  const canCancel = item.estado_codigo === 'CONFIRMADO';

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-mono text-slate-500">#{shortId}…</span>
          <EstadoBadge estado={item.estado_codigo} />
        </div>
        <p className="text-sm font-medium text-slate-800 truncate">
          {item.nombre_cliente_snapshot ?? '—'}
        </p>
        <p className="text-xs text-slate-400">{fecha}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="font-bold text-slate-900 text-sm">{ARS.format(Number(item.total))}</span>

        <div className="flex gap-2 items-center">
          <Link
            to={`/mis-pedidos/${item.id}`}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-500 text-xs font-semibold transition-colors"
          >
            Ver detalle
          </Link>
          {nextAction && (
            <button
              onClick={() => onAvanzar(item.id, nextAction.estado)}
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors"
            >
              {nextAction.label}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancelar(item.id)}
              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function GestorPedidosPage() {
  const [page, setPage] = useState(1);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const limit = 50;
  const queryClient = useQueryClient();
  const openConfirmModal = useUIStore((s) => s.openConfirmModal);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gestor-pedidos', page],
    queryFn: () => pedidosApi.list(page, limit),
  });

  const visibleItems = estadoFiltro
    ? (data?.items ?? []).filter((i) => i.estado_codigo === estadoFiltro)
    : (data?.items ?? []);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  const handleAvanzar = (id: string, nuevoEstado: string) => {
    openConfirmModal(`¿Avanzar el pedido a "${nuevoEstado.replace('_', ' ')}"?`, async () => {
      await pedidosApi.updateEstado(id, { nuevo_estado: nuevoEstado });
      queryClient.invalidateQueries({ queryKey: ['gestor-pedidos'] });
    });
  };

  const handleCancelar = (id: string) => {
    openConfirmModal('¿Cancelar este pedido?', async () => {
      await pedidosApi.updateEstado(id, { nuevo_estado: 'CANCELADO' });
      queryClient.invalidateQueries({ queryKey: ['gestor-pedidos'] });
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Gestión de Pedidos</h1>
        {data && (
          <span className="text-xs text-slate-400">
            {estadoFiltro ? `${visibleItems.length} de ${data.total}` : data.total} pedido{data.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Estado filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setEstadoFiltro('')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            estadoFiltro === ''
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
          }`}
        >
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            onClick={() => setEstadoFiltro(estadoFiltro === e ? '' : e)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              estadoFiltro === e
                ? ESTADO_COLORS[e] + ' border-transparent shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {e.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          Error al cargar pedidos. Intentá de nuevo.
        </div>
      )}

      {data && visibleItems.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center space-y-2">
          <p className="text-slate-500 font-medium">
            {estadoFiltro ? `No hay pedidos en estado ${estadoFiltro.replace('_', ' ')}` : 'No hay pedidos aún'}
          </p>
        </div>
      )}

      {data && visibleItems.length > 0 && (
        <>
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <PedidoRow
                key={item.id}
                item={item}
                onAvanzar={handleAvanzar}
                onCancelar={handleCancelar}
              />
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
