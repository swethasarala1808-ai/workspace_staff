import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDailyQuote } from '../data/quotes';
import axios from 'axios';

const quote = getDailyQuote();

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', company:'BIZAXL', department:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState([]);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch departments for registration dropdown
    axios.get('/api/public/departments').then(r => setDepts(r.data)).catch(() => {
      // fallback defaults
      setDepts([
        { name:'Deployment', color:'#3b82f6' },
        { name:'Functional', color:'#8b5cf6' },
        { name:'Marketing', color:'#ec4899' },
        { name:'Research', color:'#10b981' },
      ]);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const u = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      navigate(u.company === 'SERIA' ? '/seria' : '/dashboard');
    } catch(err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F4F4F5' }}>
      {/* Left — branding */}
      <div style={{ width:'44%', background:'var(--navy)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)' }}/>
        <div>
          <img src="/static/logo.svg" alt="bizaxl" style={{ height:32, filter:'brightness(0) invert(1)' }}/>
          <div style={{ marginTop:10, height:2, width:40, background:'#14F1B1', borderRadius:2 }}/>
        </div>
        <div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', color:'#14F1B1', marginBottom:14 }}>Today's Thought</div>
          <p style={{ fontSize:18, fontWeight:600, color:'white', lineHeight:1.7, fontStyle:'italic', marginBottom:12 }}>"{quote.text}"</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>— {quote.attr}</p>
        </div>
        <p style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>bizaxl Workspace · Internal Platform</p>
      </div>

      {/* Right — form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 40px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:'var(--navy)', marginBottom:4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p style={{ fontSize:14, color:'var(--gray-400)', marginBottom:28 }}>
            {mode === 'login' ? 'Sign in to your bizaxl workspace' : 'Join the bizaxl team workspace'}
          </p>

          {/* Toggle */}
          <div style={{ display:'flex', background:'var(--gray-100)', borderRadius:'var(--radius)', padding:4, marginBottom:28 }}>
            {[['login','Sign In'],['register','Register']].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{ flex:1, padding:'8px', borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer',
                  fontWeight:600, fontSize:14, fontFamily:'DM Sans,sans-serif', transition:'all 0.15s',
                  background:mode===m?'white':'transparent', color:mode===m?'var(--navy)':'var(--gray-400)',
                  boxShadow:mode===m?'var(--shadow)':'none' }}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (<>
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
                {form.company === 'BIZAXL' && (
                  <div className="form-group">
                    <label className="label">Department</label>
                    <select className="select" value={form.department} onChange={e=>set('department',e.target.value)} required>
                      <option value="">Select</option>
                      {depts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </>)}

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
              style={{ justifyContent:'center', marginTop:8 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
