import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ICONS = ['💬','📢','🚀','💡','🎯','📋','🔥','⚡','🌟','🏆','📊','🎉'];

export default function ChatPage() {
  const { user, API } = useAuth();
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [activeChannel, setActiveChannel] = useState({ id:'company', label:'Company', type:'company' });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name:'', icon:'💬', description:'', members:[] });
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [msg, setMsg] = useState('');
  const bottomRef = useRef();
  const isAdmin = user.role === 'admin';

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),2500); };

  const fetchGroups = useCallback(() => {
    axios.get(`${API}/chat/groups`).then(r=>setGroups(r.data)).catch(()=>{});
  }, [API]);

  useEffect(() => {
    axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{});
    if (isAdmin) axios.get(`${API}/users`).then(r=>setAllUsers(r.data.filter(u=>u.company==='BIZAXL'))).catch(()=>{});
    fetchGroups();
  }, [API, isAdmin, fetchGroups]);

  const fetchMessages = useCallback(() => {
    axios.get(`${API}/chat/messages/${activeChannel.id}`)
      .then(r=>setMessages(r.data))
      .catch(()=>{});
  }, [API, activeChannel.id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => {
    const i = setInterval(fetchMessages, 4000);
    return () => clearInterval(i);
  }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const deptColor = (name) => depts.find(d=>d.name===name)?.color || '#71717b';

  // Build channel list
  const builtinChannels = [
    { id:'company', label:'Company', type:'company', icon:'🏢', desc:'All bizaxl staff' },
    ...(user.department ? [{ id:`dept_${user.department.toLowerCase()}`, label:user.department, type:'dept', icon:'👥', desc:'Your team' }] : []),
  ];

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try { await axios.post(`${API}/chat/messages`, { channel: activeChannel.id, text }); setText(''); fetchMessages(); }
    catch(err) { alert(err.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); }
  };

  const deleteMsg = async (id) => {
    await axios.delete(`${API}/chat/messages/${id}`); fetchMessages();
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    await axios.put(`${API}/chat/messages/${id}`, {text:editText});
    setEditing(null); fetchMessages();
  };

  // Group form helpers
  const openCreateGroup = () => {
    setEditGroup(null);
    setGroupForm({ name:'', icon:'💬', description:'', members:isAdmin?[user.id]:[] });
    setShowGroupForm(true);
    setShowGroupInfo(false);
  };

  const openEditGroup = (g) => {
    setEditGroup(g);
    setGroupForm({ name:g.name, icon:g.icon, description:g.description, members:[...g.members] });
    setShowGroupForm(true);
    setShowGroupInfo(false);
  };

  const toggleMember = (uid) => {
    setGroupForm(f => ({
      ...f,
      members: f.members.includes(uid)
        ? f.members.filter(id=>id!==uid)
        : [...f.members, uid]
    }));
  };

  const submitGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return;
    // Always include admin
    let members = groupForm.members;
    if (!members.includes(user.id)) members = [user.id, ...members];
    try {
      if (editGroup) {
        const r = await axios.put(`${API}/chat/groups/${editGroup.id}`, {...groupForm, members});
        showMsg('Group updated');
        // If currently viewing this group, refresh its info
        if (activeChannel.id === editGroup.channel) {
          setActiveChannel({id:editGroup.channel, label:groupForm.name, type:'group', icon:groupForm.icon, group:r.data});
        }
      } else {
        const r = await axios.post(`${API}/chat/groups`, {...groupForm, members});
        showMsg('Group created');
        setActiveChannel({id:r.data.channel, label:r.data.name, type:'group', icon:r.data.icon, group:r.data});
      }
      setShowGroupForm(false); setEditGroup(null);
      fetchGroups();
    } catch(err) { alert(err.response?.data?.error || 'Error'); }
  };

  const deleteGroup = async (gid) => {
    if (!window.confirm('Delete this group and all its messages?')) return;
    await axios.delete(`${API}/chat/groups/${gid}`);
    fetchGroups(); showMsg('Group deleted');
    setActiveChannel({ id:'company', label:'Company', type:'company', icon:'🏢', desc:'All bizaxl staff' });
    setShowGroupInfo(false);
  };

  // Group by date for rendering
  const grouped = [];
  let lastDate = '';
  messages.forEach(m => {
    const d = new Date(m.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    const today = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    const yesterday = new Date(Date.now()-86400000).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
    const label = d===today?'Today':d===yesterday?'Yesterday':d;
    if (d !== lastDate) { grouped.push({type:'date',label}); lastDate=d; }
    grouped.push({type:'msg',...m});
  });

  const currentGroup = activeChannel.type==='group' ? groups.find(g=>g.channel===activeChannel.id) : null;

  return (
    <div style={{display:'flex', height:'calc(100vh - 0px)', overflow:'hidden', fontFamily:'DM Sans,sans-serif'}}>

      {/* ── Left sidebar ── */}
      <div style={{width:260, background:'white', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0}}>
        {/* Header */}
        <div style={{padding:'16px 16px 12px', borderBottom:'1px solid #e5e7eb'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span style={{fontWeight:700, fontSize:15, color:'#05133c'}}>Messages</span>
            {isAdmin && (
              <button onClick={openCreateGroup}
                style={{background:'#14F1B1', border:'none', borderRadius:20, padding:'4px 10px',
                  cursor:'pointer', fontSize:12, fontWeight:700, color:'#05133c', fontFamily:'DM Sans,sans-serif'}}>
                + Group
              </button>
            )}
          </div>
        </div>

        {/* Channels */}
        <div style={{flex:1, overflowY:'auto'}}>
          {/* Built-in channels */}
          <div style={{padding:'8px 8px 4px', fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px'}}>
            Channels
          </div>
          {builtinChannels.map(ch=>(
            <div key={ch.id} onClick={()=>{ setActiveChannel(ch); setShowGroupForm(false); setShowGroupInfo(false); }}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                cursor:'pointer', borderRadius:8, margin:'2px 6px',
                background: activeChannel.id===ch.id ? '#f0fdf9' : 'transparent',
                borderLeft: activeChannel.id===ch.id ? '3px solid #14F1B1' : '3px solid transparent',
              }}>
              <span style={{fontSize:18}}>{ch.icon}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, fontSize:13, color: activeChannel.id===ch.id?'#05133c':'#374151'}}>{ch.label}</div>
                <div style={{fontSize:11, color:'#9ca3af'}}>{ch.desc}</div>
              </div>
            </div>
          ))}

          {/* Groups */}
          {groups.length > 0 && (
            <div style={{padding:'12px 8px 4px', fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px'}}>
              Groups
            </div>
          )}
          {groups.map(g=>(
            <div key={g.id} onClick={()=>{ setActiveChannel({id:g.channel, label:g.name, type:'group', icon:g.icon, group:g}); setShowGroupForm(false); setShowGroupInfo(false); }}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                cursor:'pointer', borderRadius:8, margin:'2px 6px',
                background: activeChannel.id===g.channel ? '#f0fdf9' : 'transparent',
                borderLeft: activeChannel.id===g.channel ? '3px solid #14F1B1' : '3px solid transparent',
              }}>
              <div style={{width:36, height:36, borderRadius:'50%', background:'#05133c', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0}}>
                {g.icon}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, fontSize:13, color:activeChannel.id===g.channel?'#05133c':'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{g.name}</div>
                <div style={{fontSize:11, color:'#9ca3af'}}>{g.members.length} member{g.members.length!==1?'s':''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0, background:'#f8faff'}}>

        {/* Channel header */}
        <div style={{background:'white', padding:'12px 20px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{fontSize:22}}>{activeChannel.icon||'💬'}</span>
            <div>
              <div style={{fontWeight:700, color:'#05133c', fontSize:15}}>{activeChannel.label}</div>
              {activeChannel.type==='group' && currentGroup && (
                <div style={{fontSize:12, color:'#9ca3af'}}>{currentGroup.members.length} members · {currentGroup.description||'Group chat'}</div>
              )}
              {activeChannel.type==='company' && <div style={{fontSize:12, color:'#9ca3af'}}>All bizaxl staff</div>}
              {activeChannel.type==='dept' && <div style={{fontSize:12, color:'#9ca3af'}}>Your department</div>}
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            {activeChannel.type==='group' && (
              <button onClick={()=>setShowGroupInfo(!showGroupInfo)}
                style={{background:'none', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:'#374151', fontFamily:'DM Sans,sans-serif'}}>
                👥 Members
              </button>
            )}
            {isAdmin && activeChannel.type==='group' && currentGroup && (
              <button onClick={()=>openEditGroup(currentGroup)}
                style={{background:'none', border:'1px solid #e5e7eb', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, color:'#374151', fontFamily:'DM Sans,sans-serif'}}>
                ✏️ Edit
              </button>
            )}
          </div>
        </div>

        {msg && <div style={{background:'#d1fae5',color:'#065f46',padding:'6px 20px',fontSize:13,fontWeight:500,flexShrink:0}}>{msg}</div>}

        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* Messages */}
          <div style={{flex:1, overflowY:'auto', padding:'16px 20px'}}>
            {grouped.length===0 && (
              <div style={{textAlign:'center', color:'#9ca3af', marginTop:60}}>
                <div style={{fontSize:40, marginBottom:10}}>💬</div>
                <p style={{fontWeight:500}}>No messages yet. Start the conversation!</p>
              </div>
            )}
            {grouped.map((item,idx) => {
              if (item.type==='date') return (
                <div key={idx} style={{textAlign:'center', margin:'14px 0'}}>
                  <span style={{background:'white', border:'1px solid #e5e7eb', borderRadius:20, padding:'3px 14px', fontSize:11, color:'#9ca3af', fontWeight:500}}>
                    {item.label}
                  </span>
                </div>
              );
              const isMe = item.sender_id===user.id;
              const canEdit = isMe;
              const canDelete = isMe || isAdmin;
              const time = new Date(item.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
              const color = deptColor(item.sender_dept);
              return (
                <div key={item.id} style={{marginBottom:6, display:'flex', flexDirection:isMe?'row-reverse':'row', gap:8, alignItems:'flex-end'}}
                  onMouseEnter={()=>setHovered(item.id)} onMouseLeave={()=>setHovered(null)}>
                  {!isMe && (
                    <div style={{width:30,height:30,borderRadius:'50%',background:color,color:'white',fontWeight:800,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:2}}>
                      {item.sender_name?.charAt(0)}
                    </div>
                  )}
                  <div style={{maxWidth:'66%'}}>
                    {!isMe && (
                      <div style={{fontSize:11,color:'#9ca3af',marginBottom:3,display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontWeight:600,color:'#05133c'}}>{item.sender_name}</span>
                        {item.sender_dept&&<span style={{background:color+'20',color:color,padding:'1px 6px',borderRadius:20,fontSize:10,fontWeight:600}}>{item.sender_dept}</span>}
                      </div>
                    )}
                    <div style={{display:'flex',alignItems:'flex-end',gap:6,flexDirection:isMe?'row-reverse':'row'}}>
                      {editing===item.id ? (
                        <div>
                          <input value={editText} onChange={e=>setEditText(e.target.value)}
                            onKeyDown={e=>{if(e.key==='Enter')saveEdit(item.id);if(e.key==='Escape')setEditing(null);}}
                            style={{padding:'8px 12px',borderRadius:12,border:'2px solid #14F1B1',fontSize:14,fontFamily:'DM Sans,sans-serif',minWidth:200}} autoFocus/>
                          <div style={{display:'flex',gap:4,marginTop:4}}>
                            <button onClick={()=>saveEdit(item.id)} style={{background:'#14F1B1',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'DM Sans,sans-serif',color:'#05133c'}}>Save</button>
                            <button onClick={()=>setEditing(null)} style={{background:'#f3f4f6',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background:isMe?'#05133c':'white', color:isMe?'white':'#111827',
                          padding:'9px 13px', borderRadius:isMe?'16px 16px 4px 16px':'16px 16px 16px 4px',
                          fontSize:14, lineHeight:1.5, boxShadow:'0 1px 3px rgba(0,0,0,0.07)',
                          border:isMe?'none':'1px solid #e5e7eb',
                        }}>
                          {item.text}{item.edited&&<span style={{fontSize:10,opacity:0.5,marginLeft:6}}>edited</span>}
                        </div>
                      )}
                      <div style={{display:'flex',flexDirection:'column',alignItems:isMe?'flex-end':'flex-start',gap:2,minWidth:38}}>
                        <span style={{fontSize:10,color:'#9ca3af',whiteSpace:'nowrap'}}>{time}</span>
                        {hovered===item.id && editing!==item.id && (canEdit||canDelete) && (
                          <div style={{display:'flex',gap:3}}>
                            {canEdit&&<button onClick={()=>{setEditing(item.id);setEditText(item.text);}} style={{background:'#e0f2fe',border:'1px solid #bae6fd',borderRadius:4,padding:'1px 7px',cursor:'pointer',fontSize:10,color:'#0369a1',fontFamily:'DM Sans,sans-serif'}}>Edit</button>}
                            {canDelete&&<button onClick={()=>deleteMsg(item.id)} style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:4,padding:'1px 7px',cursor:'pointer',fontSize:10,color:'#dc2626',fontFamily:'DM Sans,sans-serif'}}>Delete</button>}
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

          {/* Group info panel */}
          {showGroupInfo && currentGroup && (
            <div style={{width:260, background:'white', borderLeft:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden'}}>
              <div style={{padding:'14px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontWeight:700, fontSize:14, color:'#05133c'}}>Group Info</span>
                <button onClick={()=>setShowGroupInfo(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#9ca3af'}}>×</button>
              </div>
              <div style={{flex:1, overflowY:'auto', padding:16}}>
                <div style={{textAlign:'center', marginBottom:20}}>
                  <div style={{fontSize:40, marginBottom:8}}>{currentGroup.icon}</div>
                  <div style={{fontWeight:700, fontSize:16}}>{currentGroup.name}</div>
                  {currentGroup.description && <div style={{fontSize:13, color:'#9ca3af', marginTop:4}}>{currentGroup.description}</div>}
                  <div style={{fontSize:12, color:'#9ca3af', marginTop:4}}>Created by {currentGroup.created_by_name}</div>
                </div>
                <div style={{fontSize:11, fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10}}>
                  {currentGroup.members.length} Member{currentGroup.members.length!==1?'s':''}
                </div>
                {allUsers.filter(u=>currentGroup.members.includes(u.id)).map(u=>(
                  <div key={u.id} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f3f4f6'}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:deptColor(u.department),color:'white',fontWeight:700,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {u.name.charAt(0)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                      <div style={{fontSize:11,color:'#9ca3af'}}>{u.department||u.role}</div>
                    </div>
                    {isAdmin && u.id !== user.id && (
                      <button onClick={async()=>{ await axios.delete(`${API}/chat/groups/${currentGroup.id}/members/${u.id}`); fetchGroups(); showMsg(`${u.name} removed`); }}
                        style={{background:'none',border:'1px solid #fca5a5',borderRadius:6,padding:'2px 8px',cursor:'pointer',color:'#dc2626',fontSize:11,fontFamily:'DM Sans,sans-serif'}}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <button onClick={()=>deleteGroup(currentGroup.id)}
                    style={{marginTop:16, width:'100%', padding:'8px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, cursor:'pointer', color:'#dc2626', fontWeight:600, fontSize:13, fontFamily:'DM Sans,sans-serif'}}>
                    Delete Group
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Create / Edit group panel */}
          {showGroupForm && isAdmin && (
            <div style={{width:300, background:'white', borderLeft:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden'}}>
              <div style={{padding:'14px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f0fdf9'}}>
                <span style={{fontWeight:700, fontSize:14, color:'#05133c'}}>{editGroup?'Edit Group':'New Group'}</span>
                <button onClick={()=>{setShowGroupForm(false);setEditGroup(null);}} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#9ca3af'}}>×</button>
              </div>
              <div style={{flex:1, overflowY:'auto', padding:16}}>
                <form onSubmit={submitGroup}>
                  {/* Icon picker */}
                  <div style={{marginBottom:14}}>
                    <label style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:8}}>Icon</label>
                    <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                      {ICONS.map(ic=>(
                        <button key={ic} type="button" onClick={()=>setGroupForm(f=>({...f,icon:ic}))}
                          style={{width:36,height:36,borderRadius:8,border:groupForm.icon===ic?'2px solid #14F1B1':'1px solid #e5e7eb',background:groupForm.icon===ic?'#f0fdf9':'white',fontSize:18,cursor:'pointer'}}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{marginBottom:12}}>
                    <label style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Group Name *</label>
                    <input className="input" value={groupForm.name} onChange={e=>setGroupForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Marketing Sprint" required/>
                  </div>
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:6}}>Description</label>
                    <input className="input" value={groupForm.description} onChange={e=>setGroupForm(f=>({...f,description:e.target.value}))} placeholder="What's this group for?"/>
                  </div>

                  {/* Member picker */}
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:11,fontWeight:700,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.5px',display:'block',marginBottom:8}}>
                      Add Members ({groupForm.members.length} selected)
                    </label>
                    <div style={{maxHeight:280, overflowY:'auto', border:'1px solid #e5e7eb', borderRadius:8}}>
                      {allUsers.map(u=>{
                        const selected = groupForm.members.includes(u.id);
                        return (
                          <div key={u.id} onClick={()=>toggleMember(u.id)}
                            style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',cursor:'pointer',borderBottom:'1px solid #f9fafb',background:selected?'#f0fdf9':'white',transition:'background 0.1s'}}>
                            <div style={{width:32,height:32,borderRadius:'50%',background:deptColor(u.department),color:'white',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                              {u.name.charAt(0)}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                              <div style={{fontSize:11,color:'#9ca3af'}}>{u.department||u.role}</div>
                            </div>
                            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${selected?'#14F1B1':'#d1d5db'}`,background:selected?'#14F1B1':'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.1s'}}>
                              {selected&&<span style={{fontSize:10,color:'#05133c',fontWeight:800}}>✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}>
                    {editGroup ? 'Save Changes' : 'Create Group'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Message input */}
        <div style={{background:'white', padding:'12px 20px', borderTop:'1px solid #e5e7eb', flexShrink:0}}>
          <form onSubmit={send} style={{display:'flex', gap:10}}>
            <input className="input" style={{flex:1}}
              placeholder={`Message ${activeChannel.label}...`}
              value={text} onChange={e=>setText(e.target.value)}/>
            <button type="submit" className="btn btn-primary" style={{flexShrink:0}} disabled={sending||!text.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
