import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

export async function createGoogleEvent(user, eventData) {
  try {
    // Initialize OAuth2 client with credentials from env
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set user's refresh token to allow access token refresh
    oauth2.setCredentials({ refresh_token: user.google_refresh_token });

    // Create calendar API client
    const calendar = google.calendar({ version: 'v3', auth: oauth2 });

    // Insert the event with conference data (Google Meet link)
    const res = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'none',
      requestBody: eventData,
    });

    // Return newly created Google event ID
    return res.data.id;

  } catch (error) {
    // Log the error - important for debugging
    console.error('Failed to create Google Calendar event:', error);

    // Rethrow the error to be handled in caller (controller/service)
    throw error;
  }
}
