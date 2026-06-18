import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, ScreenType } from '../navigation/Navigator';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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

const PRIMARY = '#7C3AED';

export const BottomNavBar = ({ onLogCraving }: { onLogCraving?: () => void }) => {
  const { currentScreen, navigate } = useNavigation();
  const { isDark } = useThemeMode();
  const { lang } = useLanguage();

  const barBg = isDark ? '#15152E' : '#FFFFFF';
  const topBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const inactiveColor = isDark ? '#6F6F92' : '#9A9AB2';

  // Render the four tabs with a centered FAB inserted in the middle.
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  const renderTab = (tab: TabDef) => {
    const active = currentScreen === tab.screen;
    const color = active ? PRIMARY : inactiveColor;
    return (
      <TouchableOpacity
        key={tab.screen}
        style={s.tab}
        onPress={() => navigate(tab.screen)}
        activeOpacity={0.7}
      >
        <View style={[s.indicator, { backgroundColor: active ? PRIMARY : 'transparent' }]} />
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
        backgroundColor: barBg,
        borderTopColor: topBorder,
        ...Platform.select({
          web: { boxShadow: '0 -8px 30px rgba(0,0,0,0.12)' } as any,
          default: {
            shadowColor: '#000', shadowOpacity: isDark ? 0.4 : 0.12,
            shadowRadius: 16, shadowOffset: { width: 0, height: -6 }, elevation: 20,
          },
        }),
      }]}>
        {left.map(renderTab)}

        {/* Center FAB */}
        <View style={s.fabSlot}>
          <TouchableOpacity
            style={s.fab}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        boxShadow: '0 10px 26px rgba(124,58,237,0.5)',
        cursor: 'pointer',
      } as any,
      default: {
        shadowColor: PRIMARY,
        shadowOpacity: 0.5,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      },
    }),
  },
});
