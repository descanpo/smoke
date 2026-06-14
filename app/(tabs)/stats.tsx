import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useJourneyStore } from '@/store/journeyStore';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { user } = useAuthStore();
  const { journey, stats } = useJourneyStore();
  const [weeklyData, setWeeklyData] = useState<{ date: string; cravings: number; resisted: number }[]>([]);
  const [triggerStats, setTriggerStats] = useState<{ trigger: string; count: number }[]>([]);

  useEffect(() => {
    if (user && journey) {
      fetchWeeklyData();
      fetchTriggerStats();
    }
  }, [user, journey]);

  const fetchWeeklyData = async () => {
    if (!journey) return;
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const results = await Promise.all(
      days.map(async (day) => {
        const startOfDay = new Date(day.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(day.setHours(23, 59, 59, 999)).toISOString();
        const { data } = await supabase
          .from('craving_logs')
          .select('resisted')
          .eq('user_id', user!.id)
          .gte('logged_at', startOfDay)
          .lte('logged_at', endOfDay);
        return {
          date: format(day, 'EEE', { locale: tr }),
          cravings: data?.length ?? 0,
          resisted: data?.filter((c) => c.resisted).length ?? 0,
        };
      })
    );
    setWeeklyData(results);
  };

  const fetchTriggerStats = async () => {
    if (!journey) return;
    const { data } = await supabase
      .from('craving_logs')
      .select('trigger_type')
      .eq('user_id', user!.id)
      .eq('journey_id', journey.id)
      .not('trigger_type', 'is', null);
    if (!data) return;
    const counts: Record<string, number> = {};
    data.forEach((c) => {
      if (c.trigger_type) counts[c.trigger_type] = (counts[c.trigger_type] ?? 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([trigger, count]) => ({ trigger, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setTriggerStats(sorted);
  };

  const daysSmokeFree = stats?.daysSmokeeFree ?? 0;
  const moneySaved = stats?.moneySaved ?? 0;
  const cigarettesAvoided = stats?.cigarettesAvoided ?? 0;
  const resistanceRate =
    stats && stats.cravingsTotal > 0
      ? Math.round((stats.cravingsResisted / stats.cravingsTotal) * 100)
      : 100;

  const maxCravings = Math.max(...weeklyData.map((d) => d.cravings), 1);

  const triggerLabels: Record<string, string> = {
    stress: 'Stres',
    boredom: 'Sıkıntı',
    social: 'Sosyal',
    after_meal: 'Yemek Sonrası',
    coffee: 'Kahve',
    alcohol: 'Alkol',
    habit: 'Alışkanlık',
    emotion: 'Duygusal',
    other: 'Diğer',
  };

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.pageTitle}>statistikler</Text>

          <View style={styles.bigStatsRow}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.bigStatCard}>
              <Text style={styles.bigStatValue}>{daysSmokeFree}</Text>
              <Text style={styles.bigStatLabel}>Gün Sigarasız</Text>
            </LinearGradient>
            <View style={{ flex: 1, gap: Spacing.sm }}>
              <View style={styles.smallStatCard}>
                <Text style={styles.smallStatValue}>{cigarettesAvoided}</Text>
                <Text style={styles.smallStatLabel}>Sigara İçmedin</Text>
              </View>
              <View style={[styles.smallStatCard, { borderColor: Colors.success + '44' }]}>
                <Text style={[styles.smallStatValue, { color: Colors.success }]}>
                  {moneySaved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                </Text>
                <Text style={styles.smallStatLabel}>Tasarruf</Text>
              </View>
            </View>
          </View>

          <View style={styles.resistanceCard}>
            <View style={styles.resistanceHeader}>
              <Text style={styles.sectionTitle}>İstek Direnme Oranı</Text>
              <Text style={styles.resistanceValue}>{resistanceRate}%</Text>
            </View>
            <View style={styles.resistanceBar}>
              <View style={[styles.resistanceFill, { width: `${resistanceRate}%` }]} />
            </View>
            <Text style={styles.resistanceDesc}>
              {stats?.cravingsResisted ?? 0}/{stats?.cravingsTotal ?? 0} isteğe direndin
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Haftalık İstek Grafigi</Text>
            <View style={styles.barChart}>
              {weeklyData.map((d, i) => (
                <View key={i} style={styles.barGroup}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(d.cravings / maxCravings) * 100}%`,
                          backgroundColor: Colors.primary + '88',
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${(d.resisted / maxCravings) * 100}%`,
                          backgroundColor: Colors.success,
                          position: 'absolute',
                          bottom: 0,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{d.date}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary + '88' }]} />
                <Text style={styles.legendText}>İstekler</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.legendText}>Direnilenler</Text>
              </View>
            </View>
          </View>

          {triggerStats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>En Sık Tetikleyiciler</Text>
              {triggerStats.map((t, i) => (
                <View key={t.trigger} style={styles.triggerRow}>
                  <Text style={styles.triggerRank}>#{i + 1}</Text>
                  <Text style={styles.triggerName}>{triggerLabels[t.trigger] ?? t.trigger}</Text>
                  <View style={styles.triggerBar}>
                    <View
                      style={[
                        styles.triggerBarFill,
                        { width: `${(t.count / triggerStats[0].count) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.triggerCount}>{t.count}</Text>
                </View>
              ))}
            </View>
          )}

          {journey && (
            <View style={styles.journeyInfo}>
              <Text style={styles.sectionTitle}>Yolculuk Bilgileri</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Başlangıç</Text>
                  <Text style={styles.infoValue}>
                    {new Date(journey.quit_date).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Günlük Sigara</Text>
                  <Text style={styles.infoValue}>{journey.cigarettes_per_day} adet</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Paket Fiyatı</Text>
                  <Text style={styles.infoValue}>{journey.cost_per_pack} TL</Text>
                </View>
                {journey.brand && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Marka</Text>
                    <Text style={styles.infoValue}>{journey.brand}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.lg },
  pageTitle: { ...Typography.h2, color: Colors.dark.text },
  bigStatsRow: { flexDirection: 'row', gap: Spacing.md, height: 160 },
  bigStatCard: { flex: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  bigStatValue: { fontSize: 42, fontWeight: '700', color: '#fff' },
  bigStatLabel: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  smallStatCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  smallStatValue: { ...Typography.h4, color: Colors.dark.text },
  smallStatLabel: { ...Typography.caption, color: Colors.dark.textSecondary },
  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.dark.text },
  resistanceCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.sm,
  },
  resistanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resistanceValue: { ...Typography.h3, color: Colors.primary },
  resistanceBar: { height: 8, backgroundColor: Colors.dark.border, borderRadius: BorderRadius.full, overflow: 'hidden' },
  resistanceFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  resistanceDesc: { ...Typography.caption, color: Colors.dark.textSecondary },
  barChart: { flexDirection: 'row', gap: Spacing.xs, height: 120, alignItems: 'flex-end' },
  barGroup: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barContainer: { flex: 1, width: '100%', justifyContent: 'flex-end', position: 'relative' },
  bar: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { ...Typography.caption, color: Colors.dark.textTertiary, fontSize: 10 },
  legend: { flexDirection: 'row', gap: Spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { ...Typography.caption, color: Colors.dark.textSecondary },
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  triggerRank: { ...Typography.caption, color: Colors.dark.textTertiary, width: 24 },
  triggerName: { ...Typography.bodySmall, color: Colors.dark.textSecondary, width: 100 },
  triggerBar: { flex: 1, height: 8, backgroundColor: Colors.dark.border, borderRadius: BorderRadius.full, overflow: 'hidden' },
  triggerBarFill: { height: '100%', backgroundColor: Colors.warning, borderRadius: BorderRadius.full },
  triggerCount: { ...Typography.label, color: Colors.dark.text, width: 24, textAlign: 'right' },
  journeyInfo: { gap: Spacing.md },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  infoItem: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minWidth: '45%',
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoLabel: { ...Typography.caption, color: Colors.dark.textTertiary },
  infoValue: { ...Typography.label, color: Colors.dark.text, marginTop: 4 },
});
