import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation/Navigator';

const TRIGGER_LABELS: Record<string, { label: string; labelEn: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  stress:     { label: 'Stres',         labelEn: 'Stress',       icon: 'thunderstorm-outline', color: '#F43F5E' },
  boredom:    { label: 'Sıkıntı',       labelEn: 'Boredom',      icon: 'hourglass-outline',    color: '#8B5CF6' },
  social:     { label: 'Sosyal Ortam',  labelEn: 'Social',       icon: 'people-outline',       color: '#EAB308' },
  after_meal: { label: 'Yemek Sonrası', labelEn: 'After Meal',   icon: 'restaurant-outline',   color: '#F97316' },
  coffee:     { label: 'Kahve Sonrası', labelEn: 'After Coffee', icon: 'cafe-outline',         color: '#F59E0B' },
  alcohol:    { label: 'Alkol',         labelEn: 'Alcohol',      icon: 'wine-outline',         color: '#64748B' },
  habit:      { label: 'Alışkanlık',    labelEn: 'Habit',        icon: 'repeat-outline',       color: '#0EA5A4' },
  emotion:    { label: 'Duygusal',      labelEn: 'Emotional',    icon: 'heart-dislike-outline',color: '#EC4899' },
  other:      { label: 'Diğer',         labelEn: 'Other',        icon: 'ellipsis-horizontal',  color: '#6B7280' },
};

function calcStats(journey: any) {
  const mins = (Date.now() - new Date(journey.quit_date).getTime()) / 60000;
  const days = Math.floor(mins / 1440);
  const avoided = Math.floor(mins * journey.cigarettes_per_day / 1440);
  const saved = Math.round(avoided * (journey.cost_per_pack / (journey.cigarettes_per_pack || 20)) * 100) / 100;
  return { days, avoided, saved };
}

function calcLongestStreak(logs: any[], quitDate: Date): number {
  const now = new Date();
  const daysSinceQuit = Math.floor((now.getTime() - quitDate.getTime()) / 86400000);
  const failedDays = new Set<string>();
  (logs || []).filter((l: any) => !l.resisted).forEach((l: any) => {
    failedDays.add(new Date(l.created_at).toDateString());
  });
  let maxStreak = 0;
  let cur = 0;
  for (let i = 0; i <= daysSinceQuit; i++) {
    const d = new Date(quitDate);
    d.setDate(d.getDate() + i);
    if (!failedDays.has(d.toDateString())) {
      cur++;
      maxStreak = Math.max(maxStreak, cur);
    } else {
      cur = 0;
    }
  }
  return maxStreak;
}

