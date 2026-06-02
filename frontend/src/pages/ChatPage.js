import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment: '#3b82f6', Functional: '#8b5cf6', Marketing: '#ec4899', Research: '#10b981' };

export default function ChatPage() {
  const { user, API } = useAuth();
  const [channel, setChannel] = useState('company');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const channels = [
    { id: 'company', label: '🌐 Company', desc: 'All BIZAXL staff' },
    ...(user.department ? [{ id: `dept_${user.department.toLowerCase()}`, label: `🏷️ ${user.department}`, desc: 'Your team' }] : []),
  ];

  const fetchMessages = () => {
    axios.get(`${API}/chat/messages/${channel}`).then(r => setMessages(r.data)).catch(() => {});
  };

  useEffect(() => { fetchMessages(); }, [channel]);
  useEffect(() => { const i = setInterval(fetchMessages, 5000); return () => clearInterval(i); }, [channel]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API}/chat/messages`, { channel, text });
      setText('');
      fetchMessages();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send');
    } finally { setSending(false); }
  };

  const deptColor = ch => {
    const d = Object.keys(DEPT_COLORS).find(k => ch?.toLowerCase().includes(k.toLowerCase()));
    return DEPT_COLORS[d] || '#00C851';
  };

  return (
    <div className="container" style={{ height: 'calc(100vh - 100px)', display: 'flex', gap: 20, padding: '20px 16px' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'var(--dark)', color: 'white', fontWeight: 700 }}>💬 Channels</div>
          {channels.map(ch => (
            <div key={ch.id} onClick={() => setChannel(ch.id)}
              style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: channel === ch.id ? '#f0fdf4' : 'white', borderLeft: channel === ch.id ? '3px solid var(--green)' : '3px solid transparent', transition: 'all 0.15s' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: channel === ch.id ? 'var(--green)' : 'var(--text)' }}>{ch.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{ch.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="card" style={{ marginBottom: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{channels.find(c => c.id === channel)?.label.split(' ')[0]}</span>
          <div>
            <div style={{ fontWeight: 700 }}>{channels.find(c => c.id === channel)?.label.split(' ').slice(1).join(' ')}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{channels.find(c => c.id === channel)?.desc}</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>Auto-refreshes every 5s</span>
        </div>

        <div className="card" style={{ flex: 1, overflowY: 'auto', padding: 16, marginBottom: 12 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p>No messages yet. Say hi!</p>
            </div>
          ) : messages.map((m, i) => {
            const isMe = m.sender_name === user.name;
            return (
              <div key={i} style={{ marginBottom: 14, display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: deptColor(m.sender_dept), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {m.sender_name.charAt(0)}
                </div>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.sender_name}</span>
                    {m.sender_dept && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: deptColor(m.sender_dept), fontWeight: 600 }}>{m.sender_dept}</span>}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ background: isMe ? 'var(--green)' : 'var(--bg)', color: isMe ? 'white' : 'var(--text)', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 14, lineHeight: 1.5 }}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>Send →</button>
        </form>
      </div>
    </div>
  );
}
