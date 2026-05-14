import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { pedidosApi } from '@/features/pedidos/api';
import type { DetalleResponse, HistorialResponse } from '@/features/pedidos/types';
import { useAuthStore } from '@/store/authStore';

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

function DetalleRow({ detalle }: { detalle: DetalleResponse }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-2 pr-3 text-sm text-slate-700">{detalle.nombre_snapshot}</td>
      <td className="py-2 pr-3 text-sm text-slate-600">${Number(detalle.precio_snapshot).toFixed(2)}</td>
      <td className="py-2 pr-3 text-sm text-slate-600 text-center">{detalle.cantidad}</td>
      <td className="py-2 pr-3 text-sm text-slate-500">
        {detalle.personalizacion.length > 0
          ? `sin: ${detalle.personalizacion.join(', ')}`
          : '—'}
      </td>
      <td className="py-2 text-sm font-medium text-slate-900 text-right">
        ${Number(detalle.subtotal).toFixed(2)}
      </td>
    </tr>
  );
}

function HistorialItem({ item }: { item: HistorialResponse }) {
  const fecha = new Date(item.created_at).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-1 shrink-0" />
        <div className="flex-1 w-px bg-slate-200 mt-1" />
      </div>
      <div className="pb-4">
        <div className="flex items-center gap-2">
          <EstadoBadge estado={item.estado_codigo} />
          <span className="text-xs text-slate-400">{fecha}</span>
        </div>
        {item.observacion && (
          <p className="text-sm text-slate-500 mt-1">{item.observacion}</p>
        )}
      </div>
    </div>
  );
}

export function PedidoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: pedido, isLoading: loadingPedido, isError: errorPedido } = useQuery({
    queryKey: ['pedido', id],
    queryFn: () => pedidosApi.get(id!),
    enabled: !!id,
  });

  const { data: historial = [], isLoading: loadingHistorial } = useQuery({
    queryKey: ['pedido-historial', id],
    queryFn: () => pedidosApi.getHistorial(id!),
    enabled: !!id,
  });

  const handleCancelar = async () => {
    if (!id) return;
    if (!window.confirm('¿Estás seguro de que deseas cancelar este pedido?')) return;

    try {
      await pedidosApi.updateEstado(id, { nuevo_estado: 'CANCELADO' });
      queryClient.invalidateQueries({ queryKey: ['pedido', id] });
      queryClient.invalidateQueries({ queryKey: ['pedido-historial', id] });
      queryClient.invalidateQueries({ queryKey: ['mis-pedidos'] });
    } catch {
      alert('No se pudo cancelar el pedido. Intenta de nuevo.');
    }
  };

  const isOwner = pedido && user && pedido.usuario_id === user.id;

  if (loadingPedido) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        Cargando pedido…
      </div>
    );
  }

  if (errorPedido || !pedido) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500">
        Pedido no encontrado.
      </div>
    );
  }

  const fecha = new Date(pedido.created_at).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link
            to="/mis-pedidos"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            ← Mis Pedidos
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-slate-900">
              Pedido #{pedido.id.slice(0, 8).toUpperCase()}…
            </h1>
            <EstadoBadge estado={pedido.estado_codigo} />
          </div>
          <p className="text-sm text-slate-400 mt-1">{fecha}</p>
        </div>

        {/* Order metadata */}
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-semibold text-slate-900">Información del pedido</h2>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div>
              <span className="text-slate-400">Dirección:</span>{' '}
              {pedido.direccion_snapshot}
            </div>
            <div>
              <span className="text-slate-400">Cliente:</span>{' '}
              {pedido.nombre_cliente_snapshot}
              {pedido.telefono_snapshot && ` · ${pedido.telefono_snapshot}`}
            </div>
            {pedido.notas && (
              <div>
                <span className="text-slate-400">Notas:</span> {pedido.notas}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(pedido.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>${Number(pedido.costo_envio).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
              <span>Total</span>
              <span>${Number(pedido.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Detalles table */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Detalle de productos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-slate-400 uppercase">
                  <th className="pb-2 pr-3">Producto</th>
                  <th className="pb-2 pr-3">Precio</th>
                  <th className="pb-2 pr-3 text-center">Cant.</th>
                  <th className="pb-2 pr-3">Personaliz.</th>
                  <th className="pb-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.detalles.map((d) => (
                  <DetalleRow key={d.id} detalle={d} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Historial de estado</h2>
          {loadingHistorial ? (
            <p className="text-sm text-slate-400">Cargando historial…</p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-slate-400">Sin historial</p>
          ) : (
            <div>
              {historial.map((h) => (
                <HistorialItem key={h.id} item={h} />
              ))}
            </div>
          )}
        </div>

        {/* Cancel button — visible if PENDIENTE and user is owner */}
        {pedido.estado_codigo === 'PENDIENTE' && isOwner && (
          <button
            onClick={handleCancelar}
            className="w-full px-5 py-3 border border-red-300 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors"
          >
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  );
}