export default function StatsScreen({ session, journey }: { session: any; journey: any }) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const { navigate } = useNavigation();
  const colors = getColors(mode);

  const [weekly, setWeekly] = useState<{ label: string; count: number; isToday: boolean }[]>([]);
  const [triggers, setTriggers] = useState<{ key: string; count: number }[]>([]);
  const [totalCravings, setTotalCravings] = useState(0);
  const [resistedCravings, setResistedCravings] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [cleanDays, setCleanDays] = useState(0);

  useEffect(() => {
    if (!session?.user?.id || !journey?.id) return;
    fetchAllData();
    fetchTriggers();
  }, [session?.user?.id, journey?.id]);

  const fetchAllData = async () => {
    const { data: allLogs } = await supabase
      .from('craving_logs')
      .select('created_at, resisted')
      .eq('journey_id', journey.id)
      .order('created_at', { ascending: true });

    if (allLogs) {
      setTotalCravings(allLogs.length);
      setResistedCravings(allLogs.filter((l: any) => l.resisted).length);

      if (journey.quit_date) {
        const streak = calcLongestStreak(allLogs, new Date(journey.quit_date));
        setLongestStreak(streak);
      }

      const failedDaySet = new Set<string>();
      allLogs.filter((l: any) => !l.resisted).forEach((l: any) => {
        failedDaySet.add(new Date(l.created_at).toDateString());
      });
      const totalDays = journey.quit_date
        ? Math.floor((Date.now() - new Date(journey.quit_date).getTime()) / 86400000)
        : 0;
      setCleanDays(Math.max(0, totalDays - failedDaySet.size));

      // Weekly bar chart using language-aware day labels
      const dayLabels = t.days;
      const weeklyData: { label: string; count: number; isToday: boolean }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dayStr = d.toDateString();
        const jsDay = d.getDay(); // 0=Sun, 1=Mon...
        // t.days is Mon-Sun order: [0]=Mon,[1]=Tue,...[6]=Sun
        // JS: Sun=0,Mon=1,...Sat=6  -> index = (jsDay + 6) % 7
        const labelIdx = (jsDay + 6) % 7;
        const count = (allLogs || []).filter((l: any) => {
          const ld = new Date(l.created_at).toDateString();
          return ld === dayStr;
        }).length;
        weeklyData.push({
          label: dayLabels[labelIdx],
          count,
          isToday: i === 0,
        });
      }
      setWeekly(weeklyData);
    }
  };

  const fetchTriggers = async () => {
    const { data } = await supabase.from('craving_logs')
      .select('trigger_type')
      .eq('journey_id', journey.id)
      .not('trigger_type', 'is', null);
    if (!data) return;
    const counts: Record<string, number> = {};
    data.forEach((c: any) => {
      if (c.trigger_type) counts[c.trigger_type] = (counts[c.trigger_type] ?? 0) + 1;
    });
    setTriggers(
      Object.entries(counts)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
    );
  };

  const cardStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...Theme.shadows.card,
  };

  if (!journey) {
    return (
      <View style={[s.container, s.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, ...Theme.shadows.card }]}>
          <View style={[s.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="bar-chart-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[s.emptyTitle, { color: colors.text }]}>
            {lang === 'tr' ? 'Yolculuk bulunamadı' : 'Journey not found'}
          </Text>
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>
            {lang === 'tr'
              ? 'İstatistikler yolculuğun başladığında burada görünecek.'
              : 'Statistics will appear here once your journey begins.'}
          </Text>
        </View>
      </View>
    );
  }

  const resistPct = totalCravings > 0 ? Math.round((resistedCravings / totalCravings) * 100) : 100;
  const maxBar = Math.max(...weekly.map(d => d.count), 1);
  const triggerTotal = triggers.reduce((sum, t2) => sum + t2.count, 0) || 1;

  // 2x2 overview tiles
  const statTiles: { accent: string; icon: keyof typeof Ionicons.glyphMap; value: string; label: string }[] = [
    {
      accent: colors.success,
      icon: 'shield-checkmark',
      value: `%${resistPct}`,
      label: t.resistanceRate,
    },
    {
      accent: colors.primary,
      icon: 'flame',
      value: `${longestStreak}`,
      label: t.longestStreak,
    },
    {
      accent: '#F59E0B',
      icon: 'flash',
      value: `${totalCravings}`,
      label: t.totalCravings,
    },
    {
      accent: colors.secondary,
      icon: 'calendar',
      value: `${cleanDays}`,
      label: t.cleanDays,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={[s.container, { backgroundColor: colors.background }]}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'ANALİZ' : 'ANALYTICS'}
            </Text>
            <Text style={[s.title, { color: colors.text }]}>{t.statistics}</Text>
          </View>
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => navigate('Community')}
          >
            <Ionicons name="people-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Weekly Bar Chart */}
        <View style={[cardStyle, s.chartCard]}>
          <View style={s.cardHead}>
            <Text style={[s.eyebrow, { color: colors.textTertiary }]}>{t.weeklyActivity}</Text>
            <View style={s.legend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: isDark ? '#475569' : '#94A3B8' }]} />
                <Text style={[s.legendText, { color: colors.textTertiary }]}>
                  {lang === 'tr' ? 'GEÇMİŞ' : 'PAST'}
                </Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: colors.secondary }]} />
                <Text style={[s.legendText, { color: colors.textTertiary }]}>
                  {lang === 'tr' ? 'BUGÜN' : 'TODAY'}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.chart}>
            {weekly.map((d, i) => {
              const fillPct = Math.max(d.count > 0 ? 8 : 0, (d.count / maxBar) * 100);
              return (
                <View key={i} style={s.barGroup}>
                  {/* value (today only) */}
                  <View style={s.barValueSlot}>
                    {d.isToday && d.count > 0 && (
                      <Text style={[s.barValue, { color: colors.secondary }]}>{d.count}</Text>
                    )}
                  </View>
                  {/* track */}
                  <View style={[s.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(17,17,40,0.05)' }]}>
                    {fillPct > 0 && (
                      <View
                        style={[
                          s.barFill,
                          { height: `${fillPct}%` as any },
                          d.isToday
                            ? { backgroundColor: colors.secondary }
                            : { backgroundColor: colors.primary, opacity: 0.50 },
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[s.barLabel, { color: colors.textTertiary }, d.isToday && { color: colors.secondary, fontWeight: '800' }]}>
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Overview 2x2 */}
        <View style={s.statsGrid}>
          {statTiles.map((tile, i) => (
            <View key={i} style={[s.statCard, cardStyle]}>
              <View style={s.statTop}>
                <View style={[s.statIconWrap, { backgroundColor: tile.accent + (isDark ? '22' : '14') }]}>
                  <Ionicons name={tile.icon} size={18} color={tile.accent} />
                </View>
                <View style={[s.statDot, { backgroundColor: tile.accent }]} />
              </View>
              <Text style={[s.statValue, { color: colors.text }]}>{tile.value}</Text>
              <Text style={[s.statLabel, { color: colors.textTertiary }]}>{tile.label}</Text>
            </View>
          ))}
        </View>

        {/* Trigger Analysis */}
        {triggers.length > 0 ? (
          <View style={[cardStyle, s.triggerCard]}>
            <Text style={[s.eyebrow, { color: colors.textTertiary, marginBottom: 18 }]}>{t.triggerAnalysis}</Text>
            {triggers.map((trig, idx) => {
              const info = TRIGGER_LABELS[trig.key] ?? { label: trig.key, labelEn: trig.key, icon: 'ellipsis-horizontal' as keyof typeof Ionicons.glyphMap, color: '#6B7280' };
              const widthPct = Math.round((trig.count / triggerTotal) * 100);
              return (
                <View key={trig.key} style={[s.triggerRow, idx === triggers.length - 1 && { marginBottom: 0 }]}>
                  <View style={[s.triggerIconWrap, { backgroundColor: info.color + (isDark ? '22' : '14') }]}>
                    <Ionicons name={info.icon} size={16} color={info.color} />
                  </View>
                  <View style={s.triggerBody}>
                    <View style={s.triggerLabelRow}>
                      <Text style={[s.triggerLabel, { color: colors.text }]} numberOfLines={1}>
                        {lang === 'tr' ? info.label : info.labelEn}
                      </Text>
                      <Text style={[s.triggerPct, { color: info.color }]}>%{widthPct}</Text>
                    </View>
                    <View style={[s.triggerTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={[s.triggerFill, {
                        width: `${widthPct}%` as any,
                        backgroundColor: info.color,
                      }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[cardStyle, s.triggerCard, s.emptyState]}>
            <View style={[s.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="analytics-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[s.emptyTitle, { color: colors.text }]}>
              {lang === 'tr' ? 'Henüz veri yok' : 'No data yet'}
            </Text>
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              {lang === 'tr'
                ? 'İstek kaydetmeye başladığında tetikleyici analizi burada görünecek.'
                : 'Trigger analysis will appear here once you start logging cravings.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 16, paddingBottom: 120 },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },

  eyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: 6 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Card heads
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  // Legend
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  // Bar chart
  chartCard: { borderRadius: 18, padding: 22 },
  chart: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  barGroup: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValueSlot: { height: 18, justifyContent: 'flex-end', marginBottom: 6 },
  barValue: { fontSize: 11, fontWeight: '800' },
  barTrack: {
    width: 10,
    height: 132,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
  },
  barLabel: { fontSize: 11, fontWeight: '700', marginTop: 12 },

  // Stats grid 2x2
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 18, padding: 18 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4 },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1, marginBottom: 4 },
  statLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Triggers
  triggerCard: { borderRadius: 18, padding: 22, marginTop: 20 },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  triggerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerBody: { flex: 1 },
  triggerLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  triggerLabel: { flex: 1, fontSize: 13, fontWeight: '700', paddingRight: 8, letterSpacing: -0.2 },
  triggerTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  triggerFill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 6,
  },
  triggerPct: { fontSize: 13, fontWeight: '800', textAlign: 'right' },

  // Empty states
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  emptyState: { alignItems: 'center', paddingVertical: 36 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 260 },
});
