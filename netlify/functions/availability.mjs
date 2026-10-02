import { store, slotKey, isBlocking, json } from "../lib/bookings.mjs";
import { TIME_SLOTS } from "../../src/config/booking.mjs";

// GET /.netlify/functions/availability?date=2026-09-28
// Answers: which times are NOT available on that day?
export default async (req) => {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Invalid date" }, 400);

  const bookings = store();
  const saved = await Promise.all(
    TIME_SLOTS.map((time) => bookings.get(slotKey(date, time), { type: "json" }))
  );

  const taken = TIME_SLOTS.filter((time, i) => isBlocking(saved[i]));
  return json({ date, taken });
};