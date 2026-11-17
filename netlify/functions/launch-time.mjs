// GET /.netlify/functions/launch-time
// Tells the "Coming soon" page when the website opens (the LAUNCH_AT setting),
// so the countdown is always right, wherever and however the page is shown.
export default async () =>
  new Response(JSON.stringify({ launchAt: process.env.LAUNCH_AT ?? null }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
