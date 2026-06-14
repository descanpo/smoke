import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useNavigation, ScreenType } from '../navigation/Navigator';
import { Theme } from '../theme/Theme';

const TABS: { screen: ScreenType; icon: string; label: string }[] = [
  { screen: 'Home', icon: '🏠', label: 'Ana Sayfa' },
  { screen: 'Progress', icon: '💪', label: 'Sağlık' },
  { screen: 'Community', icon: '👥', label: 'Topluluk' },
  { screen: 'Stats', icon: '📊', label: 'İstatistik' },
  { screen: 'Profile', icon: '👤', label: 'Profil' },
];

export const BottomNavBar = ({ onLogCraving }: { onLogCraving?: () => void }) => {
  const { currentScreen, navigate } = useNavigation();

  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const isActive = currentScreen === tab.screen;
        return (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tab}
            onPress={() => navigate(tab.screen)}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 68,
    backgroundColor: 'rgba(18, 18, 31, 0.97)',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 8,
    paddingHorizontal: 4,
    ...Platform.select({ web: { backdropFilter: 'blur(20px)' } as any }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    ...Platform.select({ web: { cursor: 'pointer', outlineStyle: 'none' } as any }),
  },
  icon: { fontSize: 20, opacity: 0.4 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, marginTop: 3, color: Theme.colors.textTertiary, fontWeight: '500' },
  labelActive: { color: Theme.colors.primary, fontWeight: '700' },
});
