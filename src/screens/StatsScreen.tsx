import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const TRIGGER_LABELS: Record<string, { label: string; labelEn: string; icon: string; color: string }> = {
  stress:     { label: 'Stres',         labelEn: 'Stress',       icon: '😫', color: '#F43F5E' },
  boredom:    { label: 'Sıkıntı',       labelEn: 'Boredom',      icon: '😑', color: '#8B5CF6' },
  social:     { label: 'Sosyal Ortam',  labelEn: 'Social',       icon: '👥', color: '#EAB308' },
  after_meal: { label: 'Yemek Sonrası', labelEn: 'After Meal',   icon: '🍽️', color: '#F97316' },
  coffee:     { label: 'Kahve Sonrası', labelEn: 'After Coffee', icon: '☕', color: '#F59E0B' },
  alcohol:    { label: 'Alkol',         labelEn: 'Alcohol',      icon: '🍺', color: '#64748B' },
  habit:      { label: 'Alışkanlık',    labelEn: 'Habit',        icon: '🔄', color: '#06B6D4' },
  emotion:    { label: 'Duygusal',      labelEn: 'Emotional',    icon: '💔', color: '#EC4899' },
  other:      { label: 'Diğer',         labelEn: 'Other',        icon: '❓', color: '#6B7280' },
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

  if (!journey) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <Text style={[s.empty, { color: colors.textSecondary }]}>
          {lang === 'tr' ? 'Yolculuk bulunamadı' : 'Journey not found'}
        </Text>
      </View>
    );
  }

  const resistPct = totalCravings > 0 ? Math.round((resistedCravings / totalCravings) * 100) : 100;
  const maxBar = Math.max(...weekly.map(d => d.count), 1);
  const triggerTotal = triggers.reduce((sum, t2) => sum + t2.count, 0) || 1;

  const glassCard = {
    backgroundColor: isDark ? 'rgba(18,18,42,0.6)' : colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({ web: isDark ? { backdropFilter: 'blur(20px)' } as any : {} }),
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Header */}
      <Text style={[s.title, { color: colors.text }]}>{t.statistics}</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>
        {lang === 'tr' ? 'Bu hafta harika gidiyorsun 📈' : "You're doing great this week 📈"}
      </Text>

      {/* Weekly Bar Chart */}
      <View style={[glassCard, s.card]}>
        <Text style={[s.cardTitle, { color: colors.text }]}>{t.weeklyActivity}</Text>
        <View style={s.chart}>
          {weekly.map((d, i) => (
            <View key={i} style={s.barGroup}>
              <View style={s.barWrap}>
                <View style={[s.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' }]} />
                {d.count > 0 && (
                  <View style={[s.bar, {
                    height: `${(d.count / maxBar) * 100}%` as any,
                    ...Platform.select({
                      web: {
                        background: d.isToday
                          ? '#06B6D4'
                          : 'linear-gradient(180deg, rgba(124,58,237,0.6) 0%, rgba(124,58,237,1) 100%)',
                        boxShadow: d.isToday ? '0 0 8px rgba(6,182,212,0.6)' : 'none',
                      } as any,
                      default: {
                        backgroundColor: d.isToday ? '#06B6D4' : '#7C3AED',
                        shadowColor: d.isToday ? '#06B6D4' : '#7C3AED',
                        shadowOpacity: d.isToday ? 0.5 : 0.2,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 0 },
                      },
                    }),
                  }]} />
                )}
              </View>
              <Text style={[s.barLabel, { color: colors.textTertiary }, d.isToday && { color: '#06B6D4', fontWeight: '700' }]}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Cards 2x2 */}
      <View style={s.statsGrid}>
        {/* Resistance Rate */}
        <View style={[glassCard, s.statCard]}>
          <Text style={[s.statCardTitle, { color: colors.textSecondary }]}>{t.resistanceRate}</Text>
          <Text style={[s.statBigValue, { color: '#10B981' }]}>{resistPct}%</Text>
          <Text style={[s.statCardDesc, { color: colors.textTertiary }]}>
            {totalCravings} {lang === 'tr' ? 'istekten' : 'of'} {resistedCravings} {lang === 'tr' ? 'direndi' : 'resisted'}
          </Text>
        </View>

        {/* Longest Streak */}
        <View style={[glassCard, s.statCard]}>
          <Text style={[s.statCardTitle, { color: colors.textSecondary }]}>{t.longestStreak}</Text>
          <Text style={[s.statBigValue, { color: '#7C3AED' }]}>{longestStreak}</Text>
          <Text style={[s.statCardDesc, { color: colors.textTertiary }]}>{t.personalRecord}</Text>
        </View>

        {/* Total Cravings */}
        <View style={[glassCard, s.statCard]}>
          <Text style={[s.statCardTitle, { color: colors.textSecondary }]}>{t.totalCravings}</Text>
          <Text style={[s.statBigValue, { color: '#F59E0B' }]}>{totalCravings}</Text>
          <Text style={[s.statCardDesc, { color: colors.textTertiary }]}>{t.cravingsLogged}</Text>
        </View>

        {/* Clean Days */}
        <View style={[glassCard, s.statCard]}>
          <Text style={[s.statCardTitle, { color: colors.textSecondary }]}>{t.cleanDays}</Text>
          <Text style={[s.statBigValue, { color: '#06B6D4' }]}>{cleanDays}</Text>
          <Text style={[s.statCardDesc, { color: colors.textTertiary }]}>{t.cleanDaysDesc}</Text>
        </View>
      </View>

      {/* Trigger Analysis */}
      {triggers.length > 0 ? (
        <View style={[glassCard, s.card]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>{t.triggerAnalysis}</Text>
          {triggers.map((trig) => {
            const info = TRIGGER_LABELS[trig.key] ?? { label: trig.key, labelEn: trig.key, icon: '❓', color: '#6B7280' };
            const widthPct = Math.round((trig.count / triggerTotal) * 100);
            return (
              <View key={trig.key} style={s.triggerRow}>
                <Text style={s.triggerIcon}>{info.icon}</Text>
                <Text style={[s.triggerLabel, { color: colors.textSecondary }]}>
                  {lang === 'tr' ? info.label : info.labelEn}
                </Text>
                <View style={[s.triggerTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <View style={[s.triggerFill, { width: `${widthPct}%` as any, backgroundColor: info.color }]} />
                </View>
                <Text style={[s.triggerPct, { color: colors.text }]}>{widthPct}%</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[glassCard, s.card, { alignItems: 'center', padding: 32 }]}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📊</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
            {lang === 'tr'
              ? 'İstek kaydetmeye başladığında tetikleyici analizi burada görünecek.'
              : 'Trigger analysis will appear here once you start logging cravings.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 52, paddingBottom: 120 },
  empty: { textAlign: 'center', marginTop: 100 },

  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 20 },

  card: {
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 16 },

  // Bar chart
  chart: {
    flexDirection: 'row',
    height: 180,
    gap: 6,
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  barGroup: { flex: 1, alignItems: 'center', gap: 6 },
  barWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 6,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: { fontSize: 10, fontWeight: '500' },

  // Stats grid 2x2
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
  },
  statCardTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontWeight: '600',
  },
  statBigValue: { fontSize: 32, fontWeight: '800', marginBottom: 4, letterSpacing: -1 },
  statCardDesc: { fontSize: 11, lineHeight: 16 },

  // Triggers
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  triggerIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  triggerLabel: { width: 110, fontSize: 13, fontWeight: '500' },
  triggerTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  triggerFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  triggerPct: { width: 32, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});
