import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDailyQuote } from '../data/quotes';
import axios from 'axios';

const DEFAULT_DEPTS = ['Deployment','Functional','Marketing','Research'];
const quote = getDailyQuote();

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', company:'BIZAXL', department:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState(DEFAULT_DEPTS);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Fetch live departments from backend (no auth needed for signup)
  useEffect(() => {
    axios.get('/api/departments_public').then(r => {
      if (r.data?.length) setDepts(r.data.map(d=>d.name));
    }).catch(() => {
      // fallback to defaults silently
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const u = mode==='login'
        ? await login(form.email, form.password)
        : await register(form);
      navigate(u.company==='SERIA' ? '/seria' : '/dashboard');
    } catch(err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'#F4F4F5'}}>
      {/* Left — brand panel */}
      <div style={{width:'45%', background:'var(--navy)', display:'flex', flexDirection:'column',
        justifyContent:'space-between', padding:'48px', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)'}}/>
        <div style={{position:'absolute',bottom:-100,right:-80,width:300,height:300,borderRadius:'50%',background:'rgba(20,241,177,0.04)'}}/>

        {/* Logo */}
        <div>
          <img src="/static/logo.svg" alt="bizaxl" style={{height:32, filter:'brightness(0) invert(1)'}}/>
          <div style={{marginTop:10,height:2,width:40,background:'var(--mint)',borderRadius:2}}/>
        </div>

        {/* Quote */}
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',color:'var(--mint)',marginBottom:14}}>
            Today's Thought
          </div>
          <p style={{fontSize:18,fontWeight:600,color:'white',lineHeight:1.6,fontStyle:'italic',marginBottom:12}}>
            "{quote.text}"
          </p>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.5px'}}>
            — {quote.attr}
          </p>
        </div>

        {/* Footer */}
        <div>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.25)'}}>bizaxl Workspace · Internal Platform</p>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.15)',marginTop:3}}>Building confidence, dignity and growth.</p>
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px'}}>
        <div style={{width:'100%',maxWidth:420}}>
          <h1 style={{fontSize:26,fontWeight:700,color:'var(--navy)',marginBottom:4}}>
            {mode==='login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{fontSize:14,color:'var(--gray-400)',marginBottom:28}}>
            {mode==='login' ? 'Sign in to your bizaxl workspace' : 'Join the bizaxl team workspace'}
          </p>

          {/* Toggle */}
          <div style={{display:'flex',gap:0,marginBottom:24,background:'var(--gray-100)',borderRadius:'var(--radius)',padding:4}}>
            {[['login','Sign In'],['register','Register']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError('');}}
                style={{flex:1,padding:'8px',borderRadius:'var(--radius-sm)',border:'none',cursor:'pointer',
                  fontWeight:600,fontSize:14,fontFamily:'DM Sans,sans-serif',transition:'all 0.15s',
                  background:mode===m?'white':'transparent',
                  color:mode===m?'var(--navy)':'var(--gray-400)',
                  boxShadow:mode===m?'var(--shadow)':'none'}}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode==='register' && (
              <>
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" placeholder="Your full name" value={form.name} onChange={e=>set('name',e.target.value)} required/>
                </div>
                <div className="form-group">
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+91 9876543210" value={form.phone} onChange={e=>set('phone',e.target.value)} required/>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Company</label>
                    <select className="select" value={form.company} onChange={e=>set('company',e.target.value)}>
                      <option value="BIZAXL">bizaxl</option>
                      <option value="SERIA">Seria</option>
                    </select>
                  </div>
                  {form.company==='BIZAXL' && (
                    <div className="form-group">
                      <label className="label">Department</label>
                      <select className="select" value={form.department} onChange={e=>set('department',e.target.value)} required>
                        <option value="">Select</option>
                        {depts.map(d=><option key={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@bizaxl.com" value={form.email} onChange={e=>set('email',e.target.value)} required/>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} required/>
            </div>

            {error && <div className="alert alert-error" style={{padding:'10px 14px',fontSize:13}}>{error}</div>}

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}
              style={{justifyContent:'center',marginTop:8}}>
              {loading ? 'Please wait...' : mode==='login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
