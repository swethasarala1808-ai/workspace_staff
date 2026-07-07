import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LEVEL_LABELS = ['Founder / Leadership','Department Head','Team Lead','Employee','Intern'];
const LEVEL_COLORS = ['#05133c','#3b82f6','#8b5cf6','#ec4899','#10b981'];
const PRESET_COLORS = ['#05133c','#3b82f6','#8b5cf6','#ec4899','#10b981','#14F1B1','#f59e0b','#ef4444','#06b6d4','#84cc16'];

export default function OrgChartPage() {
  const { user, API } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [depts, setDepts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [focused, setFocused] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name:'', role_title:'', department:'', level:0, parent_id:'', color:'#05133c', user_id:'' });

  const showMsg = (m) => { setMsg(m); setTimeout(()=>setMsg(''),3000); };

  const fetchAll = useCallback(() => {
    axios.get(`${API}/orgchart`).then(r => {
      setNodes(r.data);
      const exp = {};
      r.data.forEach(n => { exp[n.id] = true; });
      setExpanded(exp);
    }).catch(()=>{});
    axios.get(`${API}/departments`).then(r=>setDepts(r.data)).catch(()=>{});
    if (user.role==='admin') axios.get(`${API}/users`).then(r=>setAllUsers(r.data)).catch(()=>{});
  }, [API, user.role]);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const submit = async (e) => {
    e.preventDefault();
    if (editNode) await axios.put(`${API}/orgchart/${editNode.id}`, form);
    else await axios.post(`${API}/orgchart`, form);
    setShowForm(false); setEditNode(null);
    setForm({ name:'', role_title:'', department:'', level:0, parent_id:'', color:'#05133c', user_id:'' });
    fetchAll(); showMsg(editNode ? 'Updated' : 'Added');
  };

  const del = async (id) => {
    if (!window.confirm('Delete this node and all its children?')) return;
    await axios.delete(`${API}/orgchart/${id}`);
    if (focused === id) setFocused(null);
    fetchAll(); showMsg('Deleted');
  };

  const seed = async () => {
    await axios.post(`${API}/orgchart/seed`); fetchAll(); showMsg('Seeded default structure');
  };

  const startEdit = (n) => {
    setEditNode(n);
    setForm({ name:n.name, role_title:n.role, department:n.department, level:n.level, parent_id:n.parent_id, color:n.color, user_id:n.user_id||'' });
    setShowForm(true); window.scrollTo({top:0,behavior:'smooth'});
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const childrenOf = (parentId) => nodes.filter(n => n.parent_id === parentId);
  const roots = nodes.filter(n => !n.parent_id || n.parent_id === '');

  const getDescendantCount = (id) => {
    const children = childrenOf(id);
    return children.length + children.reduce((acc, c) => acc + getDescendantCount(c.id), 0);
  };

  // When focused, collect all nodes under that id
  const getFocusedNodes = (id) => {
    const collect = (nodeId) => {
      const n = nodes.find(x => x.id === nodeId);
      if (!n) return [];
      return [n, ...childrenOf(nodeId).flatMap(c => collect(c.id))];
    };
    return collect(id);
  };

  const focusedNodeSet = focused ? new Set(getFocusedNodes(focused).map(n => n.id)) : null;
  const displayRoots = focused ? [nodes.find(n => n.id === focused)].filter(Boolean) : roots;

  const NodeCard = ({ node, depth }) => {
    const rawChildren = childrenOf(node.id);
    const children = focusedNodeSet
      ? rawChildren.filter(c => focusedNodeSet.has(c.id))
      : rawChildren;
    const isExpanded = expanded[node.id] !== false;
    const hasChildren = children.length > 0;
    const descCount = getDescendantCount(node.id);
    const color = node.color || LEVEL_COLORS[node.level] || '#05133c';
    const isAdmin = user.role === 'admin';
    const isFocused = focused === node.id;

    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
        {depth > 0 && <div style={{ width:2, height:24, background:'#cbd5e1', flexShrink:0 }}/>}

        <div style={{
          background:'white', border:`2.5px solid ${color}`,
          borderRadius:14, padding:'14px 16px', textAlign:'center',
          boxShadow: isFocused ? `0 0 0 3px ${color}40, 0 4px 20px ${color}30` : `0 2px 12px ${color}18`,
          minWidth:148, maxWidth:172, position:'relative',
          transition:'all 0.2s',
        }}>
          {/* Focus button top-right */}
          {hasChildren && (
            <button onClick={()=>{ setFocused(isFocused ? null : node.id); setExpanded(ex=>({...ex,[node.id]:true})); }}
              title={isFocused ? 'Back to full chart' : `Focus on ${node.name}'s team`}
              style={{ position:'absolute', top:7, right:7, width:22, height:22, borderRadius:'50%',
                background: isFocused ? color : 'white', color: isFocused ? 'white' : color,
                border:`1.5px solid ${color}`, cursor:'pointer', fontSize:11, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'DM Sans,sans-serif', lineHeight:1 }}>
              {isFocused ? '✕' : '⊙'}
            </button>
          )}

          {/* Avatar */}
          <div style={{
            width:44, height:44, borderRadius:'50%', background:color,
            color:'white', fontWeight:800, fontSize:16,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 8px', boxShadow:`0 0 0 3px ${color}30`,
          }}>
            {node.name.charAt(0).toUpperCase()}
          </div>

          <div style={{ fontWeight:700, fontSize:13, color:'#05133c', marginBottom:2, lineHeight:1.3 }}>{node.name}</div>
          <div style={{ fontSize:11, color:'#71717B', lineHeight:1.3, marginBottom:node.department?5:0 }}>{node.role}</div>
          {node.department && (
            <span style={{ fontSize:10, background:`${color}15`, color:color, padding:'2px 8px', borderRadius:20,
              fontWeight:600, border:`1px solid ${color}28`, display:'inline-block' }}>
              {node.department}
            </span>
          )}

          {/* Admin edit/delete */}
          {isAdmin && (
            <div style={{ display:'flex', gap:4, justifyContent:'center', marginTop:9 }}>
              <button onClick={()=>startEdit(node)}
                style={{ fontSize:10, padding:'2px 9px', borderRadius:6, background:'#eff6ff',
                  border:'1px solid #bae6fd', cursor:'pointer', color:'#0369a1', fontFamily:'DM Sans,sans-serif' }}>
                Edit
              </button>
              <button onClick={()=>del(node.id)}
                style={{ fontSize:10, padding:'2px 9px', borderRadius:6, background:'#fee2e2',
                  border:'1px solid #fca5a5', color:'#dc2626', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Expand/collapse button */}
        {hasChildren && (
          <button onClick={()=>toggleExpand(node.id)}
            style={{ marginTop:3, background:'white', border:'1px solid #e2e8f0', borderRadius:20,
              padding:'2px 12px', cursor:'pointer', fontSize:11, color:'#71717B',
              fontFamily:'DM Sans,sans-serif', display:'flex', alignItems:'center', gap:5,
              boxShadow:'0 1px 3px rgba(0,0,0,0.07)', zIndex:1 }}>
            {isExpanded ? '▲' : '▼'} {isExpanded ? 'Collapse' : `${descCount} member${descCount!==1?'s':''}`}
          </button>
        )}

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ width:2, height:20, background:'#cbd5e1' }}/>
            <div style={{ position:'relative', display:'flex', alignItems:'flex-start' }}>
              {/* Horizontal bridge line */}
              {children.length > 1 && (
                <div style={{
                  position:'absolute', top:0, height:2, background:'#cbd5e1',
                  left:`calc(50% / ${children.length} + 12px)`,
                  right:`calc(50% / ${children.length} + 12px)`,
                  zIndex:0,
                }}/>
              )}
              {children.map(child => (
                <div key={child.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'0 10px' }}>
                  <NodeCard node={child} depth={depth+1}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#f8faff' }}>

      {/* Header */}
      <div style={{ padding:'16px 28px', background:'white', borderBottom:'1px solid #e2e8f0',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0,
        boxShadow:'0 1px 4px rgba(5,19,60,0.06)' }}>
        <div>
          <h1 style={{ fontWeight:700, fontSize:19, color:'#05133c', margin:0 }}>Organization Chart</h1>
          {focused && (
            <div style={{ fontSize:13, color:'#71717B', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
              Showing:&nbsp;<strong style={{color:'#05133c'}}>{nodes.find(n=>n.id===focused)?.name}'s team</strong>
              <button onClick={()=>setFocused(null)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#14F1B1',
                  fontWeight:700, fontSize:12, fontFamily:'DM Sans,sans-serif', padding:0, textDecoration:'underline' }}>
                ← Back to full chart
              </button>
            </div>
          )}
        </div>
        {user.role==='admin' && (
          <div style={{ display:'flex', gap:8 }}>
            {nodes.length===0 && <button className="btn btn-outline btn-sm" onClick={seed}>Seed Default</button>}
            <button className="btn btn-primary btn-sm" onClick={()=>{ setEditNode(null); setForm({ name:'', role_title:'', department:'', level:0, parent_id:'', color:'#05133c', user_id:'' }); setShowForm(!showForm); }}>
              {showForm && !editNode ? 'Cancel' : '+ Add Person'}
            </button>
          </div>
        )}
      </div>

      {/* Alert */}
      {msg && <div style={{ background:'#d1fae5', color:'#065f46', padding:'8px 28px', fontSize:13, fontWeight:500, flexShrink:0 }}>{msg}</div>}

      {/* Add / Edit form */}
      {showForm && user.role==='admin' && (
        <div style={{ padding:'16px 28px', background:'#f0fdf9', borderBottom:'2px solid #6ee7b7', flexShrink:0, overflowX:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h3 style={{ fontWeight:700, fontSize:15, margin:0 }}>{editNode ? `Editing: ${editNode.name}` : 'Add New Person'}</h3>
            <button className="btn btn-outline btn-sm" onClick={()=>{setShowForm(false);setEditNode(null);}}>Cancel</button>
          </div>
          <form onSubmit={submit} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
            {[['Name *','name','text','Full name'],['Title *','role_title','text','e.g. Marketing Head']].map(([label,key,type,ph])=>(
              <div key={key} style={{ display:'flex', flexDirection:'column', gap:4, minWidth:160 }}>
                <label style={{ fontSize:11, fontWeight:700, color:'#71717B', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</label>
                <input className="input" style={{ height:36, fontSize:13 }} type={type} placeholder={ph} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} required/>
              </div>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:160 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#71717B', textTransform:'uppercase', letterSpacing:'0.5px' }}>Department</label>
              <select className="select" style={{ height:36, fontSize:13 }} value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                <option value="">None / Leadership</option>
                {depts.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:160 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#71717B', textTransform:'uppercase', letterSpacing:'0.5px' }}>Level</label>
              <select className="select" style={{ height:36, fontSize:13 }} value={form.level} onChange={e=>setForm(f=>({...f,level:parseInt(e.target.value)}))}>
                {LEVEL_LABELS.map((l,i)=><option key={i} value={i}>{l}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:200 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#71717B', textTransform:'uppercase', letterSpacing:'0.5px' }}>Reports To</label>
              <select className="select" style={{ height:36, fontSize:13 }} value={form.parent_id} onChange={e=>setForm(f=>({...f,parent_id:e.target.value}))}>
                <option value="">Top Level (no parent)</option>
                {nodes.filter(n=>!editNode||n.id!==editNode.id).map(n=><option key={n.id} value={n.id}>{n.name} — {n.role}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#71717B', textTransform:'uppercase', letterSpacing:'0.5px' }}>Color</label>
              <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                {PRESET_COLORS.map(c=>(
                  <button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))}
                    style={{ width:22, height:22, borderRadius:'50%', background:c, border:form.color===c?'3px solid #05133c':'2px solid white', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', flexShrink:0 }}/>
                ))}
                <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{ width:26, height:26, borderRadius:4, border:'1px solid #e2e8f0', cursor:'pointer', padding:1 }}/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ height:36, alignSelf:'flex-end' }}>{editNode ? 'Save' : 'Add'}</button>
          </form>
        </div>
      )}

      {/* Legend */}
      <div style={{ padding:'8px 28px', background:'white', borderBottom:'1px solid #e2e8f0',
        display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#71717B', textTransform:'uppercase', letterSpacing:'0.5px' }}>Levels:</span>
        {LEVEL_LABELS.map((l,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:9, height:9, borderRadius:'50%', background:LEVEL_COLORS[i] }}/>
            <span style={{ fontSize:11, color:'#71717B' }}>{l}</span>
          </div>
        ))}
        <span style={{ fontSize:11, color:'#14F1B1', marginLeft:'auto', fontWeight:600 }}>Click ⊙ to view a team only</span>
      </div>

      {/* Chart area — scrollable all directions */}
      <div style={{ flex:1, overflow:'auto', padding:'36px 40px', position:'relative' }}>
        {nodes.length === 0 ? (
          <div style={{ textAlign:'center', paddingTop:80 }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🏢</div>
            <h3 style={{ fontWeight:700, color:'#05133c', marginBottom:8 }}>No org chart yet</h3>
            {user.role==='admin' ? (
              <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                <button className="btn btn-outline" onClick={seed}>Seed Default Structure</button>
                <button className="btn btn-primary" onClick={()=>setShowForm(true)}>Add First Person</button>
              </div>
            ) : <p style={{ color:'#71717B' }}>The org chart will appear here once admin sets it up.</p>}
          </div>
        ) : (
          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', minWidth:'100%', paddingBottom:60 }}>
            {displayRoots.filter(Boolean).map(root => (
              <NodeCard key={root.id} node={root} depth={0}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
