import { store, slotKey, isBlocking, json } from "../lib/bookings.mjs";
import { slotsFor, serviceFor } from "../../src/config/booking.mjs";

// GET /.netlify/functions/availability?date=2026-09-28
// Answers: which service runs that day, its times, and which times are NOT available.
export default async (req) => {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Invalid date" }, 400);

  const slots = slotsFor(date);   // that weekday's timetable (empty on Sundays)
  const bookings = store();
  const saved = await Promise.all(
    slots.map((time) => bookings.get(slotKey(date, time), { type: "json" }))
  );

  const taken = slots.filter((time, i) => isBlocking(saved[i]));
  return json({ date, service: serviceFor(date), slots, taken });
};
