import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

const Icon = ({d}) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {d.split('||').map((p,i)=><path key={i} d={p}/>)}
  </svg>
);

const NAV = [
  { to:'/dashboard',  label:'Home',         icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z||M9 22V12h6v10' },
  { to:'/drive',      label:'Drive',         icon:'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
  { to:'/meetings',   label:'Meetings',      icon:'M15 10l4.553-2.277A1 1 0 0 1 21 8.624v6.752a1 1 0 0 1-1.447.899L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z' },
  { to:'/chat',       label:'Chat',          icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { to:'/email',      label:'Email',         icon:'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z||M22 6l-10 7L2 6' },
  { to:'/ideas',      label:'Ideas',         icon:'M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z||M9 21h6||M10 17v4||M14 17v4' },
  { to:'/policies',   label:'Policies',      icon:'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { to:'/materials',  label:'Materials',     icon:'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
  { to:'/leads',      label:'Leads',         icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2||M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z||M23 21v-2a4 4 0 0 0-3-3.87||M16 3.13a4 4 0 0 1 0 7.75' },
  { to:'/quicklinks', label:'Quick Access',  icon:'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z||M13 2v7h7' },
  { to:'/org',        label:'Team Structure',icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2||M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z||M23 21v-2a4 4 0 0 0-3-3.87||M16 3.13a4 4 0 0 1 0 7.75' },
  { to:'/about',      label:'About bizaxl',  icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

const ADMIN_NAV = [
  { to:'/admin', label:'Admin', icon:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z||M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user || user.company === 'SERIA') return null;
  const deptColor = DEPT_COLORS[user.department] || '#14F1B1';
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to+'/');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/static/logo.svg" alt="bizaxl" style={{height:28, filter:'brightness(0) invert(1)'}}/>
        <div style={{marginTop:8,height:2,background:'linear-gradient(90deg,#14F1B1,#114EFF,#091526)',borderRadius:2}}/>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(item=>(
          <Link key={item.to} to={item.to} className={`nav-item${isActive(item.to)?' active':''}`}>
            <Icon d={item.icon}/>
            <span>{item.label}</span>
          </Link>
        ))}
        {user.role==='admin' && (
          <>
            <div className="nav-section-label">Administration</div>
            {ADMIN_NAV.map(item=>(
              <Link key={item.to} to={item.to} className={`nav-item${isActive(item.to)?' active':''}`}>
                <Icon d={item.icon}/>
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User + signout */}
      <div className="sidebar-bottom">
        <Link to="/profile" style={{textDecoration:'none'}}>
          <div className="user-chip">
            <div className="avatar" style={{background:deptColor, color:['Research','Deployment'].includes(user.department)?'white':'var(--navy)'}}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>{user.department||user.role}</div>
            </div>
          </div>
        </Link>
        <button onClick={()=>{logout();navigate('/');}}
          style={{width:'100%',marginTop:8,padding:'8px',background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'rgba(255,255,255,0.5)',
            fontSize:13,cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:500}}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
