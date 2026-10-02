// Booking settings, shared by the website AND the Netlify Functions.

export const TIME_SLOTS = ["07:00", "08:30", "10:00", "11:30", "14:00", "16:00", "17:30"]; // India time, 24-hour
export const CLOSED_WEEKDAYS = [];   // 0 = Sunday … 6 = Saturday. Example: [0] closes Sundays
export const MIN_DAYS_AHEAD = 1;     // earliest bookable day: 1 = tomorrow
export const MONTHS_SHOWN = 3;       // this month + the next 2
export const SESSION_MINUTES = 45;
export const HOLD_MINUTES = 15;      // how long a slot is held while the visitor pays
export const DEFAULT_PROGRAMME = "General consultation";

// Price in rupees per programme. Confirm with the client!
export const PRICES = {
  default: 500,
};

// Payment details shown to visitors. Replace with the client's real details before launch.
export const UPI_ID = "CHANGE-ME@upi";
export const PAYEE_NAME = "Visva Ved";

export const priceFor = (programme) => PRICES[programme] ?? PRICES.default;

// "14:00" → "2:00 PM"
export const formatTime = (time) => {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};