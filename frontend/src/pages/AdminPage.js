import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };
const PRESET_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#14F1B1','#114EFF','#ef4444'];

export default function AdminPage() {
  const { user, API } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [msg, setMsg] = useState('');
  const [deptForm, setDeptForm] = useState({ name:'', color:'#14F1B1', icon:'👥' });
  const [showDeptForm, setShowDeptForm] = useState(false);

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const fetchUsers = () => axios.get(`${API}/users`).then(r=>setUsers(r.data)).catch(()=>{});
  const fetchDepts = () => axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{});

  useEffect(()=>{ if(user?.role==='admin'){ fetchUsers(); fetchDepts(); } },[]);

  if (user?.role !== 'admin') return (
    <div className="page-container">
      <div className="card"><div className="empty-state"><div className="empty-state-icon">🔒</div><h3>Admin access required</h3></div></div>
    </div>
  );

  const updateRole = async (id, role) => {
    await axios.put(`${API}/users/${id}`, { role });
    showMsg('Role updated'); fetchUsers();
  };

  const updateDepartment = async (id, department) => {
    await axios.put(`${API}/users/${id}`, { department });
    showMsg('Department updated'); fetchUsers();
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await axios.delete(`${API}/users/${id}`);
    showMsg('User deleted'); fetchUsers();
  };

  const createDept = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/departments`, deptForm);
      setDeptForm({ name:'', color:'#14F1B1', icon:'👥' });
      setShowDeptForm(false);
      showMsg('Department created ✓'); fetchDepts();
    } catch(err) { showMsg(err.response?.data?.error || 'Error'); }
  };

  const deleteDept = async (id, name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    await axios.delete(`${API}/departments/${id}`);
    showMsg('Department deleted'); fetchDepts();
  };

  const seedDepts = async () => {
    await axios.post(`${API}/departments/seed`);
    showMsg('Default departments seeded'); fetchDepts();
  };

  const bizaxl = users.filter(u=>u.company==='BIZAXL');
  const seria  = users.filter(u=>u.company==='SERIA');
  const tableUsers = tab==='users' ? users : tab==='bizaxl' ? bizaxl : seria;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle">Manage users, departments and access</p>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Stats */}
      <div className="grid-4" style={{marginBottom:24}}>
        {[['Total Users',users.length,'var(--navy)'],['bizaxl',bizaxl.length,'#059669'],['Seria',seria.length,'#d97706'],['Departments',depts.length,'#7c3aed']].map(([l,v,c])=>(
          <div key={l} className="card card-sm" style={{textAlign:'center'}}>
            <div style={{fontSize:26, fontWeight:800, color:c}}>{v}</div>
            <div style={{fontSize:12, color:'var(--gray-400)', marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[['users','All Users'],['bizaxl','bizaxl'],['seria','Seria'],['departments','Departments']].map(([id,label])=>(
          <button key={id} className={`tab${tab===id?' active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {/* Departments tab */}
      {tab==='departments' && (
        <>
          <div className="flex-between" style={{marginBottom:16}}>
            <div style={{fontSize:14, color:'var(--gray-400)'}}>Create and manage team departments</div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn-outline btn-sm" onClick={seedDepts}>Seed Defaults</button>
              <button className="btn btn-primary btn-sm" onClick={()=>setShowDeptForm(!showDeptForm)}>+ New Department</button>
            </div>
          </div>

          {showDeptForm && (
            <div className="card" style={{marginBottom:20, borderTop:'3px solid var(--mint)'}}>
              <h3 style={{fontWeight:700, marginBottom:16, fontSize:15}}>Create Department</h3>
              <form onSubmit={createDept}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Name *</label>
                    <input className="input" placeholder="e.g. Operations" value={deptForm.name} onChange={e=>setDeptForm(f=>({...f,name:e.target.value}))} required/>
                  </div>
                  <div className="form-group">
                    <label className="label">Icon (emoji)</label>
                    <input className="input" value={deptForm.icon} onChange={e=>setDeptForm(f=>({...f,icon:e.target.value}))} maxLength={2}/>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Color</label>
                  <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                    {PRESET_COLORS.map(c=>(
                      <button key={c} type="button" onClick={()=>setDeptForm(f=>({...f,color:c}))}
                        style={{width:28, height:28, borderRadius:'50%', background:c, border:deptForm.color===c?'3px solid var(--navy)':'2px solid transparent', cursor:'pointer'}}>
                      </button>
                    ))}
                    <input type="color" value={deptForm.color} onChange={e=>setDeptForm(f=>({...f,color:e.target.value}))}
                      style={{width:40, height:30, borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', cursor:'pointer', padding:2}}/>
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button type="submit" className="btn btn-primary">Create Department</button>
                  <button type="button" className="btn btn-outline" onClick={()=>setShowDeptForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {depts.length===0
            ? <div className="card"><div className="empty-state"><div className="empty-state-icon">🏢</div><h3>No departments yet</h3><p>Click "Seed Defaults" to add the standard departments</p></div></div>
            : <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12}}>
                {depts.map(d=>(
                  <div key={d.id} className="card" style={{display:'flex', gap:14, alignItems:'center', padding:'16px 18px'}}>
                    <div style={{width:44, height:44, borderRadius:'var(--radius)', background:d.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, border:`1px solid ${d.color}30`}}>
                      {d.icon}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight:700, fontSize:14}}>{d.name}</div>
                      <div style={{fontSize:12, color:'var(--gray-400)'}}>{d.member_count} member{d.member_count!==1?'s':''}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={()=>deleteDept(d.id, d.name)} style={{padding:'4px 10px', fontSize:12}}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>}
        </>
      )}

      {/* Users table */}
      {tab !== 'departments' && (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Department</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableUsers.map(u=>(
                <tr key={u.id}>
                  <td style={{fontWeight:600}}>{u.name}</td>
                  <td style={{color:'var(--gray-400)', fontSize:13}}>{u.email}</td>
                  <td><span className="badge badge-gray" style={{fontSize:12}}>{u.company}</span></td>
                  <td>
                    {u.company === 'BIZAXL' ? (
                      <select className="select" style={{width:'auto', height:32, fontSize:12, padding:'4px 8px', color:depts.find(d=>d.name===u.department)?.color||'var(--navy)'}}
                        value={u.department||''} onChange={e=>updateDepartment(u.id, e.target.value)}>
                        <option value="">— None —</option>
                        {depts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    ) : (
                      <span style={{fontSize:12, color:'var(--gray-400)'}}>—</span>
                    )}
                  </td>
                  <td>
                    {u.id !== user.id
                      ? <select className="select" style={{width:'auto', height:32, fontSize:12, padding:'4px 8px'}}
                          value={u.role} onChange={e=>updateRole(u.id, e.target.value)}>
                          {['employee','admin','marketing','director'].map(r=><option key={r}>{r}</option>)}
                        </select>
                      : <span className="badge badge-blue">admin (you)</span>}
                  </td>
                  <td>
                    {u.id !== user.id && (
                      <button className="btn btn-danger btn-sm" onClick={()=>deleteUser(u.id, u.name)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableUsers.length===0 && (
            <div className="empty-state" style={{padding:32}}><h3>No users found</h3></div>
          )}
        </div>
      )}
    </div>
  );
}
