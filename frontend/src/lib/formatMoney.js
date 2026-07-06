import { getTenantCurrency, localeForCurrency } from "@/lib/tenant/locale";

/** Default console currency when tenant preference is unset. */
export const DISPLAY_CURRENCY = "INR";

/** Normalize legacy/API currency codes for UI labels. */
export function normalizeDisplayCurrency(currency) {
  const code = String(currency || "")
    .trim()
    .toUpperCase();
  if (!code) return getTenantCurrency();
  return code;
}

/** Record-scoped currency code, or empty when the API row has no currency set. */
export function recordCurrencyCode(currency) {
  const code = String(currency ?? "")
    .trim()
    .toUpperCase();
  return code || "";
}

/** Format money using only an explicit record currency (no tenant fallback). */
export function formatRecordMoney(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const code = recordCurrencyCode(currency);
  if (!code) {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return formatMoney(n, code);
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

/** Format minor-unit (smallest currency unit) amounts from ledger APIs. */
export function formatMoneyMinor(minor, currency) {
  return formatMoney(minorToMajor(minor), currency);
}

/** Format a major-unit amount using tenant currency unless overridden. */
export function formatMoney(amount, currency) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const code = normalizeDisplayCurrency(currency);
  const locale = localeForCurrency(code);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${code} ${n.toFixed(2)}`;
  }
}

/** Form field label with tenant currency code, e.g. "Amount (USD)". */
export function amountFieldLabel(prefix = "Amount") {
  return `${prefix} (${getTenantCurrency()})`;
}

/** Format API money fields that may be a number or `{ amount }` object. */
export function formatMoneyField(value, currency) {
  if (value == null || value === "") return "—";
  const amount = typeof value === "object" ? value.amount : value;
  const code = typeof value === "object" ? value.currency ?? currency : currency;
  if (amount == null || amount === "") return "—";
  return formatMoney(amount, code);
}
