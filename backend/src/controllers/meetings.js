import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createGoogleEvent } from '../services/google.js';
import { getIO } from '../sockets/io.js';

export async function createMeeting(req, res, next) {
  try {
    const hostId = req.user?.id;
    if (!hostId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { summary, description, start_ts, end_ts, inviteeEmails } = req.body;
    if (!summary || !start_ts || !end_ts || !Array.isArray(inviteeEmails)) {
      return res.status(400).json({ error: 'Missing required fields or invalid inviteeEmails' });
    }
    const emails = inviteeEmails.map(email => email.trim().toLowerCase()).filter(email => email.length > 0);

    if (emails.length === 0) {
      return res.status(400).json({ error: 'At least one invitee email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: `Invalid email format: ${email}` });
      }
    }

    // Query registered users in DB
    const usersResult = await pool.query(
      `SELECT id, email, name FROM users WHERE LOWER(email) = ANY($1)`,
      [emails]
    );
    const foundEmails = usersResult.rows.map(u => u.email.toLowerCase());
    const notFoundEmails = emails.filter(e => !foundEmails.includes(e));
    const existingUsers = usersResult.rows;
    const inviteeIds = existingUsers.map(u => u.id);

    // Create meeting record
    const meetingId = uuidv4();
    await pool.query(
      `INSERT INTO meetings(id, host_id, summary, description, start_ts, end_ts)
       VALUES($1, $2, $3, $4, $5, $6)`,
      [
        meetingId,
        hostId,
        summary,
        description || '',
        new Date(start_ts).toISOString(),
        new Date(end_ts).toISOString(),
      ]
    );

    const host = req.user;

    // Prepare full attendees list (all emails) for Google Calendar event
    const attendees = emails.map(email => ({ email }));

    // Append sign-up link to description
    const baseSignUpUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup`;
    const descriptionWithSignup = (description || '') + `\n\nTo join and manage your meetings on OurApp, sign up here: ${baseSignUpUrl}`;

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

    let googleEventId = null;
    try {
      if (host.google_refresh_token) {
        googleEventId = await createGoogleEvent(host, eventData);
        await pool.query('UPDATE meetings SET google_event_id = $1 WHERE id = $2', [googleEventId, meetingId]);
      } else {
        console.warn(`Host user ${host.email} does not have a Google refresh token.`);
      }
    } catch (googleError) {
      console.error('Google Calendar event creation failed:', googleError);
      // Don't fail the whole request if Google Calendar fails
    }

    // Create invitations and notifications only for registered invitees
    await Promise.all(
      inviteeIds.map(async inviteeId => {
        const inviteIdResult = await pool.query(
          `INSERT INTO invitations(id, meeting_id, invitee_id)
           VALUES(uuid_generate_v4(), $1, $2) RETURNING id`,
          [meetingId, inviteeId]
        );
        const inviteId = inviteIdResult.rows[0].id;

        await pool.query(
          `INSERT INTO notifications(id, invite_id, message)
           VALUES(uuid_generate_v4(), $1, $2)`,
          [inviteId, `You were invited to ${summary}`]
        );

        // Emit socket notification only to invitee (not organizer)
        getIO().to(`user:${inviteeId}`).emit('notification', { meetingId, summary, inviteeId });
      })
    );

    res.status(201).json({ meetingId, googleEventId, notRegisteredEmails: notFoundEmails });
  } catch (err) {
    console.error('Create meeting error:', err);
    next(err);
  }
}
