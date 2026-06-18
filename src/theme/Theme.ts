import { Platform } from 'react-native';

export const Colors = {
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',
  secondary: '#06B6D4',
  secondaryDark: '#0891B2',
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2196F3',

  background: '#0A0A1A',
  surface: '#0F0F1F',
  card: '#12122A',
  cardElevated: '#22223A',
  cardGlass: 'rgba(255,255,255,0.04)',
  cardGlassBorder: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSecondary: '#A3A3C2',
  textTertiary: '#6B6B8F',
};

export const darkColors = {
  background: '#0A0A1A',
  card: '#12122A',
  cardGlass: 'rgba(255,255,255,0.04)',
  cardGlassBorder: 'rgba(255,255,255,0.08)',
  surface: '#0F0F24',
  border: 'rgba(255,255,255,0.08)',
  text: '#FFFFFF',
  textSecondary: '#A3A3C2',
  textTertiary: '#5A5A7A',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  secondary: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export const lightColors = {
  background: '#F2F0FB',
  card: '#FFFFFF',
  cardGlass: 'rgba(255,255,255,0.95)',
  cardGlassBorder: 'rgba(124,58,237,0.12)',
  surface: '#FAFAFE',
  border: 'rgba(0,0,0,0.07)',
  text: '#0A0A1A',
  textSecondary: '#4A4A6A',
  textTertiary: '#8A8AAA',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  secondary: '#0891B2',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
};

export const getColors = (mode: 'dark' | 'light') =>
  mode === 'dark' ? darkColors : lightColors;

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  rounded: {
    sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '700' as const },
    h4: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
    caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
    label: { fontSize: 13, fontWeight: '600' as const },
  },
  shadows: {
    soft: Platform.select({
      web: { boxShadow: '0 8px 32px rgba(124,58,237,0.12)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
    }),
    medium: Platform.select({
      web: { boxShadow: '0 16px 40px rgba(124,58,237,0.15)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 4 },
    }),
    glow: Platform.select({
      web: { boxShadow: '0 0 30px rgba(124,58,237,0.45), 0 4px 20px rgba(124,58,237,0.25)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
    }),
    cyanGlow: Platform.select({
      web: { boxShadow: '0 0 24px rgba(6,182,212,0.35)' } as any,
      default: { shadowColor: '#06B6D4', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
    }),
    successGlow: Platform.select({
      web: { boxShadow: '0 0 20px rgba(16,185,129,0.3)' } as any,
      default: { shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
    }),
    card: Platform.select({
      web: { boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
    }),
  },
};
