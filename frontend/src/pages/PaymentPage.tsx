import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { pedidosApi } from '@/features/pedidos/api';
import { useCartStore } from '@/store/cartStore';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10; // 10 attempts × 3s = 30s

type PaymentView = 'approved' | 'pending' | 'failure' | 'polling' | 'timeout';

export function PaymentPage() {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);

  const status = searchParams.get('status') ?? 'failure';
  const externalReference = searchParams.get('external_reference') ?? '';
  const paymentId = searchParams.get('payment_id') ?? '';

  const [view, setView] = useState<PaymentView>(() => {
    if (status === 'approved') return 'approved';
    if (status === 'pending') return 'polling';
    return 'failure';
  });

  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear cart on approved
  useEffect(() => {
    if (view === 'approved') {
      clearCart();
    }
  }, [view, clearCart]);

  // Polling logic for pending payments
  useEffect(() => {
    if (view !== 'polling' || !externalReference) return;

    const poll = async () => {
      try {
        const pedido = await pedidosApi.get(externalReference);
        if (pedido.estado_codigo === 'CONFIRMADO') {
          setView('approved');
          return;
        }
      } catch {
        // Ignore fetch errors during polling — keep trying
      }

      pollCount.current += 1;
      if (pollCount.current >= POLL_MAX_ATTEMPTS) {
        setView('timeout');
        return;
      }

      pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
    };

    pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [view, externalReference]);

  if (view === 'approved') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold text-slate-900">Pago exitoso</h1>
          <p className="text-slate-600">
            Tu pago fue aprobado y tu pedido está siendo procesado.
          </p>
          {paymentId && (
            <p className="text-xs text-slate-400">ID de pago: {paymentId}</p>
          )}
          {externalReference && (
            <Link
              to={`/mis-pedidos/${externalReference}`}
              className="inline-block mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
            >
              Ver mi pedido
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (view === 'polling') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="text-5xl animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold text-slate-900">Pago pendiente</h1>
          <p className="text-slate-600">
            Tu pago está siendo procesado. Esperando confirmación…
          </p>
          <p className="text-xs text-slate-400">Esto puede tardar unos segundos.</p>
        </div>
      </div>
    );
  }

  if (view === 'timeout') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
          <div className="text-5xl">⏰</div>
          <h1 className="text-2xl font-bold text-slate-900">Pago en proceso</h1>
          <p className="text-slate-600">
            Tu pago está siendo procesado por MercadoPago. Puede demorar unos minutos en confirmarse.
          </p>
          {externalReference && (
            <Link
              to={`/mis-pedidos/${externalReference}`}
              className="inline-block mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
            >
              Ver estado del pedido
            </Link>
          )}
        </div>
      </div>
    );
  }

  // failure or any other status
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        <div className="text-5xl">❌</div>
        <h1 className="text-2xl font-bold text-slate-900">Pago fallido</h1>
        <p className="text-slate-600">
          El pago no pudo completarse. Puedes intentarlo de nuevo desde tu carrito.
        </p>
        <Link
          to="/carrito"
          className="inline-block mt-4 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-colors"
        >
          Volver al carrito
        </Link>
      </div>
    </div>
  );
}
