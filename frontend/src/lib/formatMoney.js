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
export function formatMoneyMinor(minor, currency = "INR") {
  return formatMoney(minorToMajor(minor), currency);
}

/** Format amount using backend currency code (defaults to INR). */
export function formatMoney(amount, currency = "INR") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const code = currency || "INR";
  try {
    return new Intl.NumberFormat(code === "INR" ? "en-IN" : undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₹${n.toFixed(2)}`;
  }
}
