import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TABS = ['Mission','What is bizaxl','Values','Principles','Promise','Team Note'];

function EditableText({ value, onSave, multiline, className, style }) {
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);
  if (!editing) return (
    <span
      style={{
        ...style,
        cursor:'text',
        borderBottom: hover ? '1px dashed rgba(20,241,177,0.6)' : '1px dashed transparent',
        transition:'border-color 0.15s',
      }}
      className={className}
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {value}
    </span>
  );
  return multiline
    ? <div>
        <textarea autoFocus style={{width:'100%',padding:'8px',borderRadius:8,border:'2px solid var(--mint)',fontSize:'inherit',fontFamily:'DM Sans,sans-serif',minHeight:80,lineHeight:1.7}} value={val} onChange={e=>setVal(e.target.value)}/>
        <div style={{display:'flex',gap:6,marginTop:6}}>
          <button onClick={()=>{onSave(val);setEditing(false);}} style={{background:'var(--mint)',border:'none',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontWeight:700,fontFamily:'DM Sans,sans-serif',fontSize:12}}>Save</button>
          <button onClick={()=>{setVal(value);setEditing(false);}} style={{background:'var(--gray-100)',border:'none',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:12}}>Cancel</button>
        </div>
      </div>
    : <div>
        <input autoFocus style={{width:'100%',padding:'6px 10px',borderRadius:8,border:'2px solid var(--mint)',fontSize:'inherit',fontFamily:'DM Sans,sans-serif'}} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onSave(val);setEditing(false);}if(e.key==='Escape'){setVal(value);setEditing(false);}}}/>
        <div style={{display:'flex',gap:6,marginTop:4}}>
          <button onClick={()=>{onSave(val);setEditing(false);}} style={{background:'var(--mint)',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontWeight:700,fontFamily:'DM Sans,sans-serif',fontSize:11}}>Save</button>
          <button onClick={()=>{setVal(value);setEditing(false);}} style={{background:'var(--gray-100)',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontSize:11}}>Cancel</button>
        </div>
      </div>;
}

