import { json } from "../lib/bookings.mjs";
import { checkPassword, sessionCookie } from "../lib/admin-auth.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Every attempt waits a moment, which makes guessing thousands of passwords impractical
  await new Promise((resolve) => setTimeout(resolve, 600));

  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  if (!checkPassword(password)) {
    return json({ error: "Incorrect password" }, 401);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": sessionCookie() },
  });
};