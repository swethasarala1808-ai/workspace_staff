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
    { id:'company', label:'Company', desc:'All Bizaxl staff' },
    ...(user.department ? [{ id:`dept_${user.department.toLowerCase()}`, label:user.department, desc:'Your team only' }] : []),
  ];

  const fetchMessages = () => axios.get(`${API}/chat/messages/${channel}`).then(r=>setMessages(r.data)).catch(()=>{});
  useEffect(()=>{ fetchMessages(); },[channel]);
  useEffect(()=>{ const i=setInterval(fetchMessages,5000); return ()=>clearInterval(i); },[channel]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { await axios.post(`${API}/chat/messages`, { channel, text }); setText(''); fetchMessages(); }
    catch(err) { alert(err.response?.data?.error||'Failed'); }
    finally { setSending(false); }
  };

  const deptColor = dept => DEPT_COLORS[dept] || '#14F1B1';

  return (
    <div style={{display:'flex', height:'calc(100vh - 56px)'}}>
      {/* Channel list */}
      <div style={{width:200, background:'white', borderRight:'1px solid var(--border)', flexShrink:0, display:'flex', flexDirection:'column'}}>
        <div style={{padding:'14px 16px', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)'}}>Channels</div>
        </div>
        {channels.map(ch=>(
          <div key={ch.id} onClick={()=>setChannel(ch.id)}
            style={{padding:'12px 16px', cursor:'pointer', borderLeft:`2px solid ${channel===ch.id?'var(--mint)':'transparent'}`, background:channel===ch.id?'rgba(20,241,177,0.05)':'transparent', transition:'all 0.15s'}}>
            <div style={{fontWeight:600, fontSize:13, color:channel===ch.id?'var(--navy)':'var(--gray-400)'}}># {ch.label}</div>
            <div style={{fontSize:11, color:'var(--gray-400)', marginTop:1}}>{ch.desc}</div>
          </div>
        ))}
        <div style={{flex:1}}/>
        <div style={{padding:'10px 14px', borderTop:'1px solid var(--border)'}}>
          <div style={{fontSize:11, color:'var(--gray-400)'}}>Refreshes every 5s</div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{flex:1, display:'flex', flexDirection:'column', background:'var(--gray-100)'}}>
        {/* Header */}
        <div style={{background:'white', padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
          <div>
            <div style={{fontWeight:700, color:'var(--navy)'}}># {channels.find(c=>c.id===channel)?.label}</div>
            <div style={{fontSize:12, color:'var(--gray-400)'}}>{channels.find(c=>c.id===channel)?.desc}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{flex:1, overflowY:'auto', padding:'16px 20px'}}>
          {messages.length===0 ? (
            <div style={{textAlign:'center', color:'var(--gray-400)', marginTop:60}}>
              <p style={{fontWeight:500}}>No messages yet</p>
              <p style={{fontSize:13}}>Start the conversation</p>
            </div>
          ) : messages.map((m,i)=>{
            const isMe = m.sender_name===user.name;
            return (
              <div key={i} style={{marginBottom:12, display:'flex', flexDirection:isMe?'row-reverse':'row', gap:10}}>
                <div className="avatar" style={{width:32, height:32, fontSize:12, background:deptColor(m.sender_dept), color:'white', flexShrink:0}}>
                  {m.sender_name?.charAt(0)}
                </div>
                <div style={{maxWidth:'70%'}}>
                  <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:3, flexDirection:isMe?'row-reverse':'row'}}>
                    <span style={{fontWeight:600, fontSize:13}}>{m.sender_name}</span>
                    {m.sender_dept && <span className="badge badge-gray" style={{fontSize:10}}>{m.sender_dept}</span>}
                    <span style={{fontSize:11, color:'var(--gray-400)'}}>{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  <div style={{background:isMe?'var(--navy)':'white', color:isMe?'white':'var(--navy)', padding:'10px 14px', borderRadius:isMe?'12px 12px 2px 12px':'12px 12px 12px 2px', fontSize:14, lineHeight:1.5, boxShadow:'var(--shadow)'}}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{background:'white', padding:'12px 20px', borderTop:'1px solid var(--border)'}}>
          <form onSubmit={send} style={{display:'flex', gap:8}}>
            <input className="input" placeholder={`Message #${channels.find(c=>c.id===channel)?.label}`} value={text} onChange={e=>setText(e.target.value)} style={{flex:1}}/>
            <button type="submit" className="btn btn-primary" disabled={sending||!text.trim()}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
