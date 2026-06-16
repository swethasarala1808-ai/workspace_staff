import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RATINGS = ['Excellent','Good','Okay','Needs Work','Bad'];
const RATING_COLOR = { Excellent:'#166534', Good:'#1d4ed8', Okay:'#92400e', 'Needs Work':'#c2410c', Bad:'#991b1b' };

const VALUES = [
  { icon:'🔍', title:'Truth & Honesty', desc:'We are transparent about what our software can and cannot do. We never over-promise.' },
  { icon:'❤️', title:'Compassion & Empathy', desc:'We listen with care and respond with kindness. Every customer is a fellow human.' },
  { icon:'🙏', title:'Respect', desc:'We respect the courage of every MSME owner. We never talk down to anyone.' },
  { icon:'⚡', title:'Reliability', desc:'When a small business depends on us, we commit to being consistently dependable.' },
  { icon:'🌱', title:'Empowerment', desc:'We help customers become stronger and more confident in their own business.' },
];

export default function SeriaPortal() {
  const { user, logout, API } = useAuth();
  const [tab, setTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState({ rating:'', comment:'', suggestion:'' });
  const [submitted, setSubmitted] = useState({});
  const [leadForm, setLeadForm] = useState({ title:'', source:'LinkedIn', contact_name:'', contact_info:'', company:'', description:'' });
  const [leadMsg, setLeadMsg] = useState('');

  useEffect(()=>{
    axios.get(`${API}/materials/library`).then(r=>setMaterials(r.data)).catch(()=>{});
  },[]);

  const submitFeedback = async () => {
    if (!feedback.rating) return;
    await axios.post(`${API}/materials/${selected.id}/feedback`, feedback);
    setSubmitted(s=>({...s,[selected.id]:true}));
    setFeedback({ rating:'', comment:'', suggestion:'' });
    setSelected(null);
  };

  const submitLead = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/leads`, leadForm);
    setLeadForm({ title:'', source:'LinkedIn', contact_name:'', contact_info:'', company:'', description:'' });
    setLeadMsg('Lead submitted to Marketing team ✓'); setTimeout(()=>setLeadMsg(''),4000);
  };

  return (
    <div style={{minHeight:'100vh', background:'var(--gray-100)'}}>
      {/* Header */}
      <div style={{background:'var(--navy)', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{maxWidth:1100, margin:'0 auto', padding:'0 32px', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative'}}>
          <img src="/static/logo.svg" alt="bizaxl" style={{height:28, filter:'brightness(0) invert(1)'}}/>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <span style={{color:'rgba(255,255,255,0.6)', fontSize:13}}>Hi, {user.name}</span>
            <span style={{background:'rgba(20,241,177,0.1)', color:'#14F1B1', padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, border:'1px solid rgba(20,241,177,0.2)'}}>Seria</span>
            <button onClick={logout} style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif'}}>Sign out</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1100, margin:'0 auto', padding:'32px'}}>
        {/* Tabs */}
        <div className="tabs">
          {[['materials','Materials'],['leads','Submit Lead'],['about','About bizaxl']].map(([id,label])=>(
            <button key={id} className={`tab${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</button>
          ))}
        </div>

        {/* Materials */}
        {tab==='materials' && (
          selected ? (
            <div>
              <button className="btn btn-outline btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:20}}>← Back</button>
              <div className="grid-2">
                <div className="card">
                  <div style={{height:140, background:'var(--gray-100)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, marginBottom:16}}>
                    {selected.files?.[0]?.url && selected.files[0].url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                      ? <img src={selected.files[0].url} alt={selected.title} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--radius)'}}/>
                      : '📄'}
                  </div>
                  <h2 style={{fontWeight:700, fontSize:20, marginBottom:8}}>{selected.title}</h2>
                  <p style={{color:'var(--gray-400)', marginBottom:16, fontSize:14}}>{selected.description}</p>
                  {selected.files?.length > 0 && selected.files.map((f,i)=>(
                    <a key={i} href={f.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{marginRight:8}}>Download: {f.name}</a>
                  ))}
                </div>
                <div className="card">
                  <h3 style={{fontWeight:700, marginBottom:16}}>Rate this material</h3>
                  {submitted[selected.id] ? (
                    <div style={{textAlign:'center', padding:32, color:'#166534'}}>
                      <div style={{fontSize:40, marginBottom:12}}>✓</div>
                      <p style={{fontWeight:600}}>Thank you for your feedback!</p>
                    </div>
                  ) : (<>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:16}}>
                      {RATINGS.map(r=>(
                        <button key={r} onClick={()=>setFeedback(f=>({...f,rating:r}))}
                          style={{padding:'8px 16px', borderRadius:'var(--radius)', border:`1.5px solid ${feedback.rating===r?RATING_COLOR[r]:'var(--border)'}`, background:feedback.rating===r?RATING_COLOR[r]+'15':'white', cursor:'pointer', fontWeight:600, fontSize:13, color:feedback.rating===r?RATING_COLOR[r]:'var(--navy)', fontFamily:'DM Sans,sans-serif'}}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <div className="form-group"><label className="label">Comment</label><textarea className="input textarea" rows={3} value={feedback.comment} onChange={e=>setFeedback(f=>({...f,comment:e.target.value}))} placeholder="What do you think?"/></div>
                    <div className="form-group"><label className="label">Suggestion</label><textarea className="input textarea" rows={2} value={feedback.suggestion} onChange={e=>setFeedback(f=>({...f,suggestion:e.target.value}))} placeholder="Any improvements?"/></div>
                    <button className="btn btn-primary" onClick={submitFeedback} style={{width:'100%', justifyContent:'center'}}>Submit Feedback</button>
                  </>)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16}}>
              {materials.length===0 && <div className="card"><div className="empty-state"><div className="empty-state-icon">📁</div><h3>No materials yet</h3><p>Check back soon</p></div></div>}
              {materials.map(m=>(
                <div key={m.id} className="card" onClick={()=>setSelected(m)} style={{cursor:'pointer', padding:0, overflow:'hidden'}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-2px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.transform='';}}>
                  <div style={{height:120, background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, overflow:'hidden'}}>
                    {m.files?.[0]?.url && m.files[0].url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                      ? <img src={m.files[0].url} alt={m.title} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                      : '📄'}
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    <h3 style={{fontWeight:700, fontSize:14, marginBottom:6}}>{m.title}</h3>
                    {m.description && <p style={{fontSize:13, color:'var(--gray-400)'}}>{m.description}</p>}
                    <div style={{marginTop:10, fontSize:12, color:'#14F1B1', fontWeight:600}}>{submitted[m.id] ? '✓ Feedback given' : 'Give feedback →'}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Lead submission */}
        {tab==='leads' && (
          <div style={{maxWidth:600}}>
            <div style={{marginBottom:20}}>
              <h2 style={{fontWeight:700, fontSize:20, marginBottom:4}}>Submit a Lead</h2>
              <p style={{color:'var(--gray-400)', fontSize:14}}>Spotted a potential bizaxl customer in your circle or on social media? Let the team know!</p>
            </div>
            {leadMsg && <div className="alert alert-success">{leadMsg}</div>}
            <div className="card">
              <form onSubmit={submitLead}>
                <div className="form-group"><label className="label">Lead / Business Name *</label><input className="input" placeholder="e.g. Kumar Textiles" value={leadForm.title} onChange={e=>setLeadForm(f=>({...f,title:e.target.value}))} required/></div>
                <div className="form-row">
                  <div className="form-group"><label className="label">Source</label>
                    <select className="select" value={leadForm.source} onChange={e=>setLeadForm(f=>({...f,source:e.target.value}))}>
                      {['Circle','LinkedIn','Instagram','Facebook','WhatsApp','Other'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="label">Company</label><input className="input" value={leadForm.company} onChange={e=>setLeadForm(f=>({...f,company:e.target.value}))}/></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="label">Contact Name</label><input className="input" value={leadForm.contact_name} onChange={e=>setLeadForm(f=>({...f,contact_name:e.target.value}))}/></div>
                  <div className="form-group"><label className="label">Contact Info</label><input className="input" placeholder="Phone or email" value={leadForm.contact_info} onChange={e=>setLeadForm(f=>({...f,contact_info:e.target.value}))}/></div>
                </div>
                <div className="form-group"><label className="label">Description</label><textarea className="input textarea" rows={4} placeholder="What did you observe? Why are they a potential lead?" value={leadForm.description} onChange={e=>setLeadForm(f=>({...f,description:e.target.value}))}/></div>
                <button type="submit" className="btn btn-primary">Submit to Marketing Team</button>
              </form>
            </div>
          </div>
        )}

        {/* About */}
        {tab==='about' && (
          <div>
            <div style={{background:'var(--navy)', borderRadius:16, padding:40, marginBottom:24, position:'relative', overflow:'hidden'}}>
              <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
              <img src="/static/logo.svg" alt="bizaxl" style={{height:28, filter:'brightness(0) invert(1)', marginBottom:20}}/>
              <h2 style={{color:'white', fontSize:24, fontWeight:700, lineHeight:1.4, marginBottom:8}}>
                We build confidence, <span style={{color:'#14F1B1'}}>dignity, and growth.</span>
              </h2>
              <p style={{color:'rgba(255,255,255,0.5)', fontSize:14}}>For every MSME in India.</p>
              <div style={{marginTop:20, display:'flex', gap:20}}>
                <a href="mailto:markcom@bizaxl.com" style={{color:'#14F1B1', fontSize:13, fontWeight:600}}>markcom@bizaxl.com</a>
                <a href="tel:+919886711156" style={{color:'#14F1B1', fontSize:13, fontWeight:600}}>+91 98867 11156</a>
                <a href="https://bizaxl.com" target="_blank" rel="noreferrer" style={{color:'#14F1B1', fontSize:13, fontWeight:600}}>bizaxl.com</a>
              </div>
            </div>
            <div className="card">
              <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:20}}>Our 5 Core Values</div>
              {VALUES.map((v,i)=>(
                <div key={v.title} style={{display:'flex', gap:14, padding:'14px 0', borderBottom: i<VALUES.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{width:36, height:36, background:'var(--gray-100)', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0}}>{v.icon}</div>
                  <div><div style={{fontWeight:700, marginBottom:3}}>{v.title}</div><p style={{fontSize:13, color:'var(--gray-400)', lineHeight:1.6}}>{v.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
