import { useEffect, useState } from 'react';
import { listUsers } from '../api/admin';
import type { AdminUser } from '../api/types';

const roleLabels: Record<string, string> = {
  customer: '买家',
  merchant: '商家',
  company_admin: '公司管理人员',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function matchesUser(user: AdminUser, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [
    user.id,
    user.username,
    user.nickname,
    roleLabels[user.role] || user.role,
    user.order_count,
    user.cart_item_count,
    user.address_count,
    formatDate(user.created_at),
  ].some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}


export default function UserListPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : '用户加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((user) => matchesUser(user, searchKeyword));

  return (
    <section className="section-stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">用户管理</p>
          <h2>查看商城用户和行为数据</h2>
        </div>
        <span className="summary-pill">共 {users.length} 位用户</span>
      </div>

      <div className="search-panel admin-search-panel">
        <label>
          搜索用户
          <input
            type="search"
            placeholder="按用户 ID、用户名、昵称、角色或行为数据搜索"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
        <span>匹配 {filteredUsers.length} 位</span>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="panel table-panel">
        {loading ? (
          <div className="state-panel">用户加载中...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">没有找到匹配的用户。</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>用户 ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th>角色</th>
                <th>订单数</th>
                <th>购物车商品数</th>
                <th>地址数</th>
                <th>注册日期</th>

              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>#{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.nickname}</td>
                  <td>{roleLabels[user.role] || user.role}</td>
                  <td>{user.order_count}</td>
                  <td>{user.cart_item_count}</td>
                  <td>{user.address_count}</td>
                  <td>{formatDate(user.created_at)}</td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
