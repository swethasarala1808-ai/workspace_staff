import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function QuickLinksPage() {
  const { user, API } = useAuth();
  const [links, setLinks] = useState([]);
  const [depts, setDepts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', url:'', icon:'🔗', dept:'all' });
  const [msg, setMsg] = useState('');

  const fetchLinks = () => axios.get(`${API}/quicklinks`).then(r=>setLinks(r.data)).catch(()=>{});
  const fetchDepts = () => axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{
    setDepts([{name:'Deployment'},{name:'Functional'},{name:'Marketing'},{name:'Research'}]);
  });

  useEffect(()=>{ fetchLinks(); fetchDepts(); },[]);

  const deptLabel = (dept) => dept === 'all' ? 'Everyone' : dept;
  const allOptions = ['all', ...depts.map(d=>d.name)];

  const submit = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/quicklinks`, form);
    setForm({ title:'', url:'', icon:'🔗', dept:'all' });
    setShowForm(false); fetchLinks();
    setMsg('Quick link added ✓'); setTimeout(()=>setMsg(''),3000);
  };

  const del = async (id) => {
    await axios.delete(`${API}/quicklinks/${id}`);
    fetchLinks();
  };

  // Group by dept — only show groups that actually have links, in the order departments exist
  const grouped = allOptions.reduce((acc, d) => {
    const dlinks = links.filter(l => l.dept === d);
    if (dlinks.length) acc[d] = dlinks;
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Quick Access</h1>
          <p className="page-subtitle">Department shortcuts for daily tools and links</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>{showForm?'Cancel':'+ Add Link'}</button>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {showForm && user.role === 'admin' && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:20, fontSize:16}}>Add Quick Access Link</h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. CRM Dashboard" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Icon (emoji)</label>
                <input className="input" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} maxLength={2}/>
              </div>
            </div>
            <div className="form-group">
              <label className="label">URL *</label>
              <input className="input" type="url" placeholder="https://..." value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} required/>
            </div>
            <div className="form-group">
              <label className="label">Visible To</label>
              <select className="select" value={form.dept} onChange={e=>setForm(f=>({...f,dept:e.target.value}))}>
                {allOptions.map(d=><option key={d} value={d}>{deptLabel(d)}</option>)}
              </select>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary">Save Link</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {Object.keys(grouped).length === 0
        ? <div className="card"><div className="empty-state"><div className="empty-state-icon">🔗</div><h3>No quick links yet</h3>{user.role==='admin'&&<p>Add links for your team using the button above</p>}</div></div>
        : Object.entries(grouped).map(([dept, dlinks])=>(
          <div key={dept} style={{marginBottom:24}}>
            <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:12}}>
              {deptLabel(dept)}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10}}>
              {dlinks.map(l=>(
                <div key={l.id} style={{display:'flex', alignItems:'center', gap:0, background:'white', borderRadius:'var(--radius-lg)', border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow)'}}>
                  <a href={l.url} target="_blank" rel="noreferrer"
                    style={{flex:1, display:'flex', alignItems:'center', gap:12, padding:'14px 16px', textDecoration:'none', color:'var(--navy)', transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--gray-100)'}
                    onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <span style={{fontSize:22, flexShrink:0}}>{l.icon}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:600, fontSize:14}} className="truncate">{l.title}</div>
                      <div style={{fontSize:11, color:'var(--gray-400)'}} className="truncate">{l.url.replace(/^https?:\/\//,'').split('/')[0]}</div>
                    </div>
                  </a>
                  {user.role === 'admin' && (
                    <button onClick={()=>del(l.id)}
                      style={{padding:'14px 12px', background:'none', border:'none', borderLeft:'1px solid var(--border)', cursor:'pointer', color:'var(--gray-400)', fontSize:14}}
                      onMouseEnter={e=>{e.currentTarget.style.background='#fee2e2';e.currentTarget.style.color='#dc2626';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--gray-400)';}}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
