// Launch gate: until LAUNCH_AT, every page shows the "Coming soon" page (with a countdown).
// From LAUNCH_AT on, the real website appears automatically, to the second.
//
// Settings (Netlify → Site configuration → Environment variables), then Trigger deploy:
//   LAUNCH_AT    = 2026-11-18T07:20:00+05:30   (India time; "+05:30" is required)
//                  Not set, or a time in the past = the website is simply open.
//   PREVIEW_CODE = any secret word
//                  Open https://<site>/?preview=<word> once to see the real site before
//                  launch (remembered for 7 days). /?preview=off ends it.
//
// Always reachable: /admin, the booking/admin functions, images, CSS, JS and fonts.
// The countdown page itself (/coming-soon/) reads LAUNCH_AT when the site is built.

const COOKIE = "vv_preview";

export default async (request, context) => {
  const launchAt = Date.parse(Netlify.env.get("LAUNCH_AT") ?? "");
  if (Number.isNaN(launchAt) || Date.now() >= launchAt) return;   // launched (or no gate): normal site

  const url = new URL(request.url);

  // Only page visits are gated: images, CSS, JS and fonts always load
  const wantsPage = (request.headers.get("accept") ?? "").includes("text/html");
  if (!wantsPage || /\.[a-z0-9]{2,5}$/i.test(url.pathname) || url.pathname.startsWith("/_")) return;

  // Secret preview link for the developer and the client
  const previewCode = Netlify.env.get("PREVIEW_CODE");
  const asked = url.searchParams.get("preview");
  if (previewCode && asked === previewCode) {
    context.cookies.set({ name: COOKIE, value: previewCode, path: "/", maxAge: 604800, secure: true, httpOnly: true, sameSite: "Lax" });
    return;
  }
  if (asked === "off") {
    context.cookies.delete({ name: COOKIE, path: "/" });
  } else if (previewCode && context.cookies.get(COOKIE) === previewCode) {
    return;
  }

  // Show the countdown page at this address (a rewrite: the address bar does not change)
  return new URL("/coming-soon/", request.url);
};

export const config = {
  path: "/*",
  excludedPath: ["/admin", "/admin/*", "/coming-soon", "/coming-soon/*", "/.netlify/*"],
};