import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "vv_admin";
const SESSION_HOURS = 8;

function secret() {
  const value = process.env.ADMIN_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SECRET is missing or too short");
  return value;
}

// A "signature": proves a value was created by us and hasn't been changed
const sign = (value) => createHmac("sha256", secret()).update(value).digest("hex");

// Compares two strings safely (always takes the same time, so it can't be guessed bit by bit)
function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Is this the correct admin password? */
export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (expected.length < 12) return false;          // refuse missing or weak passwords
  return safeEqual(sign(String(input)), sign(expected));
}

/** The cookie that keeps the admin logged in for 8 hours */
export function sessionCookie() {
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const value = `${expires}.${sign(expires)}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

/** A cookie that deletes the session (for logging out) */
export function clearedCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/** Does this request come from a logged-in admin? */
export function isAdmin(req) {
  const cookies = req.headers.get("cookie") ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expires, signature] = match[1].split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now()) return false;   // session expired
  return safeEqual(signature, sign(expires));
}