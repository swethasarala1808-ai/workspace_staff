import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import IdeasPage from './pages/IdeasPage';
import PoliciesPage from './pages/PoliciesPage';
import MaterialsPage from './pages/MaterialsPage';
import EmailPage from './pages/EmailPage';
import ProfilePage from './pages/ProfilePage';
import SeriaPortal from './pages/SeriaPortal';
import AdminPage from './pages/AdminPage';
import Navbar from './components/Navbar';

function PrivateRoute({ children, onlyBizaxl }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{minHeight:'100vh'}}/>;
  if (!user) return <Navigate to="/" replace/>;
  if (onlyBizaxl && user.company!=='BIZAXL') return <Navigate to="/seria" replace/>;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{minHeight:'100vh'}}/>;

  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.company==='SERIA'?'/seria':'/dashboard'}/> : <AuthPage/>}/>
        <Route path="/seria" element={<PrivateRoute><SeriaPortal/></PrivateRoute>}/>
        <Route path="/dashboard" element={<PrivateRoute onlyBizaxl><Dashboard/></PrivateRoute>}/>
        <Route path="/chat" element={<PrivateRoute onlyBizaxl><ChatPage/></PrivateRoute>}/>
        <Route path="/email" element={<PrivateRoute onlyBizaxl><EmailPage/></PrivateRoute>}/>
        <Route path="/ideas" element={<PrivateRoute onlyBizaxl><IdeasPage/></PrivateRoute>}/>
        <Route path="/policies" element={<PrivateRoute onlyBizaxl><PoliciesPage/></PrivateRoute>}/>
        <Route path="/materials" element={<PrivateRoute><MaterialsPage/></PrivateRoute>}/>
        <Route path="/profile" element={<PrivateRoute><ProfilePage/></PrivateRoute>}/>
        <Route path="/admin" element={<PrivateRoute><AdminPage/></PrivateRoute>}/>
        <Route path="*" element={<Navigate to="/"/>}/>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider><AppRoutes/></AuthProvider>
    </BrowserRouter>
  );
}
