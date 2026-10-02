import { randomUUID } from "node:crypto";
import { store, slotKey, isValidSlot, isBlocking, json } from "../lib/bookings.mjs";
import { HOLD_MINUTES, DEFAULT_PROGRAMME, priceFor } from "../../src/config/booking.mjs";
import { createPayment } from "../lib/payments.mjs";

const TAKEN = "Sorry, this slot was just taken. Please choose another time.";

// POST /.netlify/functions/hold-slot
// Holds a slot for 15 minutes AND creates the payment for it.
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  // Never trust data from the browser: clean it and check it
  const { date, time } = body;
  const name = String(body.name ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const whatsapp = String(body.whatsapp ?? "").trim().slice(0, 20);
  const programme = String(body.programme || DEFAULT_PROGRAMME).trim().slice(0, 100);

  if (!isValidSlot(date, time)) return json({ error: "This slot can't be booked." }, 400);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Please enter your name and a valid email." }, 400);
  }

  const bookings = store();
  const key = slotKey(date, time);

  const existing = await bookings.getWithMetadata(key, { type: "json" });
  if (existing && isBlocking(existing.data)) return json({ error: TAKEN }, 409);

  const orderId = `VV-${date.replaceAll("-", "")}-${time.replace(":", "")}-${randomUUID().slice(0, 8)}`;
  const amount = priceFor(programme);   // from OUR settings, never from the browser

  const booking = {
    date,
    time,
    name,
    email,
    whatsapp,
    whatsappOptIn: body.whatsappOptIn === true,
    programme,
    amount,
    orderId,
    status: "held",
    createdAt: Date.now(),
    expiresAt: Date.now() + HOLD_MINUTES * 60 * 1000,
    holdToken: randomUUID(),
    adminToken: randomUUID(),
  };

  // Save ONLY if nobody else grabbed the slot in the meantime
  const result = existing
    ? await bookings.setJSON(key, booking, { onlyIfMatch: existing.etag })
    : await bookings.setJSON(key, booking, { onlyIfNew: true });

  if (!result?.modified) return json({ error: TAKEN }, 409);

  // Create the payment. If that fails, release the slot again.
  let payment;
  try {
    payment = await createPayment({ orderId, amount, note: `Visva Ved ${programme} ${date} ${time}` });
  } catch (error) {
    console.error("Creating the payment failed:", error);
    await bookings.delete(key);
    return json({ error: "Payments are temporarily unavailable. Please try again later." }, 503);
  }

  return json({
    date,
    time,
    amount,
    expiresAt: booking.expiresAt,
    holdToken: booking.holdToken,
    orderId,
    qrData: payment.qrData,
    intentUrl: payment.intentUrl,
  });
};