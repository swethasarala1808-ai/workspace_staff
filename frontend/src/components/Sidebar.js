import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

const NAV = [
  { to:'/dashboard',  label:'Home' },
  { to:'/drive',      label:'Drive' },
  { to:'/meetings',   label:'Meetings' },
  { to:'/chat',       label:'Chat' },
  { to:'/email',      label:'Email' },
  { to:'/ideas',      label:'Ideas' },
  { to:'/policies',   label:'Policies' },
  { to:'/materials',  label:'Materials' },
  { to:'/leads',      label:'Leads' },
  { to:'/quicklinks', label:'Quick Access' },
  { to:'/orgchart',   label:'Org Chart' },
  { to:'/about',      label:'About Us' },
];
const ADMIN_NAV = [{ to:'/admin', label:'Admin' }];

// Simple SVG icons
const ICONS = {
  '/dashboard':  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  '/drive':      'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
  '/meetings':   'M15 10l4.553-2.277A1 1 0 0121 8.624v6.752a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  '/chat':       'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  '/email':      'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 0l10 7L4 4',
  '/ideas':      'M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z',
  '/policies':   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  '/materials':  'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z',
  '/leads':      'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zm13 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  '/quicklinks': 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7',
  '/orgchart':   'M12 2a3 3 0 100 6 3 3 0 000-6zM3 18a3 3 0 100-6 3 3 0 000 6zm18 0a3 3 0 100-6 3 3 0 000 6zm-9-6v-4M6 15.5l6-3.5m6 3.5l-6-3.5',
  '/about':      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  '/admin':      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

function Icon({ path }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {path.split('M').filter(Boolean).map((p,i) => (
        <path key={i} d={'M'+p}/>
      ))}
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user || user.company === 'SERIA') return null;

  const deptColor = DEPT_COLORS[user.department] || '#14F1B1';
  const active = (to) => location.pathname === to;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/static/logo.svg" alt="bizaxl" style={{height:28, filter:'brightness(0) invert(1)'}}/>
        <div style={{marginTop:8, height:2, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)', borderRadius:2}}/>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(item => (
          <Link key={item.to} to={item.to}
            className={`nav-item${active(item.to)?' active':''}`}>
            <Icon path={ICONS[item.to]||'M12 12h.01'}/>
            <span>{item.label}</span>
          </Link>
        ))}
        {user.role === 'admin' && (
          <>
            <div className="nav-section-label">Administration</div>
            {ADMIN_NAV.map(item => (
              <Link key={item.to} to={item.to}
                className={`nav-item${active(item.to)?' active':''}`}>
                <Icon path={ICONS[item.to]||'M12 12h.01'}/>
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User bottom */}
      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar" style={{background:deptColor, color:['Research','Deployment'].includes(user.department)?'white':'var(--navy)'}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:11, color:'rgba(255,255,255,0.4)'}}>{user.department||user.role}</div>
          </div>
          <Link to="/profile" title="Profile" style={{color:'rgba(255,255,255,0.4)',display:'flex',alignItems:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </Link>
        </div>
        <button onClick={() => { logout(); navigate('/'); }}
          style={{width:'100%', marginTop:8, padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500}}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
