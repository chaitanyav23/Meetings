import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // <== confirm your actual filename here
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const { loginWithCredentials, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginWithCredentials(credentials.username, credentials.password);
    setLoading(false);
    if (result.success) {
      navigate('/home');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Sign In</h2>
        
        <button
          onClick={handleGoogleLogin}
          className="google-login-btn"
          type="button"
          aria-label="Sign in with Google"
        >
          <img src="/google-icon.png" alt="Google" />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message" role="alert">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
