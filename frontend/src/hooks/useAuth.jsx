import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, dashboardAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await userAPI.getProfile();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  const register = async (email, username, password) => {
    const response = await authAPI.register({ email, username, password });
    // Auto-login after registration
    const loginResponse = await authAPI.login({ email, password });
    const token = loginResponse.data.access_token;
    localStorage.setItem('token', token);
    
    // Small delay to ensure token is set in interceptor
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userResponse = await userAPI.getProfile();
    setUser(userResponse.data);
    setIsAuthenticated(true);
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    
    // Small delay to ensure token is set in interceptor
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const userResponse = await userAPI.getProfile();
    setUser(userResponse.data);
    setIsAuthenticated(true);
    
    // Always redirect to dashboard
    return '/dashboard';
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      register,
      login, 
      logout,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};