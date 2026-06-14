import { Platform } from 'react-native';

export const Colors = {
  primary: '#6C63FF',
  primaryLight: '#8B83FF',
  primaryDark: '#4B44CC',
  secondary: '#FF6584',
  success: '#4CAF50',
  successDark: '#2E7D32',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  background: '#0A0A14',
  surface: '#12121F',
  card: '#1A1A2E',
  cardElevated: '#22223A',
  border: '#2D2D4E',
  borderLight: '#3D3D5E',
  text: '#FFFFFF',
  textSecondary: '#9E9EBF',
  textTertiary: '#6B6B8A',
};

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  rounded: {
    sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    label: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  },
  shadows: {
    soft: Platform.select({
      web: { boxShadow: '0 8px 32px rgba(108, 99, 255, 0.1)' } as any,
      default: {
        shadowColor: '#6C63FF',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 2,
      },
    }),
    medium: Platform.select({
      web: { boxShadow: '0 16px 40px rgba(108, 99, 255, 0.15)' } as any,
      default: {
        shadowColor: '#6C63FF',
        shadowOpacity: 0.15,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        elevation: 4,
      },
    }),
    glow: Platform.select({
      web: { boxShadow: '0 0 25px rgba(108, 99, 255, 0.35)' } as any,
      default: {
        shadowColor: '#6C63FF',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5,
      },
    }),
    successGlow: Platform.select({
      web: { boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)' } as any,
      default: {
        shadowColor: '#4CAF50',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
      },
    }),
  },
};
