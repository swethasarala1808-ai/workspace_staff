import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Leave', 'Code of Conduct', 'Remote Work', 'Benefits', 'Performance'];

export default function PoliciesPage() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'Leave', emoji: '📄', title: '', summary: '', content: '' });
  const [seedMsg, setSeedMsg] = useState('');

  const fetchPolicies = () => axios.get(`${API}/policies`).then(r => setPolicies(r.data)).catch(() => {});
  useEffect(() => { fetchPolicies(); }, []);

  const createPolicy = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/policies`, form);
    setShowForm(false); fetchPolicies();
  };

  const markRead = async (id) => {
    await axios.post(`${API}/policies/${id}/read`);
    fetchPolicies();
  };

  const seed = async () => {
    const r = await axios.post(`${API}/policies/seed`);
    setSeedMsg(r.data.message); fetchPolicies();
    setTimeout(() => setSeedMsg(''), 3000);
  };

  const unread = policies.filter(p => !p.read).length;

  return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📋 Policies</h1>
          <p className="page-sub">{unread > 0 ? `${unread} unread policies` : 'All caught up ✅'}</p>
        </div>
        {user.role === 'admin' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={seed}>🌱 Seed Defaults</button>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Policy</button>
          </div>
        )}
      </div>

      {seedMsg && <div className="card" style={{ marginBottom: 16, background: '#f0fdf4', color: '#16a34a', padding: '12px 16px' }}>✅ {seedMsg}</div>}

      {showForm && user.role === 'admin' && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>New Policy</h3>
          <form onSubmit={createPolicy}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Category</label>
                <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Emoji</label>
                <input className="input" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} maxLength={2} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">One-line Summary</label>
              <input className="input" value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Full Content (plain language)</label>
              <textarea className="input" rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">Publish Policy</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selected ? (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)} style={{ marginBottom: 20 }}>← Back</button>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 48 }}>{selected.emoji}</span>
            <div>
              <span style={{ background: '#f3f4f6', padding: '4px 12px', borderRadius: 20, fontSize: 13, color: 'var(--muted)' }}>{selected.category}</span>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: '8px 0 4px' }}>{selected.title}</h2>
              <p style={{ color: 'var(--muted)' }}>{selected.summary}</p>
            </div>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 20, fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-wrap', marginBottom: 20 }}>
            {selected.content}
          </div>
          {!selected.read ? (
            <button className="btn btn-primary" onClick={() => { markRead(selected.id); setSelected(p => ({ ...p, read: true })); }}>
              ✅ Mark as Read
            </button>
          ) : (
            <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: 14 }}>✅ You've read this policy</div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {policies.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48 }}>📋</div>
              <p className="text-muted" style={{ marginTop: 12 }}>No policies yet.{user.role === 'admin' ? ' Click "Seed Defaults" to add some!' : ''}</p>
            </div>
          )}
          {policies.map(p => (
            <div key={p.id} className="card" onClick={() => setSelected(p)} style={{ cursor: 'pointer', transition: 'transform 0.15s', display: 'flex', gap: 16, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}>
              <span style={{ fontSize: 32 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <h3 style={{ fontWeight: 700 }}>{p.title}</h3>
                  <span style={{ background: '#f3f4f6', padding: '2px 10px', borderRadius: 20, fontSize: 12, color: 'var(--muted)' }}>{p.category}</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>{p.summary}</p>
              </div>
              <div>{p.read ? <span style={{ color: 'var(--green)', fontSize: 20 }}>✅</span> : <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Unread</span>}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
