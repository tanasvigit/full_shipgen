export const colors = {
  // Surfaces — matches web command-center palette
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF1F6",
  surfaceElevated: "#F9FAFB",

  // Text
  text: "#0A0E1A",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textInverse: "#FFFFFF",

  // Brand — electric blue (web --primary #0066FF)
  brand: "#0066FF",
  brandHover: "#0040CC",
  brandSoft: "#E6EFFF",
  brandBorder: "#BBD3FF",
  accent: "#0066FF",
  shipgenBlue: "#0066FF",
  shipgenOrange: "#FF6600",

  // Secondary accent
  violet: "#7C3AED",
  violetBg: "#F3EEFF",

  // Semantic
  success: "#16A34A",
  successBg: "#E9F9EF",
  warning: "#D97706",
  warningBg: "#FEF3E2",
  error: "#DC2626",
  errorBg: "#FDECEC",
  info: "#0066FF",
  infoBg: "#E6EFFF",
  offline: "#6B7280",
  offlineBg: "#F1F3F7",

  // Lines
  border: "#E6E8EE",
  borderStrong: "#D3D7E0",
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
};

/**
 * Elevation presets. Spread into a style object, e.g. `{ ...shadow.md }`.
 * Combines iOS shadow props with Android elevation.
 */
export const shadow = {
  sm: {
    shadowColor: "#0A0E1A",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: "#0A0E1A",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lg: {
    shadowColor: "#0A0E1A",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  brand: {
    shadowColor: "#0066FF",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: "900" as const, letterSpacing: -0.6, color: colors.text },
  h2: { fontSize: 24, fontWeight: "800" as const, letterSpacing: -0.4, color: colors.text },
  h3: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.text },
  h4: { fontSize: 16, fontWeight: "700" as const, letterSpacing: -0.2, color: colors.text },
  body: { fontSize: 14, fontWeight: "400" as const, color: colors.text },
  small: { fontSize: 12, fontWeight: "400" as const, color: colors.textSecondary },
  overline: {
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
    color: colors.textMuted,
  },
  mono: { fontFamily: "monospace" as const, fontWeight: "600" as const, color: colors.text },
};

export const statusColor = (status: string) => {
  const s = status.toLowerCase();
  if (["completed", "available", "paid", "online", "active"].includes(s))
    return { fg: colors.success, bg: colors.successBg };
  if (["delivered", "arrived", "en_route", "started", "enroute", "in_transit", "in transit"].includes(s))
    return { fg: colors.info, bg: colors.infoBg };
  if (["idle", "pending", "assigned", "scheduled", "maintenance", "created", "dispatched", "delayed"].includes(s))
    return { fg: colors.warning, bg: colors.warningBg };
  if (["offline", "canceled", "cancelled", "failed", "out_of_service", "critical", "unpaid"].includes(s))
    return { fg: colors.error, bg: colors.errorBg };
  if (["new", "draft", "info"].includes(s)) return { fg: colors.info, bg: colors.infoBg };
  return { fg: colors.offline, bg: colors.offlineBg };
};
