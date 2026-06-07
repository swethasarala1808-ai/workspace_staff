import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Open','In Review','Implemented','Closed'];
const STATUS_COLOR = { Open:'#059669', 'In Review':'#d97706', Implemented:'#1d4ed8', Closed:'#6b7280' };

export default function IdeasPage() {
  const { user, API } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [sort, setSort] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', tags:'' });
  const [commenting, setCommenting] = useState({});
  const [commentText, setCommentText] = useState({});

  const fetch = () => axios.get(`${API}/ideas?sort=${sort}`).then(r=>setIdeas(r.data)).catch(()=>{});
  useEffect(()=>{ fetch(); },[sort]);

  const post = async (e) => {
    e.preventDefault();
    const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
    await axios.post(`${API}/ideas`, {...form, tags});
    setForm({title:'',description:'',tags:''}); setShowForm(false); fetch();
  };

  const like = async (id) => { await axios.post(`${API}/ideas/${id}/like`); fetch(); };
  const comment = async (id) => {
    if (!commentText[id]?.trim()) return;
    await axios.post(`${API}/ideas/${id}/comment`, { text: commentText[id] });
    setCommentText(c=>({...c,[id]:''})); fetch();
  };
  const setStatus = async (id, status) => { await axios.put(`${API}/ideas/${id}/status`, { status }); fetch(); };

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Ideas Board</h1>
          <p className="page-subtitle">Share ideas — vote and discuss with your team</p>
        </div>
        <div style={{display:'flex', gap:8}}>
          <select className="select" style={{width:'auto', height:40}} value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="liked">Most Liked</option>
          </select>
          <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ Share Idea</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:20, fontSize:16}}>Share Your Idea</h3>
          <form onSubmit={post}>
            <div className="form-group"><label className="label">Title *</label><input className="input" placeholder="A short, clear title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Description *</label><textarea className="input textarea" rows={4} placeholder="Describe your idea in detail..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Tags (comma separated)</label><input className="input" placeholder="e.g. automation, process, culture" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/></div>
            <div style={{display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary">Post Idea</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {ideas.length===0 && <div className="card"><div className="empty-state"><div className="empty-state-icon">💡</div><h3>No ideas yet</h3><p>Be the first to share one</p></div></div>}
        {ideas.map(idea=>(
          <div key={idea.id} className="card">
            <div className="flex-between" style={{flexWrap:'wrap', gap:10, marginBottom:10}}>
              <div style={{flex:1}}>
                <h3 style={{fontWeight:700, fontSize:16, marginBottom:6}}>{idea.title}</h3>
                <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center'}}>
                  <span style={{fontSize:13, color:'var(--gray-400)'}}>by {idea.author_name}</span>
                  {idea.author_dept && <span className="badge badge-gray" style={{fontSize:11}}>{idea.author_dept}</span>}
                  {idea.tags?.map(t=><span key={t} className="badge badge-blue" style={{fontSize:11}}>#{t}</span>)}
                </div>
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <span style={{padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:STATUS_COLOR[idea.status]+'15', color:STATUS_COLOR[idea.status]}}>{idea.status}</span>
                {user.role==='admin' && (
                  <select className="select" style={{width:'auto', height:30, fontSize:12, padding:'4px 8px'}} value={idea.status} onChange={e=>setStatus(idea.id, e.target.value)}>
                    {STATUSES.map(s=><option key={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
            <p style={{fontSize:14, color:'var(--gray-400)', lineHeight:1.7, marginBottom:14}}>{idea.description}</p>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <button onClick={()=>like(idea.id)}
                style={{background:idea.likes?.includes(user.id)?'#fef2f2':'var(--gray-100)', border:'none', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13, fontWeight:600, color:'#dc2626', fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:4}}>
                ♥ {idea.like_count}
              </button>
              <button onClick={()=>setCommenting(c=>({...c,[idea.id]:!c[idea.id]}))}
                style={{background:'var(--gray-100)', border:'none', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13, color:'var(--gray-400)', fontFamily:'DM Sans,sans-serif'}}>
                {idea.comments?.length||0} comments
              </button>
              <span style={{fontSize:12, color:'var(--gray-400)'}}>{new Date(idea.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</span>
            </div>
            {commenting[idea.id] && (
              <div style={{marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)'}}>
                {idea.comments?.map((c,i)=>(
                  <div key={i} style={{padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13}}>
                    <span style={{fontWeight:600}}>{c.author}</span> <span style={{color:'var(--gray-400)'}}>{c.text}</span>
                  </div>
                ))}
                <div style={{display:'flex', gap:8, marginTop:10}}>
                  <input className="input" placeholder="Write a comment..." style={{flex:1}} value={commentText[idea.id]||''} onChange={e=>setCommentText(c=>({...c,[idea.id]:e.target.value}))}/>
                  <button className="btn btn-secondary btn-sm" onClick={()=>comment(idea.id)}>Post</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
