import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Deployment', 'Functional', 'Marketing', 'Research'];
const DEPT_COLORS = { Deployment: '#3b82f6', Functional: '#8b5cf6', Marketing: '#ec4899', Research: '#10b981' };

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', department: user.department || '' });
  const [emailForm, setEmailForm] = useState({ hostinger_email: user.hostinger_email || '', hostinger_password: '' });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const deptColor = DEPT_COLORS[user.department] || '#00C851';

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await updateProfile(form); setMsg('Profile updated! ✅'); setTimeout(() => setMsg(''), 3000); }
    catch { setMsg('Failed to update'); }
    finally { setSaving(false); }
  };

  const saveEmail = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(emailForm);
      setMsg('Email settings saved! ✅'); setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to save email'); }
    finally { setSaving(false); }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">👤 Profile & Settings</h1>
      </div>

      {msg && <div className="card" style={{ marginBottom: 16, background: '#f0fdf4', color: '#16a34a', padding: '12px 16px' }}>{msg}</div>}

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          {/* Avatar card */}
          <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: deptColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 32, margin: '0 auto 16px' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 4 }}>{user.name}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 12 }}>{user.email}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ background: '#f0fdf4', color: 'var(--green)', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{user.company}</span>
              {user.department && <span style={{ background: deptColor + '20', color: deptColor, padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{user.department}</span>}
              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{user.role}</span>
            </div>
          </div>

          {/* Profile form */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Edit Profile</h3>
            <form onSubmit={saveProfile}>
              <div className="form-group"><label className="label">Full Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="form-group"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              {user.company === 'BIZAXL' && (
                <div className="form-group">
                  <label className="label">Department</label>
                  <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          </div>
        </div>

        <div>
          {/* Email settings */}
          {user.company === 'BIZAXL' && (
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>📧 Email Integration</h3>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>Connect your Hostinger email for the inbox feature</p>
              <form onSubmit={saveEmail}>
                <div className="form-group">
                  <label className="label">Hostinger Email</label>
                  <input className="input" type="email" placeholder="you@yourdomain.com" value={emailForm.hostinger_email} onChange={e => setEmailForm(f => ({ ...f, hostinger_email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">Email Password</label>
                  <input className="input" type="password" placeholder="Leave blank to keep current" value={emailForm.hostinger_password} onChange={e => setEmailForm(f => ({ ...f, hostinger_password: e.target.value }))} />
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--muted)' }}>
                  <div>🔒 IMAP: mail.hostinger.com:993</div>
                  <div>📤 SMTP: mail.hostinger.com:465</div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : '🔗 Save Email Settings'}</button>
              </form>
            </div>
          )}

          {/* Account info */}
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Account Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['Email', user.email], ['Company', user.company], ['Role', user.role], ['Phone', user.phone || 'Not set']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>{k}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
