import { Router } from 'express';
import { pool } from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Protect all notification routes with authentication
router.use(authenticateToken);

// GET /api/notifications
// Returns last 50 notifications for the logged-in user (recipient)
router.get('/', async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Fetch notifications directly by recipient_id, join invitations for status if needed
    const result = await pool.query(
      `SELECT 
        n.id AS notification_id,
        n.invite_id,
        n.message,
        n.is_read,
        i.status
      FROM notifications n
      LEFT JOIN invitations i ON n.invite_id = i.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [userId]
    );

    const notifications = result.rows.map(row => ({
      notificationId: row.notification_id,
      inviteId: row.invite_id,
      message: row.message,
      isRead: row.is_read,
      status: row.status,
    }));

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

export default router;
