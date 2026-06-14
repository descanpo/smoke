import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useNavigation, ScreenType } from '../navigation/Navigator';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type TabDef = { screen: ScreenType; icon: string; labelTr: string; labelEn: string };

const TABS: TabDef[] = [
  { screen: 'Home', icon: '🏠', labelTr: 'Ana Sayfa', labelEn: 'Home' },
  { screen: 'Progress', icon: '❤️', labelTr: 'Sağlık', labelEn: 'Health' },
  { screen: 'Stats', icon: '📊', labelTr: 'İstatistik', labelEn: 'Stats' },
  { screen: 'Profile', icon: '👤', labelTr: 'Profil', labelEn: 'Profile' },
];

export const BottomNavBar = ({ onLogCraving }: { onLogCraving?: () => void }) => {
  const { currentScreen, navigate } = useNavigation();
  const { isDark } = useThemeMode();
  const { lang } = useLanguage();

  const containerBg = isDark
    ? 'rgba(12,12,28,0.92)'
    : 'rgba(255,255,255,0.92)';
  const containerBorder = isDark
    ? 'rgba(255,255,255,0.1)'
    : 'rgba(0,0,0,0.08)';

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: containerBg, borderColor: containerBorder }]}>
        {TABS.map(tab => {
          const isActive = currentScreen === tab.screen;
          const label = lang === 'tr' ? tab.labelTr : tab.labelEn;
          return (
            <TouchableOpacity
              key={tab.screen}
              style={styles.tab}
              onPress={() => navigate(tab.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.label, { color: isDark ? '#5A5A7A' : '#8A8AAA' }, isActive && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  container: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 9999,
    borderWidth: 1,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingHorizontal: 8,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px rgba(124,58,237,0.2), 0 0 0 1px rgba(255,255,255,0.06)',
      } as any,
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    ...Platform.select({ web: { cursor: 'pointer', outlineStyle: 'none' } as any }),
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(124,58,237,0.25)',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(124,58,237,0.4)' } as any,
    }),
  },
  icon: {
    fontSize: 22,
    opacity: 0.45,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
});
