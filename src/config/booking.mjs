// ============================================================
//  Visva Ved booking settings
//  Everything the client may want to change lives in this file.
// ============================================================

// ---------- Weekly timetable (India time) ----------
// Day numbers: 0 = Sunday, 1 = Monday ... 6 = Saturday.
// A day that is not listed here is closed (Sunday).
// Each slot is [start, end] in 24-hour "HH:MM".

const TAROT_SLOTS = [
  ["10:00", "11:00"],
  ["11:30", "12:30"],
  ["14:00", "15:00"],
  ["15:30", "16:30"],
];

const LONG_SLOTS = [
  ["10:00", "11:30"],
  ["12:00", "13:30"],
  ["14:30", "16:00"],
  ["16:30", "18:00"],
];

export const SCHEDULE = {
  1: { service: "Tarot", slots: TAROT_SLOTS },        // Monday
  4: { service: "Tarot", slots: TAROT_SLOTS },        // Thursday
  2: { service: "Numerology", slots: LONG_SLOTS },    // Tuesday
  5: { service: "Numerology", slots: LONG_SLOTS },    // Friday
  3: { service: "Vedic Vastu", slots: LONG_SLOTS },   // Wednesday
  6: { service: "Vedic Vastu", slots: LONG_SLOTS },   // Saturday
};

// ---------- Booking window ----------
export const MIN_DAYS_AHEAD = 1;   // earliest booking: tomorrow
export const MONTHS_SHOWN = 3;     // how many months the calendar shows
export const HOLD_MINUTES = 15;    // how long a slot is held while the visitor pays

// ---------- Programme & price ----------
export const DEFAULT_PROGRAMME = "General consultation";

export const PRICES = {
  default: 500,
  // "Tarot": 500,
  // "Numerology": 700,
  // "Vedic Vastu": 900,
};

export const priceFor = (programme) => PRICES[programme] ?? PRICES.default;

// ---------- UPI ----------
export const UPI_ID = "CHANGE-ME@upi";
export const PAYEE_NAME = "Visva Ved";

// ============================================================
//  Helpers (no need to edit below this line)
// ============================================================

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

// Weekday of a "YYYY-MM-DD" date, independent of the visitor's time zone
export const weekdayOf = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

// Closed days, worked out from SCHEDULE (kept for older code)
export const CLOSED_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6].filter((d) => !SCHEDULE[d]);

// Every start time used on any day (kept for older code)
export const TIME_SLOTS = [
  ...new Set(Object.values(SCHEDULE).flatMap((day) => day.slots.map(([start]) => start))),
].sort();

// The plan for one date: { service, slots: [{ start, end, minutes }] } or null if closed
export function dayPlan(dateStr) {
  const day = SCHEDULE[weekdayOf(dateStr)];
  if (!day) return null;
  return {
    service: day.service,
    slots: day.slots.map(([start, end]) => ({
      start,
      end,
      minutes: toMinutes(end) - toMinutes(start),
    })),
  };
}

// Start times offered on one date, e.g. ["10:00", "11:30", ...]
export const slotsFor = (dateStr) => dayPlan(dateStr)?.slots.map((s) => s.start) ?? [];

// Is this start time offered on this date?
export const isScheduledSlot = (dateStr, time) => slotsFor(dateStr).includes(time);

// The slot object for a date + start time, or null
export const slotInfo = (dateStr, time) =>
  dayPlan(dateStr)?.slots.find((s) => s.start === time) ?? null;

// Session length in minutes for a date + start time (for the calendar event)
export const sessionMinutes = (dateStr, time) => slotInfo(dateStr, time)?.minutes ?? 60;

// The service held on a date, e.g. "Tarot"
export const serviceFor = (dateStr) => dayPlan(dateStr)?.service ?? null;

// Which service a programme name belongs to: "Tarot", "Numerology", "Vedic Vastu" or null
export function serviceOfProgramme(programme) {
  const p = String(programme || "").toLowerCase();
  if (p.includes("tarot")) return "Tarot";
  if (p.includes("numerology")) return "Numerology";
  if (p.includes("vastu")) return "Vedic Vastu";
  return null;
}

// Days of the week a programme can be booked, e.g. "Mondays and Thursdays"
export function daysForProgramme(programme) {
  const service = serviceOfProgramme(programme);
  const names = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  const days = Object.keys(SCHEDULE)
    .map(Number)
    .filter((d) => !service || SCHEDULE[d].service === service)
    .map((d) => names[d]);
  return days.length > 1 ? `${days.slice(0, -1).join(", ")} and ${days.at(-1)}` : days[0] ?? "";
}

// Does a programme chosen on the website fit this date?
// "Book Tarot" only allows Tarot days, and so on. Anything else (a general
// consultation, Medical Astrology) may be booked on any open day.
export function programmeFitsDate(programme, dateStr) {
  const service = serviceFor(dateStr);
  if (!service) return false;
  const wanted = serviceOfProgramme(programme);
  return !wanted || wanted === service;
}

// The name saved with a booking: a general booking takes the service of that day
// ("General consultation" on a Monday → "Tarot"); a specific one keeps its own name.
export function programmeForBooking(programme, dateStr) {
  const name = String(programme || "").trim();
  if (!name || name === DEFAULT_PROGRAMME) return serviceFor(dateStr) ?? DEFAULT_PROGRAMME;
  return name;
}

// "14:30" -> "2:30 PM"
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

// ("2026-11-02", "10:00") -> "10:00 AM – 11:00 AM"
export function formatRange(dateStr, time) {
  const slot = slotInfo(dateStr, time);
  return slot ? `${formatTime(slot.start)} – ${formatTime(slot.end)}` : formatTime(time);
}
