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

  if (user?.role !== 'admin') return (
    <div className="page-container">
      <div className="card"><div className="empty-state"><div className="empty-state-icon">🔒</div><h3>Admin access required</h3></div></div>
    </div>
  );

  const updateRole = async (id, role) => {
    await axios.put(`${API}/users/${id}`, { role });
    setMsg('Updated'); fetchUsers(); setTimeout(()=>setMsg(''),2000);
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    await axios.delete(`${API}/users/${id}`);
    setMsg('User deleted'); fetchUsers(); setTimeout(()=>setMsg(''),2000);
  };

  const bizaxl = users.filter(u=>u.company==='BIZAXL');
  const seria  = users.filter(u=>u.company==='SERIA');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users, roles and access</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Stats */}
      <div className="grid-4" style={{marginBottom:24}}>
        {[['Total Users',users.length,'var(--navy)'],['Bizaxl',bizaxl.length,'#059669'],['Seria',seria.length,'#d97706'],['Admins',users.filter(u=>u.role==='admin').length,'#7c3aed']].map(([l,v,c])=>(
          <div key={l} className="card card-sm">
            <div style={{fontSize:26, fontWeight:800, color:c}}>{v}</div>
            <div style={{fontSize:12, color:'var(--gray-400)', marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['users','All Users'],['bizaxl','Bizaxl'],['seria','Seria']].map(([id,label])=>(
          <button key={id} className={`tab${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Department</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>
            {(tab==='users'?users:tab==='bizaxl'?bizaxl:seria).map(u=>(
              <tr key={u.id}>
                <td style={{fontWeight:600}}>{u.name}</td>
                <td style={{color:'var(--gray-400)', fontSize:13}}>{u.email}</td>
                <td><span className="badge badge-gray">{u.company}</span></td>
                <td>{u.department && <span className="badge" style={{background:(DEPT_COLORS[u.department]||'#666')+'15', color:DEPT_COLORS[u.department]||'#666'}}>{u.department}</span>}</td>
                <td>
                  {u.id !== user.id
                    ? <select className="select" style={{width:'auto', height:32, fontSize:12, padding:'4px 8px'}}
                        value={u.role} onChange={e=>updateRole(u.id, e.target.value)}>
                        {['employee','admin','marketing','director'].map(r=><option key={r}>{r}</option>)}
                      </select>
                    : <span className="badge badge-blue">admin (you)</span>}
                </td>
                <td>{u.id !== user.id && <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(u.id, u.name)}>Delete</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length===0 && <div className="empty-state"><h3>No users yet</h3></div>}
      </div>
    </div>
  );
}
