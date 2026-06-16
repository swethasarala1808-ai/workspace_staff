import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RATINGS = ['Excellent','Good','Okay','Needs Work','Bad'];
const RATING_COLORS = { Excellent:'#059669', Good:'#1d4ed8', Okay:'#d97706', 'Needs Work':'#c2410c', Bad:'#991b1b' };
const STATUS_STYLE = {
  pending:         { bg:'#fef3c7', color:'#92400e', label:'Pending Review' },
  approved:        { bg:'rgba(20,241,177,0.1)', color:'#059669', label:'Approved' },
  rejected:        { bg:'#fef2f2', color:'#991b1b', label:'Rejected' },
  revision_needed: { bg:'#fff7ed', color:'#c2410c', label:'Needs Revision' },
  sent_to_director:{ bg:'#eff6ff', color:'#1d4ed8', label:'Sent to Director' },
};

export default function MaterialsPage() {
  const { user, API } = useAuth();
  const [tab, setTab] = useState('library');
  const [materials, setMaterials] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [filterSolution, setFilterSolution] = useState('');
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [fbForm, setFbForm] = useState({ rating:'', comment:'', suggestion:'' });
  const [fbSubmitted, setFbSubmitted] = useState({});
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [upForm, setUpForm] = useState({ title:'', description:'', solution:'', material_type:'document', tags:'' });
  const [upFiles, setUpFiles] = useState([]);
  const fileRef = useRef();
  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const isMarketing = user.department==='Marketing' || user.role==='admin';
  const isAdmin = user.role==='admin';

  const fetchMaterials = () => {
    const endpoint = tab==='library' ? '/materials/library' : '/materials';
    const q = filterSolution ? `?solution=${filterSolution}` : '';
    axios.get(`${API}${endpoint}${q}`).then(r=>setMaterials(r.data)).catch(()=>{});
    axios.get(`${API}/solutions`).then(r=>setSolutions(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchMaterials(); },[tab, filterSolution]);

  const openMaterial = async (m) => {
    setSelected(m); setFbForm({rating:'',comment:'',suggestion:''});
    const r = await axios.get(`${API}/materials/${m.id}/feedback`).catch(()=>({data:[]}));
    setFeedbacks(r.data||[]);
  };

  const doAction = async (id, action, note='') => {
    await axios.post(`${API}/materials/${id}/action`, {action, note});
    fetchMaterials(); if(selected?.id===id) setSelected(null); showMsg('Done');
  };

  const submitFeedback = async () => {
    if (!fbForm.rating) return;
    await axios.post(`${API}/materials/${selected.id}/feedback`, fbForm);
    setFbSubmitted(s=>({...s,[selected.id]:true}));
    setFbForm({rating:'',comment:'',suggestion:''}); showMsg('Feedback submitted');
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!upFiles.length) return;
    setUploading(true);
    const fileData = await Promise.all(Array.from(upFiles).map(f => new Promise((res,rej) => {
      const r = new FileReader();
      r.onload = ev => res({ name:f.name, data:ev.target.result });
      r.onerror = rej;
      r.readAsDataURL(f);
    })));
    try {
      const tags = upForm.tags.split(',').map(t=>t.trim()).filter(Boolean);
      await axios.post(`${API}/materials`, {...upForm, tags, files:fileData});
      setUpForm({title:'',description:'',solution:'',material_type:'document',tags:''});
      setUpFiles([]); if(fileRef.current) fileRef.current.value='';
      fetchMaterials(); showMsg('Uploaded — all staff notified');
    } catch(err) { showMsg(err.response?.data?.error||'Upload failed'); }
    finally { setUploading(false); }
  };

  const TABS = [
    { id:'library', label:'Library' },
    { id:'all', label:'All Materials', adminOnly:false },
    ...(isAdmin ? [{ id:'pending', label:'Pending Review' }] : []),
    ...(isMarketing ? [{ id:'upload', label:'Upload' }] : []),
    { id:'solutions', label:'Solutions' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Materials</h1>
        <p className="page-subtitle">bizaxl marketing materials and resources</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Tabs - clean horizontal */}
      <div className="tabs">
        {TABS.map(t=>(
          <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Solution filter */}
      {(tab==='library'||tab==='all') && solutions.length>0 && (
        <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
          <button onClick={()=>setFilterSolution('')}
            style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${!filterSolution?'var(--navy)':'var(--border)'}`,background:!filterSolution?'var(--navy)':'white',color:!filterSolution?'var(--mint)':'var(--gray-400)',cursor:'pointer',fontSize:13,fontWeight:!filterSolution?700:400,fontFamily:'DM Sans,sans-serif'}}>
            All
          </button>
          {solutions.map(s=>(
            <button key={s.id} onClick={()=>setFilterSolution(filterSolution===s.name?'':s.name)}
              style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${filterSolution===s.name?s.color:'var(--border)'}`,background:filterSolution===s.name?s.color+'15':'white',color:filterSolution===s.name?s.color:'var(--gray-400)',cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'DM Sans,sans-serif',display:'flex',alignItems:'center',gap:5}}>
              <span>{s.icon}</span> {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Library + All Materials */}
      {(tab==='library'||tab==='all') && !selected && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
          {materials.length===0&&<div className="card" style={{gridColumn:'1/-1'}}><div className="empty-state"><div className="empty-state-icon">📁</div><h3>No materials yet</h3></div></div>}
          {materials.map(m=>{
            const ss = STATUS_STYLE[m.status]||STATUS_STYLE.pending;
            return (
              <div key={m.id} className="card" onClick={()=>openMaterial(m)}
                style={{padding:0,overflow:'hidden',cursor:'pointer',transition:'transform 0.15s,box-shadow 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                <div style={{height:100,background:'var(--gray-100)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40}}>
                  {m.files?.[0]?.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? <img src={m.files[0].url} alt={m.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : '📄'}
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{m.title}</div>
                  <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                    {m.solution&&<span style={{fontSize:11,color:'var(--gray-400)'}}>{m.solution}</span>}
                    {tab==='all'&&<span style={{fontSize:11,background:ss.bg,color:ss.color,padding:'2px 8px',borderRadius:20,fontWeight:600}}>{ss.label}</span>}
                  </div>
                  <div style={{fontSize:11,color:'var(--gray-400)',marginTop:4}}>by {m.uploaded_by_name} · {m.feedback_count} reviews</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Material detail */}
      {(tab==='library'||tab==='all') && selected && (
        <div>
          <button className="btn btn-outline btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:16}}>← Back</button>
          <div className="grid-2">
            <div className="card">
              <h2 style={{fontWeight:700,fontSize:18,marginBottom:8}}>{selected.title}</h2>
              {selected.description&&<p style={{color:'var(--gray-400)',fontSize:14,marginBottom:14,lineHeight:1.6}}>{selected.description}</p>}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
                {selected.solution&&<span className="badge badge-gray">{selected.solution}</span>}
                {selected.tags?.map(t=><span key={t} className="badge badge-blue">#{t}</span>)}
              </div>
              {selected.files?.length>0&&selected.files.map((f,i)=>(
                <div key={i} style={{marginBottom:8}}>
                  {f.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)&&<img src={f.url} alt={f.name} style={{width:'100%',borderRadius:'var(--radius)',marginBottom:8}}/>}
                  <a href={f.url} download={f.name} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Download: {f.name}</a>
                </div>
              ))}
              {isAdmin&&(
                <div style={{marginTop:14,display:'flex',gap:6,flexWrap:'wrap',borderTop:'1px solid var(--border)',paddingTop:14}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>doAction(selected.id,'approve')}>Approve</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>doAction(selected.id,'send_to_director')}>Send to Director</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>doAction(selected.id,'revision')}>Needs Revision</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>doAction(selected.id,'reject')}>Reject</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>doAction(selected.id,'delete')}>Delete</button>
                </div>
              )}
            </div>
            <div className="card">
              <h3 style={{fontWeight:700,marginBottom:16}}>Leave Feedback</h3>
              {fbSubmitted[selected.id] ? (
                <div style={{textAlign:'center',padding:32,color:'#059669'}}><div style={{fontSize:40,marginBottom:8}}>✓</div><p style={{fontWeight:600}}>Thank you for your feedback!</p></div>
              ) : (<>
                <label className="label" style={{marginBottom:8}}>Rating</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
                  {RATINGS.map(r=>(
                    <button key={r} onClick={()=>setFbForm(f=>({...f,rating:r}))}
                      style={{padding:'6px 14px',borderRadius:'var(--radius)',border:`1.5px solid ${fbForm.rating===r?RATING_COLORS[r]:'var(--border)'}`,background:fbForm.rating===r?RATING_COLORS[r]+'12':'white',cursor:'pointer',fontWeight:600,fontSize:13,color:fbForm.rating===r?RATING_COLORS[r]:'var(--navy)',fontFamily:'DM Sans,sans-serif'}}>
                      {r}
                    </button>
                  ))}
                </div>
                <div className="form-group"><label className="label">Comment</label><textarea className="input textarea" rows={3} value={fbForm.comment} onChange={e=>setFbForm(f=>({...f,comment:e.target.value}))} placeholder="What do you think?"/></div>
                <div className="form-group"><label className="label">Suggestion</label><textarea className="input textarea" rows={2} value={fbForm.suggestion} onChange={e=>setFbForm(f=>({...f,suggestion:e.target.value}))} placeholder="Any improvements?"/></div>
                <button className="btn btn-primary" onClick={submitFeedback} style={{width:'100%',justifyContent:'center'}}>Submit Feedback</button>
              </>)}
              {feedbacks.length>0&&(
                <div style={{marginTop:16,borderTop:'1px solid var(--border)',paddingTop:14}}>
                  <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--gray-400)',marginBottom:8}}>Past Feedback</div>
                  {feedbacks.map((f,i)=>(
                    <div key={i} style={{padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                      <span style={{fontWeight:600}}>{f.user_name}</span> <span style={{color:RATING_COLORS[f.rating],fontWeight:600}}>{f.rating}</span>
                      {f.comment&&<p style={{color:'var(--gray-400)',marginTop:2}}>{f.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending review - admin */}
      {tab==='pending'&&isAdmin&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {materials.filter(m=>m.status==='pending'||m.status==='sent_to_director').length===0&&(
            <div className="card"><div className="empty-state"><div className="empty-state-icon">✓</div><h3>Nothing pending</h3></div></div>
          )}
          {materials.filter(m=>m.status==='pending'||m.status==='sent_to_director').map(m=>{
            const ss=STATUS_STYLE[m.status]||STATUS_STYLE.pending;
            return (
              <div key={m.id} className="card" style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,marginBottom:4}}>{m.title}</div>
                  <div style={{fontSize:13,color:'var(--gray-400)',marginBottom:8}}>by {m.uploaded_by_name} · {m.created_at}</div>
                  {m.description&&<p style={{fontSize:13,color:'var(--gray-400)'}}>{m.description}</p>}
                </div>
                <div style={{flexShrink:0,display:'flex',gap:6,flexWrap:'wrap'}}>
                  <span style={{background:ss.bg,color:ss.color,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>{ss.label}</span>
                  <button className="btn btn-primary btn-sm" onClick={()=>doAction(m.id,'approve')}>Approve</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>doAction(m.id,'send_to_director')}>→ Director</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>doAction(m.id,'reject')}>Reject</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload */}
      {tab==='upload'&&isMarketing&&(
        <div className="card" style={{borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700,marginBottom:20,fontSize:15}}>Upload New Material</h3>
          <form onSubmit={upload}>
            <div className="form-row">
              <div className="form-group"><label className="label">Title *</label><input className="input" value={upForm.title} onChange={e=>setUpForm(f=>({...f,title:e.target.value}))} required/></div>
              <div className="form-group">
                <label className="label">Solution / Category</label>
                <select className="select" value={upForm.solution} onChange={e=>setUpForm(f=>({...f,solution:e.target.value}))}>
                  <option value="">Select</option>
                  {solutions.map(s=><option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="label">Description</label><textarea className="input textarea" rows={3} value={upForm.description} onChange={e=>setUpForm(f=>({...f,description:e.target.value}))}/></div>
            <div className="form-group"><label className="label">Tags (comma separated)</label><input className="input" placeholder="e.g. GST, billing, retail" value={upForm.tags} onChange={e=>setUpForm(f=>({...f,tags:e.target.value}))}/></div>
            <div className="form-group">
              <label className="label">Files *</label>
              <input ref={fileRef} type="file" multiple className="input" style={{height:'auto',padding:'8px'}} onChange={e=>setUpFiles(e.target.files)} required/>
              <p style={{fontSize:12,color:'var(--gray-400)',marginTop:6}}>All staff will be notified when you upload.</p>
            </div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Notify Team'}
            </button>
          </form>
        </div>
      )}

      {/* Solutions tab */}
      {tab==='solutions'&&(
        <div>
          {isAdmin&&(
            <div style={{marginBottom:16,display:'flex',gap:8}}>
              <button className="btn btn-outline" onClick={async()=>{ await axios.post(`${API}/solutions/seed`); fetchMaterials(); showMsg('Seeded'); }}>Seed Defaults</button>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
            {solutions.length===0&&<div className="card"><div className="empty-state"><h3>No solutions yet</h3>{isAdmin&&<p>Click Seed Defaults</p>}</div></div>}
            {solutions.map(s=>(
              <div key={s.id} className="card" style={{textAlign:'center',padding:'20px 16px'}}>
                <div style={{fontSize:36,marginBottom:8}}>{s.icon}</div>
                <div style={{fontWeight:700,fontSize:14,color:'var(--navy)'}}>{s.name}</div>
                {isAdmin&&<button onClick={async()=>{ await axios.delete(`${API}/solutions/${s.id}`); fetchMaterials(); }} className="btn btn-danger btn-sm" style={{marginTop:10,fontSize:11}}>Delete</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
