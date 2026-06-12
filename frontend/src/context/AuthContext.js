import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const API = '/api';

axios.interceptors.request.use(cfg => {
  const t = localStorage.getItem('ws_token');
  if (t) cfg.headers['Authorization'] = `Bearer ${t}`;
  return cfg;
}, err => Promise.reject(err));

axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 422) {
      const url = err.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('ws_token');
      }
    }
    return Promise.reject(err);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch departments for registration form (no auth needed conceptually, but use public endpoint)
    const fetchDepts = async () => {
      try {
        // Try with token first if available
        const token = localStorage.getItem('ws_token');
        if (token) {
          const r = await axios.get(`${API}/departments`);
          setDepartments(r.data.map(d => d.name));
        }
      } catch {}
    };

    const token = localStorage.getItem('ws_token');
    if (token) {
      axios.get(`${API}/auth/me`)
        .then(r => { setUser(r.data); fetchDepts(); })
        .catch(() => localStorage.removeItem('ws_token'))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const r = await axios.post(`${API}/auth/login`, { email, password });
    localStorage.setItem('ws_token', r.data.token);
    setUser(r.data.user);
    // Fetch departments after login
    try {
      const dr = await axios.get(`${API}/departments`);
      setDepartments(dr.data.map(d => d.name));
    } catch {}
    return r.data.user;
  };

  const register = async (data) => {
    const r = await axios.post(`${API}/auth/register`, data);
    localStorage.setItem('ws_token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => { localStorage.removeItem('ws_token'); setUser(null); };

  const updateProfile = async (data) => {
    const r = await axios.put(`${API}/auth/profile`, data);
    setUser(r.data); return r.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, API, departments }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
