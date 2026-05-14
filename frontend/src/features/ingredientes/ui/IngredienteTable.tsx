import type { Ingrediente } from '../types';

interface Props {
  items: Ingrediente[];
  onEdit: (item: Ingrediente) => void;
  onDelete: (id: string) => void;
}

export function IngredienteTable({ items, onEdit, onDelete }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No hay ingredientes registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 px-3 font-semibold text-slate-600">Nombre</th>
            <th className="py-2 px-3 font-semibold text-slate-600">Alérgeno</th>
            <th className="py-2 px-3 font-semibold text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-3 text-slate-800">{item.nombre}</td>
              <td className="py-2 px-3">
                {item.es_alergeno ? (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Alérgeno
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-xs">—</span>
                )}
              </td>
              <td className="py-2 px-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="px-3 py-1 text-xs font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-3 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
