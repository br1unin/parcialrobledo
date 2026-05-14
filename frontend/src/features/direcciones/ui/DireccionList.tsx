import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { direccionesApi } from '../api';
import type { DireccionEntrega } from '../types';

const QUERY_KEY = ['direcciones'];

interface Props {
  onEdit: (d: DireccionEntrega) => void;
}

export function DireccionList({ onEdit }: Props) {
  const queryClient = useQueryClient();

  const { data: direcciones = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: direccionesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => direccionesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const setPredeterminadaMutation = useMutation({
    mutationFn: (id: string) => direccionesApi.setPredeterminada(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  if (isLoading) {
    return <p className="text-sm text-slate-400">Cargando direcciones...</p>;
  }

  if (direcciones.length === 0) {
    return <p className="text-sm text-slate-500">No tienes direcciones guardadas.</p>;
  }

  return (
    <div className="space-y-3">
      {direcciones.map((d) => (
        <div key={d.id} className="border border-slate-200 rounded-lg p-4 bg-white space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-800">
              {d.calle} {d.numero}
              {d.departamento ? `, ${d.departamento}` : ''}
            </p>
            {d.es_principal && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                Predeterminada
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {d.comuna}, {d.ciudad}
            {d.codigo_postal ? ` (${d.codigo_postal})` : ''}
          </p>
          <div className="flex gap-2 pt-2 flex-wrap">
            {!d.es_principal && (
              <button
                onClick={() => setPredeterminadaMutation.mutate(d.id)}
                disabled={setPredeterminadaMutation.isPending}
                className="text-xs px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg font-medium"
              >
                Establecer predeterminada
              </button>
            )}
            <button
              onClick={() => onEdit(d)}
              className="text-xs px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-medium"
            >
              Editar
            </button>
            <button
              onClick={() => deleteMutation.mutate(d.id)}
              disabled={deleteMutation.isPending}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
