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
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 flex-col items-center justify-center p-12 text-white">
        <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-5xl font-bold mb-6 shadow-lg backdrop-blur-sm">
          F
        </div>
        <h1 className="text-4xl font-bold mb-3 tracking-tight">Food Store</h1>
        <p className="text-orange-100 text-lg text-center max-w-xs leading-relaxed">
          Tu plataforma de gestión de pedidos y productos
        </p>
        <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-xs opacity-30">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/40" />
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl">
                F
              </div>
              <span className="text-xl font-bold text-slate-900">Food Store</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido de nuevo</h2>
            <p className="text-slate-500 mt-1 text-sm">Ingresá a tu cuenta para continuar</p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
            className="space-y-5"
          >
            <form.Field name="email">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition placeholder-slate-400"
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                  <input
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition placeholder-slate-400"
                    required
                  />
                </div>
              )}
            </form.Field>

            {serverError && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-orange-500 hover:text-orange-600 font-semibold">
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
