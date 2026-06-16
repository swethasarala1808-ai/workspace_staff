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
import OrgChartPage  from './pages/OrgChartPage';
import Sidebar       from './components/Sidebar';

function PrivateRoute({ children, onlybizaxl }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{minHeight:'100vh'}}/>;
  if (!user) return <Navigate to="/" replace/>;
  if (onlybizaxl && user.company !== 'BIZAXL') return <Navigate to="/seria" replace/>;
  return children;
}

function bizaxlLayout({ children }) {
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
      <Route path="/dashboard"  element={<PrivateRoute onlybizaxl><bizaxlLayout><Dashboard/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/drive"      element={<PrivateRoute onlybizaxl><bizaxlLayout><DrivePage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/meetings"   element={<PrivateRoute onlybizaxl><bizaxlLayout><MeetingsPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/chat"       element={<PrivateRoute onlybizaxl><bizaxlLayout><ChatPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/email"      element={<PrivateRoute onlybizaxl><bizaxlLayout><EmailPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/ideas"      element={<PrivateRoute onlybizaxl><bizaxlLayout><IdeasPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/policies"   element={<PrivateRoute onlybizaxl><bizaxlLayout><PoliciesPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/materials"  element={<PrivateRoute><bizaxlLayout><MaterialsPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/leads"      element={<PrivateRoute><bizaxlLayout><LeadsPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/quicklinks" element={<PrivateRoute><bizaxlLayout><QuickLinksPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/orgchart"   element={<PrivateRoute><bizaxlLayout><OrgChartPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/about"      element={<PrivateRoute><bizaxlLayout><AboutPage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/profile"    element={<PrivateRoute><bizaxlLayout><ProfilePage/></bizaxlLayout></PrivateRoute>}/>
      <Route path="/admin"      element={<PrivateRoute><bizaxlLayout><AdminPage/></bizaxlLayout></PrivateRoute>}/>
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
