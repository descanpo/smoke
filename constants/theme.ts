export const Colors = {
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4B44CC',
  secondary: '#FF6584',
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  dark: {
    background: '#0A0A14',
    surface: '#12121F',
    card: '#1A1A2E',
    cardElevated: '#22223A',
    border: '#2D2D4E',
    text: '#FFFFFF',
    textSecondary: '#9E9EBF',
    textTertiary: '#6B6B8A',
    icon: '#9E9EBF',
  },

  light: {
    background: '#F5F5FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardElevated: '#F0F0F8',
    border: '#E0E0EE',
    text: '#1A1A2E',
    textSecondary: '#5C5C7A',
    textTertiary: '#9E9EBF',
    icon: '#5C5C7A',
  },

  rarity: {
    common: '#9E9E9E',
    uncommon: '#4CAF50',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
  },

  gradients: {
    primary: ['#6C63FF', '#4B44CC'] as const,
    success: ['#4CAF50', '#2E7D32'] as const,
    warm: ['#FF9800', '#F44336'] as const,
    cool: ['#2196F3', '#6C63FF'] as const,
    dark: ['#1A1A2E', '#0A0A14'] as const,
    purple: ['#7C4DFF', '#6C63FF'] as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
};
