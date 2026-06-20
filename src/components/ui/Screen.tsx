import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, SafeAreaView } from 'react-native';
import { getColors } from '../../theme/Theme';
import { useThemeMode } from '../../context/ThemeContext';

/**
 * Ekran kabuğu: güvenli alan + tema arka planı + opsiyonel scroll.
 * Tab bar yüksekliği kadar alt boşluk bırakır (scroll=true iken).
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle | ViewStyle[];
}) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);

  const pad: ViewStyle = padded ? { padding: 20, paddingTop: 16 } : {};

  if (scroll) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[pad, { paddingBottom: 120 }, contentStyle as any]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={[styles.fill, pad, contentStyle as any]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
