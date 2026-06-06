export const colors = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F3F5",
  text: "#0A0A0A",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",
  brand: "#0A0A0A",
  brandHover: "#262626",
  accent: "#0033A0",
  success: "#10B981",
  successBg: "#ECFDF5",
  warning: "#F59E0B",
  warningBg: "#FFFBEB",
  error: "#EF4444",
  errorBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  offline: "#6B7280",
  offlineBg: "#F3F4F6",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: "900" as const, letterSpacing: -0.5, color: colors.text },
  h2: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  h4: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 14, fontWeight: "400" as const, color: colors.text },
  small: { fontSize: 12, fontWeight: "400" as const, color: colors.textSecondary },
  overline: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
    color: colors.textMuted,
  },
  mono: { fontFamily: "monospace" as const, fontWeight: "600" as const, color: colors.text },
};

export const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (["active", "online", "delivered", "completed", "available", "in_transit", "in transit", "paid", "en_route", "arrived"].includes(s))
    return { fg: colors.success, bg: colors.successBg };
  if (["idle", "pending", "assigned", "scheduled", "maintenance", "created", "dispatched"].includes(s))
    return { fg: colors.warning, bg: colors.warningBg };
  if (["offline", "cancelled", "failed", "out_of_service", "critical", "unpaid"].includes(s))
    return { fg: colors.error, bg: colors.errorBg };
  if (["new", "draft", "info"].includes(s)) return { fg: colors.info, bg: colors.infoBg };
  return { fg: colors.offline, bg: colors.offlineBg };
};
