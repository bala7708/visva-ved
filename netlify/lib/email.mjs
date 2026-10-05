const isConfigured = () => Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

// Visitor-typed text must never become code inside an email
const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Sends the branded "Your session is confirmed" email via Brevo. */
export async function sendConfirmationEmail(booking, { when, meetLink }) {
  if (!isConfigured()) return { skipped: "Email is not set up yet" };

  const name = escapeHtml(booking.name);
  const programme = escapeHtml(booking.programme);
  const safeWhen = escapeHtml(when);
  const safeLink = meetLink ? escapeHtml(meetLink) : null;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5efe2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe2;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background:#ffffff;border-top:4px solid #c9a84c;">
          <tr><td style="background:#1e2e20;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:13px;letter-spacing:4px;color:#c9a84c;">VISVA VED</p>
          </td></tr>

          <tr><td style="padding:36px 32px 8px;font-family:Georgia,serif;color:#1e2e20;">
            <h1 style="margin:0 0 16px;font-size:24px;font-weight:normal;">Your session is confirmed</h1>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Namaste ${name},</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
              Thank you for your payment. Your booking is confirmed, and we look forward to meeting you.
            </p>
          </td></tr>

          <tr><td style="padding:0 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="background:#faf6ee;border:1px solid #ece3cf;font-family:Arial,sans-serif;font-size:14px;color:#1e2e20;">
              <tr><td style="padding:16px 20px 6px;color:#8a8d7e;font-size:12px;letter-spacing:1px;">SESSION</td></tr>
              <tr><td style="padding:0 20px 12px;font-size:16px;">${programme}</td></tr>
              <tr><td style="padding:0 20px 6px;color:#8a8d7e;font-size:12px;letter-spacing:1px;">DATE &amp; TIME</td></tr>
              <tr><td style="padding:0 20px 12px;font-size:16px;">${safeWhen} (India time)</td></tr>
              <tr><td style="padding:0 20px 6px;color:#8a8d7e;font-size:12px;letter-spacing:1px;">WHERE</td></tr>
              <tr><td style="padding:0 20px 16px;font-size:16px;">Online, on Google Meet</td></tr>
            </table>
          </td></tr>

          <tr><td align="center" style="padding:28px 32px 8px;">
            ${
              safeLink
                ? `<a href="${safeLink}" style="display:inline-block;background:#e8a020;color:#ffffff;
                     font-family:Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:2px;
                     text-decoration:none;padding:14px 28px;">JOIN ON GOOGLE MEET</a>
                   <p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#8a8d7e;">
                     Or copy this link: ${safeLink}</p>`
                : `<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#1e2e20;">
                     Your Google Meet link will follow in a separate email shortly.</p>`
            }
          </td></tr>

          <tr><td style="padding:24px 32px 32px;font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1e2e20;">
            <p style="margin:0 0 12px;">You'll also receive a Google Calendar invitation, so the session appears in your calendar.</p>
            <p style="margin:0 0 12px;">Need to reschedule? Simply reply to this email.</p>
            <p style="margin:24px 0 0;">With warmth,<br />Visva Ved</p>
          </td></tr>

          <tr><td style="background:#1e2e20;padding:16px 32px;text-align:center;
                         font-family:Arial,sans-serif;font-size:11px;color:rgba(245,239,226,0.6);">
            Order ${escapeHtml(booking.orderId)}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `Namaste ${booking.name},`,
    ``,
    `Thank you for your payment. Your booking is confirmed.`,
    ``,
    `Session: ${booking.programme}`,
    `Date & time: ${when} (India time)`,
    `Where: Online, on Google Meet`,
    meetLink ? `Join here: ${meetLink}` : `Your Google Meet link will follow in a separate email shortly.`,
    ``,
    `You'll also receive a Google Calendar invitation.`,
    `Need to reschedule? Simply reply to this email.`,
    ``,
    `With warmth,`,
    `Visva Ved`,
    ``,
    `Order ${booking.orderId}`,
  ].join("\n");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Visva Ved", email: process.env.EMAIL_FROM },
      replyTo: { email: process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM },
      to: [{ email: booking.email, name: booking.name }],
      subject: `Your ${booking.programme} is confirmed: ${when}`,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(`Email error ${response.status}: ${details.message ?? "unknown problem"}`);
  }
  return { sent: true };
}