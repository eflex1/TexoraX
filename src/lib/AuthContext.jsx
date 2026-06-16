// src/lib/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const token = localStorage.getItem('texorax_token');
      
      if (!token) {
        throw new Error("No active session");
      }

      // Call our new service layer instead of Base44
      const userData = await authService.me();
      
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.log('No active user session');
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('texorax_token');
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  // Update this one function in AuthContext.jsx
  const login = async (email, password, role) => {
    const { token, user: userData } = await authService.login(email, password, role);
    localStorage.setItem('texorax_token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    authService.logout();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authChecked,
      login,
      logout,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);