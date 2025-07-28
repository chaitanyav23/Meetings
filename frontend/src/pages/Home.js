import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Hide page and show loading while fetching user info
  if (user === null) {
    return <div>Loading user information...</div>;
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: '3rem auto',
        padding: 20,
        textAlign: 'center',
        background: '#fff',
        borderRadius: 8,
      }}
    >
      <h1>Welcome to Meetings App</h1>

      {user && (
        <>
          <img
            src={user.avatar_url || '/default-avatar.png'}
            alt="User avatar"
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              objectFit: 'cover',
              marginBottom: 20,
            }}
          />
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </>
      )}

      {/* Navigation buttons to other pages */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20 }}>
        {/* Using Link for better semantics and SPA navigation */}
        <Link to="/new-meeting" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '10px 20px',
              fontSize: 16,
              cursor: 'pointer',
              borderRadius: 5,
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
            }}
            aria-label="Create a new meeting"
          >
            Create New Meeting
          </button>
        </Link>

        <Link to="/notifications" style={{ textDecoration: 'none' }}>
          <button
            style={{
              padding: '10px 20px',
              fontSize: 16,
              cursor: 'pointer',
              borderRadius: 5,
              border: 'none',
              backgroundColor: '#28a745',
              color: 'white',
            }}
            aria-label="View notifications"
          >
            Notifications
          </button>
        </Link>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: 30,
          padding: '12px 25px',
          backgroundColor: '#d32f2f',
          border: 'none',
          borderRadius: 5,
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
        aria-label="Logout"
      >
        Logout
      </button>
    </div>
  );
};

export default Home;
