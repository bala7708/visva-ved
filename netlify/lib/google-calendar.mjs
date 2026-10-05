import { SESSION_MINUTES } from "../../src/config/booking.mjs";

const isConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);

// Exchanges the long-lasting refresh token for a short-lived access token
async function getAccessToken() {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Google sign-in failed: ${data.error_description ?? data.error}`);
  return data.access_token;
}

// "2026-10-03" + "10:00" + 45 → "2026-10-03T10:45:00"
function localDateTime(date, time, addMinutes = 0) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + addMinutes;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date}T${pad(Math.floor(total / 60))}:${pad(total % 60)}:00`;
}

/** Creates the event in the client's calendar, with a Google Meet link, and emails an invite to the customer. */
export async function createCalendarEvent(booking) {
  if (!isConfigured()) return { skipped: "Google Calendar is not set up yet" };

  const token = await getAccessToken();
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events` +
    `?conferenceDataVersion=1&sendUpdates=all`;

  const event = {
    summary: `${booking.programme} with Visva Ved`,
    description: [
      `Client: ${booking.name}`,
      `Email: ${booking.email}`,
      booking.whatsapp ? `WhatsApp: ${booking.whatsapp}` : null,
      `Booked via the Visva Ved website (order ${booking.orderId})`,
    ].filter(Boolean).join("\n"),
    start: { dateTime: localDateTime(booking.date, booking.time), timeZone: "Asia/Kolkata" },
    end: { dateTime: localDateTime(booking.date, booking.time, SESSION_MINUTES), timeZone: "Asia/Kolkata" },
    attendees: [{ email: booking.email, displayName: booking.name }],
    conferenceData: {
      createRequest: { requestId: booking.orderId, conferenceSolutionKey: { type: "hangoutsMeet" } },
    },
    reminders: { useDefault: true },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(event),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Google Calendar error: ${data.error?.message ?? response.status}`);

  return { eventId: data.id, meetLink: data.hangoutLink ?? null };
}