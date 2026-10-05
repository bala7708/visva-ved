import { store, json } from "../lib/bookings.mjs";
import { isAdmin } from "../lib/admin-auth.mjs";
import { onBookingConfirmed } from "../lib/on-confirmed.mjs";

// confirm · reject · cancel · notify (= retry calendar / email / WhatsApp)
export default async (req) => {
  if (!isAdmin(req)) return json({ error: "Not logged in" }, 401);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { key, action } = await req.json();
  if (typeof key !== "string" || !key.startsWith("slot_")) return json({ error: "Invalid booking" }, 400);
  if (!["confirm", "reject", "cancel", "notify"].includes(action)) return json({ error: "Invalid action" }, 400);

  // Retry the notifications for an already-confirmed booking
  if (action === "notify") {
    const result = await onBookingConfirmed(key);
    return json({ ok: true, ...result });
  }

  const bookings = store();
  const saved = await bookings.getWithMetadata(key, { type: "json" });
  if (!saved) return json({ error: "Booking not found" }, 404);

  const now = Date.now();
  const updated =
    action === "confirm"
      ? { ...saved.data, status: "confirmed", confirmedBy: "admin", confirmedAt: now }
      : action === "reject"
        ? { ...saved.data, status: "rejected", rejectedAt: now }
        : { ...saved.data, status: "cancelled", cancelledAt: now };

  const result = await bookings.setJSON(key, updated, { onlyIfMatch: saved.etag });
  if (!result?.modified) {
    return json({ error: "This booking just changed. Please refresh and try again." }, 409);
  }

  // Accepted → calendar + Meet link, email, WhatsApp
  if (action === "confirm") {
    const notify = await onBookingConfirmed(key);
    return json({ ok: true, ...notify });
  }
  return json({ ok: true });
};