import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import api from '../api/axios';

export default function Notifications() {
  const { socket, connected } = useSocket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/notifications');
      const notifications = Array.isArray(res.data.notifications) ? res.data.notifications : [];
      setItems(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    const handleNotification = (notification) => {
      try {
        console.log('Received notification:', notification);
        
        // Add new notification and deduplicate
        setItems(prev => {
          const exists = prev.some(item => 
            item.notificationId === notification.notificationId ||
            (item.inviteId === notification.inviteId && item.message === notification.message)
          );
          
          if (exists) return prev;
          
          return [notification, ...prev];
        });
      } catch (error) {
        console.error('Error handling notification:', error);
      }
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, connected]);

  const accept = async (inviteId) => {
    try {
      await api.post(`/invitations/${inviteId}/accept`);
      // Refresh notifications to get updated status
      await fetchNotifications();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading notifications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>{error}</div>
        <button 
          onClick={fetchNotifications}
          style={{ marginTop: '10px', padding: '8px 16px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Notifications</h1>
      
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        Socket Status: <span style={{ color: connected ? 'green' : 'red' }}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>
          No notifications yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {items.map((item, index) => (
            <div
              key={item.notificationId || `notification-${index}`}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: item.isRead ? '#f9f9f9' : '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: '10px', fontWeight: '500' }}>
                {item.message}
              </div>
              
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                Status: <span style={{ 
                  color: item.status === 'accepted' ? 'green' : 
                        item.status === 'declined' ? 'red' : '#ff9800'
                }}>
                  {item.status || 'pending'}
                </span>
              </div>

              {item.status === 'pending' && item.inviteId && (
                <button
                  onClick={() => accept(item.inviteId)}
                  style={{
                    backgroundColor: '#4285f4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Accept Invitation
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={fetchNotifications}
          style={{
            backgroundColor: '#f1f3f4',
            color: '#3c4043',
            padding: '8px 16px',
            border: '1px solid #dadce0',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Notifications
        </button>
      </div>
    </div>
  );
}
