import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LEVEL_LABELS = ['Founder / Leadership','Department Head','Team Lead','Employee','Intern'];
const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981', Leadership:'#05133c' };
const PRESET_COLORS = ['#05133c','#3b82f6','#8b5cf6','#ec4899','#10b981','#14F1B1','#f59e0b','#ef4444'];

export default function OrgChartPage() {
  const { user, API } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name:'', role_title:'', department:'', level:0, parent_id:'', color:'#05133c', user_id:'' });

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };
  const fetch = () => {
    axios.get(`${API}/orgchart`).then(r=>setNodes(r.data)).catch(()=>{});
    if(user.role==='admin') axios.get(`${API}/users`).then(r=>setUsers(r.data)).catch(()=>{});
    axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetch(); },[]);

  const submit = async (e) => {
    e.preventDefault();
    if(editNode) { await axios.put(`${API}/orgchart/${editNode.id}`, form); showMsg('Updated'); }
    else { await axios.post(`${API}/orgchart`, form); showMsg('Added'); }
    setShowForm(false); setEditNode(null);
    setForm({ name:'', role_title:'', department:'', level:0, parent_id:'', color:'#05133c', user_id:'' });
    fetch();
  };

  const del = async (id) => {
    if(!window.confirm('Delete this node and all its children?')) return;
    await axios.delete(`${API}/orgchart/${id}`); fetch(); showMsg('Deleted');
  };

  const seed = async () => {
    await axios.post(`${API}/orgchart/seed`); fetch(); showMsg('Seeded default structure');
  };

  const startEdit = (n) => {
    setEditNode(n);
    setForm({ name:n.name, role_title:n.role, department:n.department, level:n.level, parent_id:n.parent_id, color:n.color, user_id:n.user_id||'' });
    setShowForm(true);
  };

  // Build tree
  const buildTree = (nodes, parentId='') => {
    return nodes.filter(n=>n.parent_id===parentId).sort((a,b)=>a.level-b.level);
  };

  const NodeCard = ({ node, depth=0 }) => {
    const children = buildTree(nodes, node.id);
    const color = node.color || DEPT_COLORS[node.department] || '#05133c';
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0}}>
        {/* Vertical line from parent */}
        {depth>0 && <div style={{width:2,height:24,background:'var(--border)'}}/>}
        
        {/* Node card */}
        <div style={{position:'relative',display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
          <div style={{
            background:'white', border:`2px solid ${color}`,
            borderRadius:12, padding:'12px 20px', textAlign:'center',
            boxShadow:'0 2px 12px rgba(5,19,60,0.08)',
            minWidth:140, maxWidth:180, position:'relative',
          }}>
            <div style={{width:40,height:40,borderRadius:'50%',background:color,color:'white',
              fontWeight:800,fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',
              margin:'0 auto 8px'}}>
              {node.name.charAt(0).toUpperCase()}
            </div>
            <div style={{fontWeight:700,fontSize:13,color:'var(--navy)',marginBottom:2}}>{node.name}</div>
            <div style={{fontSize:11,color:'var(--gray-400)',marginBottom:4}}>{node.role}</div>
            {node.department && (
              <span style={{fontSize:10,background:color+'15',color:color,padding:'2px 8px',borderRadius:20,fontWeight:600,border:`1px solid ${color}30`}}>
                {node.department}
              </span>
            )}
            {user.role==='admin' && (
              <div style={{display:'flex',gap:4,justifyContent:'center',marginTop:8}}>
                <button onClick={()=>startEdit(node)} style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:'var(--gray-100)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>Edit</button>
                <button onClick={()=>del(node.id)} style={{fontSize:10,padding:'2px 8px',borderRadius:6,background:'#fee2e2',border:'1px solid #fca5a5',color:'#dc2626',cursor:'pointer',fontFamily:'DM Sans,sans-serif'}}>Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {children.length>0 && (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{width:2,height:20,background:'var(--border)'}}/>
            <div style={{display:'flex',alignItems:'flex-start',gap:0,position:'relative'}}>
              {/* Horizontal connector line */}
              {children.length>1 && (
                <div style={{
                  position:'absolute',top:0,
                  left:`calc(50% / ${children.length})`,
                  right:`calc(50% / ${children.length})`,
                  height:2,background:'var(--border)',
                  zIndex:0,
                }}/>
              )}
              {children.map((child,i)=>(
                <div key={child.id} style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'0 16px'}}>
                  <NodeCard node={child} depth={depth+1}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const roots = buildTree(nodes, '');

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Organization Chart</h1>
          <p className="page-subtitle">bizaxl team structure and hierarchy</p>
        </div>
        {user.role==='admin' && (
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-outline" onClick={seed}>Seed Default</button>
            <button className="btn btn-primary" onClick={()=>{ setEditNode(null); setForm({ name:'', role_title:'', department:'', level:0, parent_id:'', color:'#05133c', user_id:'' }); setShowForm(!showForm); }}>+ Add Person</button>
          </div>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Add/Edit Form */}
      {showForm && user.role==='admin' && (
        <div className="card" style={{marginBottom:24,borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700,marginBottom:20,fontSize:15}}>{editNode?'Edit Person':'Add Person to Chart'}</h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Name *</label>
                <input className="input" placeholder="Person's name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Role / Title *</label>
                <input className="input" placeholder="e.g. Marketing Head" value={form.role_title} onChange={e=>setForm(f=>({...f,role_title:e.target.value}))} required/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Department</label>
                <select className="select" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                  <option value="">None / Leadership</option>
                  {depts.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Level</label>
                <select className="select" value={form.level} onChange={e=>setForm(f=>({...f,level:parseInt(e.target.value)}))}>
                  {LEVEL_LABELS.map((l,i)=><option key={i} value={i}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Reports To (Parent)</label>
                <select className="select" value={form.parent_id} onChange={e=>setForm(f=>({...f,parent_id:e.target.value}))}>
                  <option value="">Top Level (No parent)</option>
                  {nodes.filter(n=>!editNode||n.id!==editNode.id).map(n=><option key={n.id} value={n.id}>{n.name} — {n.role}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Link to Staff Account</label>
                <select className="select" value={form.user_id} onChange={e=>setForm(f=>({...f,user_id:e.target.value}))}>
                  <option value="">None</option>
                  {users.filter(u=>u.company==='BIZAXL').map(u=><option key={u.id} value={u.id}>{u.name} ({u.department})</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Card Color</label>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                {PRESET_COLORS.map(c=>(
                  <button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))}
                    style={{width:28,height:28,borderRadius:'50%',background:c,border:form.color===c?'3px solid var(--navy)':'2px solid white',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,0.15)'}}/>
                ))}
                <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))}
                  style={{width:36,height:28,borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:'pointer',padding:2}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button type="submit" className="btn btn-primary">{editNode?'Save Changes':'Add to Chart'}</button>
              <button type="button" className="btn btn-outline" onClick={()=>{ setShowForm(false); setEditNode(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      {nodes.length===0 ? (
        <div className="card"><div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <h3>No org chart yet</h3>
          {user.role==='admin' && <><p>Click "Seed Default" to start or add people manually</p><button className="btn btn-primary" style={{marginTop:14}} onClick={seed}>Seed Default Structure</button></>}
          {user.role!=='admin' && <p>The organization chart will appear here once admin sets it up.</p>}
        </div></div>
      ) : (
        <>
          {/* Legend */}
          <div className="card" style={{marginBottom:20,padding:'12px 20px'}}>
            <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:700,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px'}}>Levels:</span>
              {LEVEL_LABELS.map((l,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:['#05133c','#3b82f6','#8b5cf6','#ec4899','#10b981'][i]}}/>
                  <span style={{fontSize:12,color:'var(--gray-400)'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tree */}
          <div style={{overflowX:'auto',overflowY:'visible'}}>
            <div style={{minWidth:'max-content',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center'}}>
              {roots.map(root=>(
                <NodeCard key={root.id} node={root} depth={0}/>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
