import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = {
  Deployment: '#3b82f6', Functional: '#8b5cf6',
  Marketing: '#ec4899', Research: '#10b981',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;
  const isSeria = user.company === 'SERIA';
  const deptColor = DEPT_COLORS[user.department] || '#00C851';

  const links = isSeria
    ? [{ to: '/seria', label: '🏠 Home' }]
    : [
        { to: '/dashboard', label: '🏠 Home' },
        { to: '/chat', label: '💬 Chat' },
        { to: '/email', label: '📧 Email' },
        { to: '/ideas', label: '💡 Ideas' },
        { to: '/policies', label: '📋 Policies' },
        { to: '/materials', label: '📁 Materials' },
        ...(user.role === 'admin' ? [{ to: '/admin', label: '⚙️ Admin' }] : []),
      ];

  return (
    <nav className="navbar">
      <span className="navbar-brand">🏢 WorkSpace</span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} className={`navbar-right ${location.pathname === l.to ? 'active' : ''}`}
            style={{ color: location.pathname === l.to ? '#00C851' : 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '6px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: deptColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{user.name.split(' ')[0]}</span>
        </Link>
        <button onClick={() => { logout(); navigate('/'); }}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
