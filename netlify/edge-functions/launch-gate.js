// Launch gate: until LAUNCH_AT, every page shows the "Coming soon" page (with a countdown).
// From LAUNCH_AT on, the real website appears automatically, to the second. No deploy needed.
//
// Settings (Netlify → Site configuration → Environment variables):
//   LAUNCH_AT    = 2026-11-25T10:00:00+05:30   (India time; "+05:30" is required)
//                  Not set, or a time in the past = the website is simply open.
//   PREVIEW_CODE = any secret word, e.g. lotus-preview-42
//                  Open https://<site>/?preview=lotus-preview-42 once to see the real
//                  site before launch (remembered for 7 days). /?preview=off ends it.
//
// Always reachable before launch: /admin, the booking/admin functions, images, CSS and JS.

const COOKIE = "vv_preview";

export default async (request, context) => {
  // The gate's own request for the template page: let it through
  if (request.headers.get("x-vv-gate") === "1") return context.next();

  const url = new URL(request.url);
  const isSoonPage = url.pathname.startsWith("/coming-soon");
  const launchAt = Date.parse(Netlify.env.get("LAUNCH_AT") ?? "");

  if (Number.isNaN(launchAt) || Date.now() >= launchAt) {
    // Launched (or no gate): the old "coming soon" address goes to the homepage
    return isSoonPage ? Response.redirect(new URL("/", url), 302) : context.next();
  }
  if (isSoonPage) return gatePage(url, launchAt);   // visited directly: still show the countdown

  // Only page visits are gated. Images, CSS, JS, fonts and icons always load,
  // including image addresses without a file ending (e.g. /_image?… while developing).
  const wantsPage = (request.headers.get("accept") ?? "").includes("text/html");
  if (!wantsPage || /\.[a-z0-9]{2,5}$/i.test(url.pathname) || url.pathname.startsWith("/_")) {
    return context.next();
  }

  // Secret preview link for the developer and the client
  const previewCode = Netlify.env.get("PREVIEW_CODE");
  const asked = url.searchParams.get("preview");
  if (previewCode && asked === previewCode) {
    const response = await context.next();
    response.headers.append("Set-Cookie", `${COOKIE}=${encodeURIComponent(previewCode)}; Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=Lax`);
    return response;
  }
  if (asked === "off") {
    const response = await gatePage(url, launchAt);
    response.headers.append("Set-Cookie", `${COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`);
    return response;
  }
  if (previewCode && context.cookies.get(COOKIE) === previewCode) return context.next();

  return gatePage(url, launchAt);
};

// The "Coming soon" page, with the launch time filled in
async function gatePage(url, launchAt) {
  const page = await fetch(new URL("/coming-soon/", url), { headers: { "x-vv-gate": "1" } });
  const html = (await page.text()).replace("__LAUNCH_AT__", new Date(launchAt).toISOString());
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",          // never keep the gate page after launch
      "X-Robots-Tag": "noindex",
    },
  });
}

export const config = {
  path: "/*",
  excludedPath: ["/admin", "/admin/*", "/.netlify/*"],
};