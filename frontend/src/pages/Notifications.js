import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import api from '../api/axios';

export default function Notifications() {
  const socket = useContext(SocketContext);
  const [items, setItems] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setItems(Array.isArray(res.data.notifications) ? res.data.notifications : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    socket.on('notification', (n) => {
      // Optionally deduplicate notifications here
      setItems(prev => [n, ...prev]);
    });

    return () => socket.off('notification');
  }, [socket]);

  const accept = async (inviteId) => {
    try {
      await api.post(`/invitations/${inviteId}/accept`);
      await fetchNotifications();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation.');
    }
  };

  return (
    <ul>
      {(Array.isArray(items) ? items : []).map(n => (
        <li key={n.inviteId || n.notificationId}>
          {n.message} - <em>{n.status}</em>
          {n.status === 'pending' && <button onClick={() => accept(n.inviteId)}>Accept</button>}
        </li>
      ))}
    </ul>
  );
}
