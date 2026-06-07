import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import AuthPage      from './pages/AuthPage';
import Dashboard     from './pages/Dashboard';
import ChatPage      from './pages/ChatPage';
import IdeasPage     from './pages/IdeasPage';
import PoliciesPage  from './pages/PoliciesPage';
import MaterialsPage from './pages/MaterialsPage';
import EmailPage     from './pages/EmailPage';
import ProfilePage   from './pages/ProfilePage';
import SeriaPortal   from './pages/SeriaPortal';
import AdminPage     from './pages/AdminPage';
import DrivePage     from './pages/DrivePage';
import MeetingsPage  from './pages/MeetingsPage';
import LeadsPage     from './pages/LeadsPage';
import QuickLinksPage from './pages/QuickLinksPage';
import AboutPage     from './pages/AboutPage';
import Sidebar       from './components/Sidebar';

function PrivateRoute({ children, onlyBizaxl }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{minHeight:'100vh'}}/>;
  if (!user) return <Navigate to="/" replace/>;
  if (onlyBizaxl && user.company !== 'BIZAXL') return <Navigate to="/seria" replace/>;
  return children;
}

function BizaxlLayout({ children }) {
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
      <Route path="/seria" element={<PrivateRoute><SeriaPortal/></PrivateRoute>}/>

      {/* Bizaxl routes with sidebar */}
      <Route path="/dashboard"  element={<PrivateRoute onlyBizaxl><BizaxlLayout><Dashboard/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/drive"      element={<PrivateRoute onlyBizaxl><BizaxlLayout><DrivePage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/meetings"   element={<PrivateRoute onlyBizaxl><BizaxlLayout><MeetingsPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/chat"       element={<PrivateRoute onlyBizaxl><BizaxlLayout><ChatPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/email"      element={<PrivateRoute onlyBizaxl><BizaxlLayout><EmailPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/ideas"      element={<PrivateRoute onlyBizaxl><BizaxlLayout><IdeasPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/policies"   element={<PrivateRoute onlyBizaxl><BizaxlLayout><PoliciesPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/materials"  element={<PrivateRoute><BizaxlLayout><MaterialsPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/leads"      element={<PrivateRoute><BizaxlLayout><LeadsPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/quicklinks" element={<PrivateRoute><BizaxlLayout><QuickLinksPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/about"      element={<PrivateRoute><BizaxlLayout><AboutPage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/profile"    element={<PrivateRoute><BizaxlLayout><ProfilePage/></BizaxlLayout></PrivateRoute>}/>
      <Route path="/admin"      element={<PrivateRoute><BizaxlLayout><AdminPage/></BizaxlLayout></PrivateRoute>}/>
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
