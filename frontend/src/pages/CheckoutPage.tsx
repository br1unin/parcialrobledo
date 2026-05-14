import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { direccionesApi } from '@/features/direcciones/api';
import { pedidosApi } from '@/features/pedidos/api';
import { pagosApi } from '@/features/pagos/api';
import { useCartStore } from '@/store/cartStore';

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const costoEnvio = useCartStore((s) => s.costoEnvio);
  const total = useCartStore((s) => s.total);

  const [selectedDireccionId, setSelectedDireccionId] = useState<string>('');
  const [notas, setNotas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to carrito if cart is empty
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
    if (!selectedDireccionId || items.length === 0) return;

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

      const preference = await pagosApi.createPreference(String(pedido.id));

      // Redirect to MercadoPago hosted payment page
      window.location.href = preference.init_point;
    } catch (err) {
      if (err instanceof AxiosError) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Error al procesar el pedido');
      } else {
        setError('Error inesperado. Intenta de nuevo.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link to="/carrito" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Volver al carrito
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Confirmar pedido</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Cart summary */}
          <div className="bg-white rounded-xl shadow p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Resumen del carrito</h2>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div
                  key={`${item.productoId}-${JSON.stringify(item.personalizacion)}`}
                  className="flex justify-between py-2 text-sm text-slate-700"
                >
                  <span>
                    {item.nombre} × {item.cantidad}
                    {item.personalizacion.length > 0 && (
                      <span className="text-slate-400 text-xs ml-1">
                        (sin {item.personalizacion.join(', ')})
                      </span>
                    )}
                  </span>
                  <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-100 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>${costoEnvio().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-base pt-1 border-t border-slate-100">
                <span>Total</span>
                <span>${total().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Address selector */}
          <div className="bg-white rounded-xl shadow p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Dirección de entrega</h2>
            {loadingDirecciones ? (
              <p className="text-sm text-slate-400">Cargando direcciones…</p>
            ) : direcciones.length === 0 ? (
              <p className="text-sm text-slate-500">
                No tienes direcciones guardadas.{' '}
                <Link to="/mis-direcciones" className="text-orange-500 hover:underline">
                  Agregar una
                </Link>
              </p>
            ) : (
              <select
                value={selectedDireccionId}
                onChange={(e) => setSelectedDireccionId(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">— Selecciona una dirección —</option>
                {direcciones.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {dir.calle} {dir.numero}, {dir.comuna}, {dir.ciudad}
                    {dir.es_principal ? ' (Principal)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow p-5 space-y-3">
            <h2 className="font-semibold text-slate-900">Notas (opcional)</h2>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Instrucciones especiales, referencias, etc."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !selectedDireccionId || items.length === 0}
            className="w-full px-5 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            {submitting ? 'Redirigiendo a MercadoPago…' : 'Pagar con MercadoPago'}
          </button>
        </form>
      </div>
    </div>
  );
}
