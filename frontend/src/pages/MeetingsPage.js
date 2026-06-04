import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = ['Google Meet','Zoom','Microsoft Teams','Webex','Other'];
const DEPT_LIST = ['Deployment','Functional','Marketing','Research'];

function timeUntil(isoStr){
  if(!isoStr) return '';
  const diff = new Date(isoStr) - new Date();
  if(diff<0) return 'Ended';
  const mins = Math.floor(diff/60000);
  const hrs = Math.floor(mins/60);
  const days = Math.floor(hrs/24);
  if(days>0) return `in ${days}d ${hrs%24}h`;
  if(hrs>0) return `in ${hrs}h ${mins%60}m`;
  return `in ${mins}m`;
}

const STATUS_STYLE = {
  live:    {bg:'#fef2f2',color:'#dc2626',label:'🔴 Live Now'},
  upcoming:{bg:'#f0fdf4',color:'#16a34a',label:'🟢 Upcoming'},
  ended:   {bg:'#f3f4f6',color:'#6b7280',label:'⚫ Ended'},
};

const PLATFORM_ICONS = {'Google Meet':'🟢','Zoom':'🔵','Microsoft Teams':'🟣','Webex':'🟤','Other':'🔗'};

export default function MeetingsPage() {
  const { user, API } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [view, setView] = useState('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editNotes, setEditNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [msg, setMsg] = useState('');
  const [agendaItem, setAgendaItem] = useState('');

  const defaultForm = {
    title:'', description:'', start_dt:'', duration_mins:60,
    platform:'Google Meet', meeting_link:'', attendees:['all'],
    agenda:[], attendee_names:[],
  };
  const [form, setForm] = useState(defaultForm);

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3500); };

  const fetchMeetings = () =>
    axios.get(`${API}/meetings?view=${view}`).then(r=>setMeetings(r.data)).catch(()=>{});

  useEffect(()=>{ fetchMeetings(); },[view]);

  // Refresh live meetings every 30s
  useEffect(()=>{
    const i = setInterval(fetchMeetings, 30000);
    return ()=>clearInterval(i);
  },[view]);

  const createMeeting = async (e) => {
    e.preventDefault();
    if(!form.title||!form.start_dt) return;
    try {
      const local = new Date(form.start_dt);
      await axios.post(`${API}/meetings`,{...form, start_dt: local.toISOString()});
      setShowForm(false); setForm(defaultForm); fetchMeetings();
      showMsg('Meeting scheduled ✅');
    } catch(err){ showMsg(err.response?.data?.error||'Error'); }
  };

  const deleteMeeting = async (id) => {
    if(!window.confirm('Delete this meeting?')) return;
    await axios.delete(`${API}/meetings/${id}`);
    setSelected(null); fetchMeetings(); showMsg('Deleted');
  };

  const saveNotes = async (id) => {
    await axios.put(`${API}/meetings/${id}/notes`,{notes:noteText});
    setEditNotes(false); fetchMeetings();
    if(selected) setSelected(s=>({...s,notes:noteText}));
    showMsg('Notes saved ✅');
  };

  const addAgenda = () => {
    if(!agendaItem.trim()) return;
    setForm(f=>({...f,agenda:[...f.agenda,agendaItem.trim()]}));
    setAgendaItem('');
  };

  const toggleAttendees = (val) => {
    setForm(f=>{
      const curr = f.attendees;
      if(val==='all') return {...f,attendees:['all']};
      let next = curr.filter(a=>a!=='all');
      if(next.includes(val)) next=next.filter(a=>a!==val);
      else next.push(val);
      return {...f,attendees:next.length?next:['all']};
    });
  };

  const liveMeetings = meetings.filter(m=>m.status==='live');
  const tabs = [{id:'upcoming',label:'🗓️ Upcoming'},{id:'past',label:'📋 Past'},{id:'mine',label:'👤 My Meetings'}];

  return (
    <div className="container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">📹 Meetings</h1>
          <p className="page-sub">Schedule, join and track team meetings</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ Schedule Meeting</button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Live meetings banner */}
      {liveMeetings.length>0 && (
        <div style={{background:'linear-gradient(135deg,#dc2626,#b91c1c)',borderRadius:14,
          padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
          <div style={{width:12,height:12,borderRadius:'50%',background:'#fca5a5',
            boxShadow:'0 0 0 4px rgba(252,165,165,0.4)',animation:'pulse 1.5s infinite'}}/>
          <div style={{flex:1}}>
            <div style={{color:'white',fontWeight:700,fontSize:16}}>
              🔴 {liveMeetings[0].title} — Live Now!
            </div>
            <div style={{color:'rgba(255,255,255,0.8)',fontSize:13}}>{liveMeetings[0].organizer_name}</div>
          </div>
          {liveMeetings[0].meeting_link && (
            <a href={liveMeetings[0].meeting_link} target="_blank" rel="noreferrer"
              style={{background:'white',color:'#dc2626',padding:'10px 20px',
                borderRadius:10,fontWeight:800,textDecoration:'none',fontSize:14,
                boxShadow:'0 4px 14px rgba(0,0,0,0.15)'}}>
              Join Now →
            </a>
          )}
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <div className="card" style={{marginBottom:24,border:'2px solid var(--green)'}}>
          <h3 style={{fontWeight:700,marginBottom:20}}>📅 Schedule New Meeting</h3>
          <form onSubmit={createMeeting}>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Meeting Title *</label>
                <input className="input" placeholder="e.g. Weekly Standup" value={form.title}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Platform</label>
                <select className="select" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
                  {PLATFORMS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="label">Date & Time *</label>
                <input className="input" type="datetime-local" value={form.start_dt}
                  onChange={e=>setForm(f=>({...f,start_dt:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Duration (minutes)</label>
                <select className="select" value={form.duration_mins}
                  onChange={e=>setForm(f=>({...f,duration_mins:parseInt(e.target.value)}))}>
                  {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min{d>=60?' ('+d/60+'h)':''}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Meeting Link (Google Meet / Zoom URL)</label>
              <input className="input" type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx"
                value={form.meeting_link} onChange={e=>setForm(f=>({...f,meeting_link:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input textarea" rows={2} placeholder="What is this meeting about?"
                value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
            </div>
            {/* Attendees */}
            <div className="form-group">
              <label className="label">Invite</label>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {[['all','🌐 Everyone'],['dept:Deployment','🔵 Deployment'],
                  ['dept:Functional','🟣 Functional'],['dept:Marketing','🩷 Marketing'],
                  ['dept:Research','🟢 Research']].map(([val,label])=>(
                  <button key={val} type="button"
                    onClick={()=>toggleAttendees(val)}
                    style={{padding:'6px 14px',borderRadius:20,border:'1.5px solid',cursor:'pointer',
                      fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600,transition:'all 0.15s',
                      background:form.attendees.includes(val)?'var(--navy)':'white',
                      color:form.attendees.includes(val)?'var(--green)':'var(--muted)',
                      borderColor:form.attendees.includes(val)?'var(--navy)':'var(--border)'}}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Agenda */}
            <div className="form-group">
              <label className="label">Agenda Items</label>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input className="input" placeholder="Add agenda item..." value={agendaItem}
                  onChange={e=>setAgendaItem(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addAgenda())}
                  style={{flex:1}}/>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addAgenda}>+ Add</button>
              </div>
              {form.agenda.length>0 && (
                <div style={{background:'var(--bg)',borderRadius:8,padding:'8px 12px'}}>
                  {form.agenda.map((item,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',
                      borderBottom:i<form.agenda.length-1?'1px solid var(--border)':'none'}}>
                      <span style={{color:'var(--green)',fontWeight:700}}>{i+1}.</span>
                      <span style={{flex:1,fontSize:14}}>{item}</span>
                      <button type="button" onClick={()=>setForm(f=>({...f,agenda:f.agenda.filter((_,j)=>j!==i)}))}
                        style={{background:'none',border:'none',cursor:'pointer',color:'#dc2626',fontSize:16}}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button type="submit" className="btn btn-primary">📅 Schedule Meeting</button>
              <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t.id} className={`tab-btn${view===t.id?' active':''}`} onClick={()=>setView(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Meeting detail modal */}
      {selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(5,19,60,0.6)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}
          onClick={()=>setSelected(null)}>
          <div className="card" style={{width:'100%',maxWidth:640,maxHeight:'90vh',overflowY:'auto'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
              <div>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                  <span style={STATUS_STYLE[selected.status]||STATUS_STYLE.upcoming}
                    className={`badge`}>
                    {STATUS_STYLE[selected.status]?.label||selected.status}
                  </span>
                  <span style={{fontSize:13,color:'var(--muted)'}}>{selected.platform}</span>
                </div>
                <h2 style={{fontWeight:800,fontSize:22,color:'var(--navy)'}}>{selected.title}</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={()=>setSelected(null)}>✕</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              {[['📅 Date & Time',selected.start_str],['⏱ Duration',`${selected.duration_mins} minutes`],
                ['👤 Organizer',selected.organizer_name],['👥 Invited',
                  selected.attendees.includes('all')?'Everyone':
                  selected.attendees.filter(a=>a.startsWith('dept:')).map(a=>a.replace('dept:','')).join(', ')]
              ].map(([label,val])=>(
                <div key={label} style={{background:'var(--bg)',borderRadius:10,padding:'12px 14px'}}>
                  <div style={{fontSize:12,color:'var(--muted)',marginBottom:2}}>{label}</div>
                  <div style={{fontWeight:600,fontSize:14}}>{val}</div>
                </div>
              ))}
            </div>

            {selected.description && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Description</div>
                <p style={{fontSize:14,color:'var(--text)'}}>{selected.description}</p>
              </div>
            )}

            {selected.agenda?.length>0 && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Agenda</div>
                {selected.agenda.map((item,i)=>(
                  <div key={i} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:14}}>
                    <span style={{color:'var(--green)',fontWeight:800,width:20}}>{i+1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Meeting Notes</div>
                <button className="btn btn-secondary btn-sm"
                  onClick={()=>{setEditNotes(!editNotes);setNoteText(selected.notes||'');}}>
                  {editNotes?'Cancel':'✏️ Edit'}
                </button>
              </div>
              {editNotes ? (
                <div>
                  <textarea className="input textarea" rows={4} value={noteText}
                    onChange={e=>setNoteText(e.target.value)} placeholder="Add meeting notes..."/>
                  <button className="btn btn-primary btn-sm" style={{marginTop:8}}
                    onClick={()=>saveNotes(selected.id)}>Save Notes</button>
                </div>
              ) : (
                <div style={{background:'var(--bg)',borderRadius:8,padding:'12px 14px',
                  fontSize:14,color:selected.notes?'var(--text)':'var(--muted)',
                  minHeight:60,lineHeight:1.7,whiteSpace:'pre-wrap'}}>
                  {selected.notes||'No notes yet. Click Edit to add.'}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {selected.meeting_link && (
                <a href={selected.meeting_link} target="_blank" rel="noreferrer"
                  className="btn btn-primary">
                  {PLATFORM_ICONS[selected.platform]||'🔗'} Join Meeting
                </a>
              )}
              {selected.recording_url && (
                <a href={selected.recording_url} target="_blank" rel="noreferrer"
                  className="btn btn-secondary">🎬 Recording</a>
              )}
              {(selected.is_organizer || user.role==='admin') && (
                <button className="btn btn-danger btn-sm" onClick={()=>deleteMeeting(selected.id)}>🗑 Delete</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meeting list */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {meetings.length===0 && (
          <div className="card" style={{textAlign:'center',padding:60}}>
            <div style={{fontSize:56,marginBottom:12}}>📅</div>
            <h3 style={{fontWeight:700,marginBottom:6}}>
              {view==='upcoming'?'No upcoming meetings':'No meetings found'}
            </h3>
            <p className="text-muted">
              {view==='upcoming'?'Schedule a meeting to get started':'Nothing here yet'}
            </p>
            {view==='upcoming' && (
              <button className="btn btn-primary" style={{marginTop:16}} onClick={()=>setShowForm(true)}>
                + Schedule Meeting
              </button>
            )}
          </div>
        )}
        {meetings.map(m=>{
          const ss = STATUS_STYLE[m.status]||STATUS_STYLE.upcoming;
          return (
            <div key={m.id} className="card" onClick={()=>setSelected(m)}
              style={{cursor:'pointer',transition:'transform 0.15s,box-shadow 0.15s',
                borderLeft:`4px solid ${m.status==='live'?'#dc2626':m.status==='upcoming'?'var(--green)':'var(--border)'}`,
                display:'flex',gap:16,alignItems:'center'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.boxShadow='var(--shadow-md)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>

              {/* Date block */}
              <div style={{textAlign:'center',minWidth:56,background:'var(--bg)',
                borderRadius:10,padding:'10px 8px',flexShrink:0}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase'}}>
                  {m.start_dt?new Date(m.start_dt).toLocaleString('en',{month:'short'}):''}
                </div>
                <div style={{fontSize:22,fontWeight:900,color:'var(--navy)',lineHeight:1}}>
                  {m.start_dt?new Date(m.start_dt).getDate():''}
                </div>
              </div>

              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                  <h3 style={{fontWeight:700,fontSize:16,color:'var(--navy)'}}>{m.title}</h3>
                  <span style={{padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,
                    background:ss.bg,color:ss.color}}>{ss.label}</span>
                </div>
                <div style={{display:'flex',gap:12,fontSize:13,color:'var(--muted)',flexWrap:'wrap'}}>
                  <span>🕐 {m.start_str}</span>
                  <span>⏱ {m.duration_mins}min</span>
                  <span>{PLATFORM_ICONS[m.platform]||'🔗'} {m.platform}</span>
                  <span>👤 {m.organizer_name}</span>
                </div>
                {m.agenda?.length>0 && (
                  <div style={{marginTop:4,fontSize:12,color:'var(--muted)'}}>
                    📋 {m.agenda.length} agenda item{m.agenda.length>1?'s':''}
                  </div>
                )}
              </div>

              <div style={{flexShrink:0,textAlign:'right'}}>
                {m.status!=='ended' && (
                  <div style={{fontSize:12,fontWeight:600,color:m.status==='live'?'#dc2626':'var(--green)',marginBottom:6}}>
                    {timeUntil(m.start_dt)}
                  </div>
                )}
                {m.meeting_link && m.status!=='ended' && (
                  <a href={m.meeting_link} target="_blank" rel="noreferrer"
                    onClick={e=>e.stopPropagation()}
                    style={{display:'inline-block',background:m.status==='live'?'#dc2626':'var(--navy)',
                      color:'white',padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:700,textDecoration:'none'}}>
                    {m.status==='live'?'🔴 Join':'Join →'}
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
