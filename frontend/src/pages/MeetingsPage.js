import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = ['Google Meet','Zoom','Microsoft Teams','Webex','Other'];
const DEPT_LIST = ['Deployment','Functional','Marketing','Research'];
const STATUS_STYLE = {
  live:    { bg:'#fef2f2', color:'#dc2626', label:'Live Now' },
  upcoming:{ bg:'#f0fdf4', color:'#16a34a', label:'Upcoming' },
  ended:   { bg:'var(--gray-100)', color:'var(--gray-400)', label:'Ended' },
};
const PLATFORM_ICONS = {'Google Meet':'🟢','Zoom':'🔵','Microsoft Teams':'🟣','Webex':'🟤','Other':'🔗'};

function timeUntil(isoStr){
  if(!isoStr) return '';
  const diff = new Date(isoStr) - new Date();
  if(diff<0) return 'Ended';
  const mins = Math.floor(diff/60000);
  const hrs = Math.floor(mins/60);
  const days = Math.floor(hrs/24);
  if(days>0) return `in ${days}d`;
  if(hrs>0) return `in ${hrs}h ${mins%60}m`;
  return `in ${mins}m`;
}

export default function MeetingsPage() {
  const { user, API } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [view, setView] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [showRecurForm, setShowRecurForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editNotes, setEditNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [msg, setMsg] = useState('');
  const [agendaItem, setAgendaItem] = useState('');
  const [recurForm, setRecurForm] = useState({ title:'Daily Standup', link:'', platform:'Google Meet', schedule:'Daily' });

  const defaultForm = { title:'', description:'', start_dt:'', duration_mins:60, platform:'Google Meet', meeting_link:'', attendees:['all'], agenda:[] };
  const [form, setForm] = useState(defaultForm);

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3500); };

  const fetchAll = () => {
    axios.get(`${API}/meetings?view=${view}`).then(r=>setMeetings(r.data)).catch(()=>{});
    axios.get(`${API}/meetings/recurring`).then(r=>setRecurring(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchAll(); },[view]);
  useEffect(()=>{ const i=setInterval(fetchAll,30000); return ()=>clearInterval(i); },[view]);

  const createMeeting = async (e) => {
    e.preventDefault();
    if(!form.title||!form.start_dt) return;
    try {
      const local = new Date(form.start_dt);
      await axios.post(`${API}/meetings`,{...form, start_dt: local.toISOString()});
      setShowForm(false); setForm(defaultForm); fetchAll(); showMsg('Meeting scheduled');
    } catch(err){ showMsg(err.response?.data?.error||'Error'); }
  };

  const deleteMeeting = async (id) => {
    if(!window.confirm('Delete this meeting?')) return;
    await axios.delete(`${API}/meetings/${id}`);
    setSelected(null); fetchAll(); showMsg('Deleted');
  };

  const saveNotes = async (id) => {
    await axios.put(`${API}/meetings/${id}/notes`,{notes:noteText});
    setEditNotes(false); fetchAll();
    if(selected) setSelected(s=>({...s,notes:noteText}));
    showMsg('Notes saved');
  };

  const addAgenda = () => {
    if(!agendaItem.trim()) return;
    setForm(f=>({...f,agenda:[...f.agenda,agendaItem.trim()]}));
    setAgendaItem('');
  };

  const toggleAttendee = (val) => {
    setForm(f=>{
      if(val==='all') return {...f,attendees:['all']};
      let next = f.attendees.filter(a=>a!=='all');
      next = next.includes(val) ? next.filter(a=>a!==val) : [...next,val];
      return {...f,attendees:next.length?next:['all']};
    });
  };

  const createRecurring = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/meetings/recurring`, recurForm);
    setShowRecurForm(false); setRecurForm({title:'Daily Standup',link:'',platform:'Google Meet',schedule:'Daily'});
    fetchAll(); showMsg('Recurring link saved');
  };

  const deleteRecurring = async (id) => {
    await axios.delete(`${API}/meetings/recurring/${id}`);
    fetchAll();
  };

  const liveMeetings = meetings.filter(m=>m.status==='live');

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle">Schedule, join and track team meetings</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {user.role==='admin' && <button className="btn btn-outline" onClick={()=>setShowRecurForm(!showRecurForm)}>+ Recurring Link</button>}
          <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ Schedule</button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Recurring links */}
      {recurring.length>0 && (
        <div className="card" style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:12}}>
            Permanent Meeting Links
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {recurring.map(r=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'10px 14px',border:'1px solid var(--border)'}}>
                <span style={{fontSize:18}}>{PLATFORM_ICONS[r.platform]||'🔗'}</span>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{r.title}</div>
                  <div style={{fontSize:11,color:'var(--gray-400)'}}>{r.schedule} · {r.platform}</div>
                </div>
                <a href={r.link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{marginLeft:4}}>Join</a>
                {user.role==='admin' && (
                  <button onClick={()=>deleteRecurring(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)',fontSize:16,padding:'0 4px'}}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring form */}
      {showRecurForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:20,borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700,marginBottom:16,fontSize:15}}>Add Permanent Meeting Link</h3>
          <p style={{fontSize:13,color:'var(--gray-400)',marginBottom:16}}>Save a Google Meet or Zoom link that the team can use for recurring meetings like daily standups.</p>
          <form onSubmit={createRecurring}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Daily Standup" value={recurForm.title} onChange={e=>setRecurForm(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Platform</label>
                <select className="select" value={recurForm.platform} onChange={e=>setRecurForm(f=>({...f,platform:e.target.value}))}>
                  {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Meeting Link *</label>
                <input className="input" type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx" value={recurForm.link} onChange={e=>setRecurForm(f=>({...f,link:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Schedule</label>
                <select className="select" value={recurForm.schedule} onChange={e=>setRecurForm(f=>({...f,schedule:e.target.value}))}>
                  {['Daily','Weekdays','Weekly','Bi-weekly'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary">Save Link</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowRecurForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Live banner */}
      {liveMeetings.length>0 && (
        <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:16,borderLeft:'4px solid #dc2626'}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:'#dc2626',boxShadow:'0 0 0 3px rgba(220,38,38,0.3)',flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{color:'white',fontWeight:700,fontSize:15}}>{liveMeetings[0].title}</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:12}}>{liveMeetings[0].organizer_name} · Live now</div>
          </div>
          {liveMeetings[0].meeting_link && (
            <a href={liveMeetings[0].meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join Now</a>
          )}
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <div className="card" style={{marginBottom:20,borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700,marginBottom:20,fontSize:15}}>Schedule Meeting</h3>
          <form onSubmit={createMeeting}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Weekly Standup" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Platform</label>
                <select className="select" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
                  {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Date & Time *</label>
                <input className="input" type="datetime-local" value={form.start_dt} onChange={e=>setForm(f=>({...f,start_dt:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Duration</label>
                <select className="select" value={form.duration_mins} onChange={e=>setForm(f=>({...f,duration_mins:parseInt(e.target.value)}))}>
                  {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Meeting Link</label>
              <input className="input" type="url" placeholder="https://meet.google.com/..." value={form.meeting_link} onChange={e=>setForm(f=>({...f,meeting_link:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input textarea" rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="label">Invite</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[['all','Everyone'],['dept:Deployment','Deployment'],['dept:Functional','Functional'],['dept:Marketing','Marketing'],['dept:Research','Research']].map(([val,label])=>(
                  <button key={val} type="button" onClick={()=>toggleAttendee(val)}
                    className={`btn btn-sm`}
                    style={{background:form.attendees.includes(val)?'var(--navy)':'white',color:form.attendees.includes(val)?'var(--mint)':'var(--gray-400)',border:`1px solid ${form.attendees.includes(val)?'var(--navy)':'var(--border)'}`}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Agenda</label>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input className="input" placeholder="Add item..." value={agendaItem} onChange={e=>setAgendaItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addAgenda())} style={{flex:1}}/>
                <button type="button" className="btn btn-outline btn-sm" onClick={addAgenda}>Add</button>
              </div>
              {form.agenda.map((item,i)=>(
                <div key={i} style={{display:'flex',gap:8,alignItems:'center',padding:'6px 10px',background:'var(--gray-100)',borderRadius:'var(--radius)',marginBottom:4}}>
                  <span style={{color:'var(--mint)',fontWeight:700,fontSize:12}}>{i+1}.</span>
                  <span style={{flex:1,fontSize:13}}>{item}</span>
                  <button type="button" onClick={()=>setForm(f=>({...f,agenda:f.agenda.filter((_,j)=>j!==i)}))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--gray-400)',fontSize:16}}>×</button>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary">Schedule Meeting</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[['upcoming','Upcoming'],['past','Past'],['mine','My Meetings']].map(([id,label])=>(
          <button key={id} className={`tab${view===id?' active':''}`} onClick={()=>setView(id)}>{label}</button>
        ))}
      </div>

      {/* Meeting detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:STATUS_STYLE[selected.status]?.bg,color:STATUS_STYLE[selected.status]?.color,marginBottom:6,display:'inline-block'}}>
                  {STATUS_STYLE[selected.status]?.label}
                </span>
                <h2 className="modal-title" style={{marginTop:4}}>{selected.title}</h2>
              </div>
              <button className="btn btn-outline btn-sm" onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div className="grid-2" style={{gap:10,marginBottom:16}}>
              {[['Date',selected.start_str],['Duration',`${selected.duration_mins} min`],['Organizer',selected.organizer_name],['Platform',selected.platform]].map(([l,v])=>(
                <div key={l} style={{background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'10px 12px'}}>
                  <div style={{fontSize:11,color:'var(--gray-400)',marginBottom:2}}>{l}</div>
                  <div style={{fontWeight:600,fontSize:13}}>{v}</div>
                </div>
              ))}
            </div>
            {selected.description && <p style={{fontSize:14,color:'var(--gray-400)',marginBottom:14,lineHeight:1.6}}>{selected.description}</p>}
            {selected.agenda?.length>0 && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Agenda</div>
                {selected.agenda.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                    <span style={{color:'var(--mint)',fontWeight:700}}>{i+1}.</span><span>{item}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Notes</div>
                <button className="btn btn-outline btn-sm" onClick={()=>{setEditNotes(!editNotes);setNoteText(selected.notes||'');}}>
                  {editNotes?'Cancel':'Edit'}
                </button>
              </div>
              {editNotes ? (
                <div>
                  <textarea className="input textarea" rows={4} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add meeting notes..."/>
                  <button className="btn btn-primary btn-sm" style={{marginTop:8}} onClick={()=>saveNotes(selected.id)}>Save</button>
                </div>
              ) : (
                <div style={{background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'12px',fontSize:13,color:selected.notes?'var(--navy)':'var(--gray-400)',minHeight:60,lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                  {selected.notes||'No notes yet.'}
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {selected.meeting_link && selected.status!=='ended' && (
                <a href={selected.meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary">
                  {PLATFORM_ICONS[selected.platform]||'🔗'} Join Meeting
                </a>
              )}
              {(selected.is_organizer||user.role==='admin') && (
                <button className="btn btn-danger btn-sm" onClick={()=>deleteMeeting(selected.id)}>Delete</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meeting list */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {meetings.length===0 && (
          <div className="card"><div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>{view==='upcoming'?'No upcoming meetings':'No meetings found'}</h3>
            {view==='upcoming'&&<button className="btn btn-primary" style={{marginTop:14}} onClick={()=>setShowForm(true)}>Schedule Meeting</button>}
          </div></div>
        )}
        {meetings.map(m=>{
          const ss = STATUS_STYLE[m.status]||STATUS_STYLE.upcoming;
          return (
            <div key={m.id} className="card" onClick={()=>setSelected(m)}
              style={{cursor:'pointer',display:'flex',gap:16,alignItems:'center',borderLeft:`3px solid ${m.status==='live'?'#dc2626':m.status==='upcoming'?'var(--mint)':'var(--border)'}`,transition:'box-shadow 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-md)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow)'}>
              <div style={{textAlign:'center',minWidth:48,background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'8px',flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase'}}>
                  {m.start_dt?new Date(m.start_dt).toLocaleString('en',{month:'short'}):''}
                </div>
                <div style={{fontSize:20,fontWeight:800,color:'var(--navy)',lineHeight:1}}>
                  {m.start_dt?new Date(m.start_dt).getDate():''}
                </div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                  <h3 style={{fontWeight:700,fontSize:15,color:'var(--navy)'}}>{m.title}</h3>
                  <span style={{padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,background:ss.bg,color:ss.color}}>{ss.label}</span>
                </div>
                <div style={{display:'flex',gap:12,fontSize:12,color:'var(--gray-400)',flexWrap:'wrap'}}>
                  <span>{m.start_str}</span>
                  <span>{m.duration_mins} min</span>
                  <span>{PLATFORM_ICONS[m.platform]||'🔗'} {m.platform}</span>
                  <span>by {m.organizer_name}</span>
                </div>
              </div>
              <div style={{flexShrink:0,textAlign:'right'}}>
                {m.status!=='ended' && <div style={{fontSize:12,fontWeight:600,color:m.status==='live'?'#dc2626':'#059669',marginBottom:6}}>{timeUntil(m.start_dt)}</div>}
                {m.meeting_link && m.status!=='ended' && (
                  <a href={m.meeting_link} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    className="btn btn-primary btn-sm">
                    {m.status==='live'?'Join Now':'Join'}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
