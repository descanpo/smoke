import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ACCENT = '#8B5CF6';
const CYAN = '#06B6D4';
const SUCCESS = '#10B981';

type MilestoneIcon = React.ComponentProps<typeof Ionicons>['name'];

const MILESTONES: Array<{
  id: number; minutes: number; label: string; labelEn: string;
  desc: string; descEn: string; icon: MilestoneIcon;
}> = [
  { id: 1,  minutes: 20,      label: '20 Dakika', labelEn: '20 Minutes', desc: 'Nabız ve tansiyon normale döndü',                   descEn: 'Heart rate and blood pressure normalized',  icon: 'pulse-outline' },
  { id: 2,  minutes: 480,     label: '8 Saat',    labelEn: '8 Hours',    desc: 'Kan oksijen seviyesi yükseldi',                     descEn: 'Blood oxygen levels improved',              icon: 'water-outline' },
  { id: 3,  minutes: 1440,    label: '1 Gün',     labelEn: '1 Day',      desc: 'Nikotin vücuttan çıkmaya başladı',                  descEn: 'Nicotine begins leaving the body',          icon: 'sparkles-outline' },
  { id: 4,  minutes: 2880,    label: '2 Gün',     labelEn: '2 Days',     desc: 'Koku ve tat alma duyusu güçlendi',                  descEn: 'Sense of smell and taste improves',         icon: 'restaurant-outline' },
  { id: 5,  minutes: 10080,   label: '1 Hafta',   labelEn: '1 Week',     desc: 'Kan dolaşımı iyileşti',                             descEn: 'Blood circulation improves',                icon: 'walk-outline' },
  { id: 6,  minutes: 20160,   label: '2 Hafta',   labelEn: '2 Weeks',    desc: 'Akciğer temizlenmeye başladı',                      descEn: 'Lungs begin to clear',                      icon: 'leaf-outline' },
  { id: 7,  minutes: 43200,   label: '1 Ay',      labelEn: '1 Month',    desc: 'Öksürük ve nefes darlığı azaldı',                   descEn: 'Cough and shortness of breath reduced',     icon: 'cloud-outline' },
  { id: 8,  minutes: 131400,  label: '3 Ay',      labelEn: '3 Months',   desc: 'Akciğer kapasitesi arttı',                          descEn: 'Lung capacity increased',                   icon: 'fitness-outline' },
  { id: 9,  minutes: 262800,  label: '6 Ay',      labelEn: '6 Months',   desc: 'Ciddi enfeksiyon riski düştü',                      descEn: 'Risk of serious infection reduced',         icon: 'shield-checkmark-outline' },
  { id: 10, minutes: 525600,  label: '1 Yıl',     labelEn: '1 Year',     desc: 'Kalp krizi riski yarıya indi',                      descEn: 'Heart attack risk cut in half',             icon: 'heart-outline' },
  { id: 11, minutes: 2628000, label: '5 Yıl',     labelEn: '5 Years',    desc: 'İnme riski sigara içmeyenlerle eşitlendi',          descEn: 'Stroke risk equals a non-smoker',           icon: 'happy-outline' },
  { id: 12, minutes: 5256000, label: '10 Yıl',    labelEn: '10 Years',   desc: 'Akciğer kanseri riski yarıya düştü',                descEn: 'Lung cancer risk halved',                   icon: 'trophy-outline' },
];

function CurrentPulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(139,92,246,0.18)',
        transform: [{ scale: anim }],
      }} />
      <View style={nodeStyles.current}>
        <View style={nodeStyles.currentDot} />
      </View>
    </View>
  );
}

const nodeStyles = StyleSheet.create({
  current: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(139,92,246,0.4)' } as any,
      default: { shadowColor: ACCENT, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  currentDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: ACCENT,
  },
});

