import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import ChatPage       from './pages/ChatPage';
import IdeasPage      from './pages/IdeasPage';
import PoliciesPage   from './pages/PoliciesPage';
import MaterialsPage  from './pages/MaterialsPage';
import ProfilePage    from './pages/ProfilePage';
import SeriaPortal    from './pages/SeriaPortal';
import AdminPage      from './pages/AdminPage';
import DrivePage      from './pages/DrivePage';
import MeetingsPage   from './pages/MeetingsPage';
import LeadsPage      from './pages/LeadsPage';
import QuickLinksPage from './pages/QuickLinksPage';
import AboutPage      from './pages/AboutPage';
import OrgChartPage   from './pages/OrgChartPage';
import Sidebar        from './components/Sidebar';

function PrivateRoute({ children, onlyBizaxl }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{minHeight:'100vh'}}/>;
  if (!user) return <Navigate to="/" replace/>;
  if (onlyBizaxl && user.company !== 'BIZAXL') return <Navigate to="/seria" replace/>;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar/>
      <div className="main-content">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{minHeight:'100vh'}}/>;
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.company==='SERIA'?'/seria':'/dashboard'}/> : <AuthPage/>}/>
      <Route path="/seria"      element={<PrivateRoute><SeriaPortal/></PrivateRoute>}/>
      <Route path="/dashboard"  element={<PrivateRoute onlyBizaxl><AppLayout><Dashboard/></AppLayout></PrivateRoute>}/>
      <Route path="/drive"      element={<PrivateRoute onlyBizaxl><AppLayout><DrivePage/></AppLayout></PrivateRoute>}/>
      <Route path="/meetings"   element={<PrivateRoute onlyBizaxl><AppLayout><MeetingsPage/></AppLayout></PrivateRoute>}/>
      <Route path="/chat"       element={<PrivateRoute onlyBizaxl><AppLayout><ChatPage/></AppLayout></PrivateRoute>}/>
      <Route path="/ideas"      element={<PrivateRoute onlyBizaxl><AppLayout><IdeasPage/></AppLayout></PrivateRoute>}/>
      <Route path="/policies"   element={<PrivateRoute onlyBizaxl><AppLayout><PoliciesPage/></AppLayout></PrivateRoute>}/>
      <Route path="/materials"  element={<PrivateRoute><AppLayout><MaterialsPage/></AppLayout></PrivateRoute>}/>
      <Route path="/leads"      element={<PrivateRoute><AppLayout><LeadsPage/></AppLayout></PrivateRoute>}/>
      <Route path="/quicklinks" element={<PrivateRoute><AppLayout><QuickLinksPage/></AppLayout></PrivateRoute>}/>
      <Route path="/orgchart"   element={<PrivateRoute><AppLayout><OrgChartPage/></AppLayout></PrivateRoute>}/>
      <Route path="/about"      element={<PrivateRoute><AppLayout><AboutPage/></AppLayout></PrivateRoute>}/>
      <Route path="/profile"    element={<PrivateRoute><AppLayout><ProfilePage/></AppLayout></PrivateRoute>}/>
      <Route path="/admin"      element={<PrivateRoute><AppLayout><AdminPage/></AppLayout></PrivateRoute>}/>
      <Route path="*"           element={<Navigate to="/"/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><AppRoutes/></AuthProvider>
    </BrowserRouter>
  );
}
