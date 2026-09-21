import type { ReactElement } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductListPage from './pages/ProductListPage';


import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrderListPage from './pages/OrderListPage';
import AddressPage from './pages/AddressPage';


function RequireAuth({ children }: { children: ReactElement }) {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('access_token'));

  function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('nickname');
    navigate('/login');
  }

  return (
    <header className="app-header">
      <Link className="brand" to="/products">Mall Quality Demo</Link>
      <nav className="nav-links">
        {isLoggedIn && <Link to="/products">商品</Link>}
        {isLoggedIn && <Link to="/cart">购物车</Link>}
        {isLoggedIn && <Link to="/addresses">地址</Link>}
        {isLoggedIn && <Link to="/orders">订单</Link>}

        {isLoggedIn && <button className="link-button" onClick={logout}>退出登录</button>}
      </nav>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
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
    </div>
  );
}
