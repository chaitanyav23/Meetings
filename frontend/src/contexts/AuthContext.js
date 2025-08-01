import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  // Memoize checkAuthStatus to satisfy useEffect dependencies and prevent stale closures
  const checkAuthStatus = useCallback(async (retryCount = 0) => {
    if (retryCount === 0) {
      dispatch({ type: 'LOGIN_START' });
    }

    try {
      const response = await axios.get('/auth/me');
      if (response.data?.user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: response.data.user } });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);

      // Retry logic for network errors
      if (retryCount < 2 && error.code === 'NETWORK_ERROR') {
        setTimeout(() => checkAuthStatus(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Run the auth check on mount and when checkAuthStatus changes (only once since memoized)
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Function to log out the user
  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    dispatch({ type: 'LOGOUT' });
  };

  // Function to clear any existing error from state
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Function to refresh authentication status manually
  const refreshAuth = () => {
    checkAuthStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        logout,
        clearError,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
