import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation/Navigator';

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
  { minutes: 20, title: 'Nabız Normale Döndü', icon: 'pulse-outline' },
  { minutes: 480, title: 'Kan Oksijeni Arttı', icon: 'water-outline' },
  { minutes: 1440, title: 'Nikotin Vücudu Terk Etti', icon: 'sparkles-outline' },
  { minutes: 4320, title: 'Öksürük Azaldı', icon: 'medkit-outline' },
  { minutes: 10080, title: 'Tat ve Koku Güçlendi', icon: 'restaurant-outline' },
  { minutes: 20160, title: '2 Hafta — Kan Dolaşımı İyileşti', icon: 'fitness-outline' },
  { minutes: 43200, title: '1 Ay — Akciğerler Temizleniyor', icon: 'leaf-outline' },
  { minutes: 131400, title: '3 Ay — Nefes Rahatladı', icon: 'cloud-outline' },
  { minutes: 525600, title: '1 Yıl — Kalp Krizi Riski Yarıya İndi', icon: 'heart-outline' },
] as const;

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

// Accent constants for ProgressRing — updated to theme palette, calmer teal replaces neon cyan
const ACCENT = '#7C3AED';   // colors.primary
const TEAL = '#14B8A6';     // colors.secondary (dark) — replaces #06B6D4

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

