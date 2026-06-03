import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RATINGS = ['Excellent','Good','Okay','Needs Work','Bad'];
const RATING_EMOJI = { Excellent:'🌟', Good:'👍', Okay:'😐', 'Needs Work':'⚠️', Bad:'👎' };
const RATING_COLOR = { Excellent:'#16a34a', Good:'#2563eb', Okay:'#d97706', 'Needs Work':'#ea580c', Bad:'#dc2626' };

export default function SeriaPortal() {
  const { user, logout, API } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState({ rating:'', comment:'', suggestion:'' });
  const [submitted, setSubmitted] = useState({});
  const [msg, setMsg] = useState('');

  useEffect(()=>{ axios.get(`${API}/materials/library`).then(r=>setMaterials(r.data)).catch(()=>{}); },[]);

  const submitFeedback = async () => {
    if (!feedback.rating) { setMsg('Please select a rating!'); return; }
    await axios.post(`${API}/materials/${selected.id}/feedback`, feedback);
    setSubmitted(s=>({...s,[selected.id]:true}));
    setFeedback({ rating:'', comment:'', suggestion:'' });
    setMsg('Thank you for your feedback! 🎉');
    setTimeout(()=>setMsg(''),4000);
    setSelected(null);
  };

  return (
    <div style={{minHeight:'100vh', background:'var(--bg)'}}>
      <nav style={{background:'var(--navy)', padding:'0 28px', height:62,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 2px 20px rgba(0,0,0,0.25)'}}>
        <span style={{color:'var(--green)', fontWeight:800, fontSize:20, fontFamily:'DM Sans,sans-serif'}}>
          🏢 WorkSpace Staff
        </span>
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <span style={{color:'rgba(255,255,255,0.7)', fontSize:14}}>Hi, {user.name}!</span>
          <span style={{background:'rgba(20,241,177,0.1)', color:'var(--green)',
            padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(20,241,177,0.2)'}}>
            SERIA
          </span>
          <button onClick={logout}
            style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
              color:'rgba(255,255,255,0.65)', padding:'7px 14px', borderRadius:8,
              cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif'}}>
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="page-header" style={{marginTop:24}}>
          <h1 className="page-title">Marketing Materials</h1>
          <p className="page-sub">View approved company materials and share your feedback</p>
        </div>
        {msg && <div className="alert alert-success">{msg}</div>}

        {selected ? (
          <div className="card">
            <button className="btn btn-secondary btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:20}}>← Back</button>
            <h2 style={{fontWeight:800,fontSize:22,marginBottom:8,color:'var(--navy)'}}>{selected.title}</h2>
            <p style={{color:'var(--muted)',marginBottom:20}}>{selected.description}</p>
            {selected.files?.length>0 && (
              <div style={{marginBottom:24}}>
                {selected.files.map((f,i)=>(
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f0f4ff',
                      color:'var(--navy)',padding:'8px 16px',borderRadius:10,fontSize:14,
                      fontWeight:600,textDecoration:'none',marginRight:8,border:'1px solid var(--border)'}}>
                    📎 {f.name}
                  </a>
                ))}
              </div>
            )}
            {submitted[selected.id] ? (
              <div style={{background:'#f0fdf4',padding:32,borderRadius:12,textAlign:'center',color:'#16a34a'}}>
                <div style={{fontSize:48,marginBottom:8}}>🎉</div>
                <h3 style={{fontWeight:700}}>Feedback Submitted!</h3>
                <p>Thanks for helping us improve.</p>
              </div>
            ) : (<>
              <h3 style={{fontWeight:700,marginBottom:16}}>Share Your Feedback</h3>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
                {RATINGS.map(r=>(
                  <button key={r} onClick={()=>setFeedback(f=>({...f,rating:r}))}
                    style={{padding:'12px 18px',borderRadius:10,
                      border:`2px solid ${feedback.rating===r?RATING_COLOR[r]:'var(--border)'}`,
                      background:feedback.rating===r?RATING_COLOR[r]+'15':'white',
                      cursor:'pointer',fontWeight:700,fontSize:14,fontFamily:'DM Sans,sans-serif',
                      color:feedback.rating===r?RATING_COLOR[r]:'var(--text)',transition:'all 0.15s',
                      display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <span style={{fontSize:24}}>{RATING_EMOJI[r]}</span>
                    {r}
                  </button>
                ))}
              </div>
              <div className="form-group"><label className="label">Comment (optional)</label>
                <textarea className="input textarea" rows={3} placeholder="What did you think?"
                  value={feedback.comment} onChange={e=>setFeedback(f=>({...f,comment:e.target.value}))}/></div>
              <div className="form-group"><label className="label">Suggestion (optional)</label>
                <textarea className="input textarea" rows={2} placeholder="Any improvements?"
                  value={feedback.suggestion} onChange={e=>setFeedback(f=>({...f,suggestion:e.target.value}))}/></div>
              <button className="btn btn-primary" onClick={submitFeedback} style={{fontSize:15,padding:'12px 28px'}}>
                Submit Feedback →
              </button>
            </>)}
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:18}}>
            {materials.length===0 && (
              <div className="card" style={{gridColumn:'1/-1',textAlign:'center',padding:80}}>
                <div style={{fontSize:64,marginBottom:16}}>📁</div>
                <h3 style={{fontWeight:700,marginBottom:8}}>No materials yet</h3>
                <p className="text-muted">Check back soon!</p>
              </div>
            )}
            {materials.map(m=>(
              <div key={m.id} className="card" onClick={()=>setSelected(m)}
                style={{cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',padding:0,overflow:'hidden'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-5px)';e.currentTarget.style.boxShadow='0 12px 30px rgba(5,19,60,0.14)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                <div style={{height:140,background:'#f0f4ff',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:48,overflow:'hidden'}}>
                  {m.files?.[0]?.url && m.files[0].url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? <img src={m.files[0].url} alt={m.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : '📄'}
                </div>
                <div style={{padding:'14px 16px'}}>
                  <h3 style={{fontWeight:700,marginBottom:6,color:'var(--navy)'}}>{m.title}</h3>
                  {m.description && <p style={{color:'var(--muted)',fontSize:13,marginBottom:10}}>{m.description}</p>}
                  {submitted[m.id]
                    ? <span style={{color:'var(--green)',fontWeight:600,fontSize:13}}>✅ Feedback given</span>
                    : <span style={{color:'#f59e0b',fontWeight:600,fontSize:13}}>💬 Give feedback →</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
