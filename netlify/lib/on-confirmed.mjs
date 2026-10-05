import { store } from "./bookings.mjs";
import { formatTime } from "../../src/config/booking.mjs";
import { createCalendarEvent } from "./google-calendar.mjs";
import { sendWhatsAppConfirmation } from "./whatsapp.mjs";
import { sendConfirmationEmail } from "./email.mjs";

// "2026-10-03" + "10:00" → "Saturday, 3 October 2026 at 10:00 AM"
const describeWhen = (date, time) =>
  `${new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  })} at ${formatTime(time)}`;

/**
 * Runs after a booking is confirmed: 1. calendar + Meet link, 2. email, 3. WhatsApp.
 * Safe to call again: it won't create a second calendar event.
 * Never throws: problems become warnings shown in the admin panel.
 */
export async function onBookingConfirmed(key) {
  const bookings = store();
  const booking = await bookings.get(key, { type: "json" });
  if (!booking || booking.status !== "confirmed") return { warnings: [] };
  if (booking.eventId) return { meetLink: booking.meetLink, warnings: [] };   // already done

  const warnings = [];
  const when = describeWhen(booking.date, booking.time);
  let meetLink = null;
  let eventId = null;

  // 1. Calendar first: the others need its Meet link
  try {
    const result = await createCalendarEvent(booking);
    if (result.skipped) warnings.push(result.skipped);
    else ({ meetLink, eventId } = result);
  } catch (error) {
    warnings.push(error.message);
  }

  // 2. Email
  try {
    const result = await sendConfirmationEmail(booking, { when, meetLink });
    if (result.skipped) warnings.push(result.skipped);
  } catch (error) {
    warnings.push(error.message);
  }

  // 3. WhatsApp
  try {
    const result = await sendWhatsAppConfirmation(booking, { when, meetLink });
    if (result.skipped) warnings.push(result.skipped);
  } catch (error) {
    warnings.push(error.message);
  }

  // Save the results (re-read first, so we don't overwrite other changes)
  const latest = await bookings.getWithMetadata(key, { type: "json" });
  if (latest) {
    await bookings.setJSON(
      key,
      { ...latest.data, meetLink, eventId, notifiedAt: Date.now(), notifyWarnings: warnings },
      { onlyIfMatch: latest.etag }
    );
  }

  return { meetLink, warnings };
}