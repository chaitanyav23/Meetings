import express from 'express';
import { google } from 'googleapis';
import { pool } from '../../config/db.js';
import { getIO } from '../../sockets/io.js';

const router = express.Router();

// --- WEBHOOK SECURITY: Secret Validation Middleware ---
router.use((req, res, next) => {
  const incomingToken = req.query.token;
  const expectedToken = process.env.WEBHOOK_SECRET;
  if (!expectedToken) {
    console.error('WEBHOOK_SECRET env variable is not set!');
    return res.status(500).send('Webhook security not configured');
  }
  if (incomingToken !== expectedToken) {
    console.warn('Invalid webhook token attempt:', incomingToken);
    return res.status(403).send('Forbidden: Invalid webhook token');
  }
  next();
});

// Helper function to fetch event attendees and compare RSVP statuses
async function fetchGoogleEvent(hostRefreshToken, calendarEventId) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2.setCredentials({ refresh_token: hostRefreshToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2 });
  const res = await calendar.events.get({
    calendarId: 'primary',
    eventId: calendarEventId,
  });
  return res.data;
}

// Webhook endpoint for Google Calendar push notifications
router.post('/', async (req, res) => {
  // Google requires a 200 OK response quickly upon receiving a notification
  res.status(200).send('OK');

  try {
    // Payload contains resourceId and resourceUri indicating the changed calendar event
    const channelId = req.headers['x-goog-channel-id'];
    const resourceState = req.headers['x-goog-resource-state']; // e.g., "exists"
    const resourceId = req.headers['x-goog-resource-id'];
    const resourceUri = req.headers['x-goog-resource-uri'];

    if (!resourceUri) return; // no event info

    // Parse eventId from resourceUri
    // Example: resourceUri looks like https://www.googleapis.com/calendar/v3/calendars/primary/events/<event_id>
    const matches = resourceUri.match(/events\/([^\/\?]+)/);
    if (!matches || matches.length < 2) return;
    const eventId = matches[1];

    // Find meeting with this google_event_id
    const meetingRes = await pool.query(
      `SELECT id, host_id, google_event_id FROM meetings WHERE google_event_id = $1`,
      [eventId]
    );
    if (meetingRes.rows.length === 0) return;

    const meeting = meetingRes.rows[0];

    // Find host user to get their Google refresh token
    const userRes = await pool.query(
      `SELECT google_refresh_token FROM users WHERE id = $1`,
      [meeting.host_id]
    );
    if (userRes.rows.length === 0) return;
    const hostGoogleRefreshToken = userRes.rows[0].google_refresh_token;
    if (!hostGoogleRefreshToken) return;

    // Fetch updated Google event details
    const event = await fetchGoogleEvent(hostGoogleRefreshToken, eventId);
    if (!event || !event.attendees) return;

    // For each attendee, compare their RSVP status with DB invitation status
    for (const attendee of event.attendees) {
      const emailLower = attendee.email.toLowerCase();
      const responseStatus = attendee.responseStatus;

      // Find invitee in DB by email and meeting
      const inviteRes = await pool.query(
        `SELECT i.id, i.status, u.id AS user_id
         FROM invitations i
         LEFT JOIN users u ON i.invitee_id = u.id
         WHERE i.meeting_id = $1 AND LOWER(u.email) = $2`,
        [meeting.id, emailLower]
      );

      if (inviteRes.rows.length === 0) {
        // Unregistered attendee or not invited via app, skip for now
        continue;
      }

      const invite = inviteRes.rows[0];

      // If attendee accepted but DB status not updated, update it and notify
      if (responseStatus === 'accepted' && invite.status !== 'accepted') {
        await pool.query(
          'UPDATE invitations SET status = $1 WHERE id = $2',
          ['accepted', invite.id]
        );

        const io = getIO();
        // Notify invitee if registered (online)
        if (invite.user_id) {
          io.to(`user:${invite.user_id}`).emit('notification', {
            type: 'invite_status',
            inviteId: invite.id,
            action: 'accepted',
          });
        }

        // Notify host about acceptance
        io.to(`user:${meeting.host_id}`).emit('notification', {
          type: 'invite_status',
          inviteId: invite.id,
          action: 'accepted',
          inviteeEmail: attendee.email,
        });
      }
    }
  } catch (err) {
    console.error('Google Calendar webhook handler error:', err);
  }
});

export default router;
