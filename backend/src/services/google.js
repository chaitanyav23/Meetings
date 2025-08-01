import dotenv from 'dotenv';
dotenv.config(); // Ensure env vars loaded first

import { google } from 'googleapis';

// --- Validate Google API env vars ---
function assertGoogleEnv() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error('Missing required Google API environment variables.');
  }
}
function assertUserRefreshToken(user) {
  if (!user || !user.google_refresh_token) {
    throw new Error('User is missing a google_refresh_token');
  }
}

// --- Create OAuth2 client for user ---
function getOAuth2Client(user) {
  assertGoogleEnv();
  assertUserRefreshToken(user);

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2.setCredentials({ refresh_token: user.google_refresh_token });
  return oauth2;
}

// --- Register Google Calendar push notification webhook ---
export async function watchCalendarEvents(user, channelId, webhookUrl) {
  if (!channelId || !webhookUrl) throw new Error('Missing channelId or webhookUrl');
  const oauth2 = getOAuth2Client(user);
  const calendar = google.calendar({ version: 'v3', auth: oauth2 });

  try {
    const res = await calendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
      },
    });
    return res.data;
  } catch (error) {
    console.error(`Failed to start Google Calendar watch (user: ${user?.id || 'unknown'})`, error?.response?.data || error);
    throw error;
  }
}

export async function createGoogleEvent(user, eventData) {
  if (!eventData) throw new Error('eventData is required');
  const oauth2 = getOAuth2Client(user);
  const calendar = google.calendar({ version: 'v3', auth: oauth2 });

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1, // Enables Google Meet link
      sendUpdates: 'all',       // Change from 'none' to 'all' to notify attendees
      requestBody: eventData,
    });
    return res.data.id;
  } catch (error) {
    console.error(`Failed to create Google Calendar event (user: ${user?.id || 'unknown'})`, error?.response?.data || error);
    throw error;
  }
}