export default function ProgressScreen({ session, journey }: { session: any; journey: any }) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const colors = getColors(mode);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!journey) return;
    const quitDate = new Date(journey.quit_date);
    const tick = () => setElapsed(Date.now() - quitDate.getTime());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, [journey?.quit_date]);

  const quitDate = journey?.quit_date ? new Date(journey.quit_date) : null;
  const elapsedMinutes = quitDate ? (Date.now() - quitDate.getTime()) / 60000 : 0;
  const achievedCount = MILESTONES.filter(m => elapsedMinutes >= m.minutes).length;
  const overallPct = Math.round((achievedCount / MILESTONES.length) * 100);

  const prevMilestone = [...MILESTONES].filter(m => elapsedMinutes >= m.minutes).pop();
  const currMilestone = MILESTONES.find(m => elapsedMinutes < m.minutes);
  const currProgress = prevMilestone && currMilestone
    ? Math.min((elapsedMinutes - prevMilestone.minutes) / (currMilestone.minutes - prevMilestone.minutes), 1)
    : 0;

  // Canonical card surface (mirrors HomeScreen)
  const card = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: {
        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.3)' : '0 6px 20px rgba(17,17,40,0.06)',
      } as any,
      default: {
        shadowColor: isDark ? '#000' : '#111128',
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      },
    }),
  };

  const trackMuted = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[s.eyebrow, { color: ACCENT }]}>
        {lang === 'tr' ? 'İYİLEŞME' : 'RECOVERY'}
      </Text>
      <Text style={[s.title, { color: colors.text }]}>{t.healthTimeline}</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>
        {lang === 'tr'
          ? 'Vücudun her geçen gün daha iyiye gidiyor'
          : 'Your body keeps getting better every day'}
      </Text>

      {/* Summary card */}
      <View style={[s.summaryCard, card]}>
        <View style={s.summaryRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: colors.textTertiary, marginBottom: 10 }]}>
              {lang === 'tr' ? 'İLERLEME' : 'PROGRESS'}
            </Text>
            <View style={s.summaryCountRow}>
              <Text style={[s.summaryCount, { color: colors.text }]}>{achievedCount}/{MILESTONES.length}</Text>
              <Text style={[s.summaryUnit, { color: colors.textSecondary }]}>
                {lang === 'tr' ? 'HEDEF TAMAMLANDI' : 'GOALS DONE'}
              </Text>
            </View>
          </View>
          <Text style={[s.summaryPctText, { color: CYAN }]}>{overallPct}%</Text>
        </View>

        <View style={[s.summaryTrack, { backgroundColor: trackMuted }]}>
          <View style={[s.summaryFill, { width: `${overallPct}%` as any }]} />
        </View>
      </View>

      {/* Timeline */}
      <View style={s.timeline}>
        {MILESTONES.map((m, i) => {
          const achieved = elapsedMinutes >= m.minutes;
          const isCurrent = !achieved && MILESTONES.findIndex(x => elapsedMinutes < x.minutes) === i;
          const locked = !achieved && !isCurrent;
          const prevAchieved = i > 0 && elapsedMinutes >= MILESTONES[i - 1].minutes;

          const iconColor = achieved ? SUCCESS : isCurrent ? ACCENT : colors.textTertiary;

          const cardBorder = achieved
            ? (isDark ? 'rgba(16,185,129,0.30)' : 'rgba(16,185,129,0.26)')
            : isCurrent
            ? (isDark ? 'rgba(139,92,246,0.40)' : 'rgba(139,92,246,0.30)')
            : colors.border;

          const iconWellBg = achieved
            ? SUCCESS + (isDark ? '22' : '14')
            : isCurrent
            ? ACCENT + (isDark ? '22' : '14')
            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');

          const cardShadow = Platform.select({
            web: {
              boxShadow: isCurrent
                ? '0 10px 28px rgba(139,92,246,0.18)'
                : isDark ? '0 6px 18px rgba(0,0,0,0.28)' : '0 6px 18px rgba(17,17,40,0.05)',
            } as any,
            default: {
              shadowColor: isCurrent ? ACCENT : (isDark ? '#000' : '#111128'),
              shadowOpacity: isCurrent ? 0.18 : (isDark ? 0.28 : 0.05),
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: isCurrent ? 4 : 2,
            },
          });

          // Continuous connector: green through achieved segments, violet at the
          // current node, fading to muted for locked.
          const connectorColor = achieved
            ? SUCCESS
            : isCurrent
            ? ACCENT
            : trackMuted;
          const connectorOpacity = achieved ? 0.55 : isCurrent ? 0.45 : 1;

          return (
            <View key={m.id} style={s.timelineItem}>
              {/* Left track column */}
              <View style={s.trackCol}>
                {/* Connector above node (skip for first item); bridges the
                    gap between cards so the line reads continuous. */}
                {i > 0 && (
                  <View style={[
                    s.connectorTop,
                    { backgroundColor: prevAchieved ? SUCCESS : achieved ? SUCCESS : isCurrent ? ACCENT : trackMuted,
                      opacity: prevAchieved || achieved ? 0.55 : isCurrent ? 0.45 : 1 },
                  ]} />
                )}
                <View style={s.nodeSlot}>
                  {achieved ? (
                    <View style={s.nodeAchievedRing}>
                      <View style={s.nodeAchieved}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    </View>
                  ) : isCurrent ? (
                    <CurrentPulse />
                  ) : (
                    <View style={[s.nodeLocked, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                      <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
                    </View>
                  )}
                </View>
                {/* Connector below node (skip for last item) */}
                {i < MILESTONES.length - 1 && (
                  <View style={[
                    s.connector,
                    { backgroundColor: connectorColor, opacity: connectorOpacity },
                  ]} />
                )}
              </View>

              {/* Card */}
              <View style={[
                s.card,
                { backgroundColor: colors.card, borderColor: cardBorder },
                isCurrent && { borderWidth: 1.5 },
                cardShadow as any,
                locked && s.cardLocked,
              ]}>
                <View style={s.cardHeader}>
                  <View style={[s.iconWell, { backgroundColor: iconWellBg }]}>
                    <Ionicons name={m.icon} size={20} color={iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      s.cardTitle,
                      { color: locked ? colors.textTertiary : colors.text },
                    ]}>
                      {lang === 'tr' ? m.label : m.labelEn}
                    </Text>
                    <Text style={[s.cardDesc, { color: locked ? colors.textTertiary : colors.textSecondary }]}>
                      {lang === 'tr' ? m.desc : m.descEn}
                    </Text>
                  </View>
                  {achieved && (
                    <View style={s.pillAchieved}>
                      <Text style={s.pillAchievedText}>{t.achieved}</Text>
                    </View>
                  )}
                  {isCurrent && (
                    <View style={s.pillCurrent}>
                      <Text style={s.pillCurrentText}>{t.inProgress}</Text>
                    </View>
                  )}
                  {locked && (
                    <View style={[s.pillLocked, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                      <Text style={[s.pillLockedText, { color: colors.textTertiary }]}>
                        {t.locked}
                      </Text>
                    </View>
                  )}
                </View>

                {isCurrent && (
                  <View style={s.progressSection}>
                    <View style={s.progressLabelRow}>
                      <Text style={[s.progressLabel, { color: colors.textTertiary }]}>
                        {lang === 'tr' ? 'İLERLEME' : 'PROGRESS'}
                      </Text>
                      <Text style={s.progressPct}>{Math.round(currProgress * 100)}%</Text>
                    </View>
                    <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(139,92,246,0.16)' : 'rgba(139,92,246,0.10)' }]}>
                      <View style={[s.progressFill, { width: `${Math.round(currProgress * 100)}%` as any }]} />
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 120 },

  // Header
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 8, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  // Summary card
  summaryCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 30,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18 },
  summaryCountRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  summaryCount: { fontSize: 46, fontWeight: '800', letterSpacing: -2, lineHeight: 50 },
  summaryUnit: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginLeft: 10, textTransform: 'uppercase' },
  summaryPctText: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  summaryTrack: { height: 12, borderRadius: 6, overflow: 'hidden' },
  summaryFill: {
    height: '100%',
    borderRadius: 6,
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' } as any,
      default: { backgroundColor: ACCENT },
    }),
  },

  // Timeline
  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },

  // Left track
  trackCol: {
    width: 40,
    alignItems: 'center',
  },
  // Fixed-height slot that centers any node type for consistent alignment
  nodeSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Emerald ring wrapper around the achieved node
  nodeAchievedRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.20)',
  },
  nodeAchieved: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(16,185,129,0.4)' } as any,
      default: { shadowColor: SUCCESS, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  nodeLocked: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorTop: {
    width: 2,
    // Pull up to overlap the previous card's bottom margin (16) so the
    // timeline line stays continuous across the inter-card gap.
    height: 38,
    marginTop: -16,
    borderRadius: 1,
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: 20,
    borderRadius: 1,
  },

  // Cards
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  cardLocked: { opacity: 0.6 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWell: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 21 },
  cardDesc: { fontSize: 12.5, lineHeight: 18, marginTop: 5 },

  pillAchieved: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  pillAchievedText: { fontSize: 10, color: SUCCESS, fontWeight: '700', letterSpacing: 0.3 },
  pillCurrent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  pillCurrentText: { fontSize: 10, color: ACCENT, fontWeight: '700', letterSpacing: 0.3 },
  pillLocked: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pillLockedText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },

  progressSection: {
    marginTop: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(90deg, #8B5CF6, #06B6D4)' } as any,
      default: { backgroundColor: ACCENT },
    }),
  },
  progressPct: { fontSize: 11, fontWeight: '800', color: ACCENT, letterSpacing: 0.3 },
});
