import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { getColors } from '../../theme/Theme';
import { useThemeMode } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from './Button';

/**
 * Veri çeken bölümler için loading / error+retry sarmalayıcısı.
 * loading true ise spinner, error true ise hata + "Tekrar dene"
 * gösterir; aksi halde children render eder.
 */
export function StateView({
  loading,
  error,
  onRetry,
  children,
  minHeight = 160,
}: {
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
  minHeight?: number;
}) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);
  const { lang } = useLanguage();

  if (loading) {
    return (
      <View style={[styles.center, { minHeight }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { minHeight }]}>
        <Text style={[styles.errText, { color: colors.textSecondary }]}>
          {lang === 'tr' ? 'Bir şeyler ters gitti.' : 'Something went wrong.'}
        </Text>
        {onRetry && (
          <Button
            label={lang === 'tr' ? 'Tekrar dene' : 'Try again'}
            variant="ghost"
            icon="refresh"
            iconPosition="left"
            onPress={onRetry}
          />
        )}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  errText: { fontSize: 14, fontWeight: '500' },
});
