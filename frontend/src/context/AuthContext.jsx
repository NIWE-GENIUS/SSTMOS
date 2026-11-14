// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { api, registerLogoutHandler } from '../lib/api';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const ROLE_HOME = {
  platform_admin: '/platform',
  dos: '/dos',
  head_teacher: '/ht',
  deputy_head_teacher: '/deputy',
  trainer: '/trainer',
  student: '/student',
};

export function homeForRole(roles = []) {
  for (const r of roles) if (ROLE_HOME[r]) return ROLE_HOME[r];
  return '/login';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  useEffect(() => {
    registerLogoutHandler(clearSession);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => clearSession())
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try { await api.post('/auth/logout', { refreshToken }); } catch { /* ignore */ }
    }
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}