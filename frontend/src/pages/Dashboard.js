import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { getDailyQuote } from '../data/quotes';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

export default function Dashboard() {
  const { user, API } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [quicklinks, setQuicklinks] = useState([]);
  const quote = getDailyQuote();
  const deptColor = DEPT_COLORS[user.department] || '#14F1B1';
  const unread = policies.filter(p=>!p.read).length;

  useEffect(()=>{
    axios.get(`${API}/policies`).then(r=>setPolicies(r.data)).catch(()=>{});
    axios.get(`${API}/ideas`).then(r=>setIdeas(r.data.slice(0,4))).catch(()=>{});
    axios.get(`${API}/chat/messages/company`).then(r=>setMsgs(r.data.slice(-4))).catch(()=>{});
    axios.get(`${API}/meetings?view=upcoming`).then(r=>setMeetings(r.data.slice(0,3))).catch(()=>{});
    axios.get(`${API}/quicklinks`).then(r=>setQuicklinks(r.data.slice(0,8))).catch(()=>{});
  },[API]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex-between" style={{marginBottom:28}}>
        <div>
          <h1 style={{fontSize:22, fontWeight:700, color:'var(--navy)'}}>Good morning, {user.name.split(' ')[0]}</h1>
          <p style={{fontSize:14, color:'var(--gray-400)', marginTop:2}}>{user.department} · {user.role}</p>
        </div>
        <div style={{display:'flex', gap:8}}>
          <Link to="/profile" className="btn btn-outline btn-sm">Profile</Link>
          {unread > 0 && <Link to="/policies" className="btn btn-sm" style={{background:'#fef3c7',color:'#92400e',border:'1px solid #fde68a'}}>{unread} unread policies</Link>}
        </div>
      </div>

      {/* Daily quote */}
      <div className="quote-card" style={{marginBottom:24}}>
        <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--mint)', marginBottom:10}}>Today's Thought</div>
        <p className="quote-text">"{quote.text}"</p>
        <p className="quote-attr">— {quote.attr}</p>
      </div>

      {/* Upcoming meetings alert */}
      {meetings[0] && (
        <div style={{background:'white', border:'1px solid var(--border)', borderLeft:`3px solid var(--mint)`, borderRadius:'var(--radius-lg)', padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11, fontWeight:700, color:'var(--mint)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2}}>Next Meeting</div>
            <div style={{fontWeight:600, color:'var(--navy)'}}>{meetings[0].title}</div>
            <div style={{fontSize:13, color:'var(--gray-400)'}}>{meetings[0].start_str} · {meetings[0].platform}</div>
          </div>
          {meetings[0].meeting_link && (
            <a href={meetings[0].meeting_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Join</a>
          )}
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20}}>
        {/* Recent chat */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600, fontSize:15}}>Recent Messages</div>
            <Link to="/chat" style={{fontSize:13, color:'var(--mint)', textDecoration:'none', fontWeight:500}}>View all</Link>
          </div>
          {msgs.length===0
            ? <div className="empty-state" style={{padding:20}}><p>No messages yet</p></div>
            : msgs.map((m,i)=>(
              <div key={i} style={{padding:'8px 0', borderBottom: i<msgs.length-1?'1px solid var(--border)':'none', display:'flex', gap:10, alignItems:'flex-start'}}>
                <div className="avatar" style={{width:28,height:28,fontSize:11,background:DEPT_COLORS[m.sender_dept]||'var(--navy)',color:'white',flexShrink:0}}>
                  {m.sender_name?.charAt(0)}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:600}}>{m.sender_name} <span style={{fontSize:11, color:'var(--gray-400)', fontWeight:400}}>{m.sender_dept}</span></div>
                  <div className="truncate" style={{fontSize:13, color:'var(--gray-400)'}}>{m.text}</div>
                </div>
              </div>
            ))}
        </div>

        {/* New materials */}
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600, fontSize:15}}>Recent Ideas</div>
            <Link to="/ideas" style={{fontSize:13, color:'var(--mint)', textDecoration:'none', fontWeight:500}}>View all</Link>
          </div>
          {ideas.length===0
            ? <div className="empty-state" style={{padding:20}}><p>No ideas yet</p></div>
            : ideas.map((idea,i)=>(
              <div key={i} style={{padding:'8px 0', borderBottom: i<ideas.length-1?'1px solid var(--border)':'none'}}>
                <div style={{fontWeight:500, fontSize:14, marginBottom:2}}>{idea.title}</div>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{fontSize:12, color:'var(--gray-400)'}}>by {idea.author_name}</span>
                  <span className="badge badge-gray" style={{fontSize:11}}>{idea.status}</span>
                  <span style={{fontSize:12, color:'var(--gray-400)', marginLeft:'auto'}}>{idea.like_count} likes</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Quick links */}
      {quicklinks.length > 0 && (
        <div className="card">
          <div className="flex-between mb-16">
            <div style={{fontWeight:600, fontSize:15}}>Quick Access</div>
            <Link to="/quicklinks" style={{fontSize:13, color:'var(--mint)', textDecoration:'none', fontWeight:500}}>Manage</Link>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10}}>
            {quicklinks.map(l=>(
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer"
                style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--gray-100)', borderRadius:'var(--radius)', textDecoration:'none', color:'var(--navy)', fontSize:13, fontWeight:500, transition:'all 0.15s', border:'1px solid transparent'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--mint)';e.currentTarget.style.background='rgba(20,241,177,0.06)';}}
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
