import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/authStore';

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { nombre: '', apellido: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const data = await authApi.register(value);
        login(data.access_token, data.refresh_token, data.user);
        navigate('/');
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 409) {
          setServerError('Este email ya está registrado.');
        } else {
          setServerError('No se pudo registrar. Intentá de nuevo.');
        }
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Crear cuenta</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <form.Field name="nombre">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="apellido">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="email">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Contraseña (mín. 8 caracteres)
                </label>
                <input
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                  minLength={8}
                />
              </div>
            )}
          </form.Field>

          {serverError && (
            <p className="text-sm text-red-600">{serverError}</p>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-orange-500 hover:underline font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
