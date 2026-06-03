import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Leave','Code of Conduct','Remote Work','Benefits','Performance'];

export default function PoliciesPage() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category:'Leave', emoji:'📄', title:'', summary:'', content:'' });
  const [msg, setMsg] = useState('');

  const fetchPolicies = () => axios.get(`${API}/policies`).then(r=>setPolicies(r.data)).catch(()=>{});
  useEffect(()=>{ fetchPolicies(); },[]);

  const createPolicy = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/policies`, form);
    setShowForm(false); fetchPolicies(); setMsg('Policy created ✅');
    setTimeout(()=>setMsg(''),3000);
  };
  const markRead = async (id) => {
    await axios.post(`${API}/policies/${id}/read`); fetchPolicies();
  };
  const seed = async () => {
    const r = await axios.post(`${API}/policies/seed`);
    setMsg(r.data.message); fetchPolicies(); setTimeout(()=>setMsg(''),3000);
  };

  const unread = policies.filter(p=>!p.read).length;

  return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📋 Policies</h1>
          <p className="page-sub">{unread>0 ? `${unread} unread` : 'All caught up ✅'}</p>
        </div>
        {user.role==='admin' && (
          <div style={{display:'flex',gap:10}}>
            <button className="btn btn-secondary" onClick={seed}>🌱 Seed Defaults</button>
            <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ Add Policy</button>
          </div>
        )}
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}

      {showForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:24,border:'2px solid var(--green)'}}>
          <h3 style={{fontWeight:700,marginBottom:20}}>New Policy</h3>
          <form onSubmit={createPolicy}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Category</label>
                <select className="select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Emoji</label>
                <input className="input" value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} maxLength={2}/>
              </div>
            </div>
            <div className="form-group"><label className="label">Title</label>
              <input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">One-line Summary</label>
              <input className="input" value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Full Content (plain language)</label>
              <textarea className="input textarea" rows={6} value={form.content}
                onChange={e=>setForm(f=>({...f,content:e.target.value}))} required/></div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-primary">Publish Policy</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {selected ? (
        <div className="card">
          <button className="btn btn-secondary btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:20}}>← Back</button>
          <div style={{display:'flex',gap:16,marginBottom:20,alignItems:'flex-start'}}>
            <span style={{fontSize:48}}>{selected.emoji}</span>
            <div>
              <span style={{background:'#f0f4ff',color:'var(--navy)',padding:'4px 12px',borderRadius:20,fontSize:13,fontWeight:600}}>{selected.category}</span>
              <h2 style={{fontSize:24,fontWeight:800,margin:'8px 0 4px',color:'var(--navy)'}}>{selected.title}</h2>
              <p style={{color:'var(--muted)'}}>{selected.summary}</p>
            </div>
          </div>
          <div style={{background:'var(--bg)',borderRadius:12,padding:20,fontSize:15,lineHeight:1.9,
            whiteSpace:'pre-wrap',marginBottom:20,color:'var(--text)'}}>{selected.content}</div>
          {!selected.read ? (
            <button className="btn btn-primary" onClick={()=>{ markRead(selected.id); setSelected(p=>({...p,read:true})); }}>
              ✅ I've Read This
            </button>
          ) : (
            <div style={{color:'var(--green)',fontWeight:700,fontSize:14,display:'flex',gap:6,alignItems:'center'}}>
              ✅ You've acknowledged this policy
            </div>
          )}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {policies.length===0 && (
            <div className="card" style={{textAlign:'center',padding:60}}>
              <div style={{fontSize:48}}>📋</div>
              <p className="text-muted" style={{marginTop:12}}>
                {user.role==='admin' ? 'No policies yet. Click "Seed Defaults" to add some!' : 'No policies published yet.'}
              </p>
            </div>
          )}
          {policies.map((p,i)=>(
            <div key={p.id} className="card" onClick={()=>setSelected(p)}
              style={{cursor:'pointer',display:'flex',gap:16,alignItems:'center',
                transition:'transform 0.15s, box-shadow 0.15s',
                borderLeft: p.read ? '4px solid #14f1b1' : '4px solid #fbbf24'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
              <span style={{fontSize:32}}>{p.emoji}</span>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                  <h3 style={{fontWeight:700,color:'var(--navy)'}}>{p.title}</h3>
                  <span style={{background:'#f0f4ff',color:'var(--muted)',padding:'2px 10px',borderRadius:20,fontSize:12}}>{p.category}</span>
                </div>
                <p style={{color:'var(--muted)',fontSize:14}}>{p.summary}</p>
              </div>
              <div>
                {p.read
                  ? <span style={{color:'var(--green)',fontSize:22}}>✅</span>
                  : <span style={{background:'#fef9c3',color:'#854d0e',padding:'4px 12px',borderRadius:20,fontSize:13,fontWeight:700}}>Unread</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
