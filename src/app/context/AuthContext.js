"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  login: async (data) => {},
  logout: async () => {},
  loading: true,
  updateUser: (userData) => {},
  isAuthenticated: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Safe localStorage wrapper
  const storage = {
    get: (key) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    set: (key, value) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    remove: (key) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  };

  const checkUser = () => {
    try {
      const storedUser = storage.get('user');
      const token = storage.get('token');
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (data) => {
    try {
      if (!data.user || !data.token) {
        throw new Error('Invalid login data');
      }

      storage.set('user', JSON.stringify(data.user));
      storage.set('token', data.token);
      
      setUser(data.user);
      setIsAuthenticated(true);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setUser(null);
      setIsAuthenticated(false);
      storage.remove('user');
      storage.remove('token');
      throw error;
    }
  };

  const logout = async () => {
    try {
      storage.remove('user');
      storage.remove('token');
      storage.remove('rememberedEmail');
      
      setUser(null);
      setIsAuthenticated(false);
      
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = (userData) => {
    try {
      if (!userData) {
        throw new Error('Invalid user data');
      }

      const currentUser = JSON.parse(storage.get('user') || '{}');
      const updatedUser = { ...currentUser, ...userData };
      storage.set('user', JSON.stringify(updatedUser));

      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = storage.get('token');
      if (token) {
        try {
          // Token verification logic here
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
    };

    if (typeof window !== 'undefined') {
      checkTokenExpiration();
      const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !loading && !isAuthenticated) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        router.push('/login');
      }
    }
  }, [loading, isAuthenticated, router]);

  const value = {
    user,
    login,
    logout,
    loading,
    updateUser,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}