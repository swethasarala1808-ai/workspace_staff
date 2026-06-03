import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function EmailPage() {
  const { user, API } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('inbox');
  const [compose, setCompose] = useState({ to:'', subject:'', body:'' });
  const [creds, setCreds] = useState({ email: user.hostinger_email||'', password:'' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const hasEmail = !!user.hostinger_email;
  const showMsg = (m, t='success') => { setMsg(m); setMsgType(t); setTimeout(()=>setMsg(''), 5000); };

  useEffect(() => {
    if (hasEmail && view === 'inbox') fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true); setMsg('');
    try {
      const r = await axios.get(`${API}/email/inbox`);
      setInbox(r.data);
      if (r.data.length === 0) showMsg('Inbox is empty', 'info');
    } catch(err) {
      const errMsg = err.response?.data?.error || 'Could not connect to email';
      showMsg(errMsg, 'error');
    } finally { setLoading(false); }
  };

  const testConnection = async () => {
    setTesting(true); setTestResult(null);
    try {
      const r = await axios.get(`${API}/email/test`);
      setTestResult(r.data);
    } catch { setTestResult({ ok: false, error: 'Request failed' }); }
    finally { setTesting(false); }
  };

  const readEmail = async (id) => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/email/read/${id}`);
      setSelected(r.data); setView('read');
    } catch(err) { showMsg(err.response?.data?.error || 'Failed to load email', 'error'); }
    finally { setLoading(false); }
  };

  const sendEmail = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post(`${API}/email/send`, compose);
      showMsg('Email sent ✅');
      setCompose({ to:'', subject:'', body:'' }); setView('inbox');
    } catch(err) { showMsg(err.response?.data?.error || 'Failed to send', 'error'); }
    finally { setLoading(false); }
  };

  const saveCreds = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post(`${API}/email/credentials`, { email: creds.email, password: creds.password });
      showMsg('Email saved! Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch { showMsg('Failed to save', 'error'); }
    finally { setLoading(false); }
  };

  const MsgBox = () => msg ? (
    <div style={{
      padding:'12px 16px', borderRadius:10, marginBottom:16, fontSize:14, fontWeight:500,
      background: msgType==='error' ? '#fef2f2' : msgType==='info' ? '#eff6ff' : '#f0fdf4',
      color: msgType==='error' ? '#991b1b' : msgType==='info' ? '#1e40af' : '#166534',
      border: `1px solid ${msgType==='error'?'#fecaca':msgType==='info'?'#bfdbfe':'#bbf7d0'}`,
      display:'flex', alignItems:'center', gap:8
    }}>
      {msgType==='error'?'⚠️':msgType==='info'?'ℹ️':'✅'} {msg}
    </div>
  ) : null;

  // Setup / no email configured
  if (!hasEmail || view === 'setup') return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📧 Email</h1>
          <p className="page-sub">Connect your Hostinger email</p>
        </div>
        {hasEmail && <button className="btn btn-secondary btn-sm" onClick={()=>setView('inbox')}>← Back</button>}
      </div>
      <MsgBox/>

      <div style={{maxWidth:500}}>
        <div className="card" style={{marginBottom:16}}>
          <h3 style={{fontWeight:700, marginBottom:6}}>🔗 Hostinger Email Setup</h3>
          <p style={{color:'var(--muted)', fontSize:13, marginBottom:20}}>
            Enter your Hostinger webmail credentials to connect your inbox
          </p>
          <form onSubmit={saveCreds}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@yourdomain.com"
                value={creds.email} onChange={e=>setCreds(c=>({...c,email:e.target.value}))} required/>
            </div>
            <div className="form-group">
              <label className="label">Email Password</label>
              <input className="input" type="password" placeholder="Your Hostinger email password"
                value={creds.password} onChange={e=>setCreds(c=>({...c,password:e.target.value}))} required/>
              <p style={{fontSize:12,color:'var(--muted)',marginTop:6}}>
                This is the password you use to log into Hostinger webmail — not your Hostinger account password.
              </p>
            </div>

            <div style={{background:'#f0f4ff', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:13}}>
              <div style={{fontWeight:600, marginBottom:6, color:'var(--navy)'}}>📡 Server Settings</div>
              <div style={{color:'var(--muted)', lineHeight:1.8}}>
                <div>📥 IMAP: <b>mail.hostinger.com</b> : <b>993</b> (SSL)</div>
                <div>📤 SMTP: <b>mail.hostinger.com</b> : <b>465</b> (SSL)</div>
              </div>
            </div>

            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : '🔗 Save & Connect'}
              </button>
              {hasEmail && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={testConnection} disabled={testing}>
                  {testing ? 'Testing...' : '🔌 Test Connection'}
                </button>
              )}
            </div>
          </form>

          {testResult && (
            <div style={{marginTop:14, padding:'10px 14px', borderRadius:8, fontSize:13,
              background: testResult.ok ? '#f0fdf4' : '#fef2f2',
              color: testResult.ok ? '#166534' : '#991b1b',
              border: `1px solid ${testResult.ok ? '#bbf7d0' : '#fecaca'}`}}>
              {testResult.ok ? '✅ ' + testResult.message : '❌ ' + testResult.error}
            </div>
          )}
        </div>

        <div className="card" style={{background:'#fef9c3', border:'1px solid #fde68a'}}>
          <h4 style={{fontWeight:700, marginBottom:8, color:'#92400e'}}>⚠️ Troubleshooting</h4>
          <ul style={{fontSize:13, color:'#78350f', lineHeight:2, paddingLeft:16}}>
            <li>Make sure you're using your <b>email password</b>, not Hostinger account password</li>
            <li>IMAP must be <b>enabled</b> in Hostinger webmail settings</li>
            <li>Check your internet — IMAP port 993 must not be blocked by firewall</li>
            <li>Try logging into <b>webmail.hostinger.com</b> to verify credentials work</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📧 Email</h1>
          <p className="page-sub" style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',display:'inline-block'}}/>
            {user.hostinger_email}
          </p>
        </div>
        <div style={{display:'flex', gap:10}}>
          <button className="btn btn-secondary btn-sm" onClick={fetchInbox} disabled={loading}>↻ Refresh</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>setView('setup')}>⚙️ Settings</button>
          <button className="btn btn-primary" onClick={()=>setView('compose')}>✏️ Compose</button>
        </div>
      </div>

      <MsgBox/>

      {/* Compose */}
      {view === 'compose' && (
        <div className="card" style={{maxWidth:600}}>
          <h3 style={{fontWeight:700, marginBottom:20}}>✏️ New Email</h3>
          <form onSubmit={sendEmail}>
            <div className="form-group"><label className="label">To</label>
              <input className="input" type="email" placeholder="recipient@email.com"
                value={compose.to} onChange={e=>setCompose(c=>({...c,to:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Subject</label>
              <input className="input" placeholder="Subject line"
                value={compose.subject} onChange={e=>setCompose(c=>({...c,subject:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Body</label>
              <textarea className="input textarea" rows={10} placeholder="Write your message..."
                value={compose.body} onChange={e=>setCompose(c=>({...c,body:e.target.value}))} required/></div>
            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending...' : '📤 Send Email'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={()=>setView('inbox')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Read email */}
      {view === 'read' && selected && (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={()=>setView('inbox')} style={{marginBottom:20}}>
            ← Back to Inbox
          </button>
          <h2 style={{fontWeight:800, fontSize:20, marginBottom:12, color:'var(--navy)'}}>{selected.subject}</h2>
          <div style={{display:'flex', gap:16, marginBottom:20, fontSize:13, color:'var(--muted)', flexWrap:'wrap'}}>
            <span><b>From:</b> {selected.from}</span>
            <span><b>Date:</b> {selected.date}</span>
          </div>
          <div style={{background:'var(--bg)', borderRadius:10, padding:20, fontSize:14,
            lineHeight:1.8, whiteSpace:'pre-wrap', marginBottom:16,
            border:'1px solid var(--border)', maxHeight:500, overflowY:'auto'}}>
            {selected.body || '(Empty body)'}
          </div>
          <button className="btn btn-primary btn-sm"
            onClick={()=>{ setCompose({to:selected.from, subject:`Re: ${selected.subject}`, body:`\n\n--- Original ---\n${selected.body?.slice(0,200)}`}); setView('compose'); }}>
            ↩ Reply
          </button>
        </div>
      )}

      {/* Inbox */}
      {view === 'inbox' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          {loading && (
            <div style={{padding:40, textAlign:'center'}}>
              <div className="spinner"/>
              <p style={{color:'var(--muted)', marginTop:16, fontSize:13}}>Connecting to mail.hostinger.com...</p>
            </div>
          )}
          {!loading && inbox.length === 0 && !msg && (
            <div style={{padding:48, textAlign:'center'}}>
              <div style={{fontSize:48, marginBottom:12}}>📭</div>
              <h3 style={{fontWeight:700, marginBottom:6}}>Inbox is empty</h3>
              <p style={{color:'var(--muted)', marginBottom:16}}>No emails found</p>
              <button className="btn btn-secondary btn-sm" onClick={fetchInbox}>Try Again</button>
            </div>
          )}
          {inbox.map((m, i) => (
            <div key={m.id} onClick={()=>readEmail(m.id)}
              style={{padding:'14px 20px', borderBottom:'1px solid var(--border)',
                cursor:'pointer', display:'flex', gap:14, alignItems:'center',
                transition:'background 0.15s', background:'white'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f8faff'}
              onMouseLeave={e=>e.currentTarget.style.background='white'}>
              <div style={{width:38, height:38, borderRadius:'50%', background:'var(--navy)',
                color:'var(--green)', display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:800, fontSize:15, flexShrink:0}}>
                {(m.from||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, fontSize:14, marginBottom:2,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m.from}</div>
                <div style={{fontSize:13, color:'var(--muted)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m.subject}</div>
              </div>
              <div style={{fontSize:12, color:'var(--muted)', flexShrink:0}}>
                {m.date?.split(' ').slice(1,4).join(' ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
