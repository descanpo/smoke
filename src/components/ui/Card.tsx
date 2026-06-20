import React from 'react';
import { View, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { getColors, Theme } from '../../theme/Theme';
import { useThemeMode } from '../../context/ThemeContext';

type CardProps = ViewProps & {
  /** İç boşluk. Varsayılan 18. */
  padding?: number;
  /** Yükseltilmiş (daha belirgin gölge) kart. */
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/**
 * Uygulamadaki tek kanonik kart yüzeyi. Daha önce her ekranda
 * tekrar yazılan `card` stilinin terfisi: nötr zemin + ince kenarlık +
 * yumuşak gölge (neon glow yok).
 */
export function Card({ padding = 18, elevated, style, children, ...rest }: CardProps) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
          ...(elevated ? Theme.shadows.medium : Theme.shadows.card),
        },
        style as any,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    borderWidth: 1,
  },
});
