// The payment layer. The rest of the system only uses the functions below.
//   "mock"    : test mode on your computer (fake QR + "Simulate payment" button)
//   "upi"     : a QR for the client's own UPI ID; payments are checked by hand (UTR)
//   "phonepe" : automatic confirmation (Part 3, later)
import { getStore } from "@netlify/blobs";
import { UPI_ID, PAYEE_NAME } from "../../src/config/booking.mjs";

const MODE = process.env.PAYMENT_MODE ?? "disabled";   // nothing set = payments OFF (safe default)

const mockStore = () => getStore({ name: "mock-payments", consistency: "strong" });

export const isMockMode = () => MODE === "mock";

/** Creates a payment for one booking. Returns the QR data and a link for UPI apps. */
export async function createPayment({ orderId, amount, note }) {
  if (MODE === "mock" || MODE === "upi") {
    const qrData =
      `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
      `&pn=${encodeURIComponent(PAYEE_NAME)}` +
      `&am=${amount.toFixed(2)}&cu=INR` +
      `&tn=${encodeURIComponent(note)}`;

    if (MODE === "mock") await mockStore().setJSON(orderId, { state: "PENDING" });
    return { qrData, intentUrl: qrData };
  }

  // Part 3: the real PhonePe code goes here
  throw new Error(`Payments are not available (mode: "${MODE}")`);
}

/** Has this payment been completed automatically? Returns "PENDING", "COMPLETED" or "FAILED". */
export async function getPaymentState(orderId) {
  if (MODE === "mock") {
    const record = await mockStore().get(orderId, { type: "json" });
    return record?.state ?? "PENDING";
  }

  // "upi": nothing can be checked automatically; the client verifies the UTR in the admin panel
  if (MODE === "upi") return "PENDING";

  // Part 3: ask PhonePe's Order Status API here
  throw new Error(`Payments are not available (mode: "${MODE}")`);
}

/** TEST ONLY: pretends the customer paid. */
export async function mockMarkPaid(orderId) {
  await mockStore().setJSON(orderId, { state: "COMPLETED" });
}