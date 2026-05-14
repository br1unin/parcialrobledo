import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { CartDrawer } from '@/features/carrito/ui/CartDrawer';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { ProductoCatalogPage } from '@/features/productos/ui/ProductoCatalogPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { AdminUsuariosPage } from '@/pages/admin/AdminUsuariosPage';
import { CategoriasPage } from '@/pages/CategoriasPage';
import { CarritoPage } from '@/pages/CarritoPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { DireccionesPage } from '@/pages/DireccionesPage';
import { IngredientesPage } from '@/pages/IngredientesPage';
import { LoginPage } from '@/pages/LoginPage';
import { MisPedidosPage } from '@/pages/MisPedidosPage';
import { PaymentPage } from '@/pages/PaymentPage';
import { PedidoDetailPage } from '@/pages/PedidoDetailPage';
import { ProductosAdminPage } from '@/pages/ProductosAdminPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AdminRoute } from '@/shared/ui/AdminRoute';
import { AppLayout } from '@/shared/ui/AppLayout';
import { useAuthStore } from '@/store/authStore';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/catalogo" replace />;
  return <>{children}</>;
}

export function Router() {
  return (
    <BrowserRouter>
      <CartDrawer />
      <ConfirmModal />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><RegisterPage /></PublicRoute>}
        />

        {/* App routes — all inside sidebar layout */}
        <Route element={<AppLayout />}>
          <Route path="/catalogo" element={<ProductoCatalogPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/mis-direcciones" element={<DireccionesPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          <Route path="/mis-pedidos/:id" element={<PedidoDetailPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin/ingredientes" element={<IngredientesPage />} />
          <Route path="/admin/productos" element={<ProductosAdminPage />} />
          <Route
            path="/admin"
            element={<AdminRoute><AdminPage /></AdminRoute>}
          />
          <Route
            path="/admin/dashboard"
            element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
          />
          <Route
            path="/admin/usuarios"
            element={<AdminRoute><AdminUsuariosPage /></AdminRoute>}
          />
          <Route path="/" element={<Navigate to="/catalogo" replace />} />
          <Route path="/*" element={<Navigate to="/catalogo" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
