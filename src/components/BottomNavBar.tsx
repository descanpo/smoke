import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, ScreenType } from '../navigation/Navigator';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getColors, Theme } from '../theme/Theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type TabDef = {
  screen: ScreenType;
  icon: IconName;
  iconActive: IconName;
  labelTr: string;
  labelEn: string;
};

const TABS: TabDef[] = [
  { screen: 'Home',     icon: 'home-outline',         iconActive: 'home',         labelTr: 'Ana Sayfa',  labelEn: 'Home' },
  { screen: 'Progress', icon: 'heart-outline',        iconActive: 'heart',        labelTr: 'Sağlık',     labelEn: 'Health' },
  { screen: 'Stats',    icon: 'stats-chart-outline',  iconActive: 'stats-chart',  labelTr: 'İstatistik', labelEn: 'Stats' },
  { screen: 'Profile',  icon: 'person-outline',       iconActive: 'person',       labelTr: 'Profil',     labelEn: 'Profile' },
];

export const BottomNavBar = ({ onLogCraving }: { onLogCraving?: () => void }) => {
  const { currentScreen, navigate } = useNavigation();
  const { mode } = useThemeMode();
  const { lang } = useLanguage();
  const colors = getColors(mode);

  // Render the four tabs with a centered FAB inserted in the middle.
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const renderTab = (tab: TabDef) => {
    const active = currentScreen === tab.screen;
    const color = active ? colors.primary : colors.textTertiary;
    return (
      <TouchableOpacity
        key={tab.screen}
        style={s.tab}
        onPress={() => navigate(tab.screen)}
        activeOpacity={0.7}
      >
        <View style={[s.indicator, { backgroundColor: active ? colors.primary : 'transparent' }]} />
        <Ionicons name={active ? tab.iconActive : tab.icon} size={23} color={color} />
        <Text style={[s.label, { color }]} numberOfLines={1}>
          {lang === 'tr' ? tab.labelTr : tab.labelEn}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.wrapper} pointerEvents="box-none">
      <View style={[s.bar, {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        ...Platform.select({
          web: { boxShadow: '0 -4px 16px rgba(15,23,42,0.08)' } as any,
          default: {
            shadowColor: '#0F172A',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
          },
        }),
      }]}>
        {left.map(renderTab)}

        {/* Center FAB */}
        <View style={s.fabSlot}>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: colors.primary, ...Theme.shadows.primary }]}
            onPress={onLogCraving}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {right.map(renderTab)}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 44,
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer', outlineStyle: 'none' } as any }),
  },
  indicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    marginBottom: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Center FAB
  fabSlot: {
    width: 72,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
});
