import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    // Optionally, show loading or redirect if user info is missing
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="home-container" style={{ padding: '20px' }}>
      <header className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="user-info" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={user?.profilePicture || user?.avatar_url || '/default-avatar.png'}
            alt="Profile"
            className="user-avatar"
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: 15,
            }}
          />
          <div>
            <h3 style={{ margin: 0 }}>Welcome, {user?.name || user?.username}!</h3>
            {user?.username && <p style={{ margin: 0, color: '#555' }}>@{user.username}</p>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="logout-btn"
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          aria-label="Logout"
        >
          Logout
        </button>
      </header>

      <main className="home-main" style={{ marginTop: 30 }}>
        <div className="action-buttons" style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => navigate('/new-meeting')}
            className="action-btn primary"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '16px',
            }}
            aria-label="Create Meeting"
          >
            Create Meeting
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="action-btn secondary"
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '16px',
            }}
            aria-label="View Notifications"
          >
            Notifications
          </button>
        </div>
      </main>
    </div>
  );
};

export default Home;
