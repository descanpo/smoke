import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, SafeAreaView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const BADGES = [
  { id: 'first_day',    icon: '🌟', minutesNeeded: 1440,    nameTr: 'İlk Gün',         nameEn: 'First Day',      descTr: '1 gün temiz',    descEn: '1 day clean' },
  { id: 'one_week',     icon: '💪', minutesNeeded: 10080,   nameTr: 'İlk Hafta',       nameEn: 'First Week',     descTr: '7 gün temiz',    descEn: '7 days clean' },
  { id: 'two_weeks',    icon: '🏃', minutesNeeded: 20160,   nameTr: '2 Hafta',         nameEn: '2 Weeks',        descTr: '14 gün temiz',   descEn: '14 days clean' },
  { id: 'one_month',    icon: '🫁', minutesNeeded: 43200,   nameTr: 'Bir Ay',          nameEn: 'One Month',      descTr: '30 gün temiz',   descEn: '30 days clean' },
  { id: 'three_months', icon: '🧠', minutesNeeded: 131400,  nameTr: 'Üç Ay',           nameEn: 'Three Months',   descTr: '90 gün temiz',   descEn: '90 days clean' },
  { id: 'six_months',   icon: '🛡️', minutesNeeded: 262800,  nameTr: 'Altı Ay',         nameEn: 'Six Months',     descTr: '180 gün temiz',  descEn: '180 days clean' },
  { id: 'one_year',     icon: '🏆', minutesNeeded: 525600,  nameTr: 'Yıllık Kahraman', nameEn: 'Year Hero',      descTr: '365 gün temiz',  descEn: '365 days clean' },
];

const HEALTH_MILESTONES = [
  { minutes: 20, title: 'Nabız Normale Döndü', icon: '💓' },
  { minutes: 480, title: 'Kan Oksijeni Arttı', icon: '🩸' },
  { minutes: 1440, title: 'Nikotin Vücudu Terk Etti', icon: '✨' },
  { minutes: 4320, title: 'Öksürük Azaldı', icon: '😮‍💨' },
  { minutes: 10080, title: 'Tat ve Koku Güçlendi', icon: '👃' },
  { minutes: 20160, title: '2 Hafta — Kan Dolaşımı İyileşti', icon: '🏃' },
  { minutes: 43200, title: '1 Ay — Akciğerler Temizleniyor', icon: '🫁' },
  { minutes: 131400, title: '3 Ay — Nefes Rahatladı', icon: '🌬️' },
  { minutes: 525600, title: '1 Yıl — Kalp Krizi Riski Yarıya İndi', icon: '❤️' },
];

const QUOTES_TR = [
  'Her gün sigara içmediğin, bedenine verdiğin en büyük armağandır.',
  'Bırakma yolculuğun, yarattığın en cesur hikayedir.',
  'Güçlü olmak, başlamakla değil devam etmekle ölçülür.',
  'Bugün içmediğin her sigara, yarın daha derin bir nefes almanı sağlıyor.',
  'Sigara bırakmak bir son değil, gerçek özgürlüğün başlangıcı.',
];

const QUOTES_EN = [
  'Every smoke-free day is the greatest gift you give to your body.',
  'Your quitting journey is the bravest story you have ever created.',
  'Strength is measured not by starting, but by continuing.',
  'Every cigarette you skip today means a deeper breath tomorrow.',
  'Quitting is not an ending — it is the start of true freedom.',
];

function calcStats(journey: any, elapsed: number) {
  const mins = elapsed / 60000;
  const avoided = Math.floor(mins * journey.cigarettes_per_day / 1440);
  const saved = Math.round(avoided * (journey.cost_per_pack / (journey.cigarettes_per_pack || 20)) * 100) / 100;
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = Math.floor(mins % 60);
  return { avoided, saved, days, hours, minutes };
}

function getNextMilestone(elapsed: number) {
  const mins = elapsed / 60000;
  const next = HEALTH_MILESTONES.find(m => m.minutes > mins);
  const prev = [...HEALTH_MILESTONES].reverse().find(m => m.minutes <= mins);
  if (!next) return null;
  const progress = prev
    ? (mins - prev.minutes) / (next.minutes - prev.minutes)
    : mins / next.minutes;
  return { ...next, progress: Math.min(progress, 1) };
}

function ProgressRing({ days, progress, colors, dayLabel }: { days: number; progress: number; colors: any; dayLabel: string }) {
  const size = 160;
  const strokeWidth = 9;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'rgba(6,182,212,0.12)',
      }} />
      <View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: 'transparent',
        borderTopColor: '#06B6D4',
        borderRightColor: progress >= 0.25 ? '#06B6D4' : 'transparent',
        borderBottomColor: progress >= 0.5 ? '#06B6D4' : 'transparent',
        borderLeftColor: progress >= 0.75 ? '#06B6D4' : 'transparent',
        transform: [{ rotate: '-90deg' }],
        ...Platform.select({
          web: { boxShadow: '0 0 20px rgba(6,182,212,0.45)' } as any,
          default: {
            shadowColor: '#06B6D4',
            shadowOpacity: 0.45,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
        }),
      }} />
      <Text style={{ fontSize: 42, fontWeight: '800', color: colors.text, letterSpacing: -1 }}>{days}</Text>
      <Text style={{ fontSize: 11, color: '#06B6D4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 }}>{dayLabel}</Text>
    </View>
  );
}

