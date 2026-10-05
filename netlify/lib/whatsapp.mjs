const isConfigured = () =>
  Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE);

/** Sends the approved "booking confirmed" template via the WhatsApp Cloud API (Meta). */
export async function sendWhatsAppConfirmation(booking, { when, meetLink }) {
  if (!booking.whatsappOptIn || !booking.whatsapp) return { skipped: null };   // customer chose not to: no warning
  if (!isConfigured()) return { skipped: "WhatsApp is not set up yet" };

  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const template = process.env.WHATSAPP_TEMPLATE;
  const to = booking.whatsapp.replace(/\D/g, "");

  const values = [booking.name, booking.programme, when, meetLink ?? "the link will follow by email"];

  const response = await fetch(
    `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
          // Meta's sample "hello_world" template has no variables; ours has four
          ...(template === "hello_world"
            ? {}
            : { components: [{ type: "body", parameters: values.map((text) => ({ type: "text", text })) }] }),
        },
      }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(`WhatsApp error: ${data.error?.message ?? response.status}`);
  return { messageId: data.messages?.[0]?.id };
}