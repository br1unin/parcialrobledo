import type { Producto } from '../types';

interface Props {
  items: Producto[];
  onEdit: (item: Producto) => void;
  onDelete: (id: string) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export function ProductoTable({ items, onEdit, onDelete, onAdjustStock }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No hay productos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 px-3 font-semibold text-slate-600">Nombre</th>
            <th className="py-2 px-3 font-semibold text-slate-600">Precio</th>
            <th className="py-2 px-3 font-semibold text-slate-600">Stock</th>
            <th className="py-2 px-3 font-semibold text-slate-600">Disponible</th>
            <th className="py-2 px-3 font-semibold text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-3 text-slate-800 font-medium">{item.nombre}</td>
              <td className="py-2 px-3 text-slate-700">${Number(item.precio).toFixed(2)}</td>
              <td className="py-2 px-3 text-slate-700">{item.stock_cantidad}</td>
              <td className="py-2 px-3">
                {item.disponible ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Sí
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    No
                  </span>
                )}
              </td>
              <td className="py-2 px-3">
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => onEdit(item)}
                    className="px-2 py-1 text-xs font-medium bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, 1)}
                    className="px-2 py-1 text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => onAdjustStock(item.id, -1)}
                    disabled={item.stock_cantidad === 0}
                    className="px-2 py-1 text-xs font-medium bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors disabled:opacity-40"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-2 py-1 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
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
