import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../context/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Aksan-tonlu ikon kuyusu. Arka plan = aksan rengi + düşük alfa
 * (dark'ta biraz daha belirgin). Stat tile / milestone / motivasyon
 * kartlarındaki tekrarlanan desenin tek kaynağı.
 */
export function IconWell({
  icon,
  accent,
  size = 20,
  wellSize = 42,
  radius = 12,
  style,
}: {
  icon: IconName;
  accent: string;
  size?: number;
  wellSize?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const { isDark } = useThemeMode();
  return (
    <View
      style={[
        styles.well,
        {
          width: wellSize,
          height: wellSize,
          borderRadius: radius,
          backgroundColor: accent + (isDark ? '22' : '14'),
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  well: { alignItems: 'center', justifyContent: 'center' },
});
