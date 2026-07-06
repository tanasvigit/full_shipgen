export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const DISPLAY_CURRENCY = "INR";

/** ISO 4217 codes — INR first (default), then common international currencies. */
const CURRENCY_CODES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "AUD",
  "BDT",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "HKD",
  "IDR",
  "JPY",
  "KES",
  "KWD",
  "LKR",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "OMR",
  "PHP",
  "PKR",
  "QAR",
  "SAR",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "ZAR",
];

const FALLBACK_TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

let tenantCurrency = DISPLAY_CURRENCY;
let tenantTimezone = DEFAULT_TIMEZONE;
let tenantLocale = "en-IN";

let currencyOptionsCache = null;
let timezoneOptionsCache = null;

function currencyName(code, displayNames) {
  try {
    return displayNames?.of(code) || code;
  } catch {
    return code;
  }
}

function timezoneOffsetLabel(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
}

export function getCurrencyOptions() {
  if (currencyOptionsCache) return currencyOptionsCache;

  let displayNames = null;
  try {
    displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
  } catch {
    displayNames = null;
  }

  currencyOptionsCache = CURRENCY_CODES.map((code) => {
    const name = currencyName(code, displayNames);
    return {
      value: code,
      label: `${code} — ${name}`,
      keywords: `${code} ${name}`.toLowerCase(),
    };
  });

  return currencyOptionsCache;
}

export function getTimezoneOptions() {
  if (timezoneOptionsCache) return timezoneOptionsCache;

  let zones = FALLBACK_TIMEZONES;
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      zones = Intl.supportedValuesOf("timeZone");
    }
  } catch {
    zones = FALLBACK_TIMEZONES;
  }

  const sorted = [...zones].sort((a, b) => {
    if (a === DEFAULT_TIMEZONE) return -1;
    if (b === DEFAULT_TIMEZONE) return 1;
    return a.localeCompare(b);
  });

  timezoneOptionsCache = sorted.map((value) => {
    const offset = timezoneOffsetLabel(value);
    const label = offset ? `${value} (${offset})` : value;
    return {
      value,
      label,
      keywords: `${value} ${value.replace(/_/g, " ")} ${offset}`.toLowerCase(),
    };
  });

  return timezoneOptionsCache;
}

export function syncTenantLocalePrefs(preferences = {}) {
  const currency = String(preferences.currency || DISPLAY_CURRENCY).trim().toUpperCase() || DISPLAY_CURRENCY;
  const timezone = String(preferences.timezone || DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE;
  const locale = String(preferences.locale || "en-IN").trim() || "en-IN";

  tenantCurrency = currency;
  tenantTimezone = timezone;
  tenantLocale = locale;
}

export function getTenantCurrency() {
  return tenantCurrency;
}

const currencySymbolCache = new Map();

/** Narrow currency symbol for nav icons and inline labels (e.g. ₹, $, €). */
export function getCurrencySymbol(currency) {
  const code =
    String(currency || tenantCurrency || DISPLAY_CURRENCY)
      .trim()
      .toUpperCase() || DISPLAY_CURRENCY;
  if (currencySymbolCache.has(code)) return currencySymbolCache.get(code);

  let symbol = code;
  try {
    const parts = new Intl.NumberFormat(localeForCurrency(code), {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    symbol = parts.find((part) => part.type === "currency")?.value?.trim() || code;
  } catch {
    symbol = code;
  }

  currencySymbolCache.set(code, symbol);
  return symbol;
}

export function getTenantTimezone() {
  return tenantTimezone;
}

export function getTenantLocale() {
  return tenantLocale;
}

export function localeForCurrency(code) {
  const normalized = String(code || "").toUpperCase();
  if (normalized === "INR") return "en-IN";
  if (normalized === "EUR") return "de-DE";
  if (normalized === "GBP") return "en-GB";
  return "en-US";
}

/** Format API timestamps in the tenant timezone. */
export function formatTenantDateTime(value, options = {}) {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(getTenantLocale(), {
      timeZone: getTenantTimezone(),
      dateStyle: "medium",
      timeStyle: "short",
      ...options,
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
