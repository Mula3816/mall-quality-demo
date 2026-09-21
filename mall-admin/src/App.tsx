import type { ReactElement } from 'react';
import { NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { clearAdminToken, getAdminRole, getAdminToken } from './api/client';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import OrderManagePage from './pages/OrderManagePage';
import ProductManagePage from './pages/ProductManagePage';
import UserListPage from './pages/UserListPage';

const roleLabels: Record<string, string> = {
  merchant: '商家',
  company_admin: '公司管理人员',
};

function RequireAdmin({ children }: { children: ReactElement }) {
  if (!getAdminToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireCompanyAdmin({ children }: { children: ReactElement }) {
  if (getAdminRole() !== 'company_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AdminLayout() {
  const navigate = useNavigate();
  const nickname = localStorage.getItem('admin_nickname') || '后台用户';
  const role = getAdminRole() || 'merchant';
  const roleLabel = roleLabels[role] || '后台用户';

  function logout() {
    clearAdminToken();
    navigate('/login');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <p>商城管理后台</p>
          <strong>Mall Admin</strong>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard">概览</NavLink>
          <NavLink to="/products">商品管理</NavLink>
          <NavLink to="/orders">订单管理</NavLink>
          {role === 'company_admin' && <NavLink to="/users">用户管理</NavLink>}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <p className="eyebrow">管理控制台</p>
            <h1>后台运营面板</h1>
          </div>
          <div className="admin-header-actions">
            <div className="admin-user-chip">{nickname} · {roleLabel}</div>
            <button className="logout-button" onClick={logout}>退出登录</button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductManagePage />} />
        <Route path="/orders" element={<OrderManagePage />} />
        <Route path="/users" element={<RequireCompanyAdmin><UserListPage /></RequireCompanyAdmin>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
