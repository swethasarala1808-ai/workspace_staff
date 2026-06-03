import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

export default function AdminPage() {
  const { user, API } = useAuth();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('users');
  const [msg, setMsg] = useState('');

  const fetchUsers = () => axios.get(`${API}/users`).then(r=>setUsers(r.data)).catch(()=>{});
  useEffect(()=>{ if(user?.role==='admin') fetchUsers(); },[]);

  if (user?.role!=='admin') return (
    <div className="container">
      <div className="card" style={{textAlign:'center',padding:60}}>
        <div style={{fontSize:48,marginBottom:12}}>⛔</div>
        <h2 style={{color:'var(--navy)'}}>Admins only</h2>
      </div>
    </div>
  );

  const updateRole = async (id, role) => {
    await axios.put(`${API}/users/${id}`,{role});
    setMsg('Updated ✅'); fetchUsers(); setTimeout(()=>setMsg(''),2000);
  };
  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await axios.delete(`${API}/users/${id}`);
    setMsg('User deleted'); fetchUsers(); setTimeout(()=>setMsg(''),2000);
  };

  const bizaxl = users.filter(u=>u.company==='BIZAXL');
  const seria = users.filter(u=>u.company==='SERIA');

  return (
    <div className="container">
      <div className="page-header"><h1 className="page-title">⚙️ Admin Panel</h1>
        <p className="page-sub">{users.length} total users</p></div>
      {msg && <div className="alert alert-success">{msg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:14,marginBottom:28}}>
        {[['👥','Total',users.length,'#05133c'],['🏢','BIZAXL',bizaxl.length,'#14f1b1'],
          ['🏷️','SERIA',seria.length,'#f59e0b'],['🔑','Admins',users.filter(u=>u.role==='admin').length,'#ef4444']
        ].map(([emoji,label,val,color])=>(
          <div key={label} className="card" style={{textAlign:'center',padding:18}}>
            <div style={{fontSize:26,marginBottom:4}}>{emoji}</div>
            <div style={{fontSize:26,fontWeight:800,color}}>{val}</div>
            <div style={{fontSize:12,color:'var(--muted)'}}>{label}</div>
          </div>
        ))}
      </div>

      <div className="tab-bar" style={{marginBottom:20}}>
        {[['users','👥 All'],['bizaxl','🏢 BIZAXL'],['seria','🏷️ SERIA']].map(([id,label])=>(
          <button key={id} className={`tab-btn${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f8faff'}}>
              {['Name','Email','Company','Department','Role','Actions'].map(h=>(
                <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,
                  color:'var(--muted)',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tab==='users'?users:tab==='bizaxl'?bizaxl:seria).map((u,i)=>(
              <tr key={u.id} style={{borderBottom:'1px solid var(--border)',background:i%2===0?'white':'#fafcff'}}>
                <td style={{padding:'12px 16px',fontWeight:600,fontSize:14,color:'var(--navy)'}}>{u.name}</td>
                <td style={{padding:'12px 16px',fontSize:13,color:'var(--muted)'}}>{u.email}</td>
                <td style={{padding:'12px 16px'}}>
                  <span style={{background:'var(--green-glow)',color:'var(--navy)',
                    padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600,border:'1px solid var(--green)'}}>{u.company}</span>
                </td>
                <td style={{padding:'12px 16px'}}>
                  {u.department && <span style={{background:(DEPT_COLORS[u.department]||'#666')+'20',
                    color:DEPT_COLORS[u.department]||'#666',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600}}>{u.department}</span>}
                </td>
                <td style={{padding:'12px 16px'}}>
                  {u.id!==user.id
                    ? <select className="select" style={{width:'auto',fontSize:12,padding:'4px 8px'}}
                        value={u.role} onChange={e=>updateRole(u.id,e.target.value)}>
                        {['employee','admin','marketing','director'].map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    : <span style={{fontSize:13,fontWeight:600,color:'#dc2626'}}>admin (you)</span>}
                </td>
                <td style={{padding:'12px 16px'}}>
                  {u.id!==user.id && <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(u.id,u.name)}>🗑</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length===0 && <div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>No users yet.</div>}
      </div>
    </div>
  );
}