function ProgressRing({ days, progress, colors, dayLabel, isDark }: {
  days: number; progress: number; colors: any; dayLabel: string; isDark: boolean;
}) {
  const size = 196;
  const ring = 13;
  const inner = size - ring * 2;
  const deg = Math.max(0.02, progress) * 360;
  const track = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Progress arc — conic gradient uses calmer ACCENT/TEAL palette */}
      <View
        style={[
          { position: 'absolute', width: size, height: size, borderRadius: size / 2 },
          Platform.select({
            web: {
              backgroundImage: `conic-gradient(${ACCENT} 0deg, ${TEAL} ${deg}deg, ${track} ${deg}deg 360deg)`,
            } as any,
            default: {
              borderWidth: ring,
              borderColor: track,
              borderTopColor: ACCENT,
              borderRightColor: progress >= 0.25 ? ACCENT : track,
              borderBottomColor: progress >= 0.5 ? TEAL : track,
              borderLeftColor: progress >= 0.75 ? TEAL : track,
              transform: [{ rotate: '-90deg' }],
            },
          }),
        ]}
      />
      {/* Inner mask */}
      <View style={{
        position: 'absolute', width: inner, height: inner, borderRadius: inner / 2,
        backgroundColor: colors.background,
      }} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 62, fontWeight: '800', color: colors.text, letterSpacing: -2.5, lineHeight: 66 }}>{days}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textTertiary, letterSpacing: 4, textTransform: 'uppercase', marginTop: 2 }}>{dayLabel}</Text>
      </View>
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
  const { navigate } = useNavigation();
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

  // Friendly empty state instead of bare text
  if (!journey) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🌱</Text>
          <Text style={{
            fontSize: 22, fontWeight: '700', color: colors.text,
            letterSpacing: -0.3, textAlign: 'center', marginBottom: 10,
          }}>
            {lang === 'tr' ? 'Yolculuk Başlamadı' : 'No Journey Yet'}
          </Text>
          <Text style={{
            fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22,
          }}>
            {lang === 'tr'
              ? 'Sigara bırakma yolculuğunu başlatmak için ayarlar ekranına git.'
              : 'Head to settings to start your smoke-free journey.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = calcStats(journey, elapsed);
  const nextMs = getNextMilestone(elapsed);
  const displayName = session.user?.user_metadata?.display_name ?? 'Kahraman';
  const firstName = displayName.split(' ')[0];
  const progressForRing = nextMs ? nextMs.progress : 1;
  const earnedBadges = BADGES.filter(b => (elapsed / 60000) >= b.minutesNeeded).length;

  // Solid card style — neutral shadow, no neon glow
  const card = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    ...Theme.shadows.card,
  };

  const STAT_TILES: {
    accent: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    label: string;
  }[] = [
    {
      accent: colors.secondary,
      icon: 'ban-outline',
      value: stats.avoided.toLocaleString('tr-TR'),
      label: lang === 'tr' ? 'SİGARA İÇİLMEDİ' : 'CIGS AVOIDED',
    },
    {
      accent: colors.success,
      icon: 'wallet-outline',
      value: `₺${stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
      label: lang === 'tr' ? 'TASARRUF' : 'SAVED',
    },
    {
      accent: colors.warning,
      icon: 'flame-outline',
      value: `${resistedCount}`,
      label: lang === 'tr' ? 'DİRENİLEN İSTEK' : 'RESISTED',
    },
    {
      accent: colors.primary,
      icon: 'trophy-outline',
      value: `${earnedBadges}`,
      label: lang === 'tr' ? 'ROZET' : 'BADGES',
    },
  ];

  const timerSegments = [
    { value: stats.days, label: t.day },
    { value: stats.hours, label: t.hour },
    { value: stats.minutes, label: t.minute },
  ];

  const remainingText = nextMs
    ? (nextMs.minutes < 1440
        ? `${Math.round(nextMs.minutes / 60)} ${lang === 'tr' ? 'saat' : 'hours'}`
        : nextMs.minutes < 10080
        ? `${Math.round(nextMs.minutes / 1440)} ${lang === 'tr' ? 'gün' : 'days'}`
        : nextMs.minutes < 43200
        ? `${Math.round(nextMs.minutes / 10080)} ${lang === 'tr' ? 'hafta' : 'weeks'}`
        : `${Math.round(nextMs.minutes / 43200)} ${lang === 'tr' ? 'ay' : 'months'}`)
    : '';

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
            <Text style={[s.eyebrow, { color: colors.textTertiary }]}>
              {lang === 'tr' ? 'HEDEFE DOĞRU' : 'ON YOUR WAY'}
            </Text>
            <Text style={[s.greeting, { color: colors.text }]}>{t.hello}, {firstName} 👋</Text>
          </View>
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => navigate('Community')}
          >
            <Ionicons name="people-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero ring */}
        <View style={s.hero}>
          <ProgressRing days={stats.days} progress={progressForRing} colors={colors} dayLabel={t.day} isDark={isDark} />
          <Text style={[s.heroHeadline, { color: colors.text }]}>
            {lang === 'tr' ? `${stats.days} gün sigara içmedin 🎉` : `${stats.days} days smoke-free 🎉`}
          </Text>
          <Text style={[s.heroSince, { color: colors.textTertiary }]}>
            {new Date(journey.quit_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
              day: 'numeric', month: 'long', year: 'numeric',
            })} {lang === 'tr' ? 'tarihinden beri' : 'since'}
          </Text>
        </View>

        {/* Live timer pill */}
        <View style={[s.timerCard, card]}>
          {timerSegments.map((seg, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[s.timerDivider, { backgroundColor: colors.border }]} />}
              <View style={s.timerSeg}>
                <Text style={[s.timerValue, { color: i === 0 ? colors.primary : colors.text }]}>
                  {String(seg.value).padStart(2, '0')}
                </Text>
                <Text style={[s.timerSegLabel, { color: colors.textTertiary }]}>{seg.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Stats grid */}
        <Text style={[s.eyebrow, s.sectionGap, { color: colors.textTertiary }]}>
          {lang === 'tr' ? 'GENEL BAKIŞ' : 'OVERVIEW'}
        </Text>
        <View style={s.statsGrid}>
          {STAT_TILES.map((tile, i) => (
            <View key={i} style={[s.statCard, card]}>
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

        {/* Milestone */}
        {nextMs && (
          <View style={[s.milestoneCard, card]}>
            <Text style={[s.eyebrow, { color: colors.textTertiary }]}>{t.nextMilestone}</Text>
            <View style={s.milestoneRow}>
              <View style={[s.milestoneIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={nextMs.icon as any} size={22} color={colors.primary} />
              </View>
              <Text style={[s.milestoneName, { color: colors.text }]}>{nextMs.title}</Text>
            </View>
            <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[s.progressFill, { width: `${Math.round(nextMs.progress * 100)}%` as any, backgroundColor: colors.primary }]} />
            </View>
            <View style={s.milestoneFooter}>
              <Text style={[s.milestoneFootText, { color: colors.textSecondary }]}>
                %{Math.round(nextMs.progress * 100)} {lang === 'tr' ? 'tamamlandı' : 'complete'}
              </Text>
              <Text style={[s.milestoneFootText, { color: colors.textTertiary }]}>
                {remainingText} {t.remaining}
              </Text>
            </View>
          </View>
        )}

        {/* Badges */}
        <View style={s.badgeHeader}>
          <Text style={[s.eyebrow, { color: colors.textTertiary }]}>
            {lang === 'tr' ? 'BAŞARILARIN' : 'ACHIEVEMENTS'}
          </Text>
          <Text style={[s.badgeCounter, { color: colors.primary }]}>{earnedBadges}/{BADGES.length}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {BADGES.map(badge => {
            const earned = (elapsed / 60000) >= badge.minutesNeeded;
            const name = lang === 'tr' ? badge.nameTr : badge.nameEn;
            return (
              <View key={badge.id} style={s.badgeItem}>
                <View style={[
                  s.badgeCircle,
                  earned
                    ? { backgroundColor: colors.primarySoft, borderColor: colors.primary + '66' }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: colors.border },
                ]}>
                  {earned
                    ? <Text style={{ fontSize: 26 }}>{badge.icon}</Text>
                    : <Ionicons name="lock-closed" size={20} color={colors.textTertiary} />}
                </View>
                <Text style={[s.badgeName, { color: earned ? colors.text : colors.textTertiary }]} numberOfLines={1}>{name}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.cravingBtn} onPress={onLogCraving} activeOpacity={0.9}>
            <Ionicons name="flame" size={19} color="#fff" />
            <Text style={s.cravingBtnText}>{lang === 'tr' ? 'İstek Kaydet' : 'Log Craving'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.breathingBtn, card]} onPress={onBreathing} activeOpacity={0.9}>
            <Ionicons name="leaf-outline" size={19} color={colors.text} />
            <Text style={[s.breathingBtnText, { color: colors.text }]}>{lang === 'tr' ? 'Nefes' : 'Breathe'}</Text>
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <View style={[s.quoteCard, card]}>
          <View style={[s.quoteAccent, { backgroundColor: colors.primary }]} />
          <Ionicons name="sparkles" size={16} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={[s.quoteText, { color: colors.text }]}>"{quote}"</Text>
          <Text style={[s.quoteAuthor, { color: colors.textTertiary }]}>
            — {lang === 'tr' ? 'MOTİVASYON' : 'MOTIVATION'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 16, paddingBottom: 120 },

  eyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  sectionGap: { marginTop: 28, marginBottom: 12 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: 5 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero: { alignItems: 'center', marginTop: 18, marginBottom: 24 },
  heroHeadline: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginTop: 22 },
  heroSince: { fontSize: 13, fontWeight: '500', marginTop: 6 },

  // Timer pill
  timerCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  timerSeg: { flex: 1, alignItems: 'center', gap: 3 },
  timerDivider: { width: 1, height: 30, opacity: 0.7 },
  timerValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  timerSegLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Stats grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', padding: 16 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  statIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statDot: { width: 7, height: 7, borderRadius: 4, marginTop: 4 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -1, marginBottom: 3 },
  statLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },

  // Milestone
  milestoneCard: { padding: 18, marginTop: 28 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14, marginBottom: 16 },
  milestoneIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  milestoneName: { flex: 1, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  milestoneFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  milestoneFootText: { fontSize: 12, fontWeight: '600' },

  // Badges
  badgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  badgeCounter: { fontSize: 13, fontWeight: '800' },
  badgeItem: { alignItems: 'center', width: 72, gap: 8 },
  badgeCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgeName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cravingBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16, backgroundColor: '#7C3AED',
    ...Platform.select({
      web: { boxShadow: '0 6px 18px rgba(124,58,237,0.28)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
    }),
  },
  cravingBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  breathingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 22,
  },
  breathingBtnText: { fontSize: 15, fontWeight: '700' },

  // Quote
  quoteCard: { padding: 20, marginTop: 28, overflow: 'hidden' },
  quoteAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  quoteText: { fontSize: 15, lineHeight: 23, fontWeight: '600', fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12 },
});
