import { clearedCookie } from "../lib/admin-auth.mjs";

export default async () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": clearedCookie() },
  });