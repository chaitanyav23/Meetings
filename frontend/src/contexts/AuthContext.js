import React, { createContext, useContext, useReducer, useEffect } from 'react';
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
        token: action.payload.token || null,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        tempUserData: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_TEMP_USER':
      return { ...state, tempUserData: action.payload };
    case 'CLEAR_TEMP_USER':
      return { ...state, tempUserData: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
    tempUserData: null,
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.get('/auth/me');
      if (response.data?.user) {
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: response.data.user, token: null },
        });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const loginWithCredentials = async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post('/auth/login', { username, password });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const setupAccount = async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await axios.post('/auth/setup-account', { username, password });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data,
      });
      dispatch({ type: 'CLEAR_TEMP_USER' });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Account setup failed';
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const getTempUserData = async () => {
    try {
      const response = await axios.get('/auth/temp-user');
      dispatch({ type: 'SET_TEMP_USER', payload: response.data });
      return response.data;
    } catch (error) {
      console.error('Failed to get temp user data:', error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithCredentials,
        setupAccount,
        getTempUserData,
        logout,
        clearError,
        checkAuthStatus,
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
