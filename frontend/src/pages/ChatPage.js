import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

export default function ChatPage() {
  const { user, API } = useAuth();
  const [channel, setChannel] = useState('company');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const channels = [
    { id:'company', label:'🌐 Company', desc:'All BIZAXL staff' },
    ...(user.department ? [{ id:`dept_${user.department.toLowerCase()}`, label:`🏷️ ${user.department}`, desc:'Your team only' }] : []),
  ];

  const fetchMessages = () => axios.get(`${API}/chat/messages/${channel}`).then(r=>setMessages(r.data)).catch(()=>{});

  useEffect(()=>{ fetchMessages(); },[channel]);
  useEffect(()=>{ const i=setInterval(fetchMessages,5000); return ()=>clearInterval(i); },[channel]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { await axios.post(`${API}/chat/messages`,{channel,text}); setText(''); fetchMessages(); }
    catch(err) { alert(err.response?.data?.error||'Failed to send'); }
    finally { setSending(false); }
  };

  const deptColor = (dept) => DEPT_COLORS[dept] || '#14f1b1';

  return (
    <div style={{height:'calc(100vh - 62px)', display:'flex', gap:0}}>
      {/* Sidebar */}
      <div style={{width:220, background:'var(--navy)', flexShrink:0, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'18px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px'}}>
            Channels
          </p>
        </div>
        {channels.map(ch=>(
          <div key={ch.id} onClick={()=>setChannel(ch.id)}
            style={{padding:'14px 16px', cursor:'pointer',
              background: channel===ch.id ? 'rgba(20,241,177,0.1)' : 'transparent',
              borderLeft: channel===ch.id ? '3px solid #14f1b1' : '3px solid transparent',
              transition:'all 0.15s'}}>
            <div style={{fontWeight:600, fontSize:14, color: channel===ch.id ? '#14f1b1' : 'rgba(255,255,255,0.75)'}}>{ch.label}</div>
            <div style={{fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2}}>{ch.desc}</div>
          </div>
        ))}
        <div style={{flex:1}}/>
        <div style={{padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.35)', fontSize:11}}>Auto-refreshes every 5s</p>
        </div>
      </div>

      {/* Chat area */}
      <div style={{flex:1, display:'flex', flexDirection:'column', background:'var(--bg)'}}>
        {/* Header */}
        <div style={{background:'white', padding:'14px 20px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:10}}>
          <span style={{fontSize:20}}>{channels.find(c=>c.id===channel)?.label.split(' ')[0]}</span>
          <div>
            <div style={{fontWeight:700, color:'var(--navy)'}}>{channels.find(c=>c.id===channel)?.label.split(' ').slice(1).join(' ')}</div>
            <div style={{fontSize:12, color:'var(--muted)'}}>{channels.find(c=>c.id===channel)?.desc}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1, overflowY:'auto', padding:'16px 20px'}}>
          {messages.length===0 ? (
            <div style={{textAlign:'center', color:'var(--muted)', marginTop:60}}>
              <div style={{fontSize:48, marginBottom:12}}>💬</div>
              <p>No messages yet. Say hi!</p>
            </div>
          ) : messages.map((m,i) => {
            const isMe = m.sender_name===user.name;
            return (
              <div key={i} style={{marginBottom:14, display:'flex', flexDirection:isMe?'row-reverse':'row', gap:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:deptColor(m.sender_dept),
                  display:'flex',alignItems:'center',justifyContent:'center',color:'white',
                  fontWeight:800,fontSize:14,flexShrink:0}}>
                  {m.sender_name.charAt(0)}
                </div>
                <div style={{maxWidth:'70%'}}>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexDirection:isMe?'row-reverse':'row'}}>
                    <span style={{fontWeight:600,fontSize:13}}>{m.sender_name}</span>
                    {m.sender_dept && <span style={{fontSize:11,background:'#f3f4f6',padding:'2px 8px',borderRadius:20,color:deptColor(m.sender_dept),fontWeight:600}}>{m.sender_dept}</span>}
                    <span style={{fontSize:11,color:'var(--muted)'}}>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div style={{background:isMe?'var(--navy)':'white',color:isMe?'#14f1b1':'var(--text)',
                    padding:'10px 14px',borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px',
                    fontSize:14,lineHeight:1.5,boxShadow:'0 1px 4px rgba(0,0,0,0.07)'}}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{background:'white', padding:'14px 20px', borderTop:'1px solid var(--border)'}}>
          <form onSubmit={send} style={{display:'flex', gap:10}}>
            <input className="input" placeholder="Type a message..." value={text}
              onChange={e=>setText(e.target.value)} style={{flex:1}}/>
            <button type="submit" className="btn btn-primary" disabled={sending||!text.trim()}>Send →</button>
          </form>
        </div>
      </div>
    </div>
  );
}
