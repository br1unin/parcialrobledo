import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';

import { CartDrawer } from '@/features/carrito/ui/CartDrawer';
import { CartIcon } from '@/features/carrito/ui/CartIcon';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { ProductoCatalogPage } from '@/features/productos/ui/ProductoCatalogPage';
import { CategoriasPage } from '@/pages/CategoriasPage';
import { CarritoPage } from '@/pages/CarritoPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { DireccionesPage } from '@/pages/DireccionesPage';
import { IngredientesPage } from '@/pages/IngredientesPage';
import { LoginPage } from '@/pages/LoginPage';
import { MisPedidosPage } from '@/pages/MisPedidosPage';
import { PedidoDetailPage } from '@/pages/PedidoDetailPage';
import { ProductosAdminPage } from '@/pages/ProductosAdminPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { PrivateRoute } from '@/shared/ui/PrivateRoute';
import { useAuthStore } from '@/store/authStore';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">🍔 Food Store</h1>
        <p className="text-slate-600">
          Bienvenido, <span className="font-medium">{user?.nombre}</span>
        </p>
        <p className="text-sm text-slate-400">Roles: {user?.roles.join(', ')}</p>
        <div className="flex gap-3 justify-center mt-4 flex-wrap">
          <Link
            to="/catalogo"
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
          >
            Catálogo
          </Link>
          <Link
            to="/categorias"
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
          >
            Categorías
          </Link>
          <Link
            to="/carrito"
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
          >
            Carrito
          </Link>
          <Link
            to="/mis-direcciones"
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
          >
            Mis Direcciones
          </Link>
          <Link
            to="/mis-pedidos"
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-sm font-medium text-orange-700 transition-colors"
          >
            Mis Pedidos
          </Link>
          <CartIcon />
          {(user?.roles.includes('ADMIN') || user?.roles.includes('STOCK')) && (
            <>
              <Link
                to="/admin/ingredientes"
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
              >
                Ingredientes
              </Link>
              <Link
                to="/admin/productos"
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
              >
                Productos Admin
              </Link>
            </>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <CartDrawer />
      <ConfirmModal />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path="/catalogo" element={<ProductoCatalogPage />} />
        <Route path="/carrito" element={<CarritoPage />} />
        <Route
          path="/categorias"
          element={
            <PrivateRoute>
              <CategoriasPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/ingredientes"
          element={
            <PrivateRoute>
              <IngredientesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <PrivateRoute>
              <ProductosAdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-direcciones"
          element={
            <PrivateRoute>
              <DireccionesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <CheckoutPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-pedidos"
          element={
            <PrivateRoute>
              <MisPedidosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-pedidos/:id"
          element={
            <PrivateRoute>
              <PedidoDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
