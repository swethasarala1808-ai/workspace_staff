import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment: '#3b82f6', Functional: '#8b5cf6', Marketing: '#ec4899', Research: '#10b981' };
const DEPT_BG = { Deployment: '#dbeafe', Functional: '#ede9fe', Marketing: '#fce7f3', Research: '#d1fae5' };

export default function Dashboard() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [msgs, setMsgs] = useState([]);

  const deptColor = DEPT_COLORS[user.department] || '#00C851';
  const deptBg = DEPT_BG[user.department] || '#d1fae5';

  useEffect(() => {
    axios.get(`${API}/policies`).then(r => setPolicies(r.data)).catch(() => {});
    axios.get(`${API}/ideas`).then(r => setIdeas(r.data.slice(0, 3))).catch(() => {});
    axios.get(`${API}/chat/messages/company`).then(r => setMsgs(r.data.slice(-5))).catch(() => {});
  }, [API]);

  const unreadPolicies = policies.filter(p => !p.read).length;

  const tiles = [
    { to: '/chat', icon: '💬', label: 'Chat', desc: 'Team & company' },
    { to: '/email', icon: '📧', label: 'Email', desc: 'Hostinger inbox' },
    { to: '/ideas', icon: '💡', label: 'Ideas', desc: 'Share & vote' },
    { to: '/policies', icon: '📋', label: 'Policies', desc: unreadPolicies > 0 ? `${unreadPolicies} unread` : 'All read ✅', alert: unreadPolicies > 0 },
    { to: '/materials', icon: '📁', label: 'Materials', desc: 'Company docs' },
    { to: '/profile', icon: '👤', label: 'Profile', desc: 'Settings' },
  ];

  return (
    <div className="container">
      {/* Welcome banner */}
      <div className="card" style={{ background: `linear-gradient(135deg, ${deptColor} 0%, ${deptColor}cc 100%)`, marginBottom: 24, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Welcome back, {user.name.split(' ')[0]}! 👋</h2>
            <p style={{ opacity: 0.9, fontSize: 15 }}>{user.department} · {user.company} · {user.role}</p>
          </div>
          <div style={{ fontSize: 48 }}>🏢</div>
        </div>
      </div>

      {/* Quick tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {tiles.map(t => (
          <Link key={t.to} to={t.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', padding: 20, cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              {t.alert && <span style={{ position: 'absolute', top: 8, right: 8, background: '#f56565', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unreadPolicies}</span>}
              <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--dark)' }}>{t.label}</div>
              <div style={{ fontSize: 12, color: t.alert ? '#f56565' : 'var(--muted)', marginTop: 2 }}>{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent messages */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{ fontWeight: 700 }}>💬 Recent Company Chat</h3>
            <Link to="/chat" style={{ color: 'var(--green)', fontSize: 13, textDecoration: 'none' }}>See all →</Link>
          </div>
          {msgs.length === 0 ? <p className="text-muted text-sm">No messages yet. Start the conversation!</p> :
            msgs.map((m, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < msgs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.sender_name}</span>
                  <span className={`badge badge-${m.sender_dept?.toLowerCase()}`} style={{ fontSize: 10 }}>{m.sender_dept}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{m.text}</p>
              </div>
            ))
          }
        </div>

        {/* Recent ideas */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{ fontWeight: 700 }}>💡 Recent Ideas</h3>
            <Link to="/ideas" style={{ color: 'var(--green)', fontSize: 13, textDecoration: 'none' }}>See all →</Link>
          </div>
          {ideas.length === 0 ? <p className="text-muted text-sm">No ideas yet. Post the first one!</p> :
            ideas.map((idea, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: i < ideas.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{idea.title}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>by {idea.author_name}</span>
                  <span style={{ fontSize: 12, color: '#f59e0b' }}>❤️ {idea.like_count}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>{idea.status}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
