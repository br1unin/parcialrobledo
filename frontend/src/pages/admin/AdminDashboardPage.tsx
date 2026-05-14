import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { adminApi } from '@/api/admin';
import type { PedidosPorEstado } from '@/types/admin';

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}

function PedidosEstadoTable({ items }: { items: PedidosPorEstado[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 mt-2">Sin pedidos registrados.</p>;
  }
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Cantidad
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((row) => (
            <tr key={row.estado}>
              <td className="px-4 py-3 text-sm text-slate-700 font-medium">{row.estado}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right font-semibold">
                {row.cantidad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getDashboardStats,
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link to="/" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Resumen general de la tienda</p>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-slate-400">Cargando estadísticas…</div>
        )}

        {isError && (
          <div className="text-center py-12 text-red-500">
            Error al cargar estadísticas. Intenta de nuevo.
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Total Usuarios" value={data.total_usuarios} />
              <StatCard title="Total Productos" value={data.total_productos} subtitle="activos" />
              <StatCard
                title="Ingresos Totales"
                value={`$${Number(data.ingresos_totales).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                subtitle="pagos aprobados"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-700 mb-3">Pedidos por Estado</h2>
              <PedidosEstadoTable items={data.pedidos_por_estado} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
