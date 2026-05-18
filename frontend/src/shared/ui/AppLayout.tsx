import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { CartFAB } from '@/features/carrito/ui/CartFAB';

const PAGE_TITLES: Record<string, string> = {
  '/catalogo': 'Catálogo',
  '/carrito': 'Mi Carrito',
  '/mis-pedidos': 'Mis Pedidos',
  '/mis-direcciones': 'Mis Direcciones',
  '/perfil': 'Mi Perfil',
  '/checkout': 'Checkout',
  '/payment': 'Estado del pago',
  '/categorias': 'Categorías',
  '/admin/productos': 'Productos',
  '/admin/ingredientes': 'Ingredientes',
  '/admin/dashboard': 'Dashboard',
  '/admin/usuarios': 'Gestión de Usuarios',
  '/admin': 'Configuración',
};

export function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isDetail = location.pathname.startsWith('/mis-pedidos/');
  const title = isDetail
    ? 'Detalle del Pedido'
    : (PAGE_TITLES[location.pathname] ?? 'Food Store');

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 h-14 flex items-center">
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
        </header>
        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <CartFAB />
    </div>
  );
}
