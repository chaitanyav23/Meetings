import { Router } from 'express';
import { pool } from '../config/db.js';
import { getIO } from '../sockets/io.js';
import { google } from 'googleapis';

const router = Router();

// Accept invitation endpoint
router.post('/:inviteId/accept', async (req, res) => {
  const userId = req.user?.id;
  const { inviteId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Fetch invitation info with meeting and user Google token
    const inviteResult = await pool.query(
      `SELECT i.*, m.google_event_id, u.google_refresh_token AS invitee_refresh_token,
              u.email AS invitee_email
       FROM invitations i
       JOIN meetings m ON i.meeting_id = m.id
       JOIN users u ON i.invitee_id = u.id
       WHERE i.id = $1`,
      [inviteId]
    );

    if (inviteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invite = inviteResult.rows[0];

    if (invite.invitee_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to accept this invitation' });
    }

    // Update invitation status to accepted
    await pool.query(
      `UPDATE invitations SET status = 'accepted' WHERE id = $1`,
      [inviteId]
    );

    // Update Google Calendar attendee status if token available
    if (invite.google_event_id && invite.invitee_refresh_token) {
      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      oauth2.setCredentials({ refresh_token: invite.invitee_refresh_token });
      const calendar = google.calendar({ version: 'v3', auth: oauth2 });

      const eventRes = await calendar.events.get({
        calendarId: 'primary',
        eventId: invite.google_event_id,
      });

      const event = eventRes.data;

      if (event.attendees) {
        event.attendees = event.attendees.map(att => {
          if (att.email.toLowerCase() === invite.invitee_email.toLowerCase()) {
            return { ...att, responseStatus: 'accepted' };
          }
          return att;
        });
      }

      await calendar.events.patch({
        calendarId: 'primary',
        eventId: invite.google_event_id,
        requestBody: { attendees: event.attendees },
        sendUpdates: 'all',
      });
    }

    // Emit socket notification to invitee
    const io = getIO();
    io.to(`user:${userId}`).emit('notification', { type: 'invite_status', inviteId, action: 'accepted' });

    // Notify meeting host of acceptance
    const meetingRes = await pool.query(`SELECT host_id FROM meetings WHERE id = $1`, [invite.meeting_id]);
    if (meetingRes.rows.length > 0) {
      const hostId = meetingRes.rows[0].host_id;
      io.to(`user:${hostId}`).emit('notification', { type: 'invite_status', inviteId, action: 'accepted', inviteeId: userId });
    }

    res.json({ success: true, message: 'Invitation accepted and Google Calendar updated' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

export default router;
