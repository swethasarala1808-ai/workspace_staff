import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getDailyQuote, QUOTES, WEEKDAY_QUOTES } from '../data/quotes';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

export default function Dashboard() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [quicklinks, setQuicklinks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [customQuote, setCustomQuote] = useState(null);
  const [quoteForm, setQuoteForm] = useState({ text:'', attr:'' });
  const [annForm, setAnnForm] = useState({ type:'welcome', title:'', message:'', person_name:'', person_dept:'', person_role:'' });
  const [annMsg, setAnnMsg] = useState('');
  const DEPTS = ['Deployment','Functional','Marketing','Research'];

  const defaultQuote = getDailyQuote();
  const quote = customQuote || defaultQuote;
  const unread = policies.filter(p=>!p.read).length;

  const fetchAll = () => {
    axios.get(`${API}/policies`).then(r=>setPolicies(r.data)).catch(()=>{});
    axios.get(`${API}/ideas`).then(r=>setIdeas(r.data.slice(0,4))).catch(()=>{});
    axios.get(`${API}/chat/messages/company`).then(r=>setMsgs(r.data.slice(-4))).catch(()=>{});
    axios.get(`${API}/meetings?view=upcoming`).then(r=>setMeetings(r.data.slice(0,3))).catch(()=>{});
    axios.get(`${API}/quicklinks`).then(r=>setQuicklinks(r.data.slice(0,8))).catch(()=>{});
    axios.get(`${API}/announcements`).then(r=>setAnnouncements(r.data)).catch(()=>{});
    axios.get(`${API}/notifications`).then(r=>setNotifs(r.data)).catch(()=>{});
    axios.get(`${API}/daily_quote`).then(r=>{ if(r.data.custom) setCustomQuote(r.data); }).catch(()=>{});
  };
  useEffect(()=>{ fetchAll(); },[API]);

  const createAnn = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/announcements`, annForm);
    setAnnForm({ type:'welcome', title:'', message:'', person_name:'', person_dept:'', person_role:'' });
    setShowAnnForm(false); fetchAll();
    setAnnMsg('Posted'); setTimeout(()=>setAnnMsg(''),3000);
  };

  const deleteAnn = async (id) => {
    await axios.delete(`${API}/announcements/${id}`); fetchAll();
  };

  const saveQuote = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/daily_quote`, quoteForm);
    setShowQuoteForm(false); fetchAll();
    setAnnMsg('Daily quote updated'); setTimeout(()=>setAnnMsg(''),3000);
  };

  const markNotifsRead = async () => {
    await axios.post(`${API}/notifications/read`);
    setNotifs([]);
  };

  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';

  return (
    <div className="page-container">
      {/* Top bar with greeting + actions */}
      <div className="flex-between" style={{marginBottom:24}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:'var(--navy)'}}>{greeting}, {user.name.split(' ')[0]}</h1>
          <p style={{fontSize:13,color:'var(--gray-400)',marginTop:2}}>{user.department} · {user.role}</p>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {unread>0 && (
            <Link to="/policies" style={{fontSize:13,fontWeight:600,color:'#92400e',background:'#fef3c7',padding:'6px 12px',borderRadius:8,textDecoration:'none',border:'1px solid #fde68a'}}>
              {unread} unread {unread===1?'policy':'policies'}
            </Link>
          )}
          {/* Notifications bell */}
          <div style={{position:'relative'}}>
            <button onClick={()=>{ setShowNotifs(!showNotifs); if(!showNotifs&&notifs.length>0) markNotifsRead(); }}
              style={{position:'relative',background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'7px 12px',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',gap:6}}>
              🔔
              {notifs.length>0 && <span style={{position:'absolute',top:-4,right:-4,background:'#dc2626',color:'white',borderRadius:'50%',width:18,height:18,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{notifs.length>9?'9+':notifs.length}</span>}
            </button>
            {showNotifs && (
              <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',width:320,background:'white',borderRadius:'var(--radius-lg)',boxShadow:'0 8px 32px rgba(5,19,60,0.15)',border:'1px solid var(--border)',zIndex:200,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,fontSize:14}}>Notifications</span>
                  {notifs.length>0&&<button onClick={markNotifsRead} style={{fontSize:12,color:'var(--gray-400)',background:'none',border:'none',cursor:'pointer'}}>Mark all read</button>}
                </div>
                {notifs.length===0
                  ? <div style={{padding:24,textAlign:'center',color:'var(--gray-400)',fontSize:13}}>No new notifications</div>
                  : <div style={{maxHeight:300,overflowY:'auto'}}>
                    {notifs.map((n,i)=>(
                      <div key={n.id} style={{padding:'10px 16px',borderBottom:i<notifs.length-1?'1px solid var(--border)':'none',fontSize:13}}>
                        <div style={{fontWeight:500,color:'var(--navy)',marginBottom:2}}>{n.message}</div>
                        <div style={{fontSize:11,color:'var(--gray-400)'}}>{n.created_at}</div>
                      </div>
                    ))}
                  </div>}
              </div>
            )}
          </div>
          {user.role==='admin' && (
            <div style={{display:'flex',gap:6}}>
              <button className="btn btn-outline btn-sm" onClick={()=>setShowQuoteForm(!showQuoteForm)}>Set Quote</button>
              <button className="btn btn-outline btn-sm" onClick={()=>setShowAnnForm(!showAnnForm)}>+ Announcement</button>
            </div>
          )}
        </div>
      </div>

      {annMsg && <div className="alert alert-success">{annMsg}</div>}

      {/* Admin: set daily quote */}
      {showQuoteForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:20,borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700,marginBottom:16,fontSize:15}}>Set Today's Quote</h3>
          <form onSubmit={saveQuote}>
            <div className="form-group">
              <label className="label">Quote Text *</label>
              <textarea className="input textarea" rows={3} placeholder="Enter an inspiring quote for today..." value={quoteForm.text} onChange={e=>setQuoteForm(f=>({...f,text:e.target.value}))} required/>
            </div>
            <div className="form-group">
              <label className="label">Attribution (short)</label>
              <input className="input" placeholder="e.g. Our Mission" value={quoteForm.attr} onChange={e=>setQuoteForm(f=>({...f,attr:e.target.value}))}/>
            </div>
            <div style={{marginBottom:14}}>
              <label className="label" style={{marginBottom:8}}>Or pick from defaults</label>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {QUOTES.slice(0,6).map((q,i)=>(
                  <button key={i} type="button" onClick={()=>setQuoteForm({text:q.text,attr:q.attr})}
                    style={{fontSize:11,padding:'4px 10px',borderRadius:20,background:'var(--gray-100)',border:'1px solid var(--border)',cursor:'pointer',color:'var(--navy)',fontFamily:'DM Sans,sans-serif'}}>
                    {q.text.slice(0,40)}...
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary">Save Quote</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowQuoteForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Admin: announcement form */}
      {showAnnForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:20,borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700,marginBottom:16,fontSize:15}}>Post Announcement</h3>
          <form onSubmit={createAnn}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Type</label>
                <select className="select" value={annForm.type} onChange={e=>setAnnForm(f=>({...f,type:e.target.value}))}>
                  <option value="welcome">Welcome — New Joiner</option>
                  <option value="general">General Announcement</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Welcome Priya to Marketing!" value={annForm.title} onChange={e=>setAnnForm(f=>({...f,title:e.target.value}))} required/>
              </div>
            </div>
            {annForm.type==='welcome' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Person's Name</label>
                  <input className="input" value={annForm.person_name} onChange={e=>setAnnForm(f=>({...f,person_name:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="label">Department</label>
                  <select className="select" value={annForm.person_dept} onChange={e=>setAnnForm(f=>({...f,person_dept:e.target.value}))}>
                    <option value="">Select</option>
                    {DEPTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            )}
            {annForm.type==='welcome' && (
              <div className="form-group">
                <label className="label">Role</label>
                <input className="input" placeholder="e.g. Marketing Executive" value={annForm.person_role} onChange={e=>setAnnForm(f=>({...f,person_role:e.target.value}))}/>
              </div>
            )}
            <div className="form-group">
              <label className="label">Message</label>
              <textarea className="input textarea" rows={2} value={annForm.message} onChange={e=>setAnnForm(f=>({...f,message:e.target.value}))}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary">Post</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowAnnForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements */}
      {announcements.length>0 && (
        <div style={{marginBottom:20,display:'flex',flexDirection:'column',gap:10}}>
          {announcements.map(a=>(
            <div key={a.id} style={{
              background:a.type==='welcome'?'var(--navy)':'white',
              border:a.type==='welcome'?'none':'1px solid var(--border)',
              borderRadius:'var(--radius-lg)', padding:'16px 20px', position:'relative', overflow:'hidden',
              borderLeft:a.type!=='welcome'?'3px solid var(--mint)':undefined,
            }}>
              {a.type==='welcome'&&<div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF)'}}/>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
                    {a.type==='welcome'&&<span style={{background:'rgba(20,241,177,0.15)',color:'#14F1B1',padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700,border:'1px solid rgba(20,241,177,0.3)'}}>New Joiner</span>}
                    <span style={{fontSize:11,color:a.type==='welcome'?'rgba(255,255,255,0.35)':'var(--gray-400)'}}>{a.created_at}</span>
                  </div>
                  <h4 style={{fontWeight:700,fontSize:14,color:a.type==='welcome'?'white':'var(--navy)',marginBottom:a.person_name?8:0}}>{a.title}</h4>
                  {a.person_name&&(
                    <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:6}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'var(--mint)',color:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>
                        {a.person_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,color:'white'}}>{a.person_name}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{a.person_dept}{a.person_role&&` · ${a.person_role}`}</div>
                      </div>
                    </div>
                  )}
                  {a.message&&<p style={{fontSize:13,color:a.type==='welcome'?'rgba(255,255,255,0.65)':'var(--gray-400)',lineHeight:1.6}}>{a.message}</p>}
                </div>
                {user.role==='admin'&&<button onClick={()=>deleteAnn(a.id)} style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:a.type==='welcome'?'rgba(255,255,255,0.4)':'var(--gray-400)',fontSize:16,flexShrink:0}}>×</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily quote */}
      <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:'18px 24px',marginBottom:20,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--mint)',marginBottom:8}}>Today's Thought</div>
        <p style={{fontSize:14,fontStyle:'italic',color:'rgba(255,255,255,0.85)',lineHeight:1.7,marginBottom:6}}>"{quote.text}"</p>
        <p style={{fontSize:11,color:'var(--mint)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>— {quote.attr}</p>
      </div>

      {/* Next meeting */}
      {meetings[0]&&(
        <div style={{background:'white',border:'1px solid var(--border)',borderLeft:'3px solid var(--mint)',borderRadius:'var(--radius-lg)',padding:'12px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--mint)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2}}>Next Meeting</div>
            <div style={{fontWeight:600,color:'var(--navy)',fontSize:14}}>{meetings[0].title}</div>
            <div style={{fontSize:12,color:'var(--gray-400)'}}>{meetings[0].start_str} · {meetings[0].platform}</div>
          </div>
          {meetings[0].meeting_link&&<a href={meetings[0].meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join</a>}
        </div>
      )}

      <div className="grid-2" style={{marginBottom:20}}>
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600,fontSize:14}}>Recent Messages</div>
            <Link to="/chat" style={{fontSize:13,color:'var(--mint)',textDecoration:'none',fontWeight:500}}>View all</Link>
          </div>
          {msgs.length===0
            ? <div style={{color:'var(--gray-400)',fontSize:13,textAlign:'center',padding:'12px 0'}}>No messages yet</div>
            : msgs.map((m,i)=>(
              <div key={i} style={{padding:'8px 0',borderBottom:i<msgs.length-1?'1px solid var(--border)':'none',display:'flex',gap:10,alignItems:'flex-start'}}>
                <div className="avatar" style={{width:28,height:28,fontSize:11,background:DEPT_COLORS[m.sender_dept]||'var(--navy)',color:'white',flexShrink:0}}>{m.sender_name?.charAt(0)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{m.sender_name} <span style={{fontSize:11,color:'var(--gray-400)',fontWeight:400}}>{m.sender_dept}</span></div>
                  <div className="truncate" style={{fontSize:13,color:'var(--gray-400)'}}>{m.text}</div>
                </div>
              </div>
            ))}
        </div>
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600,fontSize:14}}>Recent Ideas</div>
            <Link to="/ideas" style={{fontSize:13,color:'var(--mint)',textDecoration:'none',fontWeight:500}}>View all</Link>
          </div>
          {ideas.length===0
            ? <div style={{color:'var(--gray-400)',fontSize:13,textAlign:'center',padding:'12px 0'}}>No ideas yet</div>
            : ideas.map((idea,i)=>(
              <div key={i} style={{padding:'8px 0',borderBottom:i<ideas.length-1?'1px solid var(--border)':'none'}}>
                <div style={{fontWeight:500,fontSize:13,marginBottom:3}} className="truncate">{idea.title}</div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <span style={{fontSize:12,color:'var(--gray-400)'}}>by {idea.author_name}</span>
                  <span className="badge badge-gray" style={{fontSize:10}}>{idea.status}</span>
                  <span style={{fontSize:12,color:'var(--gray-400)',marginLeft:'auto'}}>{idea.like_count} likes</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {quicklinks.length>0&&(
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600,fontSize:14}}>Quick Access</div>
            <Link to="/quicklinks" style={{fontSize:13,color:'var(--mint)',textDecoration:'none',fontWeight:500}}>Manage</Link>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8}}>
            {quicklinks.map(l=>(
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--gray-100)',borderRadius:'var(--radius)',textDecoration:'none',color:'var(--navy)',fontSize:13,fontWeight:500,transition:'all 0.15s',border:'1px solid transparent'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--mint)';e.currentTarget.style.background='rgba(20,241,177,0.04)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.background='var(--gray-100)';}}>
                <span style={{fontSize:18}}>{l.icon}</span>
                <span className="truncate">{l.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
