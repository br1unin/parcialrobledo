import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { direccionesApi } from '@/features/direcciones/api';
import { pedidosApi } from '@/features/pedidos/api';
import { pagosApi } from '@/features/pagos/api';
import { useCartStore } from '@/store/cartStore';

import type { TransferenciaResponse } from '@/features/pagos/types';

type MetodoPago = 'MERCADOPAGO' | 'EFECTIVO' | 'TRANSFERENCIA';

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

const METODOS: { id: MetodoPago; label: string; desc: string; icon: string }[] = [
  {
    id: 'MERCADOPAGO',
    label: 'MercadoPago',
    desc: 'Tarjeta, débito o saldo MP',
    icon: '💳',
  },
  {
    id: 'EFECTIVO',
    label: 'Efectivo',
    desc: 'Pagás al momento de la entrega',
    icon: '💵',
  },
  {
    id: 'TRANSFERENCIA',
    label: 'Transferencia',
    desc: 'CBU / alias bancario',
    icon: '🏦',
  },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const costoEnvio = useCartStore((s) => s.costoEnvio);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);

  const [selectedDireccionId, setSelectedDireccionId] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('MERCADOPAGO');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferData, setTransferData] = useState<TransferenciaResponse | null>(null);

  if (items.length === 0) {
    navigate('/carrito', { replace: true });
    return null;
  }

  const { data: direcciones = [], isLoading: loadingDirecciones } = useQuery({
    queryKey: ['direcciones'],
    queryFn: () => direccionesApi.list(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDireccionId) return;

    setSubmitting(true);
    setError(null);

    try {
      const pedido = await pedidosApi.create({
        direccion_entrega_id: selectedDireccionId,
        items: items.map((item) => ({
          producto_id: String(item.productoId),
          cantidad: item.cantidad,
          personalizacion: item.personalizacion,
        })),
        notas: notas.trim() || undefined,
      });

      if (metodoPago === 'MERCADOPAGO') {
        const preference = await pagosApi.createPreference(String(pedido.id));
        window.location.href = preference.init_point;
      } else if (metodoPago === 'EFECTIVO') {
        await pagosApi.pagarEfectivo(String(pedido.id));
        clearCart();
        navigate('/mis-pedidos', { state: { successMessage: 'Pedido confirmado. Abonás en efectivo al momento de la entrega.' } });
      } else {
        const data = await pagosApi.pagarTransferencia(String(pedido.id));
        clearCart();
        setTransferData(data);
        setSubmitting(false);
        return;
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Error al procesar el pedido');
      } else {
        setError('Error inesperado. Intentá de nuevo.');
      }
      setSubmitting(false);
    }
  };

  // Pantalla post-transferencia
  if (transferData) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl mx-auto">✅</div>
          <h2 className="text-lg font-bold text-slate-900">Pedido registrado</h2>
          <p className="text-sm text-slate-500">{transferData.mensaje}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span>🏦</span> Datos para la transferencia
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Banco', value: transferData.banco },
              { label: 'Titular', value: transferData.titular },
              { label: 'CBU', value: transferData.cbu },
              { label: 'Alias', value: transferData.alias },
              { label: 'Monto a transferir', value: formatPrice(Number(transferData.monto)) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
                <span className="text-sm font-semibold text-slate-800 select-all">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center pt-1">
            Una vez confirmada la transferencia, procesamos tu pedido.
          </p>
        </div>

        <button
          onClick={() => navigate('/mis-pedidos')}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Ver mis pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/carrito"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-orange-500 hover:border-orange-300 transition-all shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Confirmar pedido</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Resumen */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Resumen del pedido</h2>
          <div className="divide-y divide-slate-50">
            {items.map((item) => (
              <div
                key={`${item.productoId}-${JSON.stringify(item.personalizacion)}`}
                className="flex justify-between py-2 text-sm text-slate-700"
              >
                <span>
                  {item.nombre} <span className="text-slate-400">× {item.cantidad}</span>
                  {item.personalizacion.length > 0 && (
                    <span className="text-slate-400 text-xs ml-1">(sin {item.personalizacion.join(', ')})</span>
                  )}
                </span>
                <span className="font-medium">{formatPrice(item.precio * item.cantidad)}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{costoEnvio() === 0 ? <span className="text-emerald-500 font-medium">Gratis</span> : formatPrice(costoEnvio())}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-100">
              <span>Total</span>
              <span className="text-orange-500">{formatPrice(total())}</span>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Dirección de entrega</h2>
          {loadingDirecciones ? (
            <div className="h-9 bg-slate-100 animate-pulse rounded-xl" />
          ) : direcciones.length === 0 ? (
            <p className="text-sm text-slate-500">
              No tenés direcciones guardadas.{' '}
              <Link to="/mis-direcciones" className="text-orange-500 hover:underline font-medium">
                Agregar una
              </Link>
            </p>
          ) : (
            <select
              value={selectedDireccionId}
              onChange={(e) => setSelectedDireccionId(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">— Seleccioná una dirección —</option>
              {direcciones.map((dir) => (
                <option key={dir.id} value={dir.id}>
                  {dir.calle} {dir.numero}, {dir.ciudad}
                  {dir.es_principal ? ' ⭐ Principal' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Método de pago */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Método de pago</h2>
          <div className="grid grid-cols-3 gap-3">
            {METODOS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodoPago(m.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                  metodoPago === m.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {metodoPago === m.id && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className={`text-sm font-semibold ${metodoPago === m.id ? 'text-orange-600' : 'text-slate-800'}`}>
                    {m.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {metodoPago === 'EFECTIVO' && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <span className="text-base mt-0.5">ℹ️</span>
              <span>Tu pedido se confirma ahora. Abonás en efectivo al momento de la entrega.</span>
            </div>
          )}
          {metodoPago === 'TRANSFERENCIA' && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              <span className="text-base mt-0.5">ℹ️</span>
              <span>Al confirmar, te mostramos los datos bancarios. Tu pedido queda pendiente hasta que verifiquemos el pago.</span>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">Notas <span className="text-slate-400 font-normal">(opcional)</span></h2>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Instrucciones especiales, referencias, timbre, etc."
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !selectedDireccionId}
          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          {submitting ? 'Procesando…' : {
            MERCADOPAGO: 'Pagar con MercadoPago 💳',
            EFECTIVO: 'Confirmar — Pago en efectivo 💵',
            TRANSFERENCIA: 'Confirmar — Ver datos bancarios 🏦',
          }[metodoPago]}
        </button>
      </form>
    </div>
  );
}
