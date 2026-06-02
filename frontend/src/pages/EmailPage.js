import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function EmailPage() {
  const { user, API } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('inbox'); // inbox | compose | setup
  const [compose, setCompose] = useState({ to: '', subject: '', body: '' });
  const [creds, setCreds] = useState({ email: '', password: '' });
  const [msg, setMsg] = useState('');

  const hasEmail = !!user.hostinger_email;

  useEffect(() => {
    if (hasEmail) fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/email/inbox`); setInbox(r.data); }
    catch (err) { setMsg(err.response?.data?.error || 'Failed to load inbox'); }
    finally { setLoading(false); }
  };

  const readEmail = async (id) => {
    try { const r = await axios.get(`${API}/email/read/${id}`); setSelected(r.data); setView('read'); }
    catch (err) { setMsg('Failed to load email'); }
  };

  const sendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/email/send`, compose);
      setMsg('Email sent! ✅'); setCompose({ to: '', subject: '', body: '' }); setView('inbox');
    } catch (err) { setMsg(err.response?.data?.error || 'Failed to send'); }
    finally { setLoading(false); }
  };

  const saveCreds = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/email/credentials`, creds);
    setMsg('Email connected! ✅'); fetchInbox(); setView('inbox');
    window.location.reload();
  };

  if (!hasEmail && view !== 'setup') {
    return (
      <div className="container">
        <div className="page-header"><h1 className="page-title">📧 Email</h1></div>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📬</div>
          <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Connect Your Hostinger Email</h3>
          <p className="text-muted" style={{ marginBottom: 24 }}>Enter your Hostinger email credentials to access your inbox</p>
          <button className="btn btn-primary" onClick={() => setView('setup')}>🔗 Connect Email</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header flex-between">
        <h1 className="page-title">📧 Email {user.hostinger_email && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>({user.hostinger_email})</span>}</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setView('setup'); setMsg(''); }}>⚙️ Settings</button>
          <button className="btn btn-secondary btn-sm" onClick={fetchInbox}>↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => setView('compose')}>✏️ Compose</button>
        </div>
      </div>

      {msg && <div className="card" style={{ marginBottom: 16, background: '#f0fdf4', color: '#16a34a', padding: '12px 16px' }}>{msg}</div>}

      {view === 'setup' && (
        <div className="card" style={{ maxWidth: 440 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>🔗 Hostinger Email Setup</h3>
          <form onSubmit={saveCreds}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@yourdomain.com" value={creds.email} onChange={e => setCreds(c => ({ ...c, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" value={creds.password} onChange={e => setCreds(c => ({ ...c, password: e.target.value }))} required />
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>IMAP: mail.hostinger.com:993 · SMTP: mail.hostinger.com:465</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary">Save & Connect</button>
              <button type="button" className="btn btn-secondary" onClick={() => setView('inbox')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {view === 'compose' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>✏️ New Email</h3>
          <form onSubmit={sendEmail}>
            <div className="form-group"><label className="label">To</label><input className="input" type="email" value={compose.to} onChange={e => setCompose(c => ({ ...c, to: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Subject</label><input className="input" value={compose.subject} onChange={e => setCompose(c => ({ ...c, subject: e.target.value }))} required /></div>
            <div className="form-group"><label className="label">Body</label><textarea className="input" rows={10} value={compose.body} onChange={e => setCompose(c => ({ ...c, body: e.target.value }))} required style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Sending...' : '📤 Send'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setView('inbox')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {view === 'read' && selected && (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={() => setView('inbox')} style={{ marginBottom: 20 }}>← Back</button>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>{selected.subject}</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, color: 'var(--muted)', fontSize: 14 }}>
            <span>From: {selected.from}</span><span>·</span><span>{selected.date}</span>
          </div>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 20, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{selected.body}</div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => { setCompose({ to: selected.from, subject: `Re: ${selected.subject}`, body: '' }); setView('compose'); }}>↩ Reply</button>
          </div>
        </div>
      )}

      {view === 'inbox' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading && <div className="spinner" />}
          {!loading && inbox.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Inbox is empty or could not load.</div>}
          {inbox.map((m, i) => (
            <div key={m.id} onClick={() => readEmail(m.id)} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'white', transition: 'background 0.15s', display: 'flex', gap: 16, alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--dark)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {(m.from || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{m.from}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{m.date?.split(' ').slice(0, 4).join(' ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
