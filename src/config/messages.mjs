// Text of the WhatsApp confirmation message.
// Used by the "Send on WhatsApp" button in the admin panel.
export function confirmationText({ name, bookingId, programme, when, amount, utr, meetLink }) {
  return [
    `Namaste ${name || "there"}, your Visva Ved session is confirmed.`,
    ``,
    `Booking ID: ${bookingId || "-"}`,
    `Session: ${programme || "Consultation"}`,
    `Date & time: ${when || "-"} (India time)`,
    `Amount paid: ₹${amount ?? "-"}`,
    `Payment ref (UTR): ${utr || "Confirmed by Visva Ved"}`,
    ``,
    `Join on Google Meet: ${meetLink || "the link will follow by email"}`,
    ``,
    `See you soon!`,
  ].join("\n");
}
