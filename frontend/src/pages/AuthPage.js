import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Deployment', 'Functional', 'Marketing', 'Research'];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: 'BIZAXL', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
      } else {
        user = await register(form);
      }
      navigate(user.company === 'SERIA' ? '/seria' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏢</div>
          <h1 style={{ color: '#00C851', fontSize: 28, fontWeight: 800 }}>WorkSpace Staff</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 }}>Internal collaboration platform</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
                  background: mode === m ? '#1a1a2e' : '#f4f5f7', color: mode === m ? '#00C851' : '#718096', transition: 'all 0.2s' }}>
                {m === 'login' ? '🔐 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="label">Company</label>
                  <select className="select" value={form.company} onChange={e => set('company', e.target.value)}>
                    <option value="BIZAXL">BIZAXL — Full Workspace</option>
                    <option value="SERIA">SERIA — Materials Portal</option>
                  </select>
                </div>
                {form.company === 'BIZAXL' && (
                  <div className="form-group">
                    <label className="label">Department</label>
                    <select className="select" value={form.department} onChange={e => set('department', e.target.value)} required>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            {error && <p className="error-msg">⚠️ {error}</p>}
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 20 }}>
          SERIA & BIZAXL Internal Platform
        </p>
      </div>
    </div>
  );
}
