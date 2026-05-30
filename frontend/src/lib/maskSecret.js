/** Display-only masking for API keys / secrets. Never use for access control. */
export function maskSecret(value, { head = 8, tail = 4 } = {}) {
  const s = String(value ?? "");
  if (!s) return "••••••••";
  if (s.length <= head + tail + 1) return "••••••••";
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
