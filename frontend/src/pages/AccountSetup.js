import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/AccountSetup.css';

const AccountSetup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);
  
  const { setupAccount, getTempUserData, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTempUserData = async () => {
      const data = await getTempUserData();
      if (data) {
        setTempUserData(data);
      } else {
        // If no temp data, redirect to login
        navigate('/login');
      }
    };
    fetchTempUserData();
  }, [getTempUserData, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (formData.username.length < 3) {
      alert('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);
    const result = await setupAccount(formData.username, formData.password);
    setLoading(false);

    if (result.success) {
      navigate('/home');
    }
  };

  if (!tempUserData) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="account-setup-container">
      <div className="account-setup-card">
        <div className="welcome-section">
          <img 
            src={tempUserData.profilePicture || '/default-avatar.png'} 
            alt="Profile" 
            className="profile-picture"
          />
          <h2>Welcome, {tempUserData.name}!</h2>
          <p>Please create your account credentials</p>
          <p className="email-display">{tempUserData.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="username">Choose a Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              minLength="3"
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Create a Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="setup-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSetup;
