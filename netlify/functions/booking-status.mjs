import { store, slotKey, json } from "../lib/bookings.mjs";
import { getPaymentState } from "../lib/payments.mjs";

// GET /.netlify/functions/booking-status?date=…&time=…&token=…
// Answers: "pending", "verifying", "confirmed" or "expired".
export default async (req) => {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? "";
  const time = url.searchParams.get("time") ?? "";
  const token = url.searchParams.get("token") ?? "";

  const bookings = store();
  const key = slotKey(date, time);
  const saved = await bookings.getWithMetadata(key, { type: "json" });
  const booking = saved?.data;

  if (!booking || booking.holdToken !== token) {
    return json({ error: "Booking not found" }, 404);
  }

  if (booking.status === "confirmed") return json({ status: "confirmed" });
  if (booking.status === "verifying") return json({ status: "verifying" });

  if (booking.status === "held") {
    const state = await getPaymentState(booking.orderId);

    if (state === "COMPLETED") {
      const updated = { ...booking, status: "confirmed", paidAt: Date.now() };
      await bookings.setJSON(key, updated, { onlyIfMatch: saved.etag });
      return json({ status: "confirmed" });
    }

    if (Date.now() >= booking.expiresAt) return json({ status: "expired" });
    return json({ status: "pending", expiresAt: booking.expiresAt });
  }

  return json({ status: booking.status });
};