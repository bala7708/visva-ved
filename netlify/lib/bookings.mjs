import { getStore } from "@netlify/blobs";
import { TIME_SLOTS, CLOSED_WEEKDAYS, MIN_DAYS_AHEAD, MONTHS_SHOWN } from "../../src/config/booking.mjs";

// The storage "drawer" where all bookings are kept.
// "strong" consistency: a write is visible to the very next read (important for holds).
export const store = () => getStore({ name: "bookings", consistency: "strong" });

// One storage key per slot, e.g. "slot/2026-09-28/14:00"
// One storage key per slot, e.g. "slot_2026-10-03_0700"
// (only letters, numbers, "-" and "_", which are safe on every system, including Windows)
export const slotKey = (date, time) => `slot_${date}_${time.replace(":", "")}`;

// Today's date in India as "2026-09-28" (Netlify's servers run on UTC time)
export const indiaToday = () =>
  new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);

// Is this date + time a slot visitors are allowed to book?
export function isValidSlot(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !TIME_SLOTS.includes(time)) return false;

  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return false;
  const today = new Date(`${indiaToday()}T00:00:00Z`);

  const daysAhead = Math.round((day - today) / 86_400_000);
  if (daysAhead < MIN_DAYS_AHEAD) return false;
  if (CLOSED_WEEKDAYS.includes(day.getUTCDay())) return false;

  const monthsAhead =
    (day.getUTCFullYear() - today.getUTCFullYear()) * 12 + (day.getUTCMonth() - today.getUTCMonth());
  return monthsAhead < MONTHS_SHOWN;
}

// Is this saved booking still blocking its slot?
export function isBlocking(booking) {
  if (!booking) return false;
  if (booking.status === "confirmed" || booking.status === "verifying") return true;
  if (booking.status === "held") return Date.now() < booking.expiresAt;   // expired holds free the slot
  return false;                                                           // e.g. "cancelled"
}

// Sends a JSON answer back to the browser
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });