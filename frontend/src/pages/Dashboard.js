import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

export default function Dashboard() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [driveStats, setDriveStats] = useState({});
  const deptColor = DEPT_COLORS[user.department] || '#14f1b1';

  useEffect(()=>{
    axios.get(`${API}/policies`).then(r=>setPolicies(r.data)).catch(()=>{});
    axios.get(`${API}/ideas`).then(r=>setIdeas(r.data.slice(0,3))).catch(()=>{});
    axios.get(`${API}/chat/messages/company`).then(r=>setMsgs(r.data.slice(-4))).catch(()=>{});
    axios.get(`${API}/meetings?view=upcoming`).then(r=>setUpcomingMeetings(r.data.slice(0,3))).catch(()=>{});
    axios.get(`${API}/drive/stats`).then(r=>setDriveStats(r.data)).catch(()=>{});
  },[API]);

  const unread = policies.filter(p=>!p.read).length;

  const tiles = [
    { to:'/drive',    icon:'📁', label:'Team Drive',  desc:`${driveStats.total||0} files shared` },
    { to:'/meetings', icon:'📹', label:'Meetings',    desc:`${upcomingMeetings.length} upcoming` },
    { to:'/chat',     icon:'💬', label:'Chat',        desc:'Team & company-wide' },
    { to:'/email',    icon:'📧', label:'Email',       desc:'Hostinger inbox' },
    { to:'/ideas',    icon:'💡', label:'Ideas',       desc:'Share & vote on ideas' },
    { to:'/policies', icon:'📋', label:'Policies',    desc: unread>0?`${unread} unread`:'All read ✅', alert:unread>0 },
    { to:'/materials',icon:'🗂️', label:'Materials',   desc:'Upload & review docs' },
    { to:'/profile',  icon:'👤', label:'Profile',     desc:'Settings & email' },
  ];

  return (
    <div className="container">
      {/* Welcome banner */}
      <div style={{background:`linear-gradient(135deg, #05133c 0%, ${deptColor}33 100%)`,
        borderRadius:16,padding:'28px 32px',marginBottom:24,position:'relative',overflow:'hidden',
        border:'1px solid rgba(20,241,177,0.15)'}}>
        <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',
          background:`${deptColor}10`}}/>
        <div style={{position:'relative'}}>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:13,fontWeight:500,marginBottom:4}}>Welcome back 👋</p>
          <h2 style={{color:'white',fontSize:26,fontWeight:800,marginBottom:8}}>{user.name}</h2>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <span style={{background:`${deptColor}25`,color:deptColor,padding:'4px 12px',
              borderRadius:20,fontSize:13,fontWeight:600,border:`1px solid ${deptColor}40`}}>
              {user.department||user.company}
            </span>
            <span style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.8)',
              padding:'4px 12px',borderRadius:20,fontSize:13,fontWeight:500}}>{user.role}</span>
          </div>
        </div>
      </div>

      {/* Upcoming meeting alert */}
      {upcomingMeetings[0] && (
        <div style={{background:'linear-gradient(135deg,#05133c,#0a2060)',borderRadius:12,
          padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:16,
          border:'1px solid rgba(20,241,177,0.2)'}}>
          <span style={{fontSize:28}}>📹</span>
          <div style={{flex:1}}>
            <div style={{color:'var(--green)',fontWeight:700,fontSize:14}}>Next Meeting</div>
            <div style={{color:'white',fontWeight:600}}>{upcomingMeetings[0].title}</div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:13}}>{upcomingMeetings[0].start_str}</div>
          </div>
          {upcomingMeetings[0].meeting_link && (
            <a href={upcomingMeetings[0].meeting_link} target="_blank" rel="noreferrer"
              style={{background:'var(--green)',color:'var(--navy)',padding:'8px 16px',
                borderRadius:8,fontWeight:800,textDecoration:'none',fontSize:13,whiteSpace:'nowrap'}}>
              Join →
            </a>
          )}
          <Link to="/meetings"
            style={{color:'rgba(255,255,255,0.6)',fontSize:13,textDecoration:'none',whiteSpace:'nowrap'}}>
            All meetings →
          </Link>
        </div>
      )}

      {/* Quick tiles */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:24}}>
        {tiles.map(t=>(
          <Link key={t.to} to={t.to} style={{textDecoration:'none'}}>
            <div className="card" style={{padding:18,cursor:'pointer',position:'relative',
              transition:'transform 0.2s,box-shadow 0.2s',
              border:t.alert?'1px solid #fca5a5':'1px solid rgba(5,19,60,0.06)'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 28px rgba(5,19,60,0.14)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';}}>
              {t.alert&&<span style={{position:'absolute',top:10,right:10,background:'#ef4444',
                color:'white',borderRadius:'50%',width:20,height:20,fontSize:11,
                display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800}}>{unread}</span>}
              <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
              <div style={{fontWeight:700,fontSize:14,color:'var(--navy)',marginBottom:3}}>{t.label}</div>
              <div style={{fontSize:12,color:t.alert?'#ef4444':'var(--muted)'}}>{t.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent chat */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{fontWeight:700,color:'var(--navy)'}}>💬 Company Chat</h3>
            <Link to="/chat" style={{color:'var(--green)',fontSize:13,textDecoration:'none',fontWeight:600}}>See all →</Link>
          </div>
          {msgs.length===0
            ? <p className="text-muted text-sm">No messages yet.</p>
            : msgs.map((m,i)=>(
              <div key={i} style={{padding:'8px 0',borderBottom:i<msgs.length-1?'1px solid var(--border)':'none'}}>
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2}}>
                  <span style={{fontWeight:600,fontSize:13}}>{m.sender_name}</span>
                  {m.sender_dept&&<span style={{fontSize:11,background:'#f0f4ff',padding:'2px 7px',borderRadius:20}}>{m.sender_dept}</span>}
                </div>
                <p style={{fontSize:13,color:'var(--muted)'}}>{m.text}</p>
              </div>
            ))}
        </div>

        {/* Upcoming meetings */}
        <div className="card">
          <div className="flex-between mb-16">
            <h3 style={{fontWeight:700,color:'var(--navy)'}}>📹 Upcoming Meetings</h3>
            <Link to="/meetings" style={{color:'var(--green)',fontSize:13,textDecoration:'none',fontWeight:600}}>See all →</Link>
          </div>
          {upcomingMeetings.length===0
            ? <p className="text-muted text-sm">No upcoming meetings.</p>
            : upcomingMeetings.map((m,i)=>(
              <div key={i} style={{padding:'10px 0',borderBottom:i<upcomingMeetings.length-1?'1px solid var(--border)':'none',
                display:'flex',gap:12,alignItems:'center'}}>
                <div style={{textAlign:'center',background:'var(--bg)',borderRadius:8,
                  padding:'6px 10px',minWidth:44,flexShrink:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase'}}>
                    {new Date(m.start_dt).toLocaleString('en',{month:'short'})}
                  </div>
                  <div style={{fontSize:18,fontWeight:900,color:'var(--navy)',lineHeight:1}}>
                    {new Date(m.start_dt).getDate()}
                  </div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.title}</div>
                  <div style={{fontSize:12,color:'var(--muted)'}}>{m.start_str} · {m.duration_mins}min</div>
                </div>
                {m.meeting_link&&(
                  <a href={m.meeting_link} target="_blank" rel="noreferrer"
                    style={{fontSize:11,background:'var(--navy)',color:'var(--green)',
                      padding:'4px 10px',borderRadius:20,fontWeight:700,textDecoration:'none',flexShrink:0}}>
                    Join
                  </a>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
