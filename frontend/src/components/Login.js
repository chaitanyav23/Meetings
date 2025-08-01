import React from 'react';
import '../styles/Login.css';

const Login = () => {
  const handleGoogleLogin = () => {
    const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
    window.location.href = `${baseUrl}/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome to Meetings App</h2>
        <p>Sign in with your Google account to get started.</p>
        <button
          onClick={handleGoogleLogin}
          className="google-login-btn"
          type="button"
          aria-label="Sign in with Google"
        >
          <img src="/google-icon.png" alt="Google icon" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
