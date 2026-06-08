import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getDailyQuote } from '../data/quotes';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

function AnnouncementCard({ ann, isAdmin, onDelete }) {
  return (
    <div style={{
      background: ann.type==='welcome' ? 'linear-gradient(135deg,#05133c,#0a2060)' : 'white',
      border: ann.type==='welcome' ? 'none' : '1px solid var(--border)',
      borderRadius:'var(--radius-lg)', padding:'16px 20px', position:'relative', overflow:'hidden',
    }}>
      {ann.type==='welcome' && <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF)'}}/>}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12}}>
        <div style={{flex:1}}>
          <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:6, flexWrap:'wrap'}}>
            {ann.type==='welcome' && (
              <span style={{background:'rgba(20,241,177,0.15)', color:'#14F1B1', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid rgba(20,241,177,0.3)'}}>
                New Joiner
              </span>
            )}
            <span style={{fontSize:12, color: ann.type==='welcome'?'rgba(255,255,255,0.4)':'var(--gray-400)'}}>
              {ann.created_at}
            </span>
          </div>
          <h4 style={{fontWeight:700, fontSize:15, color: ann.type==='welcome'?'white':'var(--navy)', marginBottom:4}}>
            {ann.title}
          </h4>
          {ann.type==='welcome' && ann.person_name && (
            <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:6}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'var(--mint)',color:'var(--navy)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13}}>
                {ann.person_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:14,color:'white'}}>{ann.person_name}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{ann.person_dept} · {ann.person_role}</div>
              </div>
            </div>
          )}
          {ann.message && (
            <p style={{fontSize:13, color: ann.type==='welcome'?'rgba(255,255,255,0.65)':'var(--gray-400)', lineHeight:1.6}}>{ann.message}</p>
          )}
        </div>
        {isAdmin && (
          <button onClick={()=>onDelete(ann.id)}
            style={{background:'rgba(255,255,255,0.08)', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', color: ann.type==='welcome'?'rgba(255,255,255,0.4)':'var(--gray-400)', fontSize:16, flexShrink:0}}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [quicklinks, setQuicklinks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ type:'welcome', title:'', message:'', person_name:'', person_dept:'', person_role:'' });
  const [annMsg, setAnnMsg] = useState('');
  const quote = getDailyQuote();
  const unread = policies.filter(p=>!p.read).length;

  const fetchAll = () => {
    axios.get(`${API}/policies`).then(r=>setPolicies(r.data)).catch(()=>{});
    axios.get(`${API}/ideas`).then(r=>setIdeas(r.data.slice(0,4))).catch(()=>{});
    axios.get(`${API}/chat/messages/company`).then(r=>setMsgs(r.data.slice(-4))).catch(()=>{});
    axios.get(`${API}/meetings?view=upcoming`).then(r=>setMeetings(r.data.slice(0,3))).catch(()=>{});
    axios.get(`${API}/quicklinks`).then(r=>setQuicklinks(r.data.slice(0,8))).catch(()=>{});
    axios.get(`${API}/announcements`).then(r=>setAnnouncements(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchAll(); },[API]);

  const createAnn = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/announcements`, annForm);
    setAnnForm({ type:'welcome', title:'', message:'', person_name:'', person_dept:'', person_role:'' });
    setShowAnnForm(false); fetchAll();
    setAnnMsg('Announcement posted ✓'); setTimeout(()=>setAnnMsg(''),3000);
  };

  const deleteAnn = async (id) => {
    await axios.delete(`${API}/announcements/${id}`); fetchAll();
  };

  const DEPTS = ['Deployment','Functional','Marketing','Research'];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between" style={{marginBottom:24}}>
        <div>
          <h1 style={{fontSize:20, fontWeight:700, color:'var(--navy)'}}>
            Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, {user.name.split(' ')[0]}
          </h1>
          <p style={{fontSize:13, color:'var(--gray-400)', marginTop:2}}>{user.department} · {user.role}</p>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {unread > 0 && (
            <Link to="/policies" style={{fontSize:13, fontWeight:600, color:'#92400e', background:'#fef3c7', padding:'6px 14px', borderRadius:8, textDecoration:'none', border:'1px solid #fde68a'}}>
              {unread} unread {unread===1?'policy':'policies'}
            </Link>
          )}
          {user.role==='admin' && (
            <button className="btn btn-outline btn-sm" onClick={()=>setShowAnnForm(!showAnnForm)}>
              + Announcement
            </button>
          )}
        </div>
      </div>

      {annMsg && <div className="alert alert-success">{annMsg}</div>}

      {/* New announcement form */}
      {showAnnForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:20, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:16, fontSize:15}}>Post Announcement</h3>
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
                  <input className="input" placeholder="Full name" value={annForm.person_name} onChange={e=>setAnnForm(f=>({...f,person_name:e.target.value}))}/>
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
                <label className="label">Role / Position</label>
                <input className="input" placeholder="e.g. Marketing Executive" value={annForm.person_role} onChange={e=>setAnnForm(f=>({...f,person_role:e.target.value}))}/>
              </div>
            )}
            <div className="form-group">
              <label className="label">Message</label>
              <textarea className="input textarea" rows={2} placeholder="A warm welcome message or announcement details..." value={annForm.message} onChange={e=>setAnnForm(f=>({...f,message:e.target.value}))}/>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary">Post</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowAnnForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <div style={{marginBottom:20, display:'flex', flexDirection:'column', gap:10}}>
          {announcements.map(a=>(
            <AnnouncementCard key={a.id} ann={a} isAdmin={user.role==='admin'} onDelete={deleteAnn}/>
          ))}
        </div>
      )}

      {/* Daily quote */}
      <div style={{background:'var(--navy)', borderRadius:'var(--radius-lg)', padding:'20px 24px', marginBottom:20, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{fontSize:10, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--mint)', marginBottom:8}}>Today's Thought</div>
        <p style={{fontSize:14, fontStyle:'italic', color:'rgba(255,255,255,0.85)', lineHeight:1.7, marginBottom:6}}>"{quote.text}"</p>
        <p style={{fontSize:11, color:'var(--mint)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px'}}>— {quote.attr}</p>
      </div>

      {/* Next meeting bar */}
      {meetings[0] && (
        <div style={{background:'white', border:'1px solid var(--border)', borderLeft:'3px solid var(--mint)', borderRadius:'var(--radius-lg)', padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11, fontWeight:700, color:'var(--mint)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>Next Meeting</div>
            <div style={{fontWeight:600, color:'var(--navy)', fontSize:14}}>{meetings[0].title}</div>
            <div style={{fontSize:12, color:'var(--gray-400)'}}>{meetings[0].start_str} · {meetings[0].platform}</div>
          </div>
          {meetings[0].meeting_link && (
            <a href={meetings[0].meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join</a>
          )}
        </div>
      )}

      {/* Two columns */}
      <div className="grid-2" style={{marginBottom:20}}>
        {/* Recent messages */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600, fontSize:14}}>Recent Messages</div>
            <Link to="/chat" style={{fontSize:13, color:'var(--mint)', textDecoration:'none', fontWeight:500}}>View all</Link>
          </div>
          {msgs.length===0
            ? <div style={{color:'var(--gray-400)', fontSize:13, padding:'12px 0', textAlign:'center'}}>No messages yet</div>
            : msgs.map((m,i)=>(
              <div key={i} style={{padding:'8px 0', borderBottom: i<msgs.length-1?'1px solid var(--border)':'none', display:'flex', gap:10, alignItems:'flex-start'}}>
                <div className="avatar" style={{width:28,height:28,fontSize:11,background:DEPT_COLORS[m.sender_dept]||'var(--navy)',color:'white',flexShrink:0}}>
                  {m.sender_name?.charAt(0)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{m.sender_name} <span style={{fontSize:11,color:'var(--gray-400)',fontWeight:400}}>{m.sender_dept}</span></div>
                  <div className="truncate" style={{fontSize:13,color:'var(--gray-400)'}}>{m.text}</div>
                </div>
              </div>
            ))}
        </div>

        {/* Recent ideas */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600, fontSize:14}}>Recent Ideas</div>
            <Link to="/ideas" style={{fontSize:13, color:'var(--mint)', textDecoration:'none', fontWeight:500}}>View all</Link>
          </div>
          {ideas.length===0
            ? <div style={{color:'var(--gray-400)', fontSize:13, padding:'12px 0', textAlign:'center'}}>No ideas yet</div>
            : ideas.map((idea,i)=>(
              <div key={i} style={{padding:'8px 0', borderBottom: i<ideas.length-1?'1px solid var(--border)':'none'}}>
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

      {/* Quick links */}
      {quicklinks.length > 0 && (
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600, fontSize:14}}>Quick Access</div>
            <Link to="/quicklinks" style={{fontSize:13, color:'var(--mint)', textDecoration:'none', fontWeight:500}}>Manage</Link>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:8}}>
            {quicklinks.map(l=>(
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--gray-100)', borderRadius:'var(--radius)', textDecoration:'none', color:'var(--navy)', fontSize:13, fontWeight:500, transition:'all 0.15s', border:'1px solid transparent'}}
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
