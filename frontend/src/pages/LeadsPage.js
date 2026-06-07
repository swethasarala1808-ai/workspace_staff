import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SOURCES = ['Circle','LinkedIn','Instagram','Facebook','WhatsApp','Twitter','Referral','Other'];
const STATUSES = ['new','contacted','qualified','converted','lost'];
const STATUS_STYLE = {
  new:       { bg:'#eff6ff', color:'#1d4ed8', label:'New' },
  contacted: { bg:'#fefce8', color:'#92400e', label:'Contacted' },
  qualified: { bg:'#f0fdf4', color:'#166534', label:'Qualified' },
  converted: { bg:'rgba(20,241,177,0.1)', color:'#059669', label:'Converted' },
  lost:      { bg:'#fef2f2', color:'#991b1b', label:'Lost' },
};

export default function LeadsPage() {
  const { user, API } = useAuth();
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [msg, setMsg] = useState('');
  const isMarketing = user.department === 'Marketing' || user.role === 'admin';
  const [form, setForm] = useState({ title:'', source:'LinkedIn', platform:'', contact_name:'', contact_info:'', company:'', description:'' });

  const fetch = () => axios.get(`${API}/leads${filterStatus?`?status=${filterStatus}`:''}`).then(r=>setLeads(r.data)).catch(()=>{});
  useEffect(()=>{ fetch(); },[filterStatus]);

  const submit = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/leads`, form);
    setForm({ title:'', source:'LinkedIn', platform:'', contact_name:'', contact_info:'', company:'', description:'' });
    setShowForm(false); fetch(); setMsg('Lead submitted to Marketing ✓');
    setTimeout(()=>setMsg(''),3000);
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${API}/leads/${id}/status`, { status });
    fetch();
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    await axios.delete(`${API}/leads/${id}`);
    fetch();
  };

  return (
    <div className="page-container">
      <div className="flex-between page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Submit leads spotted in your network or social media</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ Submit Lead</button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {showForm && (
        <div className="card" style={{marginBottom:24, borderTop:'3px solid var(--mint)'}}>
          <h3 style={{fontWeight:700, marginBottom:20, fontSize:16}}>Submit a New Lead</h3>
          <form onSubmit={submit}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Lead Title / Business Name *</label>
                <input className="input" placeholder="e.g. Kumar Textiles - interested in BAS" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required/>
              </div>
              <div className="form-group">
                <label className="label">Source *</label>
                <select className="select" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
                  {SOURCES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Contact Name</label>
                <input className="input" placeholder="Person's name" value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="label">Contact Info (phone/email)</label>
                <input className="input" placeholder="+91 9876543210 or email" value={form.contact_info} onChange={e=>setForm(f=>({...f,contact_info:e.target.value}))}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Company</label>
                <input className="input" placeholder="Company or business name" value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="label">Platform / Post Link</label>
                <input className="input" placeholder="LinkedIn post URL or platform" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}/>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input textarea" rows={3} placeholder="What did you observe? Why is this a potential lead?" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button type="submit" className="btn btn-primary">Submit Lead</button>
              <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex', gap:8, marginBottom:20, flexWrap:'wrap'}}>
        <button onClick={()=>setFilterStatus('')}
          className={`btn btn-sm ${!filterStatus ? 'btn-secondary' : 'btn-outline'}`}>
          All ({leads.length})
        </button>
        {STATUSES.map(s=>(
          <button key={s} onClick={()=>setFilterStatus(filterStatus===s?'':s)}
            className={`btn btn-sm`}
            style={{background:filterStatus===s?STATUS_STYLE[s].color:'white', color:filterStatus===s?'white':STATUS_STYLE[s].color, border:`1px solid ${STATUS_STYLE[s].color}`}}>
            {STATUS_STYLE[s].label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        {leads.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No leads found</h3><p>Submit your first lead using the button above</p></div>
          : (
            <table className="table">
              <thead>
                <tr>
                  <th>Lead / Business</th>
                  <th>Source</th>
                  <th>Contact</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  {isMarketing && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leads.map(l=>{
                  const ss = STATUS_STYLE[l.status]||STATUS_STYLE.new;
                  return (
                    <tr key={l.id}>
                      <td>
                        <div style={{fontWeight:600}}>{l.title}</div>
                        {l.company && <div style={{fontSize:12, color:'var(--gray-400)'}}>{l.company}</div>}
                        {l.description && <div style={{fontSize:12, color:'var(--gray-400)', marginTop:2, maxWidth:280}}>{l.description.slice(0,80)}{l.description.length>80?'...':''}</div>}
                      </td>
                      <td>
                        <div style={{fontWeight:500}}>{l.source}</div>
                        {l.platform && <a href={l.platform} target="_blank" rel="noreferrer" style={{fontSize:12, color:'var(--blue)'}}>View post</a>}
                      </td>
                      <td>
                        <div style={{fontSize:13}}>{l.contact_name||'—'}</div>
                        <div style={{fontSize:12, color:'var(--gray-400)'}}>{l.contact_info||''}</div>
                      </td>
                      <td>
                        <div style={{fontSize:13}}>{l.submitted_by}</div>
                        <div style={{fontSize:12, color:'var(--gray-400)'}}>{l.submitted_dept}</div>
                        <div style={{fontSize:11, color:'var(--gray-400)'}}>{l.created_at}</div>
                      </td>
                      <td>
                        <span style={{background:ss.bg, color:ss.color, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600}}>
                          {ss.label}
                        </span>
                      </td>
                      {isMarketing && (
                        <td>
                          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                            <select className="select" style={{width:'auto', height:30, fontSize:12, padding:'4px 8px'}}
                              value={l.status} onChange={e=>updateStatus(l.id, e.target.value)}>
                              {STATUSES.map(s=><option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
                            </select>
                            <button className="btn btn-danger btn-sm" onClick={()=>deleteLead(l.id)}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
