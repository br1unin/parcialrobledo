import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usuariosApi, type ChangePasswordData, type UpdateProfileData } from '@/api/usuarios';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const openConfirmModal = useUIStore((s) => s.openConfirmModal);

  // -----------------------------------------------------------------------
  // Profile fetch
  // -----------------------------------------------------------------------
  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usuariosApi.getMe,
  });

  // -----------------------------------------------------------------------
  // Edit profile form state
  // -----------------------------------------------------------------------
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({});
  const [profileError, setProfileError] = useState<string | null>(null);

  const updateMeMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => usuariosApi.updateMe(data),
    onSuccess: (updated) => {
      updateUser(updated);
      queryClient.setQueryData(['me'], updated);
      setEditMode(false);
      setProfileError(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al actualizar el perfil';
      setProfileError(msg);
    },
  });

  const handleEditStart = () => {
    if (!profile) return;
    setProfileForm({
      nombre: profile.nombre,
      apellido: profile.apellido,
      telefono: profile.telefono ?? '',
    });
    setEditMode(true);
    setProfileError(null);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateProfileData = {};
    if (profileForm.nombre !== undefined && profileForm.nombre !== profile?.nombre) {
      payload.nombre = profileForm.nombre;
    }
    if (profileForm.apellido !== undefined && profileForm.apellido !== profile?.apellido) {
      payload.apellido = profileForm.apellido;
    }
    if (profileForm.telefono !== undefined) {
      payload.telefono = profileForm.telefono || null;
    }
    updateMeMutation.mutate(payload);
  };

  // -----------------------------------------------------------------------
  // Change password form state
  // -----------------------------------------------------------------------
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    current_password: '',
    new_password: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => usuariosApi.changePassword(data),
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      setPasswordForm({ current_password: '', new_password: '' });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Error al cambiar la contraseña';
      setPasswordError(msg);
      setPasswordSuccess(false);
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  // -----------------------------------------------------------------------
  // Delete account
  // -----------------------------------------------------------------------
  const deleteMeMutation = useMutation({
    mutationFn: usuariosApi.deleteMe,
    onSuccess: () => {
      logout();
      navigate('/login', { replace: true });
    },
  });

  const handleDeleteAccount = () => {
    openConfirmModal(
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      () => deleteMeMutation.mutate(),
    );
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No se pudo cargar el perfil.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        </div>

        {/* ----------------------------------------------------------------
            Read-only profile view
        ---------------------------------------------------------------- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Información personal</h2>
            {!editMode && (
              <button
                onClick={handleEditStart}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Editar
              </button>
            )}
          </div>

          {!editMode ? (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Nombre</dt>
                <dd className="text-slate-800 font-medium">{profile.nombre}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Apellido</dt>
                <dd className="text-slate-800 font-medium">{profile.apellido}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Email</dt>
                <dd className="text-slate-800 font-medium">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Teléfono</dt>
                <dd className="text-slate-800 font-medium">{profile.telefono ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Roles</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {profile.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                    >
                      {r}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400 uppercase tracking-wide">Miembro desde</dt>
                <dd className="text-slate-800 font-medium">
                  {new Date(profile.created_at).toLocaleDateString('es-AR')}
                </dd>
              </div>
            </dl>
          ) : (
            /* ----------------------------------------------------------
               Edit profile form
            ---------------------------------------------------------- */
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={profileForm.nombre ?? ''}
                    onChange={(e) => setProfileForm((f) => ({ ...f, nombre: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={profileForm.apellido ?? ''}
                    onChange={(e) => setProfileForm((f) => ({ ...f, apellido: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={profileForm.telefono ?? ''}
                    onChange={(e) => setProfileForm((f) => ({ ...f, telefono: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {profileError && (
                <p className="text-sm text-red-500">{profileError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updateMeMutation.isPending}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {updateMeMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ----------------------------------------------------------------
            Change password
        ---------------------------------------------------------------- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cambiar contraseña</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña actual
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, current_password: e.target.value }))
                }
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, new_password: e.target.value }))
                }
                required
                minLength={8}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <p className="text-xs text-slate-400 mt-1">Mínimo 8 caracteres</p>
            </div>

            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            {passwordSuccess && (
              <p className="text-sm text-green-600">Contraseña actualizada correctamente.</p>
            )}

            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>

        {/* ----------------------------------------------------------------
            Delete account
        ---------------------------------------------------------------- */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Eliminar cuenta</h2>
          <p className="text-sm text-slate-500 mb-4">
            Al eliminar tu cuenta, perderás acceso permanentemente. Esta acción no se puede
            deshacer.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteMeMutation.isPending}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {deleteMeMutation.isPending ? 'Eliminando...' : 'Eliminar mi cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
