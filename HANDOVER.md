# Visva Ved: handover checklist

Everything below uses the developer's test accounts during development.
Replace each item with the client's details before launch.

## 1. Business settings (src/config/booking.mjs)
- [ ] UPI_ID: client's business UPI ID (currently: developer's test UPI)
- [ ] PAYEE_NAME: name shown in UPI apps
- [ ] PRICES: real prices per programme (currently: test value)
- [ ] TIME_SLOTS, CLOSED_WEEKDAYS: client's real availability

## 2. Environment variables (Netlify → Site configuration → Environment variables)
Never put these in the code or on GitHub.
- [ ] PAYMENT_MODE = upi (later: phonepe)
- [ ] ALLOW_MOCK_PAYMENTS: must NOT exist on the live site
- [ ] ADMIN_PASSWORD: chosen by the client
- [ ] ADMIN_SECRET: a new random key for production
- [ ] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: from the client's Google Cloud project
- [ ] GOOGLE_REFRESH_TOKEN: generated while signed in as the client
- [ ] GOOGLE_CALENDAR_ID = primary (or the client's chosen calendar)
- [ ] WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_TEMPLATE: client's Meta account
- [ ] BREVO_API_KEY / EMAIL_FROM (optional): client's Brevo account and verified sender

## 3. Content
- [ ] Contact email in the footer
- [ ] Instagram / Facebook / YouTube links
- [ ] Logo (final, transparent background, ideally SVG)
- [ ] Testimonials: real, with permission
- [ ] FAQ answers approved by the client
- [ ] Statistics (500+, 3, 3 yrs) confirmed
- [ ] Photo licences confirmed
- [ ] Privacy Policy, Terms, Refund & Cancellation pages

## 4. Accounts and hosting
- [ ] Transfer the Netlify site to the client's Netlify team
- [ ] Connect the GoDaddy domain (A + CNAME records)
- [ ] HTTPS active
- [ ] Netlify plan chosen (Free or Personal)

## 5. Final tests on the live site
- [ ] Real ₹1 UPI payment → UTR → Accept
- [ ] Calendar event + Meet link created in the client's calendar
- [ ] Invite email received
- [ ] WhatsApp message received
- [ ] Newsletter signup works
- [ ] Mobile check on Android and iPhone