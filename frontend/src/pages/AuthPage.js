import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Deployment','Functional','Marketing','Research'];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', company:'BIZAXL', department:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = mode==='login'
        ? await login(form.email, form.password)
        : await register(form);
      navigate(user.company==='SERIA' ? '/seria' : '/dashboard');
    } catch(err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh', background:'linear-gradient(135deg, #05133c 0%, #0a2060 60%, #05133c 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>

      {/* Decorative circles */}
      <div style={{position:'fixed',top:-100,right:-100,width:400,height:400,borderRadius:'50%',
        background:'rgba(20,241,177,0.04)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:-150,left:-100,width:500,height:500,borderRadius:'50%',
        background:'rgba(20,241,177,0.03)',pointerEvents:'none'}}/>

      <div style={{width:'100%', maxWidth:440, position:'relative'}}>
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{fontSize:48, marginBottom:12}}>🏢</div>
          <h1 style={{color:'#14f1b1', fontSize:30, fontWeight:800, fontFamily:'DM Sans, sans-serif',
            letterSpacing:'-0.5px'}}>WorkSpace Staff</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:14, marginTop:6}}>
            Internal collaboration platform
          </p>
        </div>

        <div style={{background:'white', borderRadius:18, padding:32, boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
          {/* Tabs */}
          <div style={{display:'flex', gap:6, marginBottom:28, background:'#f4f5f7', padding:4, borderRadius:12}}>
            {[['login','🔐 Sign In'],['register','✨ Register']].map(([m,label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{flex:1, padding:'10px', borderRadius:9, border:'none', cursor:'pointer',
                  fontWeight:700, fontSize:14, fontFamily:'DM Sans,sans-serif',
                  background: mode===m ? '#05133c' : 'transparent',
                  color: mode===m ? '#14f1b1' : '#6b7a99', transition:'all 0.2s'}}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode==='register' && (<>
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" placeholder="Your full name" value={form.name}
                  onChange={e=>set('name',e.target.value)} required/>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 9876543210" value={form.phone}
                  onChange={e=>set('phone',e.target.value)} required/>
              </div>
              <div className="form-group">
                <label className="label">Company</label>
                <select className="select" value={form.company} onChange={e=>set('company',e.target.value)}>
                  <option value="BIZAXL">BIZAXL — Full Workspace</option>
                  <option value="SERIA">SERIA — Materials Portal</option>
                </select>
              </div>
              {form.company==='BIZAXL' && (
                <div className="form-group">
                  <label className="label">Department</label>
                  <select className="select" value={form.department} onChange={e=>set('department',e.target.value)} required>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </>)}
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@bizaxl.com" value={form.email}
                onChange={e=>set('email',e.target.value)} required/>
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e=>set('password',e.target.value)} required/>
            </div>
            {error && <div style={{color:'#ef4444', fontSize:13, marginBottom:12, display:'flex', gap:6, alignItems:'center'}}>⚠️ {error}</div>}
            <button type="submit" disabled={loading}
              style={{width:'100%', padding:'13px', background:'#14f1b1', color:'#05133c',
                border:'none', borderRadius:10, fontWeight:800, fontSize:15, cursor:'pointer',
                fontFamily:'DM Sans,sans-serif', transition:'all 0.2s',
                boxShadow: loading?'none':'0 4px 16px rgba(20,241,177,0.35)'}}>
              {loading ? 'Please wait...' : (mode==='login' ? 'Sign In →' : 'Create Account →')}
            </button>
          </form>
        </div>

        <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:20}}>
          SERIA & BIZAXL Internal Platform
        </p>
      </div>
    </div>
  );
}
