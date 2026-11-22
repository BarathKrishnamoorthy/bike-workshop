import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [workshop, setWorkshop] = useState(() => {
    const saved = localStorage.getItem('workshop');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const res = await api.get('/profile');
          if (res.data.success) {
            const u = res.data.user || res.data.data?.user;
            const w = res.data.workshop || res.data.data?.workshop;
            setUser(u);
            setWorkshop(w);
            localStorage.setItem('user', JSON.stringify(u));
            if (w) localStorage.setItem('workshop', JSON.stringify(w));
          }
        } catch (err) {
          console.warn('Auth token expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      if (res.data.success) {
        const { token, user, workshop } = res.data;
        setToken(token);
        setUser(user);
        setWorkshop(workshop);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        if (workshop) localStorage.setItem('workshop', JSON.stringify(workshop));
        return { success: true, user, workshop };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/register', formData);
      if (res.data.success) {
        return {
          success: true,
          message: res.data.message || 'Workshop registered successfully!',
          user: res.data.user,
          workshop: res.data.workshop,
        };
      }
      return { success: false, message: 'Registration failed.' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please check the provided information.',
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/profile', profileData);
      if (res.data.success) {
        const updated = { ...user, ...res.data.data };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        return { success: true, message: 'Profile updated successfully' };
      }
      return { success: false, message: 'Failed to update profile' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile',
      };
    }
  };

  const updateWorkshop = async (workshopData) => {
    try {
      const res = await api.put('/workshop', workshopData);
      if (res.data.success) {
        const updated = { ...workshop, ...res.data.data };
        setWorkshop(updated);
        localStorage.setItem('workshop', JSON.stringify(updated));
        if (user && updated.workshop_name) {
          const updatedUser = { ...user, workshopName: updated.workshop_name };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return { success: true, message: 'Workshop updated successfully' };
      }
      return { success: false, message: 'Failed to update workshop' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update workshop',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setWorkshop(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('workshop');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workshop,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        updateProfile,
        updateWorkshop,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