export default function HomeScreen({
  session,
  journey,
  onLogCraving,
  onBreathing,
}: {
  session: any;
  journey: any;
  onLogCraving: () => void;
  onBreathing: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const colors = getColors(mode);

  const quotes = lang === 'tr' ? QUOTES_TR : QUOTES_EN;
  const [elapsed, setElapsed] = useState(0);
  const [cravingCount, setCravingCount] = useState(0);
  const [resistedCount, setResistedCount] = useState(0);
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!journey) return;
    const quitTime = new Date(journey.quit_date).getTime();
    const tick = () => setElapsed(Date.now() - quitTime);
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [journey?.quit_date]);

  useEffect(() => {
    if (!session?.user?.id || !journey?.id) return;
    fetchCravingStats();
  }, [session?.user?.id, journey?.id]);

  const fetchCravingStats = async () => {
    const { data } = await supabase.from('craving_logs')
      .select('resisted')
      .eq('user_id', session.user.id)
      .eq('journey_id', journey.id);
    if (data) {
      setCravingCount(data.length);
      setResistedCount(data.filter((c: any) => c.resisted).length);
    }
  };

  if (!journey) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
          {lang === 'tr' ? 'Yolculuk bulunamadı' : 'Journey not found'}
        </Text>
      </View>
    );
  }

  const stats = calcStats(journey, elapsed);
  const nextMs = getNextMilestone(elapsed);
  const displayName = session.user?.user_metadata?.display_name ?? 'Kahraman';
  const firstName = displayName.split(' ')[0];
  const progressForRing = nextMs ? nextMs.progress : 1;

  const glassCard = {
    backgroundColor: isDark ? 'rgba(18,18,42,0.6)' : colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({ web: isDark ? { backdropFilter: 'blur(20px)' } as any : {} }),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={[s.greeting, { color: colors.text }]}>{t.hello}, {firstName} 👋</Text>
            <Text style={[s.subLabel, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'Hedefe Doğru' : 'On Your Way'}
            </Text>
            <Text style={s.timerLabel}>
              <Text style={s.timerAccent}>{stats.days} {t.day} </Text>
              <Text style={[s.timerSecondary, { color: colors.textSecondary }]}>
                {stats.hours} {t.hour} {stats.minutes} {t.minute}
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[s.bellBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={[s.heroCardBorder, { marginBottom: 16 }]}>
          <View style={[s.heroCardInner, { backgroundColor: isDark ? 'rgba(12,12,30,0.95)' : 'rgba(255,255,255,0.98)' }]}>
            <ProgressRing days={stats.days} progress={progressForRing} colors={colors} dayLabel={t.day} />
            <View style={s.heroTextWrap}>
              <Text style={s.heroBigDays}>{stats.days} {t.day}</Text>
              <Text style={[s.heroLabel, { color: colors.text }]}>{t.notSmoked} 🎉</Text>
              <Text style={[s.heroSince, { color: colors.textTertiary }]}>
                {new Date(journey.quit_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })} {lang === 'tr' ? 'tarihinden beri' : 'since'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats 2x2 Grid */}
        <View style={s.statsGrid}>
          <View style={[s.statCard, glassCard]}>
            <View style={[s.accentBar, { backgroundColor: '#06B6D4' }]} />
            <Text style={[s.statValue, { color: '#06B6D4' }]}>
              {stats.avoided.toLocaleString('tr-TR')}
            </Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>
              {lang === 'tr' ? 'SİGARA' : 'CIGS'}
            </Text>
            <Text style={[s.statSub, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'İçilmedi' : 'Avoided'}
            </Text>
          </View>
          <View style={[s.statCard, glassCard]}>
            <View style={[s.accentBar, { backgroundColor: '#10B981' }]} />
            <Text style={[s.statValue, { color: '#10B981' }]}>
              ₺{stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>
              {lang === 'tr' ? 'TASARRUF' : 'SAVED'}
            </Text>
            <Text style={[s.statSub, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'Birikiyor' : 'Growing'}
            </Text>
          </View>
          <View style={[s.statCard, glassCard]}>
            <View style={[s.accentBar, { backgroundColor: '#F59E0B' }]} />
            <Text style={[s.statValue, { color: '#F59E0B' }]}>
              {cravingCount - resistedCount}
            </Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>
              {lang === 'tr' ? 'İSTEK' : 'CRAVINGS'}
            </Text>
            <Text style={[s.statSub, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'Yenildin' : 'Lost'}
            </Text>
          </View>
          <View style={[s.statCard, glassCard]}>
            <View style={[s.accentBar, { backgroundColor: '#7C3AED' }]} />
            <Text style={[s.statValue, { color: '#7C3AED' }]}>
              {BADGES.filter(b => (elapsed / 60000) >= b.minutesNeeded).length}
            </Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>
              {lang === 'tr' ? 'ROZET' : 'BADGES'}
            </Text>
            <Text style={[s.statSub, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'Kazanıldı' : 'Earned'}
            </Text>
          </View>
        </View>

        {/* Badge Row */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            {lang === 'tr' ? 'ROZETLER' : 'BADGES'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
            {BADGES.map(badge => {
              const earned = (elapsed / 60000) >= badge.minutesNeeded;
              const name = lang === 'tr' ? badge.nameTr : badge.nameEn;
              const desc = lang === 'tr' ? badge.descTr : badge.descEn;
              return (
                <View key={badge.id} style={{
                  width: 90,
                  backgroundColor: earned
                    ? (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)')
                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'),
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: earned ? 'rgba(124,58,237,0.4)' : colors.border,
                  padding: 12,
                  alignItems: 'center',
                  opacity: earned ? 1 : 0.5,
                }}>
                  <Text style={{ fontSize: 28, marginBottom: 4 }}>{earned ? badge.icon : '🔒'}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: earned ? colors.primary : colors.textSecondary, textAlign: 'center' }}>{name}</Text>
                  <Text style={{ fontSize: 9, color: colors.textTertiary, textAlign: 'center', marginTop: 2 }}>{desc}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Milestone */}
        {nextMs && (
          <View style={[s.milestoneCard, glassCard]}>
            <View style={s.milestoneHeader}>
              <Text style={[s.milestoneLabel, { color: colors.textTertiary }]}>{t.nextMilestone}</Text>
              <Text style={s.milestonePct}>{Math.round(nextMs.progress * 100)}%</Text>
            </View>
            <View style={s.milestoneRow}>
              <Text style={{ fontSize: 22 }}>{nextMs.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.milestoneName, { color: colors.text }]}>{nextMs.title}</Text>
                <Text style={s.milestoneRemaining}>
                  {nextMs.minutes < 1440
                    ? `${Math.round(nextMs.minutes / 60)} ${lang === 'tr' ? 'Saat' : 'Hours'}`
                    : nextMs.minutes < 10080
                    ? `${Math.round(nextMs.minutes / 1440)} ${lang === 'tr' ? 'Gün' : 'Days'}`
                    : nextMs.minutes < 43200
                    ? `${Math.round(nextMs.minutes / 10080)} ${lang === 'tr' ? 'Hafta' : 'Weeks'}`
                    : `${Math.round(nextMs.minutes / 43200)} ${lang === 'tr' ? 'Ay' : 'Months'}`
                  } {t.remaining}
                </Text>
                <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                  <View style={[s.progressFill, {
                    width: `${Math.round(nextMs.progress * 100)}%` as any,
                  }]} />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.cravingBtn} onPress={onLogCraving} activeOpacity={0.85}>
            <Text style={s.actionBtnIcon}>🔥</Text>
            <Text style={s.actionBtnText}>
              {lang === 'tr' ? 'İstek Kaydet' : 'Log Craving'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.breathingBtn, glassCard]} onPress={onBreathing} activeOpacity={0.85}>
            <Text style={s.actionBtnIcon}>🫁</Text>
            <Text style={[s.actionBtnTextGlass, { color: colors.textSecondary }]}>
              {lang === 'tr' ? 'Nefes Egzersizi' : 'Breathing'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <View style={[s.quoteCard, glassCard, { borderLeftColor: '#7C3AED' }]}>
          <Text style={[s.quoteText, { color: colors.textSecondary }]}>"{quote}"</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 16, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  subLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  timerLabel: { fontSize: 16, fontWeight: '600' },
  timerAccent: {
    fontWeight: '800',
    fontSize: 18,
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      } as any,
      default: { color: '#8B5CF6' },
    }),
  },
  timerSecondary: { fontWeight: '500', fontSize: 14 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero Card
  heroCardBorder: {
    padding: 1,
    borderRadius: 24,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.4))',
      } as any,
      default: {
        backgroundColor: 'rgba(124,58,237,0.3)',
      },
    }),
  },
  heroCardInner: {
    borderRadius: 23,
    padding: 28,
    alignItems: 'center',
    gap: 14,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        boxShadow: '0 0 40px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
      } as any,
      default: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
  },
  heroTextWrap: { alignItems: 'center', gap: 4 },
  heroBigDays: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      } as any,
      default: { color: '#8B5CF6' },
    }),
  },
  heroLabel: { fontSize: 16, fontWeight: '600' },
  heroSince: { fontSize: 11 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2, marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  statSub: { fontSize: 11 },

  // Milestone
  milestoneCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestoneLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  milestonePct: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  milestoneName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  milestoneRemaining: { fontSize: 11, color: '#06B6D4', marginBottom: 8 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    ...Platform.select({
      web: { background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' } as any,
      default: { backgroundColor: '#7C3AED' },
    }),
  },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cravingBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        boxShadow: '0 0 24px rgba(124,58,237,0.4)',
      } as any,
      default: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5,
      },
    }),
  },
  breathingBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  actionBtnIcon: { fontSize: 24 },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  actionBtnTextGlass: { fontSize: 13, fontWeight: '600' },

  // Quote
  quoteCard: {
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 3,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
