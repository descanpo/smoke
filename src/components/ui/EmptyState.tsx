import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getColors } from '../../theme/Theme';
import { useThemeMode } from '../../context/ThemeContext';
import { Button } from './Button';

/**
 * Boş durum bloğu: emoji + başlık + açıklama + opsiyonel CTA.
 * Home / Stats / Community boş ekranlarının tek kaynağı.
 */
export function EmptyState({
  emoji,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  emoji: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!description && (
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{description}</Text>
      )}
      {ctaLabel && onCta && (
        <View style={styles.cta}>
          <Button label={ctaLabel} onPress={onCta} icon="arrow-forward" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  emoji: { fontSize: 50, marginBottom: 16 },
  title: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3, textAlign: 'center', marginBottom: 10 },
  desc: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  cta: { marginTop: 22 },
});
