import type { ReactElement } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getToken } from './api/client';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AddressPage from './pages/AddressPage';

import OrderListPage from './pages/OrderListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListPage from './pages/ProductListPage';

function RequireAuth({ children }: { children: ReactElement }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function MobileTabBar() {
  const location = useLocation();
  if (location.pathname === '/login' || location.pathname === '/register') {

    return null;
  }

  return (
    <nav className="mobile-tabbar" aria-label="移动端导航">
      <NavLink to="/products">商品</NavLink>
      <NavLink to="/cart">购物车</NavLink>
      <NavLink to="/addresses">地址</NavLink>
      <NavLink to="/orders">订单</NavLink>

    </nav>
  );
}

export default function App() {
  return (
    <div className="mobile-shell">
      <main className="mobile-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<RequireAuth><ProductListPage /></RequireAuth>} />

          <Route path="/products/:productId" element={<RequireAuth><ProductDetailPage /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
          <Route path="/addresses" element={<RequireAuth><AddressPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrderListPage /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
      <MobileTabBar />
    </div>
  );
}
