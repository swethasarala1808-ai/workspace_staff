import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Open','In Review','Implemented','Closed'];
const STATUS_COLORS = { Open:'#14f1b1', 'In Review':'#f59e0b', Implemented:'#3b82f6', Closed:'#6b7280' };

export default function IdeasPage() {
  const { user, API } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [sort, setSort] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', tags:'' });
  const [commenting, setCommenting] = useState({});
  const [commentText, setCommentText] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchIdeas = () => axios.get(`${API}/ideas?sort=${sort}`).then(r=>setIdeas(r.data)).catch(()=>{});
  useEffect(()=>{ fetchIdeas(); },[sort]);

  const postIdea = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const tags = form.tags.split(',').map(t=>t.trim()).filter(Boolean);
      await axios.post(`${API}/ideas`,{...form,tags});
      setForm({title:'',description:'',tags:''}); setShowForm(false); fetchIdeas();
    } catch(err) { alert(err.response?.data?.error||'Error'); }
    finally { setLoading(false); }
  };

  const likeIdea = async (id) => { await axios.post(`${API}/ideas/${id}/like`); fetchIdeas(); };

  const addComment = async (id) => {
    if (!commentText[id]?.trim()) return;
    await axios.post(`${API}/ideas/${id}/comment`,{text:commentText[id]});
    setCommentText(c=>({...c,[id]:''})); fetchIdeas();
  };

  const setStatus = async (id, status) => { await axios.put(`${API}/ideas/${id}/status`,{status}); fetchIdeas(); };

  return (
    <div className="container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">💡 Ideas Board</h1>
          <p className="page-sub">Share ideas — everyone votes and comments</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <select className="select" style={{width:'auto'}} value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="newest">⏰ Newest</option>
            <option value="liked">❤️ Most Liked</option>
          </select>
          <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ New Idea</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{marginBottom:24, border:'2px solid var(--green)'}}>
          <h3 style={{fontWeight:700,marginBottom:16}}>Share Your Idea 💡</h3>
          <form onSubmit={postIdea}>
            <div className="form-group"><label className="label">Title</label>
              <input className="input" placeholder="A short catchy title" value={form.title}
                onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Description</label>
              <textarea className="input textarea" rows={4} placeholder="Describe your idea in detail..."
                value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>
            <div className="form-group"><label className="label">Tags (comma separated)</label>
              <input className="input" placeholder="e.g. process, automation, culture"
                value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/></div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-primary" disabled={loading}>Post Idea</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {ideas.length===0 && (
          <div className="card" style={{textAlign:'center',padding:60}}>
            <div style={{fontSize:48}}>💡</div>
            <p className="text-muted" style={{marginTop:12}}>No ideas yet! Be the first to share one.</p>
          </div>
        )}
        {ideas.map(idea=>(
          <div key={idea.id} className="card">
            <div className="flex-between" style={{flexWrap:'wrap',gap:10,marginBottom:10}}>
              <div style={{flex:1}}>
                <h3 style={{fontWeight:700,fontSize:17,color:'var(--navy)',marginBottom:6}}>{idea.title}</h3>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:13,color:'var(--muted)'}}>by {idea.author_name}</span>
                  {idea.author_dept && <span style={{fontSize:12,background:'#f0f4ff',padding:'2px 8px',borderRadius:20,fontWeight:500}}>{idea.author_dept}</span>}
                  {idea.tags?.map(t=><span key={t} style={{fontSize:12,background:'#eff6ff',color:'#2563eb',padding:'2px 8px',borderRadius:20,fontWeight:500}}>#{t}</span>)}
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{padding:'4px 12px',borderRadius:20,fontSize:13,fontWeight:600,
                  background:STATUS_COLORS[idea.status]+'20',color:STATUS_COLORS[idea.status]}}>
                  {idea.status}
                </span>
                {user.role==='admin' && (
                  <select className="select" style={{width:'auto',fontSize:12,padding:'4px 8px'}}
                    value={idea.status} onChange={e=>setStatus(idea.id,e.target.value)}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
            <p style={{fontSize:14,color:'var(--muted)',lineHeight:1.7,marginBottom:14}}>{idea.description}</p>
            <div style={{display:'flex',gap:14,alignItems:'center'}}>
              <button onClick={()=>likeIdea(idea.id)}
                style={{background:idea.likes?.includes(user.id)?'#fee2e2':'var(--bg)',
                  border:'none',padding:'6px 14px',borderRadius:20,cursor:'pointer',
                  fontSize:13,fontWeight:600,color:'#e53e3e',fontFamily:'DM Sans,sans-serif',
                  display:'flex',alignItems:'center',gap:4,transition:'all 0.15s'}}>
                ❤️ {idea.like_count}
              </button>
              <button onClick={()=>setCommenting(c=>({...c,[idea.id]:!c[idea.id]}))}
                style={{background:'var(--bg)',border:'none',padding:'6px 14px',borderRadius:20,
                  cursor:'pointer',fontSize:13,color:'var(--muted)',fontFamily:'DM Sans,sans-serif'}}>
                💬 {idea.comments?.length||0} comments
              </button>
              <span style={{fontSize:12,color:'var(--muted)'}}>{new Date(idea.created_at).toLocaleDateString()}</span>
            </div>
            {commenting[idea.id] && (
              <div style={{marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
                {idea.comments?.map((c,i)=>(
                  <div key={i} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                    <b>{c.author}:</b> <span style={{color:'var(--muted)'}}>{c.text}</span>
                  </div>
                ))}
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  <input className="input" placeholder="Write a comment..." style={{flex:1}}
                    value={commentText[idea.id]||''} onChange={e=>setCommentText(c=>({...c,[idea.id]:e.target.value}))}/>
                  <button className="btn btn-primary btn-sm" onClick={()=>addComment(idea.id)}>Post</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
