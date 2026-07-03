/** ShipGen console displays all monetary values in Indian Rupees. */
export const DISPLAY_CURRENCY = "INR";

/** Normalize legacy/API currency codes for UI labels. */
export function normalizeDisplayCurrency(currency) {
  const code = String(currency || "")
    .trim()
    .toUpperCase();
  if (!code || code === "USD") return DISPLAY_CURRENCY;
  return code;
}

/** Ledger/API money fields are in smallest currency unit (e.g. paise). */
export function minorToMajor(minor) {
  const n = Number(minor);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}

export function majorToMinor(major) {
  const n = Number(major);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Format minor-unit (paise) amounts from ledger APIs. */
export function formatMoneyMinor(minor) {
  return formatMoney(minorToMajor(minor));
}

/** Format a major-unit amount in INR (ignores legacy USD codes from API). */
export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: DISPLAY_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₹${n.toFixed(2)}`;
  }
}

/** Format API money fields that may be a number or `{ amount }` object. */
export function formatMoneyField(value) {
  if (value == null || value === "") return "—";
  const amount = typeof value === "object" ? value.amount : value;
  if (amount == null || amount === "") return "—";
  return formatMoney(amount);
}
