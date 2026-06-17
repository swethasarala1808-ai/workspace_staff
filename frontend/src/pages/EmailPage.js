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
  const [creds, setCreds] = useState({ email:user.hostinger_email||'', password:'' });
  const [error, setError] = useState('');
  const [fetched, setFetched] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [sending, setSending] = useState(false);

  const hasEmail = !!user.hostinger_email;

  useEffect(() => {
    if (hasEmail) fetchInbox();
    else setFetched(true);
  }, []);

  const fetchInbox = async () => {
    setLoading(true); setError('');
    try {
      const r = await axios.get(`${API}/email/inbox`);
      setInbox(r.data);
    } catch(err) {
      setError(err.response?.data?.error || 'Could not connect to email server.');
      setInbox([]);
    } finally {
      setLoading(false); setFetched(true);
    }
  };

  const saveCreds = async (e) => {
    e.preventDefault(); setSavingCreds(true);
    try {
      await axios.post(`${API}/email/credentials`, creds);
      window.location.reload();
    } catch { setError('Could not save credentials'); }
    finally { setSavingCreds(false); }
  };

  const readEmail = async (id) => {
    setLoading(true); setError('');
    try {
      const r = await axios.get(`${API}/email/read/${id}`);
      setSelected(r.data); setView('read');
    } catch(err) { setError(err.response?.data?.error || 'Failed to load email'); }
    finally { setLoading(false); }
  };

  const sendEmail = async (e) => {
    e.preventDefault(); setSending(true); setError('');
    try {
      await axios.post(`${API}/email/send`, compose);
      setCompose({ to:'', subject:'', body:'' }); setView('inbox'); fetchInbox();
    } catch(err) { setError(err.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); }
  };

  // ── Not configured yet ──
  if (fetched && !hasEmail) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Email</h1>
          <p className="page-subtitle">Connect your bizaxl email to send and receive messages</p>
        </div>
        <div className="card" style={{maxWidth:480}}>
          <h3 style={{fontWeight:700,marginBottom:6,fontSize:16}}>Connect Your Email</h3>
          <p style={{fontSize:13,color:'var(--gray-400)',marginBottom:20}}>Enter your Hostinger email credentials to get started.</p>
          <form onSubmit={saveCreds}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@bizaxl.com" value={creds.email} onChange={e=>setCreds(c=>({...c,email:e.target.value}))} required/>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" value={creds.password} onChange={e=>setCreds(c=>({...c,password:e.target.value}))} required/>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={savingCreds}>{savingCreds?'Connecting...':'Connect Email'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Email</h1>
          <p className="page-subtitle">{user.hostinger_email}</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-outline" onClick={fetchInbox} disabled={loading}>{loading?'Loading...':'Refresh'}</button>
          <button className="btn btn-outline" onClick={()=>setView('settings')}>Settings</button>
          <button className="btn btn-primary" onClick={()=>setView('compose')}>Compose</button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <div style={{marginBottom: error.toLowerCase().includes('network') || error.toLowerCase().includes('block') || error.toLowerCase().includes('unreachable') || error.toLowerCase().includes('timed out') ? 10 : 0}}>
            {error}
          </div>
          {(error.toLowerCase().includes('network') || error.toLowerCase().includes('block') || error.toLowerCase().includes('unreachable') || error.toLowerCase().includes('timed out')) && (
            <div>
              <p style={{fontSize:12,marginBottom:10,opacity:0.85}}>
                Mail ports (993/465) are blocked on this network — this is a network-level block (router/ISP/campus firewall), not something the app can work around. Normal web browsing still works fine because that uses different ports.
              </p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <a href="https://mail.hostinger.com" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Open Webmail Instead</a>
                <button type="button" className="btn btn-outline btn-sm" onClick={fetchInbox}>Retry</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {view==='settings' && (
        <div className="card" style={{maxWidth:480}}>
          <h3 style={{fontWeight:700,marginBottom:16,fontSize:15}}>Email Settings</h3>
          <form onSubmit={saveCreds}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" value={creds.email} onChange={e=>setCreds(c=>({...c,email:e.target.value}))} required/>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Enter to update" value={creds.password} onChange={e=>setCreds(c=>({...c,password:e.target.value}))}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary" disabled={savingCreds}>{savingCreds?'Saving...':'Save'}</button>
              <button type="button" className="btn btn-outline" onClick={()=>setView('inbox')}>Back to Inbox</button>
            </div>
          </form>
        </div>
      )}

      {/* Compose */}
      {view==='compose' && (
        <div className="card" style={{maxWidth:600}}>
          <h3 style={{fontWeight:700,marginBottom:16,fontSize:15}}>New Email</h3>
          <form onSubmit={sendEmail}>
            <div className="form-group"><label className="label">To</label><input className="input" type="email" value={compose.to} onChange={e=>setCompose(c=>({...c,to:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Subject</label><input className="input" value={compose.subject} onChange={e=>setCompose(c=>({...c,subject:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Message</label><textarea className="input textarea" rows={8} value={compose.body} onChange={e=>setCompose(c=>({...c,body:e.target.value}))} required/></div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary" disabled={sending}>{sending?'Sending...':'Send'}</button>
              <button type="button" className="btn btn-outline" onClick={()=>setView('inbox')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Read */}
      {view==='read' && selected && (
        <div className="card" style={{maxWidth:700}}>
          <button className="btn btn-outline btn-sm" onClick={()=>setView('inbox')} style={{marginBottom:16}}>← Back to Inbox</button>
          <h2 style={{fontWeight:700,fontSize:18,marginBottom:10}}>{selected.subject}</h2>
          <div style={{fontSize:13,color:'var(--gray-400)',marginBottom:16,paddingBottom:16,borderBottom:'1px solid var(--border)'}}>
            <div>From: {selected.from}</div>
            <div>{selected.date}</div>
          </div>
          <div style={{fontSize:14,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{selected.body}</div>
        </div>
      )}

      {/* Inbox list */}
      {view==='inbox' && (
        loading ? (
          <div className="spinner"/>
        ) : inbox.length===0 && !error ? (
          <div className="card"><div className="empty-state"><div className="empty-state-icon">📭</div><h3>Inbox is empty</h3></div></div>
        ) : inbox.length>0 ? (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            {inbox.map((m,i)=>(
              <div key={m.id} onClick={()=>readEmail(m.id)}
                style={{padding:'14px 20px',borderBottom:i<inbox.length-1?'1px solid var(--border)':'none',cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--gray-100)'}
                onMouseLeave={e=>e.currentTarget.style.background='white'}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontWeight:600,fontSize:14}}>{m.from}</span>
                  <span style={{fontSize:12,color:'var(--gray-400)'}}>{m.date}</span>
                </div>
                <div style={{fontSize:13,color:'var(--gray-400)'}}>{m.subject}</div>
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}
