import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment: '#3b82f6', Functional: '#8b5cf6', Marketing: '#ec4899', Research: '#10b981' };

export default function AdminPage() {
  const { user, API } = useAuth();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('users');
  const [msg, setMsg] = useState('');

  const fetchUsers = () => axios.get(`${API}/users`).then(r => setUsers(r.data)).catch(() => {});

  // ✅ Hook MUST be called unconditionally — before any early return
  useEffect(() => {
    if (user?.role === 'admin') fetchUsers();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⛔</div>
          <h2>Admins only</h2>
        </div>
      </div>
    );
  }

  const updateRole = async (id, role) => {
    await axios.put(`${API}/users/${id}`, { role });
    setMsg('Updated!'); fetchUsers(); setTimeout(() => setMsg(''), 2000);
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await axios.delete(`${API}/users/${id}`);
    setMsg('User deleted'); fetchUsers(); setTimeout(() => setMsg(''), 2000);
  };

  const bizaxlUsers = users.filter(u => u.company === 'BIZAXL');
  const seriaUsers = users.filter(u => u.company === 'SERIA');

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Admin Panel</h1>
        <p className="page-sub">{users.length} total users across all companies</p>
      </div>

      {msg && <div className="card" style={{ marginBottom: 16, background: '#f0fdf4', color: '#16a34a', padding: '12px 16px' }}>{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Users', value: users.length, color: '#1a1a2e', emoji: '👥' },
          { label: 'BIZAXL', value: bizaxlUsers.length, color: '#00C851', emoji: '🏢' },
          { label: 'SERIA', value: seriaUsers.length, color: '#f59e0b', emoji: '🏷️' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#ef4444', emoji: '🔑' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.emoji}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['users', 'bizaxl', 'seria'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: tab === t ? '#1a1a2e' : 'var(--bg)', color: tab === t ? '#00C851' : 'var(--muted)' }}>
            {t === 'users' ? '👥 All Users' : t === 'bizaxl' ? '🏢 BIZAXL' : '🏷️ SERIA'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              {['Name', 'Email', 'Company', 'Department', 'Role', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tab === 'users' ? users : tab === 'bizaxl' ? bizaxlUsers : seriaUsers).map((u, i) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>{u.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: '#f0fdf4', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{u.company}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.department && <span style={{ background: (DEPT_COLORS[u.department] || '#666') + '20', color: DEPT_COLORS[u.department] || '#666', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{u.department}</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.id !== user.id ? (
                    <select className="select" style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }} value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                      {['employee', 'admin', 'marketing', 'director'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>admin (you)</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {u.id !== user.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.name)}>🗑</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No users yet.</div>}
      </div>
    </div>
  );
}
