import { store, slotKey, json } from "../lib/bookings.mjs";

// POST { date, time, token, utr }
// After paying, the visitor sends their 12-digit UPI transaction ID (UTR).
// The booking then waits for the client to check it in the admin panel.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const utr = String(body.utr ?? "").replace(/\s/g, "");
  if (!/^\d{12}$/.test(utr)) {
    return json({ error: "Please enter the 12-digit UPI transaction ID (UTR)." }, 400);
  }

  const bookings = store();
  const key = slotKey(String(body.date ?? ""), String(body.time ?? ""));
  const saved = await bookings.getWithMetadata(key, { type: "json" });
  const booking = saved?.data;

  // Only the visitor who made this hold (with its secret token) may submit
  if (!booking || booking.holdToken !== body.token) {
    return json({ error: "This booking could not be found. Please contact us on WhatsApp with your UTR." }, 404);
  }
  if (booking.status === "confirmed" || booking.status === "verifying") {
    return json({ status: booking.status });
  }
  if (booking.status !== "held") {
    return json({ error: "This booking can no longer be updated. Please contact us." }, 409);
  }

  const updated = { ...booking, status: "verifying", utr, utrSubmittedAt: Date.now() };
  const result = await bookings.setJSON(key, updated, { onlyIfMatch: saved.etag });
  if (!result?.modified) return json({ error: "Please try again." }, 409);

  return json({ status: "verifying" });
};