export default function AboutPage() {
  const { user, API } = useAuth();
  const [tab, setTab] = useState('Mission');
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    axios.get(`${API}/about_content`).then(r => setContent(r.data)).catch(() => {});
  }, [API]);

  const save = async (patch) => {
    setSaving(true);
    try {
      const r = await axios.put(`${API}/about_content`, { ...content, ...patch });
      setContent(r.data);
      setMsg('Saved ✓'); setTimeout(() => setMsg(''), 2000);
    } catch { setMsg('Error saving'); }
    finally { setSaving(false); }
  };

  const updateMission = (key, val) => {
    const updated = { ...content, mission: { ...content.mission, [key]: val } };
    setContent(updated); save(updated);
  };

  const updateCompany = (key, val) => {
    const updated = { ...content, company: { ...content.company, [key]: val } };
    setContent(updated); save(updated);
  };

  const updateModule = (i, key, val) => {
    const modules = content.company.modules.map((m, idx) => idx === i ? { ...m, [key]: val } : m);
    updateCompany('modules', modules);
  };

  const updateDifferentiator = (i, key, val) => {
    const differentiators = content.company.differentiators.map((d, idx) => idx === i ? { ...d, [key]: val } : d);
    updateCompany('differentiators', differentiators);
  };

  const updateValue = (i, key, val) => {
    const values = content.values.map((v, idx) => idx === i ? { ...v, [key]: val } : v);
    const updated = { ...content, values };
    setContent(updated); save(updated);
  };

  const addValue = () => {
    const values = [...content.values, { icon:'⭐', title:'New Value', desc:'Description here' }];
    const updated = { ...content, values };
    setContent(updated); save(updated);
  };

  const removeValue = (i) => {
    const values = content.values.filter((_, idx) => idx !== i);
    const updated = { ...content, values };
    setContent(updated); save(updated);
  };

  const updatePrinciple = (i, key, val) => {
    const principles = content.principles.map((p, idx) => idx === i ? { ...p, [key]: val } : p);
    const updated = { ...content, principles };
    setContent(updated); save(updated);
  };

  const addPrinciple = () => {
    const principles = [...content.principles, { title:'New Principle', desc:'Description here' }];
    const updated = { ...content, principles };
    setContent(updated); save(updated);
  };

  const removePrinciple = (i) => {
    const principles = content.principles.filter((_, idx) => idx !== i);
    const updated = { ...content, principles };
    setContent(updated); save(updated);
  };

  const updatePromise = (i, val) => {
    const promise = content.promise.map((p, idx) => idx === i ? val : p);
    const updated = { ...content, promise };
    setContent(updated); save(updated);
  };

  const addPromise = () => {
    const promise = [...content.promise, 'New promise item'];
    const updated = { ...content, promise };
    setContent(updated); save(updated);
  };

  const removePromise = (i) => {
    const promise = content.promise.filter((_, idx) => idx !== i);
    const updated = { ...content, promise };
    setContent(updated); save(updated);
  };

  const updateTeamNote = (key, val) => {
    const team_note = { ...content.team_note, [key]: val };
    const updated = { ...content, team_note };
    setContent(updated); save(updated);
  };

  const updateCheck = (i, val) => {
    const checks = content.team_note.checks.map((c, idx) => idx === i ? val : c);
    updateTeamNote('checks', checks);
  };

  const reset = async () => {
    if (!window.confirm('Reset all About content to defaults?')) return;
    const r = await axios.post(`${API}/about_content/reset`);
    setContent(r.data); setMsg('Reset to defaults'); setTimeout(() => setMsg(''), 2000);
  };

  if (!content) return <div style={{padding:32}}><div className="spinner"/></div>;

  const editHint = isAdmin ? { cursor:'text', borderBottom:'1px dashed rgba(20,241,177,0.4)', display:'inline' } : {};

  return (
    <div style={{padding:'28px 40px', width:'100%', boxSizing:'border-box', minHeight:'100vh'}}>
      {/* Hero */}
      <div style={{background:'var(--navy)',borderRadius:16,padding:'44px 48px',marginBottom:24,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{position:'absolute',bottom:-80,right:-80,width:260,height:260,borderRadius:'50%',background:'rgba(20,241,177,0.04)'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <img src="/static/logo.svg" alt="bizaxl" style={{height:30,filter:'brightness(0) invert(1)'}}/>
          {isAdmin && (
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {msg && <span style={{fontSize:12,color:'var(--mint)',fontWeight:600}}>{msg}</span>}
              <button onClick={reset} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.6)',borderRadius:8,padding:'5px 12px',cursor:'pointer',fontSize:12,fontFamily:'DM Sans,sans-serif'}}>Reset Defaults</button>
              <span style={{fontSize:11,background:'rgba(20,241,177,0.1)',color:'var(--mint)',padding:'4px 10px',borderRadius:20,border:'1px solid rgba(20,241,177,0.2)'}}>Admin — click any text to edit</span>
            </div>
          )}
        </div>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--mint)',marginBottom:12}}>Our Mission</p>
        <h1 style={{fontSize:26,fontWeight:700,color:'white',lineHeight:1.5,marginBottom:12}}>
          {isAdmin
            ? <EditableText value={content.mission.headline} onSave={v=>updateMission('headline',v)} style={{color:'white',fontSize:24,fontWeight:700}} />
            : content.mission.headline}
          <br/>
          <span style={{color:'var(--mint)'}}>
            {isAdmin
              ? <EditableText value={content.mission.subheadline} onSave={v=>updateMission('subheadline',v)} style={{color:'var(--mint)',fontSize:24,fontWeight:700}}/>
              : content.mission.subheadline}
          </span>
        </h1>
        <div style={{color:'rgba(255,255,255,0.55)',fontSize:14,lineHeight:1.8,marginBottom:24,whiteSpace:'pre-wrap'}}>
          {isAdmin
            ? <EditableText value={content.mission.body} onSave={v=>updateMission('body',v)} multiline style={{color:'rgba(255,255,255,0.55)',fontSize:14}}/>
            : content.mission.body}
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {[['email','mailto:','markcom@bizaxl.com'],['phone','tel:+91','+91 98867 11156'],['website','https://','bizaxl.com']].map(([key,prefix,fallback])=>(
            <a key={key} href={`${prefix}${content.mission[key]||fallback}`} target="_blank" rel="noreferrer"
              style={{color:'var(--mint)',fontSize:13,fontWeight:600,textDecoration:'none',padding:'6px 14px',background:'rgba(20,241,177,0.08)',borderRadius:8,border:'1px solid rgba(20,241,177,0.2)'}}>
              {isAdmin
                ? <EditableText value={content.mission[key]||fallback} onSave={v=>updateMission(key,v)} style={{color:'var(--mint)'}}/>
                : (content.mission[key]||fallback)}
            </a>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom:24}}>
        {TABS.map(t=>(
          <button key={t} className={`tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>

      {/* MISSION */}
      {tab==='Mission' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:16}}>Who We Are</p>
            <div style={{fontSize:14,lineHeight:1.9,color:'var(--gray-400)',whiteSpace:'pre-wrap'}}>
              {isAdmin
                ? <EditableText value={content.mission.body} onSave={v=>updateMission('body',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.mission.body}
            </div>
          </div>
          <div className="grid-2">
            <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:24,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF)'}}/>
              <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--mint)',marginBottom:14}}>Guiding Principle</p>
              <h3 style={{fontSize:20,fontWeight:700,color:'white',lineHeight:1.5}}>Human First.<br/><span style={{color:'var(--mint)'}}>AI Second. Always.</span></h3>
              <p style={{color:'rgba(255,255,255,0.5)',fontSize:13,marginTop:10,lineHeight:1.7}}>AI removes repetitive work. Human judgment, care, and relationships will always remain at the center.</p>
            </div>
            <div className="card">
              <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:14}}>Contact</p>
              {['email','phone','website'].map(k=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--gray-400)',fontSize:14,textTransform:'capitalize'}}>{k}</span>
                  <span style={{fontWeight:600,fontSize:14}}>
                    {isAdmin
                      ? <EditableText value={content.mission[k]} onSave={v=>updateMission(k,v)} style={{fontWeight:600}}/>
                      : content.mission[k]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WHAT IS BIZAXL */}
      {tab==='What is bizaxl' && content.company && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:14}}>What Is bizaxl</p>
            <div style={{fontSize:14,lineHeight:1.9,color:'var(--gray-400)'}}>
              {isAdmin
                ? <EditableText value={content.company.what_is} onSave={v=>updateCompany('what_is',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.company.what_is}
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:14}}>Why bizaxl Exists</p>
            <div style={{fontSize:14,lineHeight:1.9,color:'var(--gray-400)'}}>
              {isAdmin
                ? <EditableText value={content.company.why_exists} onSave={v=>updateCompany('why_exists',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.company.why_exists}
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:16}}>The Six Modules</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
              {content.company.modules.map((m,i)=>(
                <div key={i} style={{background:'var(--gray-100)',borderRadius:'var(--radius)',padding:'14px 16px'}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:4,color:'var(--navy)'}}>
                    {isAdmin
                      ? <EditableText value={m.name} onSave={v=>updateModule(i,'name',v)} style={{fontWeight:700}}/>
                      : m.name}
                  </div>
                  <div style={{fontSize:13,color:'var(--gray-400)',lineHeight:1.6}}>
                    {isAdmin
                      ? <EditableText value={m.desc} onSave={v=>updateModule(i,'desc',v)} multiline style={{fontSize:13,color:'var(--gray-400)'}}/>
                      : m.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:14}}>Customer Journey</p>
            <div style={{fontSize:14,lineHeight:1.9,color:'var(--gray-400)'}}>
              {isAdmin
                ? <EditableText value={content.company.customer_journey} onSave={v=>updateCompany('customer_journey',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.company.customer_journey}
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:14}}>150+ Industries Served</p>
            <div style={{fontSize:14,lineHeight:1.9,color:'var(--gray-400)'}}>
              {isAdmin
                ? <EditableText value={content.company.industries} onSave={v=>updateCompany('industries',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.company.industries}
            </div>
          </div>

          <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:24,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF)'}}/>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--mint)',marginBottom:16}}>What Sets Us Apart</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:14}}>
              {content.company.differentiators.map((d,i)=>(
                <div key={i} style={{display:'flex',gap:12}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(20,241,177,0.15)',border:'1px solid rgba(20,241,177,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:'var(--mint)',fontWeight:800}}>{i+1}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:'white',marginBottom:2}}>
                      {isAdmin
                        ? <EditableText value={d.title} onSave={v=>updateDifferentiator(i,'title',v)} style={{color:'white',fontWeight:700}}/>
                        : d.title}
                    </div>
                    <div style={{fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>
                      {isAdmin
                        ? <EditableText value={d.desc} onSave={v=>updateDifferentiator(i,'desc',v)} multiline style={{fontSize:13,color:'rgba(255,255,255,0.55)'}}/>
                        : d.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase',color:'var(--gray-400)',marginBottom:14}}>The Company</p>
            <div style={{fontSize:14,lineHeight:1.9,color:'var(--gray-400)'}}>
              {isAdmin
                ? <EditableText value={content.company.company_info} onSave={v=>updateCompany('company_info',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.company.company_info}
            </div>
          </div>
        </div>
      )}

      {/* VALUES */}
      {tab==='Values' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(420px,1fr))', gap:12}}>
          {content.values.map((v,i)=>(
            <div key={i} className="card" style={{display:'flex',gap:16,alignItems:'flex-start'}}>
              <div style={{width:44,height:44,background:'var(--gray-100)',borderRadius:'var(--radius)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {isAdmin
                  ? <EditableText value={v.icon} onSave={val=>updateValue(i,'icon',val)} style={{fontSize:22,cursor:'text'}}/>
                  : <span style={{fontSize:22}}>{v.icon}</span>}
              </div>
              <div style={{flex:1}}>
                <h3 style={{fontWeight:700,fontSize:15,marginBottom:6}}>
                  {isAdmin
                    ? <EditableText value={v.title} onSave={val=>updateValue(i,'title',val)} style={{fontWeight:700,fontSize:15,...editHint}}/>
                    : v.title}
                </h3>
                <p style={{fontSize:14,color:'var(--gray-400)',lineHeight:1.8}}>
                  {isAdmin
                    ? <EditableText value={v.desc} onSave={val=>updateValue(i,'desc',val)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                    : v.desc}
                </p>
              </div>
              {isAdmin && (
                <button onClick={()=>removeValue(i)} style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#dc2626',fontSize:12,flexShrink:0,fontFamily:'DM Sans,sans-serif'}}>Remove</button>
              )}
            </div>
          ))}
          {isAdmin && (
            <button onClick={addValue} className="btn btn-outline" style={{alignSelf:'flex-start', gridColumn:'1/-1'}}>+ Add Value</button>
          )}
        </div>
      )}

      {/* PRINCIPLES */}
      {tab==='Principles' && (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {content.principles.map((p,i)=>(
            <div key={i} className="card">
              <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'rgba(20,241,177,0.12)',border:'1px solid rgba(20,241,177,0.3)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                  <span style={{fontSize:12,color:'var(--mint)',fontWeight:800}}>{i+1}</span>
                </div>
                <div style={{flex:1}}>
                  <h3 style={{fontWeight:700,fontSize:15,marginBottom:6}}>
                    {isAdmin
                      ? <EditableText value={p.title} onSave={val=>updatePrinciple(i,'title',val)} style={{fontWeight:700,...editHint}}/>
                      : p.title}
                  </h3>
                  <p style={{fontSize:14,color:'var(--gray-400)',lineHeight:1.8}}>
                    {isAdmin
                      ? <EditableText value={p.desc} onSave={val=>updatePrinciple(i,'desc',val)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                      : p.desc}
                  </p>
                </div>
                {isAdmin && <button onClick={()=>removePrinciple(i)} style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:6,padding:'4px 8px',cursor:'pointer',color:'#dc2626',fontSize:12,flexShrink:0,fontFamily:'DM Sans,sans-serif'}}>Remove</button>}
              </div>
            </div>
          ))}
          {isAdmin && <button onClick={addPrinciple} className="btn btn-outline" style={{alignSelf:'flex-start'}}>+ Add Principle</button>}
        </div>
      )}

      {/* PROMISE */}
      {tab==='Promise' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:'28px 32px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--mint)',marginBottom:14}}>Our Commitment</p>
            <h2 style={{fontSize:20,fontWeight:700,color:'white',marginBottom:20}}>The bizaxl Promise</h2>
            {content.promise.map((p,i)=>(
              <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 0',borderBottom:i<content.promise.length-1?'1px solid rgba(255,255,255,0.08)':'none'}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:'rgba(20,241,177,0.15)',border:'1px solid rgba(20,241,177,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'var(--mint)'}}/>
                </div>
                <div style={{flex:1,fontSize:14,color:'rgba(255,255,255,0.85)',lineHeight:1.6}}>
                  {isAdmin
                    ? <EditableText value={p} onSave={val=>updatePromise(i,val)} style={{color:'rgba(255,255,255,0.85)',fontSize:14}}/>
                    : p}
                </div>
                {isAdmin && <button onClick={()=>removePromise(i)} style={{background:'rgba(220,38,38,0.2)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:6,padding:'3px 8px',cursor:'pointer',color:'#fca5a5',fontSize:11,flexShrink:0,fontFamily:'DM Sans,sans-serif'}}>×</button>}
              </div>
            ))}
            {isAdmin && <button onClick={addPromise} style={{marginTop:14,background:'rgba(20,241,177,0.1)',border:'1px solid rgba(20,241,177,0.2)',color:'var(--mint)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:13,fontFamily:'DM Sans,sans-serif',fontWeight:600}}>+ Add Promise</button>}
          </div>
        </div>
      )}

      {/* TEAM NOTE */}
      {tab==='Team Note' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card" style={{borderLeft:'3px solid var(--mint)'}}>
            <h2 style={{fontWeight:700,fontSize:18,marginBottom:8}}>A Note to Every bizaxl Team Member</h2>
            <p style={{fontSize:14,color:'var(--gray-400)',lineHeight:1.8}}>
              {isAdmin
                ? <EditableText value={content.team_note.intro} onSave={v=>updateTeamNote('intro',v)} multiline style={{fontSize:14,color:'var(--gray-400)'}}/>
                : content.team_note.intro}
            </p>
          </div>
          <div style={{background:'var(--navy)',borderRadius:'var(--radius-lg)',padding:'28px 32px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--mint)',marginBottom:16}}>Before Every Message — Ask Yourself</p>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
              {content.team_note.checks.map((c,i)=>(
                <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'12px 16px',background:'rgba(255,255,255,0.05)',borderRadius:'var(--radius)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div style={{width:20,height:20,borderRadius:4,background:'rgba(20,241,177,0.2)',border:'1px solid rgba(20,241,177,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:11,color:'var(--mint)',fontWeight:800}}>✓</span>
                  </div>
                  <div style={{flex:1,fontSize:14,color:'rgba(255,255,255,0.85)'}}>
                    {isAdmin
                      ? <EditableText value={c} onSave={val=>updateCheck(i,val)} style={{color:'rgba(255,255,255,0.85)',fontSize:14}}/>
                      : c}
                  </div>
                </div>
              ))}
            </div>
            <div style={{borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:20}}>
              <p style={{fontSize:15,color:'white',lineHeight:1.8,marginBottom:6}}>
                {isAdmin
                  ? <EditableText value={content.team_note.closing} onSave={v=>updateTeamNote('closing',v)} style={{color:'white',fontSize:15}}/>
                  : content.team_note.closing}
              </p>
              <p style={{fontSize:18,fontWeight:700,color:'var(--mint)'}}>
                {isAdmin
                  ? <EditableText value={content.team_note.subtext} onSave={v=>updateTeamNote('subtext',v)} style={{color:'var(--mint)',fontSize:18,fontWeight:700}}/>
                  : content.team_note.subtext}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
