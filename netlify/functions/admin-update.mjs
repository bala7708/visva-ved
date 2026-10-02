import { store, json } from "../lib/bookings.mjs";
import { isAdmin } from "../lib/admin-auth.mjs";

// Confirm or cancel a booking from the admin panel
export default async (req) => {
  if (!isAdmin(req)) return json({ error: "Not logged in" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { key, action } = await req.json();
  if (typeof key !== "string" || !key.startsWith("slot_")) return json({ error: "Invalid booking" }, 400);
  if (action !== "confirm" && action !== "cancel") return json({ error: "Invalid action" }, 400);

  const bookings = store();
  const saved = await bookings.getWithMetadata(key, { type: "json" });
  if (!saved) return json({ error: "Booking not found" }, 404);

  const updated =
    action === "confirm"
      ? { ...saved.data, status: "confirmed", confirmedBy: "admin", confirmedAt: Date.now() }
      : { ...saved.data, status: "cancelled", cancelledAt: Date.now() };

  // Only save if nobody changed the booking in the meantime (e.g. a payment just arrived)
  const result = await bookings.setJSON(key, updated, { onlyIfMatch: saved.etag });
  if (!result?.modified) {
    return json({ error: "This booking just changed. Please refresh and try again." }, 409);
  }

  // Part 4: on "confirm", create the Google Calendar event and send the WhatsApp message here
  return json({ ok: true });
};