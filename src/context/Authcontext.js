import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const Authcontext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user when token exists
  const fetchMe = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      // Token invalid/expired – clear it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = (userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const updateUser = (updatedUserData) => {
    setUser(prev => ({ ...(prev || {}), ...updatedUserData }));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <Authcontext.Provider value={{ user, token, loading, login, updateUser, logout }}>
      {children}
    </Authcontext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Authcontext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
