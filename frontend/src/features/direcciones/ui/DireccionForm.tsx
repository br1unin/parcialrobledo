import { useForm } from '@tanstack/react-form';
import type { DireccionCreate, DireccionEntrega } from '../types';

interface Props {
  onSubmit: (data: DireccionCreate) => Promise<void>;
  initialData?: DireccionEntrega;
  onCancel: () => void;
}

export function DireccionForm({ onSubmit, initialData, onCancel }: Props) {
  const form = useForm({
    defaultValues: {
      calle: initialData?.calle ?? '',
      numero: initialData?.numero ?? '',
      departamento: initialData?.departamento ?? '',
      comuna: initialData?.comuna ?? '',
      ciudad: initialData?.ciudad ?? '',
      codigo_postal: initialData?.codigo_postal ?? '',
    },
    onSubmit: async ({ value }) => {
      const payload: DireccionCreate = {
        calle: value.calle,
        numero: value.numero,
        departamento: value.departamento || undefined,
        comuna: value.comuna,
        ciudad: value.ciudad,
        codigo_postal: value.codigo_postal || undefined,
      };
      await onSubmit(payload);
    },
  });

  const inputClass =
    'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label className={labelClass}>Calle</label>
        <form.Field
          name="calle"
          children={(field) => (
            <input
              className={inputClass}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              required
            />
          )}
        />
      </div>

      <div>
        <label className={labelClass}>Número</label>
        <form.Field
          name="numero"
          children={(field) => (
            <input
              className={inputClass}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              required
            />
          )}
        />
      </div>

      <div>
        <label className={labelClass}>Departamento (opcional)</label>
        <form.Field
          name="departamento"
          children={(field) => (
            <input
              className={inputClass}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />
      </div>

      <div>
        <label className={labelClass}>Comuna</label>
        <form.Field
          name="comuna"
          children={(field) => (
            <input
              className={inputClass}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              required
            />
          )}
        />
      </div>

      <div>
        <label className={labelClass}>Ciudad</label>
        <form.Field
          name="ciudad"
          children={(field) => (
            <input
              className={inputClass}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              required
            />
          )}
        />
      </div>

      <div>
        <label className={labelClass}>Código postal (opcional)</label>
        <form.Field
          name="codigo_postal"
          children={(field) => (
            <input
              className={inputClass}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-slate-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold"
        >
          {initialData ? 'Guardar cambios' : 'Agregar dirección'}
        </button>
      </div>
    </form>
  );
}
