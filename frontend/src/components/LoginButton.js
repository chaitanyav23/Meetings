import { useAuth } from '../contexts/AuthContext';

export default function LoginButton() {
  const { login, user, logout, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user.avatar_url && (
          <img 
            src={user.avatar_url} 
            alt="Profile" 
            width="32" 
            height="32" 
            style={{ borderRadius: '50%' }}
          />
        )}
        <span>Welcome, {user.name}!</span>
        <button onClick={logout} style={{ marginLeft: '10px' }}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={login} 
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        background: 'white',
        cursor: 'pointer'
      }}
    >
      <img 
        src="https://developers.google.com/identity/images/g-logo.png" 
        alt="Google" 
        width="20" 
        height="20" 
      />
      Sign in with Google
    </button>
  );
}
