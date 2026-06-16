import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { user, API } = useAuth();
  const [channel, setChannel] = useState('company');
  const [messages, setMessages] = useState([]);
  const [depts, setDepts] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [editText, setEditText] = useState('');
  const bottomRef = useRef(null);

  // Fetch departments dynamically
  useEffect(() => {
    axios.get(`${API}/departments`).then(r => setDepts(r.data)).catch(() => {
      setDepts([
        { name:'Deployment', color:'#3b82f6' },
        { name:'Functional', color:'#8b5cf6' },
        { name:'Marketing', color:'#ec4899' },
        { name:'Research', color:'#10b981' },
      ]);
    });
  }, [API]);

  const deptColor = (deptName) => {
    const d = depts.find(x => x.name === deptName);
    return d?.color || '#71717B';
  };

  const channels = [
    { id:'company', label:'Company', desc:'All bizaxl staff' },
    ...(user.department ? [{ id:`dept_${user.department.toLowerCase()}`, label:user.department, desc:'Your team only' }] : []),
  ];

  const fetchMessages = () => {
    axios.get(`${API}/chat/messages/${channel}`).then(r => setMessages(r.data)).catch(() => {});
  };

  useEffect(() => { fetchMessages(); }, [channel]);
  useEffect(() => { const i = setInterval(fetchMessages, 5000); return () => clearInterval(i); }, [channel]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { await axios.post(`${API}/chat/messages`, { channel, text }); setText(''); fetchMessages(); }
    catch(err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSending(false); }
  };

  const deleteMsg = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    await axios.delete(`${API}/chat/messages/${id}`);
    fetchMessages();
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    await axios.put(`${API}/chat/messages/${id}`, { text: editText });
    setEditingMsg(null); fetchMessages();
  };

  // Group by date
  const grouped = [];
  let lastDate = '';
  messages.forEach(m => {
    const d = new Date(m.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
    if (d !== lastDate) { grouped.push({ type:'date', label:d }); lastDate = d; }
    grouped.push({ type:'msg', ...m });
  });

  return (
    <div style={{ display:'flex', height:'calc(100vh - 56px)' }}>
      {/* Channel sidebar */}
      <div style={{ width:200, background:'white', borderRight:'1px solid var(--border)', flexShrink:0, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)' }}>Channels</div>
        </div>
        {channels.map(ch => (
          <div key={ch.id} onClick={() => setChannel(ch.id)}
            style={{ padding:'12px 16px', cursor:'pointer',
              borderLeft:`2px solid ${channel===ch.id?'var(--mint)':'transparent'}`,
              background:channel===ch.id?'rgba(20,241,177,0.05)':'transparent' }}>
            <div style={{ fontWeight:600, fontSize:13, color:channel===ch.id?'var(--navy)':'var(--gray-400)' }}># {ch.label}</div>
            <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:1 }}>{ch.desc}</div>
          </div>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)' }}>
          <div style={{ fontSize:11, color:'var(--gray-400)' }}>Auto-refreshes every 5s</div>
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f8faff' }}>
        <div style={{ background:'white', padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontWeight:700, color:'var(--navy)', fontSize:14 }}># {channels.find(c=>c.id===channel)?.label}</div>
          <div style={{ fontSize:12, color:'var(--gray-400)' }}>{channels.find(c=>c.id===channel)?.desc}</div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {grouped.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--gray-400)', marginTop:60 }}>
              <p style={{ fontWeight:500, fontSize:14 }}>No messages yet. Start the conversation.</p>
            </div>
          ) : grouped.map((item, idx) => {
            if (item.type === 'date') return (
              <div key={idx} style={{ textAlign:'center', margin:'16px 0' }}>
                <span style={{ background:'white', border:'1px solid var(--border)', borderRadius:20, padding:'3px 14px', fontSize:11, color:'var(--gray-400)', fontWeight:500 }}>
                  {item.label}
                </span>
              </div>
            );

            const isMe = item.sender_id === user.id || item.sender_name === user.name;
            const canEdit = isMe;
            const canDelete = isMe || user.role === 'admin';
            const time = new Date(item.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
            const color = deptColor(item.sender_dept);

            return (
              <div key={item.id} style={{ marginBottom:6, display:'flex', flexDirection:isMe?'row-reverse':'row', gap:8, alignItems:'flex-end' }}
                onMouseEnter={() => setHoveredMsg(item.id)}
                onMouseLeave={() => setHoveredMsg(null)}>

                {/* Avatar for others */}
                {!isMe && (
                  <div style={{ width:30, height:30, borderRadius:'50%', background:color, color:'white',
                    fontWeight:800, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 }}>
                    {item.sender_name?.charAt(0)}
                  </div>
                )}

                <div style={{ maxWidth:'68%' }}>
                  {/* Sender name for others */}
                  {!isMe && (
                    <div style={{ fontSize:11, color:'var(--gray-400)', marginBottom:3, display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontWeight:600, color:'var(--navy)' }}>{item.sender_name}</span>
                      {item.sender_dept && (
                        <span style={{ background:color+'20', color:color, padding:'1px 6px', borderRadius:20, fontSize:10, fontWeight:600 }}>
                          {item.sender_dept}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display:'flex', alignItems:'flex-end', gap:6, flexDirection:isMe?'row-reverse':'row' }}>
                    {/* Message bubble */}
                    {editingMsg === item.id ? (
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input value={editText} onChange={e=>setEditText(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter') saveEdit(item.id); if(e.key==='Escape') setEditingMsg(null); }}
                          style={{ padding:'8px 12px', borderRadius:12, border:'2px solid var(--mint)', fontSize:14, fontFamily:'DM Sans,sans-serif', minWidth:200 }} autoFocus/>
                        <button onClick={() => saveEdit(item.id)} style={{ background:'var(--mint)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'DM Sans,sans-serif', color:'var(--navy)' }}>Save</button>
                        <button onClick={() => setEditingMsg(null)} style={{ background:'var(--gray-100)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:13, fontFamily:'DM Sans,sans-serif' }}>✕</button>
                      </div>
                    ) : (
                      <div style={{
                        background: isMe ? 'var(--navy)' : 'white',
                        color: isMe ? 'white' : 'var(--navy)',
                        padding:'9px 13px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize:14, lineHeight:1.5,
                        boxShadow:'0 1px 3px rgba(0,0,0,0.08)',
                        border: isMe ? 'none' : '1px solid var(--border)',
                      }}>
                        {item.text}
                        {item.edited && <span style={{ fontSize:10, opacity:0.5, marginLeft:6 }}>edited</span>}
                      </div>
                    )}

                    {/* Time + actions */}
                    <div style={{ display:'flex', flexDirection:'column', alignItems:isMe?'flex-end':'flex-start', gap:3, minWidth:40 }}>
                      <span style={{ fontSize:10, color:'var(--gray-400)', whiteSpace:'nowrap' }}>{time}</span>
                      {hoveredMsg === item.id && editingMsg !== item.id && (
                        <div style={{ display:'flex', gap:3 }}>
                          {canEdit && (
                            <button onClick={() => { setEditingMsg(item.id); setEditText(item.text); }}
                              style={{ background:'#e0f2fe', border:'1px solid #bae6fd', borderRadius:4, padding:'1px 7px', cursor:'pointer', fontSize:10, color:'#0369a1', fontFamily:'DM Sans,sans-serif' }}>
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => deleteMsg(item.id)}
                              style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:4, padding:'1px 7px', cursor:'pointer', fontSize:10, color:'#dc2626', fontFamily:'DM Sans,sans-serif' }}>
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ background:'white', padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
          <form onSubmit={send} style={{ display:'flex', gap:8 }}>
            <input className="input" placeholder={`Message #${channels.find(c=>c.id===channel)?.label}...`}
              value={text} onChange={e=>setText(e.target.value)} style={{ flex:1 }}/>
            <button type="submit" className="btn btn-primary" disabled={sending||!text.trim()}>Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
