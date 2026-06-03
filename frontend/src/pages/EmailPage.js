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

  const hasEmail = !!user.hostinger_email;
  const showMsg = (m,t='success')=>{ setMsg(m); setMsgType(t); setTimeout(()=>setMsg(''),4000); };

  useEffect(()=>{ if(hasEmail) fetchInbox(); },[]);

  const fetchInbox = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/email/inbox`); setInbox(r.data); }
    catch(err) { showMsg(err.response?.data?.error||'Could not connect to email','error'); }
    finally { setLoading(false); }
  };

  const readEmail = async (id) => {
    try { const r = await axios.get(`${API}/email/read/${id}`); setSelected(r.data); setView('read'); }
    catch(err) { showMsg('Failed to load email','error'); }
  };

  const sendEmail = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post(`${API}/email/send`, compose);
      showMsg('Email sent ✅'); setCompose({to:'',subject:'',body:''}); setView('inbox');
    } catch(err) { showMsg(err.response?.data?.error||'Failed to send','error'); }
    finally { setLoading(false); }
  };

  const saveCreds = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/email/credentials`, creds);
    showMsg('Email connected! ✅'); setView('inbox'); fetchInbox();
    setTimeout(()=>window.location.reload(), 1500);
  };

  return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📧 Email</h1>
          {hasEmail && <p className="page-sub">{user.hostinger_email}</p>}
        </div>
        <div style={{display:'flex',gap:10}}>
          {hasEmail && <>
            <button className="btn btn-secondary btn-sm" onClick={fetchInbox} disabled={loading}>↻ Refresh</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>setView('setup')}>⚙️ Settings</button>
            <button className="btn btn-primary" onClick={()=>setView('compose')}>✏️ Compose</button>
          </>}
          {!hasEmail && <button className="btn btn-primary" onClick={()=>setView('setup')}>🔗 Connect Email</button>}
        </div>
      </div>

      {msg && <div className={`alert alert-${msgType==='error'?'error':'success'}`}>{msg}</div>}

      {/* Setup */}
      {(view==='setup'||!hasEmail) && (
        <div className="card" style={{maxWidth:460}}>
          <h3 style={{fontWeight:700,marginBottom:6}}>🔗 Hostinger Email Setup</h3>
          <p style={{color:'var(--muted)',fontSize:13,marginBottom:20}}>Connect your Hostinger email to access your inbox here</p>
          <form onSubmit={saveCreds}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@yourdomain.com"
                value={creds.email} onChange={e=>setCreds(c=>({...c,email:e.target.value}))} required/>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Your email password"
                value={creds.password} onChange={e=>setCreds(c=>({...c,password:e.target.value}))} required/>
            </div>
            <div style={{background:'#f0f4ff',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'var(--muted)'}}>
              <div>📥 IMAP: mail.hostinger.com : 993 (SSL)</div>
              <div>📤 SMTP: mail.hostinger.com : 465 (SSL)</div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-primary">🔗 Save & Connect</button>
              {hasEmail && <button type="button" className="btn btn-secondary" onClick={()=>setView('inbox')}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {/* Compose */}
      {view==='compose' && hasEmail && (
        <div className="card" style={{maxWidth:600}}>
          <h3 style={{fontWeight:700,marginBottom:20}}>✏️ New Email</h3>
          <form onSubmit={sendEmail}>
            <div className="form-group"><label className="label">To</label>
              <input className="input" type="email" value={compose.to} onChange={e=>setCompose(c=>({...c,to:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Subject</label>
              <input className="input" value={compose.subject} onChange={e=>setCompose(c=>({...c,subject:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Body</label>
              <textarea className="input textarea" rows={10} value={compose.body}
                onChange={e=>setCompose(c=>({...c,body:e.target.value}))} required/></div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Sending...':'📤 Send'}</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setView('inbox')}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Read */}
      {view==='read' && selected && (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={()=>setView('inbox')} style={{marginBottom:20}}>← Back</button>
          <h2 style={{fontWeight:800,fontSize:20,marginBottom:8}}>{selected.subject}</h2>
          <div style={{display:'flex',gap:16,marginBottom:20,fontSize:13,color:'var(--muted)',flexWrap:'wrap'}}>
            <span><b>From:</b> {selected.from}</span>
            <span><b>To:</b> {selected.to}</span>
            <span>{selected.date}</span>
          </div>
          <div style={{background:'var(--bg)',borderRadius:10,padding:20,fontSize:14,lineHeight:1.8,
            whiteSpace:'pre-wrap',fontFamily:'monospace',marginBottom:16}}>{selected.body}</div>
          <button className="btn btn-primary btn-sm"
            onClick={()=>{ setCompose({to:selected.from,subject:`Re: ${selected.subject}`,body:''}); setView('compose'); }}>
            ↩ Reply
          </button>
        </div>
      )}

      {/* Inbox */}
      {view==='inbox' && hasEmail && (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          {loading && <div className="spinner"/>}
          {!loading && inbox.length===0 && (
            <div style={{padding:48,textAlign:'center',color:'var(--muted)'}}>
              <div style={{fontSize:48,marginBottom:12}}>📭</div>
              <p>Inbox is empty or could not load.</p>
              <button className="btn btn-secondary btn-sm" style={{marginTop:12}} onClick={fetchInbox}>Try Again</button>
            </div>
          )}
          {inbox.map((m,i)=>(
            <div key={m.id} onClick={()=>readEmail(m.id)}
              style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',cursor:'pointer',
                display:'flex',gap:14,alignItems:'center',transition:'background 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f8faff'}
              onMouseLeave={e=>e.currentTarget.style.background='white'}>
              <div style={{width:38,height:38,borderRadius:'50%',background:'var(--navy)',
                color:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',
                fontWeight:800,fontSize:15,flexShrink:0}}>
                {(m.from||'?').charAt(0).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{m.from}</div>
                <div style={{fontSize:13,color:'var(--muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.subject}</div>
              </div>
              <div style={{fontSize:12,color:'var(--muted)',flexShrink:0}}>{m.date?.split(' ').slice(0,4).join(' ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
