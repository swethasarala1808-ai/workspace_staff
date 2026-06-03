import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const RATINGS = ['Excellent','Good','Okay','Needs Work','Bad'];
const RATING_EMOJI = { Excellent:'🌟', Good:'👍', Okay:'😐', 'Needs Work':'⚠️', Bad:'👎' };
const RATING_COLOR = { Excellent:'#16a34a', Good:'#2563eb', Okay:'#d97706', 'Needs Work':'#ea580c', Bad:'#dc2626' };
const STATUS_BADGE = {
  pending:      { label:'⏳ Pending',        cls:'badge-pending' },
  approved:     { label:'✅ Approved',       cls:'badge-approved' },
  rejected:     { label:'❌ Rejected',       cls:'badge-rejected' },
  revision_needed:{ label:'🔁 Needs Revision', cls:'badge-revision' },
  sent_to_director:{ label:'📤 Sent to Director', cls:'badge-director' },
};

const TYPES = ['poster','brochure','video','document','presentation','social_post'];

export default function MaterialsPage() {
  const { user, API } = useAuth();
  const isAdmin = user.role === 'admin';
  const isMarketing = user.department === 'Marketing' || user.role === 'marketing';
  const canUpload = isMarketing || isAdmin;

  const [tab, setTab] = useState('library');
  const [materials, setMaterials] = useState([]);
  const [library, setLibrary] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [directorPending, setDirectorPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [filterSol, setFilterSol] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');
  const [feedback, setFeedback] = useState({ rating:'', comment:'', suggestion:'' });
  const [submitted, setSubmitted] = useState({});
  const [dirNote, setDirNote] = useState('');

  // Upload form
  const [upForm, setUpForm] = useState({ title:'', solution:'', material_type:'poster', description:'', files:[] });
  const fileRef = useRef();

  // Solutions form
  const [solForm, setSolForm] = useState({ name:'', icon:'📦', color:'#14f1b1', description:'' });

  const showMsg = (m, type='success') => { setMsg(m); setMsgType(type); setTimeout(()=>setMsg(''),4000); };

  const fetchAll = () => {
    axios.get(`${API}/solutions`).then(r=>setSolutions(r.data)).catch(()=>{});
    axios.get(`${API}/materials/library`).then(r=>setLibrary(r.data)).catch(()=>{});
    if (isAdmin||isMarketing) axios.get(`${API}/materials`).then(r=>setMaterials(r.data)).catch(()=>{});
    if (isAdmin) axios.get(`${API}/materials/pending_director`).then(r=>setDirectorPending(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchAll(); },[]);

  const openMaterial = async (mat) => {
    setSelected(mat);
    const fb = await axios.get(`${API}/materials/${mat.id}/feedback`).then(r=>r.data).catch(()=>[]);
    setFeedbackList(fb);
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(f => new Promise(res => {
      const reader = new FileReader();
      reader.onload = ev => res({ name:f.name, data: ev.target.result });
      reader.readAsDataURL(f);
    }));
    Promise.all(promises).then(results => setUpForm(u=>({...u, files:results})));
  };

  const uploadMaterial = async (e) => {
    e.preventDefault();
    if (!upForm.title||!upForm.solution||!upForm.material_type) { showMsg('Fill all required fields','error'); return; }
    try {
      await axios.post(`${API}/materials`, upForm);
      showMsg('Material uploaded! Pending admin review ✅');
      setShowUpload(false);
      setUpForm({ title:'', solution:'', material_type:'poster', description:'', files:[] });
      fetchAll();
    } catch(err) { showMsg(err.response?.data?.error||'Upload failed','error'); }
  };

  const doAction = async (mid, action, note='') => {
    try {
      await axios.post(`${API}/materials/${mid}/action`, { action, note });
      showMsg('Done ✅');
      setSelected(null); fetchAll();
    } catch(err) { showMsg(err.response?.data?.error||'Error','error'); }
  };

  const submitFeedback = async () => {
    if (!feedback.rating) { showMsg('Please select a rating','error'); return; }
    await axios.post(`${API}/materials/${selected.id}/feedback`, feedback);
    setSubmitted(s=>({...s,[selected.id]:true}));
    setFeedback({ rating:'', comment:'', suggestion:'' });
    showMsg('Feedback submitted! Thank you 🎉');
    const fb = await axios.get(`${API}/materials/${selected.id}/feedback`).then(r=>r.data).catch(()=>[]);
    setFeedbackList(fb);
    const mat = await axios.get(`${API}/materials/${selected.id}`).then(r=>r.data).catch(()=>null);
    if (mat) setSelected(mat);
  };

  const createSolution = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/solutions`, solForm);
      showMsg('Solution created ✅'); setSolForm({ name:'', icon:'📦', color:'#14f1b1', description:'' });
      fetchAll();
    } catch(err) { showMsg(err.response?.data?.error||'Error','error'); }
  };

  const deleteSolution = async (id) => {
    if (!window.confirm('Delete this solution?')) return;
    await axios.delete(`${API}/solutions/${id}`);
    showMsg('Deleted'); fetchAll();
  };

  const seedSolutions = async () => {
    const r = await axios.post(`${API}/solutions/seed`);
    showMsg(r.data.message); fetchAll();
  };

  // Filter library by solution
  const filteredLibrary = filterSol ? library.filter(m=>m.solution===filterSol) : library;
  const filteredMats = materials.filter(m => {
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterSol && m.solution !== filterSol) return false;
    return true;
  });

  const totalFb = (mat) => Object.values(mat.feedback_counts||{}).reduce((a,b)=>a+b,0);
  const fbPct = (mat, r) => {
    const t = totalFb(mat); if (!t) return 0;
    return Math.round((mat.feedback_counts[r]||0)/t*100);
  };

  // ─── Detail view ───
  if (selected) return (
    <div className="container">
      <button className="btn btn-secondary btn-sm" onClick={()=>setSelected(null)} style={{marginBottom:20}}>← Back</button>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:24}}>
        {/* Left: material info */}
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{background:'#f0f4ff', borderRadius:10, height:160, display:'flex',
              alignItems:'center', justifyContent:'center', marginBottom:16, fontSize:64}}>
              {selected.material_type==='video'?'🎥':selected.material_type==='poster'?'🖼️':
               selected.material_type==='brochure'?'📋':selected.material_type==='presentation'?'📊':'📄'}
            </div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:10}}>
              {selected.solution && <span style={{background:'#ede9fe',color:'#5b21b6',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>{selected.solution}</span>}
              {selected.material_type && <span style={{background:'#f0f4ff',color:'var(--navy)',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>{selected.material_type}</span>}
              <span className={`badge ${STATUS_BADGE[selected.status]?.cls||'badge-pending'}`}>
                {STATUS_BADGE[selected.status]?.label||selected.status}
              </span>
            </div>
            <h2 style={{fontWeight:800, fontSize:20, marginBottom:8}}>{selected.title}</h2>
            {selected.description && <p style={{color:'var(--muted)', fontSize:14, marginBottom:12}}>{selected.description}</p>}
            <div style={{fontSize:13, color:'var(--muted)', display:'flex', flexDirection:'column', gap:4}}>
              {selected.uploaded_by_name && <span>📤 Uploaded by: <b>{selected.uploaded_by_name}</b></span>}
              <span>📅 {selected.created_at}</span>
            </div>
            {selected.files?.length>0 && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px'}}>Files</div>
                {selected.files.map((f,i)=>(
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    style={{display:'inline-flex',alignItems:'center',gap:6,background:'#f0f4ff',
                      color:'var(--navy)',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,
                      textDecoration:'none',marginRight:8,marginBottom:6,border:'1px solid var(--border)'}}>
                    📎 {f.name}
                  </a>
                ))}
              </div>
            )}
            {selected.director_note && (
              <div style={{marginTop:12, background:'#fef9c3', borderRadius:8, padding:'10px 14px', fontSize:13}}>
                <b>📝 Note:</b> {selected.director_note}
              </div>
            )}
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="card">
              <h4 style={{fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:6}}>
                🔑 Admin Actions
              </h4>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                <button className="btn btn-success btn-sm" onClick={()=>doAction(selected.id,'approve')}>✅ Approve</button>
                <button className="btn btn-warning btn-sm" onClick={()=>doAction(selected.id,'revision')}>🔁 Needs Revision</button>
                <button className="btn btn-danger btn-sm" onClick={()=>doAction(selected.id,'reject')}>❌ Reject</button>
                <button onClick={()=>doAction(selected.id,'send_to_director',dirNote)}
                  style={{background:'#ede9fe',color:'#5b21b6',border:'1px solid #c4b5fd',padding:'6px 13px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>
                  📤 Send to Director
                </button>
                <button className="btn btn-danger btn-sm" onClick={()=>doAction(selected.id,'delete')}>🗑 Delete</button>
              </div>
              <div style={{marginTop:10}}>
                <input className="input" placeholder="Add note for director (optional)" value={dirNote}
                  onChange={e=>setDirNote(e.target.value)} style={{fontSize:13}}/>
              </div>
            </div>
          )}
        </div>

        {/* Right: feedback */}
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* Feedback summary */}
          <div className="card">
            <h4 style={{fontWeight:700, marginBottom:16}}>📊 Feedback Summary ({totalFb(selected)} responses)</h4>
            {RATINGS.map(r=>(
              <div key={r} style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                <span style={{fontSize:16}}>{RATING_EMOJI[r]}</span>
                <span style={{width:80, fontSize:13, fontWeight:500}}>{r}</span>
                <div style={{flex:1, height:8, background:'#f0f4ff', borderRadius:4, overflow:'hidden'}}>
                  <div style={{height:'100%', width:`${fbPct(selected,r)}%`,
                    background:RATING_COLOR[r], borderRadius:4, transition:'width 0.5s'}}/>
                </div>
                <span style={{fontSize:12, color:'var(--muted)', width:55, textAlign:'right'}}>
                  {selected.feedback_counts?.[r]||0} ({fbPct(selected,r)}%)
                </span>
              </div>
            ))}
          </div>

          {/* Give feedback */}
          <div className="card">
            <h4 style={{fontWeight:700, marginBottom:14}}>💬 Your Feedback</h4>
            {submitted[selected.id] ? (
              <div style={{textAlign:'center', padding:20, color:'#16a34a'}}>
                <div style={{fontSize:36, marginBottom:8}}>🎉</div>
                <p style={{fontWeight:600}}>Feedback submitted! Thank you.</p>
              </div>
            ) : (<>
              <p style={{fontSize:13, color:'var(--muted)', marginBottom:14}}>How would you rate this material?</p>
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:14}}>
                {RATINGS.map(r=>(
                  <button key={r} onClick={()=>setFeedback(f=>({...f,rating:r}))}
                    style={{padding:'10px 14px', borderRadius:10,
                      border:`2px solid ${feedback.rating===r?RATING_COLOR[r]:'var(--border)'}`,
                      background: feedback.rating===r ? RATING_COLOR[r]+'15' : 'white',
                      cursor:'pointer', fontWeight:600, fontSize:13,
                      color: feedback.rating===r ? RATING_COLOR[r] : 'var(--text)',
                      fontFamily:'DM Sans,sans-serif', transition:'all 0.15s',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                    <span style={{fontSize:20}}>{RATING_EMOJI[r]}</span>
                    <span>{r}</span>
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label className="label">Comment (optional)</label>
                <textarea className="textarea input" rows={2} placeholder="What do you think about this material?"
                  value={feedback.comment} onChange={e=>setFeedback(f=>({...f,comment:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="label">Suggestion (optional)</label>
                <textarea className="textarea input" rows={2} placeholder="Any suggestions for improvement?"
                  value={feedback.suggestion} onChange={e=>setFeedback(f=>({...f,suggestion:e.target.value}))}/>
              </div>
              <button className="btn btn-primary w-full" onClick={submitFeedback}
                style={{justifyContent:'center'}}>📩 Submit Feedback</button>
            </>)}
          </div>

          {/* All feedback list */}
          {feedbackList.length>0 && (
            <div className="card">
              <h4 style={{fontWeight:700, marginBottom:14}}>💬 All Feedback ({feedbackList.length})</h4>
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {feedbackList.map((f,i)=>(
                  <div key={i} style={{background:'#f8faff', borderRadius:8, padding:'10px 12px'}}>
                    <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:4}}>
                      <span style={{fontSize:16}}>{RATING_EMOJI[f.rating]}</span>
                      <span style={{fontWeight:600, fontSize:13, color:RATING_COLOR[f.rating]}}>{f.rating}</span>
                      {f.dept && <span style={{fontSize:12, color:'var(--muted)'}}>· {f.dept}</span>}
                    </div>
                    {f.comment && <p style={{fontSize:13, color:'var(--muted)'}}>{f.comment}</p>}
                    {f.suggestion && <p style={{fontSize:12, color:'var(--muted)', marginTop:2, fontStyle:'italic'}}>💡 {f.suggestion}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Main view ───
  const tabs = [
    { id:'library', label:'✅ Library', show:true },
    { id:'all', label:'📁 All Materials', show: isAdmin||isMarketing },
    { id:'director', label:'📤 Director Review', show: isAdmin },
    { id:'solutions', label:'🏷️ Solutions', show: isAdmin },
  ].filter(t=>t.show);

  return (
    <div className="container">
      {msg && <div className={`alert alert-${msgType==='error'?'error':'success'}`}>{msg}</div>}

      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">📁 Materials</h1>
          <p className="page-sub">Marketing materials, feedback and approvals</p>
        </div>
        <div style={{display:'flex', gap:10}}>
          {canUpload && (
            <button className="btn btn-primary" onClick={()=>setShowUpload(!showUpload)}>
              ⬆️ Upload Material
            </button>
          )}
        </div>
      </div>

      {/* Upload form */}
      {showUpload && canUpload && (
        <div className="card" style={{marginBottom:24, border:'2px solid var(--green)'}}>
          <h3 style={{fontWeight:700, marginBottom:4}}>⬆️ Upload Marketing Material</h3>
          <p style={{fontSize:13, color:'var(--muted)', marginBottom:20}}>Internal team will review and approve</p>
          <form onSubmit={uploadMaterial}>
            <div className="form-group">
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. Q1 HR Module Launch Poster" value={upForm.title}
                onChange={e=>setUpForm(u=>({...u,title:e.target.value}))} required/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">BAS Solution *</label>
                <select className="select" value={upForm.solution} onChange={e=>setUpForm(u=>({...u,solution:e.target.value}))} required>
                  <option value="">Select solution...</option>
                  {solutions.map(s=><option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Material Type *</label>
                <select className="select" value={upForm.material_type} onChange={e=>setUpForm(u=>({...u,material_type:e.target.value}))} required>
                  {TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1).replace('_',' ')}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Description (optional)</label>
              <textarea className="input textarea" rows={3} placeholder="Brief description of this material and its purpose..."
                value={upForm.description} onChange={e=>setUpForm(u=>({...u,description:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="label">Files (images, PDFs, videos)</label>
              <div style={{border:'2px dashed var(--border)', borderRadius:10, padding:24,
                textAlign:'center', cursor:'pointer', background:'#f8faff'}}
                onClick={()=>fileRef.current.click()}>
                <div style={{fontSize:36, marginBottom:8}}>📁</div>
                <p style={{color:'var(--muted)', fontSize:14}}>Click to select files</p>
                {upForm.files.length>0 && (
                  <div style={{marginTop:10, display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center'}}>
                    {upForm.files.map((f,i)=>(
                      <span key={i} style={{background:'#f0fdf4',color:'#16a34a',
                        padding:'4px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>
                        ✓ {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" multiple style={{display:'none'}}
                accept="image/*,.pdf,.mp4,.mov,.pptx,.docx"
                onChange={handleFiles}/>
            </div>
            <div style={{display:'flex', gap:10}}>
              <button type="submit" className="btn btn-primary">📤 Upload Material</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setShowUpload(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t.id} className={`tab-btn${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Solutions tab */}
      {tab==='solutions' && isAdmin && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{fontWeight:700, marginBottom:16}}>➕ Add New Solution</h3>
            <form onSubmit={createSolution}>
              <div className="form-group">
                <label className="label">Name *</label>
                <input className="input" placeholder="e.g. CRM" value={solForm.name}
                  onChange={e=>setSolForm(s=>({...s,name:e.target.value}))} required/>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Icon (Emoji)</label>
                  <input className="input" value={solForm.icon} maxLength={2}
                    onChange={e=>setSolForm(s=>({...s,icon:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="label">Color</label>
                  <input type="color" value={solForm.color}
                    onChange={e=>setSolForm(s=>({...s,color:e.target.value}))}
                    style={{width:'100%',height:44,borderRadius:10,border:'1.5px solid var(--border)',cursor:'pointer'}}/>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <input className="input" placeholder="Optional description" value={solForm.description}
                  onChange={e=>setSolForm(s=>({...s,description:e.target.value}))}/>
              </div>
              <div style={{display:'flex', gap:8}}>
                <button type="submit" className="btn btn-primary">➕ Create Solution</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={seedSolutions}>🌱 Seed Defaults</button>
              </div>
            </form>
          </div>
          <div className="card">
            <h3 style={{fontWeight:700, marginBottom:16}}>📋 Active Solutions ({solutions.length})</h3>
            {solutions.length===0 ? <p className="text-muted text-sm">No solutions yet. Click "Seed Defaults".</p> :
              solutions.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',
                  borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:40,height:40,borderRadius:10,background:s.color+'20',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                    {s.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700}}>{s.name}</div>
                    {s.description && <div style={{fontSize:12,color:'var(--muted)'}}>{s.description}</div>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={()=>deleteSolution(s.id)}>🗑</button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Director review tab */}
      {tab==='director' && isAdmin && (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',gap:16,marginBottom:4}}>
            {[['total',directorPending.length,'Total'],
              ['pending',directorPending.filter(m=>m.status==='sent_to_director').length,'Pending'],
              ['approved',directorPending.filter(m=>m.status==='approved').length,'Approved'],
              ['rejected',directorPending.filter(m=>m.status==='rejected').length,'Rejected'],
            ].map(([k,v,l])=>(
              <div key={k} className="card" style={{flex:1,textAlign:'center',padding:'14px 10px'}}>
                <div style={{fontSize:24,fontWeight:800,color:'var(--navy)'}}>{v}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{l}</div>
              </div>
            ))}
          </div>
          {directorPending.length===0
            ? <div className="card" style={{textAlign:'center',padding:40}}><p className="text-muted">No items pending director review.</p></div>
            : directorPending.map(m=>(
              <div key={m.id} className="card">
                <div className="flex-between" style={{flexWrap:'wrap',gap:10}}>
                  <div>
                    <h3 style={{fontWeight:700,fontSize:17}}>{m.title}</h3>
                    <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                      {m.solution && <span style={{fontSize:12,background:'#ede9fe',color:'#5b21b6',padding:'2px 10px',borderRadius:20,fontWeight:600}}>{m.solution}</span>}
                      <span style={{fontSize:12,background:'#f3f4f6',padding:'2px 10px',borderRadius:20}}>{m.material_type}</span>
                      <span style={{fontSize:12,color:'var(--muted)'}}>by {m.uploaded_by_name} · {m.created_at}</span>
                      <span style={{fontSize:12,color:'#f59e0b'}}>💬 {m.feedback_count} feedback</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    <button className="btn btn-success btn-sm" onClick={()=>doAction(m.id,'director_approve')}>✅ Approve</button>
                    <button className="btn btn-warning btn-sm" onClick={()=>doAction(m.id,'director_revision')}>🔁 Revision</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>doAction(m.id,'director_reject')}>❌ Reject</button>
                    <button className="btn btn-secondary btn-sm" onClick={()=>openMaterial(m)}>👁 View</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Library tab */}
      {tab==='library' && (
        <>
          {/* Solution filter pills */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20}}>
            <button onClick={()=>setFilterSol('')}
              style={{padding:'6px 16px',borderRadius:20,border:'1.5px solid',cursor:'pointer',
                fontWeight:600,fontSize:13,fontFamily:'DM Sans,sans-serif',
                background:!filterSol?'var(--navy)':'white',
                color:!filterSol?'var(--green)':'var(--muted)',
                borderColor:!filterSol?'var(--navy)':'var(--border)'}}>
              All ({library.length})
            </button>
            {solutions.map(s=>{
              const count = library.filter(m=>m.solution===s.name).length;
              return (
                <button key={s.id} onClick={()=>setFilterSol(filterSol===s.name?'':s.name)}
                  style={{padding:'6px 16px',borderRadius:20,border:'1.5px solid',cursor:'pointer',
                    fontWeight:600,fontSize:13,fontFamily:'DM Sans,sans-serif',
                    background:filterSol===s.name?s.color:s.color+'15',
                    color:filterSol===s.name?'white':s.color,
                    borderColor:s.color+'60'}}>
                  {s.icon} {s.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Group by solution */}
          {solutions.filter(s=>!filterSol||s.name===filterSol).map(sol=>{
            const solMats = filteredLibrary.filter(m=>m.solution===sol.name);
            if (solMats.length===0) return null;
            return (
              <div key={sol.id} style={{marginBottom:28}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                  <div style={{width:36,height:36,borderRadius:10,background:sol.color+'20',
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>
                    {sol.icon}
                  </div>
                  <div>
                    <h3 style={{fontWeight:800,fontSize:16,color:'var(--navy)'}}>{sol.name}</h3>
                    <p style={{fontSize:12,color:'var(--muted)'}}>{solMats.length} approved materials</p>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
                  {solMats.map(m=>(
                    <div key={m.id} className="card" onClick={()=>openMaterial(m)}
                      style={{cursor:'pointer',padding:0,overflow:'hidden',transition:'transform 0.2s,box-shadow 0.2s'}}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 10px 28px rgba(5,19,60,0.14)';}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                      <div style={{height:130,background:'#f0f4ff',display:'flex',alignItems:'center',
                        justifyContent:'center',fontSize:48,overflow:'hidden'}}>
                        {m.files?.[0]?.url && (m.files[0].url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                          ? <img src={m.files[0].url} alt={m.title}
                              style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                          : (m.material_type==='video'?'🎥':m.material_type==='poster'?'🖼️':'📄')}
                      </div>
                      <div style={{padding:'12px 14px'}}>
                        <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{m.title}</div>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <span style={{fontSize:12,color:'var(--muted)'}}>{m.material_type}</span>
                          <span style={{fontSize:12,color:'#f59e0b'}}>💬 {m.feedback_count}</span>
                        </div>
                        {m.files?.[0]?.url && (
                          <a href={m.files[0].url} download target="_blank" rel="noreferrer"
                            onClick={e=>e.stopPropagation()}
                            style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:10,
                              color:'var(--navy)',fontSize:12,fontWeight:600,textDecoration:'none',
                              background:'#f0f4ff',padding:'4px 10px',borderRadius:20,border:'1px solid var(--border)'}}>
                            ⬇️ Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {filteredLibrary.length===0 && (
            <div className="card" style={{textAlign:'center',padding:60}}>
              <div style={{fontSize:48,marginBottom:12}}>📚</div>
              <h3 style={{fontWeight:700,marginBottom:6}}>No approved materials yet</h3>
              <p className="text-muted">Approved materials appear here for all staff to view.</p>
            </div>
          )}
        </>
      )}

      {/* All materials tab */}
      {tab==='all' && (isAdmin||isMarketing) && (
        <>
          <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
            <select className="select" style={{width:'auto'}} value={filterStatus}
              onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {Object.entries(STATUS_BADGE).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="select" style={{width:'auto'}} value={filterSol}
              onChange={e=>setFilterSol(e.target.value)}>
              <option value="">All Solutions</option>
              {solutions.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14}}>
            {filteredMats.map(m=>(
              <div key={m.id} className="card" onClick={()=>openMaterial(m)}
                style={{cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',padding:0,overflow:'hidden'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 10px 24px rgba(5,19,60,0.14)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
                <div style={{height:120,background:'#f0f4ff',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:40,position:'relative',overflow:'hidden'}}>
                  {m.files?.[0]?.url && m.files[0].url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? <img src={m.files[0].url} alt={m.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : (m.material_type==='video'?'🎥':m.material_type==='poster'?'🖼️':'📄')}
                  <div style={{position:'absolute',top:8,right:8}}>
                    <span className={`badge ${STATUS_BADGE[m.status]?.cls||'badge-pending'}`} style={{fontSize:11}}>
                      {STATUS_BADGE[m.status]?.label||m.status}
                    </span>
                  </div>
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{m.title}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {m.solution && <span style={{fontSize:11,background:'#ede9fe',color:'#5b21b6',padding:'2px 8px',borderRadius:20,fontWeight:600}}>{m.solution}</span>}
                    <span style={{fontSize:11,color:'var(--muted)'}}>{m.material_type}</span>
                    <span style={{fontSize:11,color:'#f59e0b'}}>💬 {m.feedback_count}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--muted)',marginTop:6}}>{m.created_at}</div>
                </div>
              </div>
            ))}
            {filteredMats.length===0 && (
              <div style={{gridColumn:'1/-1'}} className="card">
                <p className="text-muted text-center" style={{padding:40}}>No materials found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
