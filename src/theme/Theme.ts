import { Platform } from 'react-native';

// "Sade & güven veren" sağlık paleti.
// Mor marka kimliği korunur; neon parlama azaltılır, nötr slate zeminler kullanılır.

export const Colors = {
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',
  secondary: '#0EA5A4',      // güven veren teal (sağlık)
  secondaryDark: '#0F766E',
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2196F3',

  background: '#0D0E12',
  surface: '#15161C',
  card: '#16171D',
  cardElevated: '#1E1F27',
  cardGlass: '#16171D',
  cardGlassBorder: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSecondary: '#A1A1B5',
  textTertiary: '#6E6E85',
};

export const darkColors = {
  background: '#0D0E12',
  card: '#16171D',
  cardGlass: '#16171D',
  cardGlassBorder: 'rgba(255,255,255,0.08)',
  surface: '#15161C',
  cardElevated: '#1E1F27',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSecondary: '#A1A1B5',
  textTertiary: '#6E6E85',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primarySoft: 'rgba(124,58,237,0.14)',
  secondary: '#14B8A6',
  secondarySoft: 'rgba(20,184,166,0.14)',
  success: '#10B981',
  successSoft: 'rgba(16,185,129,0.14)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.14)',
  error: '#F87171',
  // SOS / panik — sakin ama net kırmızı; light/dark ortak tutulur.
  sos: '#EF4444',
  sosSoft: 'rgba(239,68,68,0.14)',
};

export const lightColors = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  cardGlass: '#FFFFFF',
  cardGlassBorder: 'rgba(15,23,42,0.08)',
  surface: '#FFFFFF',
  cardElevated: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  borderLight: 'rgba(15,23,42,0.12)',
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primarySoft: 'rgba(124,58,237,0.08)',
  secondary: '#0D9488',
  secondarySoft: 'rgba(13,148,136,0.10)',
  success: '#059669',
  successSoft: 'rgba(5,150,105,0.10)',
  warning: '#D97706',
  warningSoft: 'rgba(217,119,6,0.10)',
  error: '#DC2626',
  sos: '#DC2626',
  sosSoft: 'rgba(220,38,38,0.10)',
};

export type ThemeColors = typeof darkColors;

export const getColors = (mode: 'dark' | 'light'): ThemeColors =>
  mode === 'dark' ? darkColors : lightColors;

export const Theme = {
  colors: Colors,
  motion: {
    fast: 150,
    base: 250,
    slow: 400,
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  rounded: {
    sm: 8, md: 12, lg: 16, xl: 18, xxl: 22, full: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
    h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '700' as const },
    h4: { fontSize: 16, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
    caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.2 },
    label: { fontSize: 13, fontWeight: '600' as const },
  },
  // Yeniden kullanılabilir gradyanlar (expo-linear-gradient `colors` prop'u için tuple).
  gradients: {
    brand: ['#8B5CF6', '#7C3AED'] as [string, string],
    brandTeal: ['#8B5CF6', '#14B8A6'] as [string, string],
    auroraDark: ['#1B1530', '#0D0E12'] as [string, string],
    auroraLight: ['#EEF0FF', '#F7F8FA'] as [string, string],
    glow: ['rgba(124,58,237,0.30)', 'rgba(124,58,237,0)'] as [string, string],
  },
  // Nötr, yumuşak gölgeler — neon glow yok.
  shadows: {
    soft: Platform.select({
      web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06)' } as any,
      default: { shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    }),
    medium: Platform.select({
      web: { boxShadow: '0 6px 20px rgba(15,23,42,0.10)' } as any,
      default: { shadowColor: '#0F172A', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
    }),
    // Birincil CTA için izin verilen TEK hafif renkli gölge (abartısız).
    primary: Platform.select({
      web: { boxShadow: '0 6px 18px rgba(124,58,237,0.28)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
    }),
    card: Platform.select({
      web: { boxShadow: '0 2px 12px rgba(15,23,42,0.06)' } as any,
      default: { shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    }),
  },
};
