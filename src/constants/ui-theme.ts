// UI Theme - Consistent spacing, radius, and sizing

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 4,      // Tiny elements (badges, small buttons)
  md: 8,      // Buttons, inputs, small cards
  lg: 12,     // Cards, modals, containers
  xl: 16,     // Large modals, sheets (top)
  full: 999,  // Pill buttons, avatars
};

export const shadows = {
  none: "0 0 0 rgba(0,0,0,0)",
  xs: "0 1px 3px rgba(0,0,0,0.05)",
  sm: "0 2px 4px rgba(0,0,0,0.08)",
  md: "0 4px 8px rgba(0,0,0,0.1)",
  lg: "0 8px 16px rgba(0,0,0,0.12)",
};

export const typography = {
  // Headlines
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  // Body
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  // UI/Labels
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600" as const,
  },
};

export const buttonSizes = {
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: 32,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 44,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    minHeight: 52,
  },
};

export const inputSizes = {
  default: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 44,
    borderWidth: 1,
  },
};
