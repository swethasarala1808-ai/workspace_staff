import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPT_COLORS = { Deployment:'#3b82f6', Functional:'#8b5cf6', Marketing:'#ec4899', Research:'#10b981' };

const NAV = [
  { to:'/dashboard',  label:'Home',       icon:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { to:'/drive',      label:'Drive',      icon:'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
  { to:'/meetings',   label:'Meetings',   icon:'M15 10l4.553-2.277A1 1 0 0 1 21 8.624v6.752a1 1 0 0 1-1.447.899L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z' },
  { to:'/chat',       label:'Chat',       icon:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { to:'/email',      label:'Email',      icon:'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6' },
  { to:'/ideas',      label:'Ideas',      icon:'M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z M9 21h6 M10 17v4 M14 17v4' },
  { to:'/policies',   label:'Policies',   icon:'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { to:'/materials',  label:'Materials',  icon:'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
  { to:'/leads',      label:'Leads',      icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0' },
  { to:'/quicklinks', label:'Quick Access',icon:'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7' },
  { to:'/about',      label:'About Us',   icon:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
];

const ADMIN_NAV = [{ to:'/admin', label:'Admin', icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' }];

function NavIcon({ d }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {d.split(' M').map((p, i) => <path key={i} d={i === 0 ? p : 'M' + p} />)}
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if (!user || user.company === 'SERIA') return null;

  const deptColor = DEPT_COLORS[user.department] || '#14F1B1';
  const isActive = (to) => location.pathname === to;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/static/logo.svg" alt="Bizaxl" style={{height:30, filter:'brightness(0) invert(1)'}} />
        <div style={{marginTop:8, height:2, background:'linear-gradient(90deg, #14F1B1 0%, #114EFF 50%, #091526 100%)', borderRadius:2}}/>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <Link key={item.to} to={item.to} className={`nav-item${isActive(item.to) ? ' active' : ''}`}>
            <NavIcon d={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
        {user.role === 'admin' && (
          <>
            <div className="nav-section-label">Administration</div>
            {ADMIN_NAV.map(item => (
              <Link key={item.to} to={item.to} className={`nav-item${isActive(item.to) ? ' active' : ''}`}>
                <NavIcon d={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-chip">
          <div className="avatar" style={{background: deptColor, color: ['Research','Deployment'].includes(user.department)?'white':undefined}}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{user.name}</div>
            <div style={{fontSize:11, color:'rgba(255,255,255,0.4)'}}>{user.department || user.role}</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/'); }}
          style={{width:'100%', marginTop:8, padding:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'rgba(255,255,255,0.5)', fontSize:13, cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:500}}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
