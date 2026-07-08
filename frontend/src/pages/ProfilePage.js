import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, API } = useAuth();
  const [form, setForm] = useState({ name:user.name, phone:user.phone||'', department:user.department||'' });
  const [emailForm, setEmailForm] = useState({ hostinger_email:user.hostinger_email||'', hostinger_password_plain:'' });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [depts, setDepts] = useState([]);

  // Fetch departments dynamically from API
  useEffect(() => {
    axios.get(`${API}/departments`).then(r => setDepts(r.data)).catch(() => {});
  }, [API]);

  const deptColor = depts.find(d => d.name === user.department)?.color || '#14F1B1';

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await updateProfile(form); setMsg('Profile updated'); setTimeout(()=>setMsg(''),3000); }
    catch { setMsg('Update failed'); }
    finally { setSaving(false); }
  };

  const saveEmail = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await updateProfile(emailForm); setMsg('Email settings saved'); setTimeout(()=>setMsg(''),3000); }
    catch { setMsg('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Profile & Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="grid-2" style={{gap:24, alignItems:'start'}}>
        <div>
          {/* Avatar card */}
          <div className="card" style={{textAlign:'center', marginBottom:20, padding:32}}>
            <div style={{width:72, height:72, borderRadius:'50%', background:deptColor,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'white', fontWeight:800, fontSize:28, margin:'0 auto 16px'}}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 style={{fontWeight:700, fontSize:18, marginBottom:4}}>{user.name}</h2>
            <p style={{color:'var(--gray-400)', fontSize:13, marginBottom:12}}>{user.email}</p>
            <div style={{display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap'}}>
              <span className="badge badge-gray">{user.company}</span>
              {user.department && <span className="badge" style={{background:deptColor+'18', color:deptColor, border:`1px solid ${deptColor}30`}}>{user.department}</span>}
              <span className="badge badge-blue">{user.role}</span>
            </div>
          </div>

          {/* Edit profile */}
          <div className="card">
            <h3 style={{fontWeight:700, marginBottom:20, fontSize:15}}>Edit Profile</h3>
            <form onSubmit={saveProfile}>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 9876543210"/>
              </div>
              {user.company==='BIZAXL' && (
                <div className="form-group">
                  <label className="label">Department</label>
                  <select className="select" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                    <option value="">Select department</option>
                    {depts.map(d=>(
                      <option key={d.id||d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  {depts.length === 0 && (
                    <p style={{fontSize:12, color:'var(--gray-400)', marginTop:4}}>Loading departments...</p>
                  )}
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        <div>
          {/* Email settings - kept but clearly labelled as blocked on most networks */}
          {user.company==='BIZAXL' && (
            <div className="card" style={{marginBottom:20}}>
              <h3 style={{fontWeight:700, marginBottom:4, fontSize:15}}>Email Integration</h3>
              <p style={{color:'var(--gray-400)', fontSize:13, marginBottom:16}}>
                {user.hostinger_email ? `Connected: ${user.hostinger_email}` : 'Connect your Hostinger email'}
              </p>
              <form onSubmit={saveEmail}>
                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input className="input" type="email" placeholder="you@bizaxl.com"
                    value={emailForm.hostinger_email} onChange={e=>setEmailForm(f=>({...f,hostinger_email:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="label">Password</label>
                  <input className="input" type="password" placeholder="Leave blank to keep current"
                    value={emailForm.hostinger_password_plain} onChange={e=>setEmailForm(f=>({...f,hostinger_password_plain:e.target.value}))}/>
                </div>
                <div style={{background:'var(--gray-100)', borderRadius:'var(--radius)', padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--gray-400)'}}>
                  IMAP: mail.hostinger.com:993 · SMTP: mail.hostinger.com:465
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>Save Email Settings</button>
              </form>
            </div>
          )}

          {/* Account info */}
          <div className="card">
            <h3 style={{fontWeight:700, marginBottom:16, fontSize:15}}>Account Information</h3>
            {[
              ['Email', user.email],
              ['Company', user.company],
              ['Department', user.department||'Not set'],
              ['Role', user.role],
              ['Phone', user.phone||'Not set'],
            ].map(([k,v])=>(
              <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--gray-400)', fontSize:14}}>{k}</span>
                <span style={{fontWeight:600, fontSize:14}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
