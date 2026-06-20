import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, View, StyleSheet, Platform, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Theme } from '../../theme/Theme';
import { useThemeMode } from '../../context/ThemeContext';
import { haptics } from '../../utils/haptics';

type IconName = keyof typeof Ionicons.glyphMap;
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Tek kanonik buton. Onboarding nextBtn, Home cravingBtn, modal
 * aksiyonları vb. buraya göçer. Dokunuşta haptics tetikler.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconPosition = 'right',
  loading,
  disabled,
  fullWidth,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle | ViewStyle[];
}) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);

  const isDisabled = disabled || loading;

  const palette: Record<Variant, { bg: string; fg: string; border?: string; shadow?: any }> = {
    primary: { bg: colors.primary, fg: '#FFFFFF', shadow: Theme.shadows.primary },
    secondary: { bg: colors.card, fg: colors.text, border: colors.border },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: colors.border },
    danger: { bg: colors.sos, fg: '#FFFFFF' },
  };
  const p = palette[variant];

  const handlePress = () => {
    if (isDisabled) return;
    variant === 'danger' ? haptics.warning() : haptics.tapMedium();
    onPress();
  };

  const fg = p.fg;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={[
        styles.base,
        {
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          opacity: isDisabled ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
          ...(p.shadow ?? {}),
        },
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.inner}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={18} color={fg} style={styles.iconLeft} />
          )}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={18} color={fg} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer', outlineStyle: 'none' } as any }),
  },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
