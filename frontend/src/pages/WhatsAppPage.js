import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function WhatsAppPage() {
  const { user, API } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [depts, setDepts] = useState([]);
  const [groupLinks, setGroupLinks] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [search, setSearch] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkForm, setLinkForm] = useState({ name:'', link:'', department:'' });
  const [msg, setMsg] = useState('');

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const fetchDirectory = () => {
    axios.get(`${API}/whatsapp/directory`).then(r => {
      setContacts(r.data.contacts);
      setDepts(r.data.departments);
    }).catch(()=>{});
  };
  const fetchGroupLinks = () => axios.get(`${API}/whatsapp/group_link`).then(r=>setGroupLinks(r.data)).catch(()=>{});

  useEffect(() => { fetchDirectory(); fetchGroupLinks(); }, []);

  const createLink = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/whatsapp/group_link`, linkForm);
    setLinkForm({ name:'', link:'', department:'' });
    setShowLinkForm(false); fetchGroupLinks(); showMsg('Group link added');
  };

  const deleteLink = async (id) => {
    await axios.delete(`${API}/whatsapp/group_link/${id}`);
    fetchGroupLinks();
  };

  const deptColor = (name) => depts.find(d=>d.name===name)?.color || '#71717B';

  const filtered = contacts.filter(c => {
    if (filterDept && c.department !== filterDept) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">WhatsApp</h1>
          <p className="page-subtitle">Reach any teammate on WhatsApp in one tap — every day, no email needed</p>
        </div>
        {user.role==='admin' && (
          <button className="btn btn-primary" onClick={()=>setShowLinkForm(!showLinkForm)}>{showLinkForm?'Cancel':'+ Group Link'}</button>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {showLinkForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:16, fontSize:15}}>Add WhatsApp Group Invite Link</h3>
          <p style={{fontSize:13, color:'var(--gray-400)', marginBottom:16}}>Paste a WhatsApp group invite link (chat.whatsapp.com/...) for company-wide or department broadcast groups.</p>
          <form onSubmit={createLink}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Group Name *</label>
                <input className="input" placeholder="e.g. bizaxl Company Group" value={linkForm.name} onChange={e=>setLinkForm(f=>({...f,name:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Department (optional)</label>
                <select className="select" value={linkForm.department} onChange={e=>setLinkForm(f=>({...f,department:e.target.value}))}>
                  <option value="">Everyone</option>
                  {depts.map(d=><option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Invite Link *</label>
              <input className="input" type="url" placeholder="https://chat.whatsapp.com/..." value={linkForm.link} onChange={e=>setLinkForm(f=>({...f,link:e.target.value}))} required/>
            </div>
            <button type="submit" className="btn btn-primary">Save Group Link</button>
          </form>
        </div>
      )}

      {/* Group links */}
      {groupLinks.length > 0 && (
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', color:'var(--gray-400)', marginBottom:12}}>
            Team Groups
          </div>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            {groupLinks.map(l=>(
              <div key={l.id} style={{display:'flex', alignItems:'center', gap:10, background:'white', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'10px 16px', boxShadow:'var(--shadow)'}}>
                <span style={{fontSize:20}}>💬</span>
                <div>
                  <div style={{fontWeight:600, fontSize:13}}>{l.name}</div>
                  <div style={{fontSize:11, color:'var(--gray-400)'}}>{l.department || 'Everyone'}</div>
                </div>
                <a href={l.link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{marginLeft:6, background:'#25D366', borderColor:'#25D366'}}>Join</a>
                {user.role==='admin' && (
                  <button onClick={()=>deleteLink(l.id)} style={{background:'none', border:'none', cursor:'pointer', color:'var(--gray-400)', fontSize:16, padding:'0 4px'}}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div style={{display:'flex', gap:10, marginBottom:18, flexWrap:'wrap'}}>
        <input className="input" placeholder="Search by name..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:240}}/>
        <button onClick={()=>setFilterDept('')}
          style={{padding:'8px 16px', borderRadius:20, border:`1px solid ${!filterDept?'var(--navy)':'var(--border)'}`, background:!filterDept?'var(--navy)':'white', color:!filterDept?'var(--mint)':'var(--gray-400)', cursor:'pointer', fontSize:13, fontWeight:!filterDept?700:400, fontFamily:'DM Sans,sans-serif'}}>
          All
        </button>
        {depts.map(d=>(
          <button key={d.name} onClick={()=>setFilterDept(filterDept===d.name?'':d.name)}
            style={{padding:'8px 16px', borderRadius:20, border:`1px solid ${filterDept===d.name?d.color:'var(--border)'}`, background:filterDept===d.name?d.color+'15':'white', color:filterDept===d.name?d.color:'var(--gray-400)', cursor:'pointer', fontSize:13, fontWeight:500, fontFamily:'DM Sans,sans-serif'}}>
            {d.name}
          </button>
        ))}
      </div>

      {/* Contacts grid */}
      {filtered.length===0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>No contacts found</h3>
          <p>{contacts.length===0 ? 'Staff phone numbers will appear here once added during registration.' : 'Try a different search or filter.'}</p>
        </div></div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12}}>
          {filtered.map(c=>(
            <div key={c.id} className="card" style={{display:'flex', alignItems:'center', gap:12, padding:'16px'}}>
              <div style={{width:42, height:42, borderRadius:'50%', background:deptColor(c.department), color:'white', fontWeight:800, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:600, fontSize:14}} className="truncate">{c.name}</div>
                <div style={{fontSize:12, color:'var(--gray-400)'}} className="truncate">{c.department || c.role}</div>
              </div>
              {c.wa_link ? (
                <a href={c.wa_link} target="_blank" rel="noreferrer" title="Chat on WhatsApp"
                  style={{width:38, height:38, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, textDecoration:'none'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17.6 6.32A8.86 8.86 0 0 0 12.05 4a8.94 8.94 0 0 0-7.74 13.4L3 21l3.71-1.23a8.93 8.93 0 0 0 5.34 1.72h.01a8.93 8.93 0 0 0 8.93-8.93 8.86 8.86 0 0 0-2.6-6.24h-.01zm-5.55 13.7h-.01a7.41 7.41 0 0 1-4.45-1.51l-.32-.2-3.18.84.85-3.1-.21-.32a7.42 7.42 0 0 1 11.49-9.21 7.36 7.36 0 0 1 2.17 5.21 7.43 7.43 0 0 1-6.34 8.29zm4.07-5.56c-.22-.11-1.31-.65-1.51-.72-.2-.08-.35-.11-.5.11-.15.22-.57.72-.7.87-.13.15-.26.16-.48.06-.22-.11-.93-.34-1.77-1.1a6.6 6.6 0 0 1-1.22-1.51c-.13-.22-.01-.34.11-.45.11-.11.25-.28.37-.42.13-.13.17-.23.25-.39.08-.15.04-.28-.02-.39-.06-.11-.5-1.21-.69-1.66-.18-.43-.37-.37-.5-.38h-.43c-.15 0-.39.06-.6.28-.2.22-.78.76-.78 1.85s.8 2.15.91 2.3c.11.15 1.55 2.37 3.77 3.22 1.87.73 2.25.59 2.66.55.4-.04 1.31-.53 1.49-1.05.18-.51.18-.95.13-1.04-.06-.1-.22-.16-.44-.27z"/></svg>
                </a>
              ) : (
                <span style={{fontSize:11, color:'var(--gray-400)'}}>No number</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
