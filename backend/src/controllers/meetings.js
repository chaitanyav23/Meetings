import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createGoogleEvent } from '../services/google.js';
import { getIO } from '../sockets/io.js';

export async function createMeeting(req, res, next) {
  const client = await pool.connect();

  try {
    const hostId = req.user?.id;
    if (!hostId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { summary, description, start_ts, end_ts, inviteeEmails } = req.body;
    if (
      !summary ||
      !start_ts ||
      !end_ts ||
      !Array.isArray(inviteeEmails)
    ) {
      return res.status(400).json({ error: 'Missing required fields or invalid inviteeEmails' });
    }

    const emails = inviteeEmails
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      return res.status(400).json({
        error: 'At least one invitee email is required',
      });
    }

    // Validate emails format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `Invalid email format: ${email}` });
      }
    }

    // Start transaction
    await client.query('BEGIN');

    // Lookup registered users by email
    const emailPlaceholders = emails.map((_, idx) => `$${idx + 1}`).join(', ');
    const query = `SELECT id, email, name, google_refresh_token FROM users WHERE LOWER(email) IN (${emailPlaceholders})`;
    const usersResult = await client.query(query, emails.map(e => e.toLowerCase()));

    const foundEmails = usersResult.rows.map(u => u.email.toLowerCase());
    const notFoundEmails = emails.filter(e => !foundEmails.includes(e));
    const existingUsers = usersResult.rows;
    const inviteeIds = existingUsers.map(u => u.id);

    // Fetch fresh host user with google_refresh_token for Google Calendar API
    const hostResult = await client.query(
      'SELECT id, email, google_refresh_token FROM users WHERE id = $1',
      [hostId]
    );
    if (hostResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(401).json({ error: 'Host user not found' });
    }
    const host = hostResult.rows[0];

    // Prepare attendees list for Google Calendar event
    const attendees = emails.map(email => ({ email }));

    // Append signup link to description
    const baseSignUpUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup`;
    const descriptionWithSignup =
      (description || '') +
      `\n\nTo join and manage your meetings on OurApp, sign up here: ${baseSignUpUrl}`;

    // Google Calendar event data
    const eventData = {
      summary,
      description: descriptionWithSignup,
      start: { dateTime: new Date(start_ts).toISOString() },
      end: { dateTime: new Date(end_ts).toISOString() },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    // Create Google event first if host has refresh token
    let googleEventId = null;
    if (host.google_refresh_token) {
      try {
        googleEventId = await createGoogleEvent(host, eventData);
      } catch (googleError) {
        console.error('Google Calendar event creation failed:', googleError);
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Failed to create Google Calendar event' });
      }
    } else {
      console.warn(`Host user ${host.email} does not have a Google refresh token.`);
    }

    // Insert meeting record with googleEventId
    const meetingId = uuidv4();
    await client.query(
      `
      INSERT INTO meetings
      (id, host_id, summary, description, start_ts, end_ts, google_event_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        meetingId,
        hostId,
        summary,
        description || '',
        new Date(start_ts).toISOString(),
        new Date(end_ts).toISOString(),
        googleEventId,
      ]
    );

    // Insert invitations and notifications
    for (const inviteeId of inviteeIds) {
      const inviteIdResult = await client.query(
        `
        INSERT INTO invitations (id, meeting_id, invitee_id)
        VALUES (uuid_generate_v4(), $1, $2)
        RETURNING id
        `,
        [meetingId, inviteeId]
      );
      const inviteId = inviteIdResult.rows[0].id;

      await client.query(
        `
        INSERT INTO notifications (id, invite_id, recipient_id, message)
        VALUES (uuid_generate_v4(), $1, $2, $3)
        `,
        [inviteId, inviteeId, `You were invited to ${summary}`]
      );

      // Emit real-time notification
      getIO().to(`user:${inviteeId}`).emit('notification', {
        meetingId,
        summary,
        inviteeId,
      });
    }

    // Commit transaction
    await client.query('COMMIT');

    // Send response
    res.status(201).json({ meetingId, googleEventId, notRegisteredEmails: notFoundEmails });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Error during rollback:', rollbackErr);
    }
    console.error('Create meeting error:', err);
    next(err);
  } finally {
    client.release();
  }
}
