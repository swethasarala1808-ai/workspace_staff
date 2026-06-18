import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

const NAV = [
  { to:'/dashboard',  label:'Home',         icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { to:'/drive',      label:'Drive',        icon:'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z' },
  { to:'/meetings',   label:'Meetings',     icon:'M15 10l4.553-2.277A1 1 0 0121 8.624v6.752a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' },
  { to:'/chat',       label:'Chat',         icon:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { to:'/ideas',      label:'Ideas',        icon:'M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 01-1 1H9a1 1 0 01-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z' },
  { to:'/policies',   label:'Policies',     icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to:'/materials',  label:'Materials',    icon:'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z' },
  { to:'/leads',      label:'Leads',        icon:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z' },
  { to:'/quicklinks', label:'Quick Access', icon:'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9zM13 2v7h7' },
  { to:'/orgchart',   label:'Org Chart',    icon:'M12 2a3 3 0 100 6 3 3 0 000-6zM3 18a3 3 0 100-6 3 3 0 000 6zm18 0a3 3 0 100-6 3 3 0 000 6zm-9-6v-4M6 15.5l6-3.5m6 3.5l-6-3.5' },
  { to:'/about',      label:'About Us',     icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

function Icon({ d }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {d.split('M').filter(Boolean).map((p,i) => <path key={i} d={'M'+p}/>)}
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || user.company === 'SERIA') return null;

  const deptColor = DEPT_COLORS[user.department] || '#14F1B1';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/static/logo.svg" alt="bizaxl" style={{height:28, filter:'brightness(0) invert(1)'}}/>
        <div style={{marginTop:8, height:2, background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)', borderRadius:2}}/>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <Link key={item.to} to={item.to}
            className={`nav-item${location.pathname===item.to?' active':''}`}>
            <Icon d={item.icon}/>
            <span>{item.label}</span>
          </Link>
        ))}
        {user.role === 'admin' && (
          <>
            <div className="nav-section-label">Administration</div>
            <Link to="/admin" className={`nav-item${location.pathname==='/admin'?' active':''}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              <span>Admin</span>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar" style={{background:deptColor, color:['Research','Deployment'].includes(user.department)?'white':'var(--navy)'}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:11, color:'rgba(255,255,255,0.4)'}}>{user.department||user.role}</div>
          </div>
          <Link to="/profile" style={{color:'rgba(255,255,255,0.4)', display:'flex', alignItems:'center'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
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
