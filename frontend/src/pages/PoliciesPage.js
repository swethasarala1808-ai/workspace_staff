import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function PoliciesPage() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCatManager, setShowCatManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [form, setForm] = useState({ category:'', emoji:'', title:'', summary:'', content:'' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchPolicies = () => axios.get(`${API}/policies`).then(r=>setPolicies(r.data)).catch(()=>{});
  const fetchCategories = () => axios.get(`${API}/policy_categories`).then(r=>setCategories(r.data)).catch(()=>{});

  useEffect(()=>{ fetchPolicies(); fetchCategories(); },[]);

  // Keep form's default category in sync once categories load
  useEffect(()=>{
    if (categories.length && !form.category) {
      setForm(f=>({...f, category: categories[0].name}));
    }
  }, [categories]);

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };
  const showErr = (m) => { setErr(m); setTimeout(()=>setErr(''),4000); };

  const create = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/policies`, form);
    setShowForm(false); setForm({ category: categories[0]?.name||'', emoji:'', title:'', summary:'', content:'' });
    fetchPolicies(); fetchCategories(); showMsg('Policy published');
  };

  const deletePolicy = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this policy?')) return;
    await axios.delete(`${API}/policies/${id}`);
    fetchPolicies(); fetchCategories(); showMsg('Policy deleted');
  };

  const markRead = async (id) => {
    await axios.post(`${API}/policies/${id}/read`); fetchPolicies();
  };

  const seed = async () => {
    const r = await axios.post(`${API}/policies/seed`);
    showMsg(r.data.message); fetchPolicies(); fetchCategories();
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await axios.post(`${API}/policy_categories`, { name: newCatName.trim() });
      setNewCatName(''); fetchCategories(); showMsg('Category added');
    } catch(error) { showErr(error.response?.data?.error || 'Could not add category'); }
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await axios.delete(`${API}/policy_categories/${cat.id}`);
      fetchCategories(); showMsg('Category deleted');
    } catch(error) { showErr(error.response?.data?.error || 'Could not delete category'); }
  };

  const unread = policies.filter(p=>!p.read).length;

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Policies</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread — please review` : 'All policies acknowledged'}</p>
        </div>
        {user.role==='admin' && (
          <div style={{display:'flex', gap:8}}>
            <button className="btn btn-outline" onClick={seed}>Seed Defaults</button>
            <button className="btn btn-outline" onClick={()=>{ setShowCatManager(!showCatManager); setShowForm(false); }}>{showCatManager?'Close':'Manage Categories'}</button>
            <button className="btn btn-primary" onClick={()=>{ setShowForm(!showForm); setShowCatManager(false); }}>+ New Policy</button>
          </div>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {showCatManager && user.role==='admin' && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:16, fontSize:16}}>Manage Categories</h3>
          <form onSubmit={createCategory} style={{display:'flex', gap:8, marginBottom:18}}>
            <input className="input" placeholder="New category name" value={newCatName} onChange={e=>setNewCatName(e.target.value)} style={{flex:1}}/>
            <button type="submit" className="btn btn-primary">Add Category</button>
          </form>
          {categories.length===0 ? (
            <p style={{color:'var(--gray-400)', fontSize:13}}>No categories yet.</p>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {categories.map(c=>(
                <div key={c.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--gray-100)', borderRadius:'var(--radius)'}}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <span style={{fontWeight:600, fontSize:14}}>{c.name}</span>
                    <span className="badge badge-gray" style={{fontSize:11}}>{c.policy_count} polic{c.policy_count===1?'y':'ies'}</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={()=>deleteCategory(c)} style={{padding:'4px 10px', fontSize:12}}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:20, fontSize:16}}>Create New Policy</h3>
          {categories.length===0 ? (
            <div className="alert alert-info">No categories yet. Click "Manage Categories" above to create one first.</div>
          ) : (
            <form onSubmit={create}>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Emoji Icon</label>
                  <input className="input" value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} maxLength={2} placeholder="📋"/>
                </div>
              </div>
              <div className="form-group"><label className="label">Title *</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
              <div className="form-group"><label className="label">Summary (one line)</label><input className="input" value={form.summary} onChange={e=>setForm(f=>({...f,summary:e.target.value}))} required/></div>
              <div className="form-group"><label className="label">Full Content (plain language)</label><textarea className="input textarea" rows={6} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} required/></div>
              <div style={{display:'flex', gap:8}}>
                <button type="submit" className="btn btn-primary">Publish Policy</button>
                <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {selected ? (
        <div className="card">
          <button className="btn btn-outline btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:20}}>← Back to Policies</button>
          <div style={{display:'flex', gap:16, marginBottom:20, alignItems:'flex-start'}}>
            <div style={{width:48, height:48, background:'var(--gray-100)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0}}>
              {selected.emoji||'📋'}
            </div>
            <div style={{flex:1}}>
              <span className="badge badge-gray" style={{marginBottom:8}}>{selected.category}</span>
              <h2 style={{fontSize:22, fontWeight:700, marginBottom:4}}>{selected.title}</h2>
              <p style={{color:'var(--gray-400)', fontSize:14}}>{selected.summary}</p>
            </div>
            {user.role==='admin' && (
              <button className="btn btn-danger btn-sm" onClick={(e)=>{ deletePolicy(selected.id,e); setSelected(null); }}>Delete</button>
            )}
          </div>
          <div style={{background:'var(--gray-100)', borderRadius:'var(--radius-lg)', padding:20, fontSize:14, lineHeight:2, whiteSpace:'pre-wrap', marginBottom:20, color:'var(--navy)'}}>
            {selected.content}
          </div>
          {!selected.read
            ? <button className="btn btn-primary" onClick={()=>{ markRead(selected.id); setSelected(p=>({...p,read:true})); }}>Mark as Read</button>
            : <div style={{color:'#059669', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:6}}>
                <div className="dot dot-green"/> Acknowledged
              </div>}
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {policies.length===0 && (
            <div className="card"><div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No policies yet</h3>
              {user.role==='admin' && <p>Click "Seed Defaults" to add standard policies</p>}
            </div></div>
          )}
          {policies.map(p=>(
            <div key={p.id} className="card" onClick={()=>setSelected(p)}
              style={{cursor:'pointer', display:'flex', gap:14, alignItems:'center', padding:'16px 20px', borderLeft:`3px solid ${p.read?'var(--mint)':'#f59e0b'}`, transition:'box-shadow 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-md)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow)'}>
              <div style={{width:36, height:36, background:'var(--gray-100)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0}}>
                {p.emoji||'📋'}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:3}}>
                  <span style={{fontWeight:600}}>{p.title}</span>
                  <span className="badge badge-gray" style={{fontSize:11}}>{p.category}</span>
                </div>
                <p style={{color:'var(--gray-400)', fontSize:13}} className="truncate">{p.summary}</p>
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center', flexShrink:0}}>
                {p.read
                  ? <div style={{display:'flex', alignItems:'center', gap:4, color:'#059669', fontSize:13, fontWeight:500}}><div className="dot dot-green"/>Read</div>
                  : <span className="badge badge-yellow">Unread</span>}
                {user.role==='admin' && (
                  <button className="btn btn-danger btn-sm" onClick={(e)=>deletePolicy(p.id,e)} style={{padding:'4px 10px', fontSize:12}}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
