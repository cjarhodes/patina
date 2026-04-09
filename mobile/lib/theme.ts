// All design tokens for the Patina "Weathered Grace" design system.
// Single source of truth. Components may still have hardcoded values —
// migration to use these tokens is a separate task.

export const colors = {
  primary: '#8B6F47',
  primaryDark: '#3D2B1F',

  text: {
    primary: '#3D2B1F',
    secondary: '#6B5B4E',
    muted: '#9E9E9E',
    disabled: '#C4B5A5',
    inverse: '#FFFFFF',
  },

  surface: {
    background: '#F5F0EB',
    card: '#FFFFFF',
    secondary: '#F0E8DE',
    skeleton: '#F0EAE4',
    skeletonHighlight: '#E8E0D8',
  },

  border: {
    default: '#E0D8D0',
    strong: '#D4C5B5',
  },

  functional: {
    error: '#C0392B',
    success: '#27AE60',
  },

  platform: {
    ebay: '#E53238',
    etsy: '#F56400',
  },

  overlay: {
    light: 'rgba(0,0,0,0.3)',
    dark: 'rgba(61,43,31,0.85)',
  },
} as const;

export const typography = {
  logo: {
    fontSize: 32,
    fontWeight: '300' as const,
    letterSpacing: 6,
    color: colors.primaryDark,
  },
  title: {
    fontSize: 26,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.text.muted,
  },
  caption: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.text.disabled,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 14,
  pill: 20,
  circle: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

const theme = { colors, typography, spacing, borderRadius, shadows } as const;
export default theme;
