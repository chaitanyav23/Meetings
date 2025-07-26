import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../contexts/SocketContext';
import api from '../api/axios';

export default function Notifications() {
  const socket = useContext(SocketContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/notifications').then((r) => {
      // Ensure r.data.notifications is an array before setting
      setItems(Array.isArray(r.data.notifications) ? r.data.notifications : []);
    });

    socket.on('notification', (n) => setItems((prev) => [n, ...prev]));

    return () => socket.off('notification');
  }, [socket]);

  const accept = async (inviteId) => {
    try {
      await api.post(`/invitations/${inviteId}/accept`);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      // Optionally add UI feedback here
    }
  };

  return (
    <ul>
      {(Array.isArray(items) ? items : []).map((n) => (
        <li key={n.inviteId}>
          {n.message}
          {n.status === 'pending' && <button onClick={() => accept(n.inviteId)}>Accept</button>}
        </li>
      ))}
    </ul>
  );
}
