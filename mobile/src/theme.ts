export const colors = {
  background: "#f3faf7",
  border: "#d7e5df",
  card: "#ffffff",
  danger: "#a30f1a",
  dangerSoft: "#fde2dc",
  delivered: "#1b7a3e",
  deliveredSoft: "#d4f5e2",
  mapSurface: "#e6eeeb",
  muted: "#65736f",
  mutedSoft: "#eaf2ef",
  overlay: "rgba(23,33,31,0.45)",
  primary: "#00796b",
  primaryDark: "#005f55",
  primarySoft: "#d8f3ee",
  text: "#17211f",
  textOnPrimary: "#ffffff",
  warning: "#a34f22",
  warningSoft: "#ffe2d4",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const font = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  heavy: "Inter_800ExtraBold",
} as const;

export const type = {
  display: { fontFamily: font.heavy, fontSize: 28, lineHeight: 34 },
  title:   { fontFamily: font.heavy, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: font.bold,  fontSize: 17, lineHeight: 22 },
  body:    { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  label:   { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.medium, fontSize: 12, lineHeight: 16 },
  mono:    { fontFamily: "monospace", fontSize: 11, letterSpacing: 1 },
} as const;

export const shadow = {
  sm: { shadowColor: "#17211f", shadowOffset: { width: 0, height: 2 },  shadowOpacity: 0.08, shadowRadius: 4,  elevation: 2 },
  md: { shadowColor: "#17211f", shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  lg: { shadowColor: "#17211f", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 12 },
} as const;

export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  spring: { damping: 18, stiffness: 180, mass: 0.7 },
} as const;

