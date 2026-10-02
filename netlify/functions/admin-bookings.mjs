import { store, json } from "../lib/bookings.mjs";
import { isAdmin } from "../lib/admin-auth.mjs";

// Lists all bookings, for the admin panel only
export default async (req) => {
  if (!isAdmin(req)) return json({ error: "Not logged in" }, 401);

  const bookings = store();
  const { blobs } = await bookings.list({ prefix: "slot_" });
  const records = await Promise.all(blobs.map((b) => bookings.get(b.key, { type: "json" })));

  const now = Date.now();
  const list = records
    .map((b, i) => {
      if (!b) return null;
      // A hold that has run out is shown as "expired"
      let status = b.status;
      if (status === "held") status = now < b.expiresAt ? "pending" : "expired";

      // Only send what the panel needs: never the secret tokens
      return {
        key: blobs[i].key,
        date: b.date,
        time: b.time,
        name: b.name,
        email: b.email,
        whatsapp: b.whatsapp,
        programme: b.programme,
        amount: b.amount,
        orderId: b.orderId,
        status,
        confirmedBy: b.confirmedBy ?? null,
        createdAt: b.createdAt,
      };
    })
    .filter(Boolean)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

  return json({ bookings: list });
};