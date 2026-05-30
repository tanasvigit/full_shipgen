/** Ledger/API money fields are in smallest currency unit (e.g. cents). */
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

/** Format minor-unit (cents) amounts from ledger APIs. */
export function formatMoneyMinor(minor, currency = "USD") {
  return formatMoney(minorToMajor(minor), currency);
}

/** Format amount using backend currency code (defaults to USD). */
export function formatMoney(amount, currency = "USD") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
