import { json } from "../lib/bookings.mjs";
import { isMockMode, mockMarkPaid } from "../lib/payments.mjs";

// TEST ONLY: pretends the customer paid.
// Refuses to work unless BOTH settings in .env allow it, so it can never run on the live site.
export default async (req) => {
  if (!isMockMode() || process.env.ALLOW_MOCK_PAYMENTS !== "true") {
    return json({ error: "Not found" }, 404);
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { orderId } = await req.json();
  if (typeof orderId !== "string" || !orderId.startsWith("VV-")) {
    return json({ error: "Invalid order" }, 400);
  }

  await mockMarkPaid(orderId);
  return json({ ok: true });
};