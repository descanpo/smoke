import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useJourneyStore } from '@/store/journeyStore';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { HEALTH_MILESTONES } from '@/constants/milestones';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { user, profile } = useAuthStore();
  const { journey, stats, fetchJourney, fetchStats } = useJourneyStore();
  const [quote, setQuote] = useState<{ text_tr: string; author: string | null } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (user) {
      fetchJourney(user.id);
      fetchStats(user.id);
    }
    fetchQuote();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user && journey) fetchStats(user.id);
  }, [tick]);

  const fetchQuote = async () => {
    const { data } = await supabase
      .from('motivational_quotes')
      .select('text_tr, author')
      .limit(10);
    if (data && data.length > 0) {
      setQuote(data[Math.floor(Math.random() * data.length)]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await fetchJourney(user.id);
      await fetchStats(user.id);
    }
    setRefreshing(false);
  };

  const getNextMilestone = () => {
    if (!stats) return null;
    const minutesSmokeeFree = stats.minutesSmokeeFree;
    return HEALTH_MILESTONES.find((m) => m.minutesElapsed > minutesSmokeeFree);
  };

  const getProgressToNextMilestone = () => {
    if (!stats) return 0;
    const minutesSmokeeFree = stats.minutesSmokeeFree;
    const next = HEALTH_MILESTONES.find((m) => m.minutesElapsed > minutesSmokeeFree);
    const prev = [...HEALTH_MILESTONES].reverse().find((m) => m.minutesElapsed <= minutesSmokeeFree);
    if (!next) return 100;
    if (!prev) return (minutesSmokeeFree / next.minutesElapsed) * 100;
    return ((minutesSmokeeFree - prev.minutesElapsed) / (next.minutesElapsed - prev.minutesElapsed)) * 100;
  };

  const formatTime = () => {
    if (!stats) return { d: '0', h: '00', m: '00' };
    const days = stats.daysSmokeeFree;
    const hours = stats.hoursSmokeeFree % 24;
    const mins = stats.minutesSmokeeFree % 60;
    return {
      d: String(days),
      h: String(hours).padStart(2, '0'),
      m: String(mins).padStart(2, '0'),
    };
  };

  const time = formatTime();
  const nextMilestone = getNextMilestone();
  const progress = getProgressToNextMilestone();

  if (!journey) {
    return (
      <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
          <Text style={{ fontSize: 64 }}>🚭</Text>
          <Text style={[Typography.h2, { color: Colors.dark.text, marginTop: Spacing.lg, textAlign: 'center' }]}>
            Hazır mısın?
          </Text>
          <Text style={[Typography.body, { color: Colors.dark.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
            Sigarayı bırakma yolculuğuna başlamak için devam et.
          </Text>
          <TouchableOpacity
            style={[styles.startBtn, { marginTop: Spacing.xl }]}
            onPress={() => router.push('/onboarding')}
          >
            <Text style={styles.startBtnText}>Başia! 🚀</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>
                Merhaba, {profile?.display_name?.split(' ')[0] || 'Kahraman'} 👋
              </Text>
              <Text style={styles.subGreeting}>Sigarasız hayata devam ediyorsun</Text>
            </View>
            <TouchableOpacity
              style={styles.cravingBtn}
              onPress={() => router.push('/craving')}
            >
              <Text style={styles.cravingBtnText}>🔥 İstek</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.timerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.timerLabel}>Sigarasız geçen süre</Text>
            <View style={styles.timerRow}>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{time.d}</Text>
                <Text style={styles.timerUnitLabel}>Gün</Text>
              </View>
              <Text style={styles.timerSep}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{time.h}</Text>
                <Text style={styles.timerUnitLabel}>Saat</Text>
              </View>
              <Text style={styles.timerSep}>:</Text>
              <View style={styles.timerUnit}>
                <Text style={styles.timerValue}>{time.m}</Text>
                <Text style={styles.timerUnitLabel}>Dakika</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🚭</Text>
              <Text style={styles.statValue}>{stats?.cigarettesAvoided ?? 0}</Text>
              <Text style={styles.statLabel}>Sigara İçmedin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>
                {(stats?.moneySaved ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.statLabel}>TL Biriktirdin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{stats?.cravingsResisted ?? 0}</Text>
              <Text style={styles.statLabel}>İstek Yendin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏅</Text>
              <Text style={styles.statValue}>{stats?.achievementCount ?? 0}</Text>
              <Text style={styles.statLabel}>Rozet</Text>
            </View>
          </View>

          {nextMilestone && (
            <TouchableOpacity
              style={styles.milestoneCard}
              onPress={() => router.push('/(tabs)/progress')}
            >
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneIcon}>{nextMilestone.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.milestoneTitle}>Sonraki: {nextMilestone.titleTr}</Text>
                  <Text style={styles.milestoneDesc} numberOfLines={2}>
                    {nextMilestone.descriptionTr}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
              </View>
              <Text style={styles.progressPct}>{Math.round(progress)}% tamamlandı</Text>
            </TouchableOpacity>
          )}

          {quote && (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>“{quote.text_tr}”</Text>
              {quote.author && <Text style={styles.quoteAuthor}>— {quote.author}</Text>}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/breathing')}
            >
              <Text style={styles.actionIcon}>🌬️</Text>
              <Text style={styles.actionLabel}>Nefes Egzersizi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/craving')}
            >
              <Text style={styles.actionIcon}>🔥</Text>
              <Text style={styles.actionLabel}>İstek Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(tabs)/community')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Topluluk</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { ...Typography.h3, color: Colors.dark.text },
  subGreeting: { ...Typography.bodySmall, color: Colors.dark.textSecondary, marginTop: 2 },
  cravingBtn: {
    backgroundColor: '#FF4444',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cravingBtnText: { ...Typography.label, color: '#fff' },
  timerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  timerLabel: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timerUnit: { alignItems: 'center', minWidth: 64 },
  timerValue: { fontSize: 48, fontWeight: '700', color: '#fff', lineHeight: 56 },
  timerUnitLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  timerSep: { fontSize: 36, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 4,
  },
  statIcon: { fontSize: 24 },
  statValue: { ...Typography.h3, color: Colors.dark.text },
  statLabel: { ...Typography.caption, color: Colors.dark.textSecondary, textAlign: 'center' },
  milestoneCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    gap: Spacing.sm,
  },
  milestoneHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  milestoneIcon: { fontSize: 32 },
  milestoneTitle: { ...Typography.label, color: Colors.primary },
  milestoneDesc: { ...Typography.bodySmall, color: Colors.dark.textSecondary, marginTop: 2 },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.dark.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: BorderRadius.full },
  progressPct: { ...Typography.caption, color: Colors.dark.textTertiary, textAlign: 'right' },
  quoteCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  quoteText: { ...Typography.body, color: Colors.dark.text, fontStyle: 'italic', lineHeight: 26 },
  quoteAuthor: { ...Typography.caption, color: Colors.dark.textSecondary, marginTop: Spacing.sm },
  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.xs,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { ...Typography.caption, color: Colors.dark.textSecondary, textAlign: 'center' },
  startBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  startBtnText: { ...Typography.label, color: '#fff', fontSize: 16 },
});
