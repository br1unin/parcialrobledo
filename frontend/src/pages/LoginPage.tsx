import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const data = await authApi.login(value);
        login(data.access_token, data.refresh_token, data.user);
        navigate('/');
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 429) {
          setServerError('Demasiados intentos. Intentá de nuevo en unos minutos.');
        } else {
          setServerError('Credenciales inválidas. Verificá tu email y contraseña.');
        }
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 text-center">Iniciar sesión</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
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
            Ingresar
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-orange-500 hover:underline font-medium">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
