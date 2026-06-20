import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { getColors } from '../../theme/Theme';
import { useThemeMode } from '../../context/ThemeContext';

/**
 * Bölüm üstü "eyebrow" etiketi — büyük harf, geniş harf aralığı.
 * Tüm ekranlardaki `eyebrow` stilinin tek kaynağı.
 */
export function SectionLabel({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);
  return <Text style={[styles.label, { color: colors.textTertiary }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
