import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;
  const isSeria = user.company === 'SERIA';
  const deptColor = DEPT_COLORS[user.department] || '#14f1b1';
  const isMkt = user.department === 'Marketing' || user.role === 'marketing';

  const links = isSeria
    ? [{ to:'/seria', label:'Home', icon:'🏠' }]
    : [
        { to:'/dashboard', label:'Home', icon:'🏠' },
        { to:'/chat', label:'Chat', icon:'💬' },
        { to:'/email', label:'Email', icon:'📧' },
        { to:'/ideas', label:'Ideas', icon:'💡' },
        { to:'/policies', label:'Policies', icon:'📋' },
        { to:'/materials', label:'Materials', icon:'📁' },
        ...(user.role === 'admin' ? [{ to:'/admin', label:'Admin', icon:'⚙️' }] : []),
      ];

  const active = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span style={{fontSize:22}}>🏢</span>
        <span>WorkSpace <span style={{color:'white'}}>Staff</span></span>
      </div>

      <div style={{display:'flex', gap:2, alignItems:'center'}}>
        {links.map(l => (
          <Link key={l.to} to={l.to}
            className={`nav-link${active(l.to) ? ' active' : ''}`}>
            <span style={{fontSize:14}}>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>

      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <Link to="/profile" style={{display:'flex', alignItems:'center', gap:8, textDecoration:'none'}}>
          <div style={{width:34, height:34, borderRadius:'50%', background:deptColor,
            display:'flex', alignItems:'center', justifyContent:'center',
            color: user.department==='Research'||user.department==='Deployment'?'white':'#05133c',
            fontWeight:800, fontSize:14, border:'2px solid rgba(255,255,255,0.2)'}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span style={{color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500}}>
            {user.name.split(' ')[0]}
          </span>
        </Link>
        <button onClick={() => { logout(); navigate('/'); }}
          style={{background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)',
            color:'rgba(255,255,255,0.65)', padding:'7px 14px', borderRadius:8,
            cursor:'pointer', fontSize:13, fontFamily:'DM Sans, sans-serif', fontWeight:500}}>
          Logout
        </button>
      </div>
    </nav>
  );
}
