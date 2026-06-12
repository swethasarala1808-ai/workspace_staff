import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TYPE_STYLES = {
  founder:   { bg:'var(--navy)', color:'white', border:'var(--mint)', label:'Founder' },
  dept_head: { bg:'#eff6ff', color:'#1d4ed8', border:'#3b82f6', label:'Dept Head' },
  lead:      { bg:'#f0fdf4', color:'#166534', border:'#10b981', label:'Lead' },
  employee:  { bg:'white', color:'var(--navy)', border:'var(--border)', label:'Employee' },
  intern:    { bg:'#fefce8', color:'#854d0e', border:'#f59e0b', label:'Intern' },
};

const DEPT_COLORS = {
  Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981'
};

function OrgNode({ node, nodes, isAdmin, onAdd, onEdit, onDelete, depth=0 }) {
  const children = nodes.filter(n => n.parent_id === node.id);
  const style = TYPE_STYLES[node.type] || TYPE_STYLES.employee;
  const deptColor = DEPT_COLORS[node.department];
  const [hover, setHover] = useState(false);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>
      {/* Connector line from parent */}
      {depth > 0 && (
        <div style={{ width:2, height:24, background:'var(--border)' }} />
      )}

      {/* Node card */}
      <div style={{ position:'relative' }}
        onMouseEnter={()=>setHover(true)}
        onMouseLeave={()=>setHover(false)}>
        <div style={{
          background: node.type==='founder' ? 'var(--navy)' : 'white',
          border: `2px solid ${node.type==='founder' ? 'var(--mint)' : (deptColor||style.border)}`,
          borderRadius: 12,
          padding: '12px 20px',
          minWidth: 160,
          textAlign: 'center',
          boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow)',
          transition: 'box-shadow 0.15s',
          position: 'relative',
          cursor: 'default',
        }}>
          {/* Avatar circle */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: node.type==='founder' ? 'var(--mint)' : (deptColor ? deptColor+'20' : 'var(--gray-100)'),
            border: `2px solid ${node.type==='founder' ? 'rgba(20,241,177,0.5)' : (deptColor||'var(--border)')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 8px',
            fontSize: 16, fontWeight: 800,
            color: node.type==='founder' ? 'var(--navy)' : (deptColor||'var(--navy)'),
          }}>
            {node.name.charAt(0).toUpperCase()}
          </div>

          <div style={{
            fontWeight: 700, fontSize: 13,
            color: node.type==='founder' ? 'white' : 'var(--navy)',
            marginBottom: 3
          }}>
            {node.name}
          </div>
          <div style={{
            fontSize: 11, color: node.type==='founder' ? 'rgba(255,255,255,0.6)' : 'var(--gray-400)',
            marginBottom: 4
          }}>
            {node.title}
          </div>

          {/* Type badge */}
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 20,
            fontSize: 10, fontWeight: 700,
            background: node.type==='founder' ? 'rgba(20,241,177,0.15)' : style.bg,
            color: node.type==='founder' ? 'var(--mint)' : style.color,
            border: `1px solid ${node.type==='founder' ? 'rgba(20,241,177,0.3)' : style.border}`,
          }}>
            {node.department ? `${node.department} · ` : ''}{style.label}
          </span>

          {/* Admin actions on hover */}
          {isAdmin && hover && (
            <div style={{
              position: 'absolute', top: -10, right: -10,
              display: 'flex', gap: 4,
            }}>
              <button onClick={()=>onEdit(node)}
                style={{width:24,height:24,borderRadius:'50%',background:'var(--navy)',color:'var(--mint)',border:'none',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--shadow)'}}>
                ✏
              </button>
              <button onClick={()=>onAdd(node.id)}
                style={{width:24,height:24,borderRadius:'50%',background:'var(--mint)',color:'var(--navy)',border:'none',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--shadow)',fontWeight:700}}>
                +
              </button>
              <button onClick={()=>onDelete(node.id)}
                style={{width:24,height:24,borderRadius:'50%',background:'#fee2e2',color:'#dc2626',border:'none',cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--shadow)'}}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {children.length > 0 && (
        <>
          {/* Vertical line down */}
          <div style={{ width:2, height:24, background:'var(--border)' }} />
          {/* Horizontal connector */}
          {children.length > 1 && (
            <div style={{ position:'relative', width:'100%' }}>
              <div style={{
                height: 2, background:'var(--border)',
                width: `calc(100% - 160px)`,
                margin: '0 auto',
              }} />
            </div>
          )}
          {/* Children row */}
          <div style={{ display:'flex', gap: 20, alignItems:'flex-start' }}>
            {children.map(child => (
              <OrgNode key={child.id} node={child} nodes={nodes} isAdmin={isAdmin}
                onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} depth={depth+1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TYPES = ['founder','dept_head','lead','employee','intern'];
const DEPTS = ['','Deployment','Functional','Marketing','Research'];

export default function OrgChartPage() {
  const { user, API } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [depts, setDepts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    name:'', title:'', type:'employee', department:'', parent_id:'', email:'', linked_user_id:'', order:99
  });
  const isAdmin = user.role === 'admin';
  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const fetchAll = () => {
    axios.get(`${API}/org`).then(r=>setNodes(r.data)).catch(()=>{});
    axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{});
  };
  useEffect(()=>{ fetchAll(); },[]);

  const allDepts = depts.length > 0
    ? depts.map(d=>d.name)
    : ['Deployment','Functional','Marketing','Research'];

  const openAdd = (parentId='') => {
    setEditing(null);
    setForm({ name:'', title:'', type:'employee', department:'', parent_id:parentId, email:'', linked_user_id:'', order:99 });
    setShowForm(true);
  };

  const openEdit = (node) => {
    setEditing(node);
    setForm({ name:node.name, title:node.title, type:node.type, department:node.department,
      parent_id:node.parent_id, email:node.email, linked_user_id:node.linked_user_id, order:node.order });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/org/${editing.id}`, form);
        showMsg('Updated');
      } else {
        await axios.post(`${API}/org`, form);
        showMsg('Added');
      }
      setShowForm(false); setEditing(null);
      fetchAll();
    } catch(err) { showMsg(err.response?.data?.error||'Error'); }
  };

  const deleteNode = async (id) => {
    if(!window.confirm('Delete this person and all their reports?')) return;
    await axios.delete(`${API}/org/${id}`);
    fetchAll(); showMsg('Deleted');
  };

  const seed = async () => {
    await axios.post(`${API}/org/seed`);
    fetchAll(); showMsg('Org chart seeded');
  };

  // Find root nodes (no parent)
  const roots = nodes.filter(n => !n.parent_id || n.parent_id === '');

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Team Structure</h1>
          <p className="page-subtitle">bizaxl organisation chart — {nodes.length} people</p>
        </div>
        {isAdmin && (
          <div style={{display:'flex', gap:8}}>
            {nodes.length===0 && <button className="btn btn-outline" onClick={seed}>Seed Default</button>}
            <button className="btn btn-primary" onClick={()=>openAdd('')}>+ Add Person</button>
          </div>
        )}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Legend */}
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:20}}>
        {Object.entries(TYPE_STYLES).map(([type,s])=>(
          <span key={type} style={{padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600,
            background:s.bg, color:s.color, border:`1px solid ${s.border}`}}>
            {s.label}
          </span>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && isAdmin && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:16, fontSize:15}}>
            {editing ? 'Edit Person' : 'Add Person to Chart'}
          </h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Name *</label>
                <input className="input" placeholder="Full name or title" value={form.name}
                  onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Job Title</label>
                <input className="input" placeholder="e.g. Marketing Lead" value={form.title}
                  onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Role Type *</label>
                <select className="select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {TYPES.map(t=><option key={t} value={t}>{TYPE_STYLES[t].label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Department</label>
                <select className="select" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                  <option value="">— None —</option>
                  {allDepts.map(d=><option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Reports To (parent)</label>
                <select className="select" value={form.parent_id} onChange={e=>setForm(f=>({...f,parent_id:e.target.value}))}>
                  <option value="">— Top level —</option>
                  {nodes.filter(n=>!editing||n.id!==editing.id).map(n=>(
                    <option key={n.id} value={n.id}>{n.name} ({TYPE_STYLES[n.type]?.label})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Email (optional)</label>
                <input className="input" type="email" placeholder="person@bizaxl.com" value={form.email}
                  onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary">{editing?'Save Changes':'Add to Chart'}</button>
              <button type="button" className="btn btn-outline" onClick={()=>{setShowForm(false);setEditing(null);}}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      {nodes.length===0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <h3>No org chart yet</h3>
            <p>Click "Seed Default" to start with a template, or add people manually.</p>
            {isAdmin && <button className="btn btn-primary" style={{marginTop:16}} onClick={seed}>Seed Default Structure</button>}
          </div>
        </div>
      ) : (
        <div style={{overflowX:'auto', padding:'20px 0'}}>
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:0, minWidth:'fit-content', padding:'0 40px'}}>
            {roots.map(root=>(
              <OrgNode key={root.id} node={root} nodes={nodes} isAdmin={isAdmin}
                onAdd={openAdd} onEdit={openEdit} onDelete={deleteNode} depth={0}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
