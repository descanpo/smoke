import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, Animated,
} from 'react-native';
import { getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const MILESTONES = [
  { id: 1,  minutes: 20,      label: '20 Dakika', labelEn: '20 Minutes', desc: 'Nabız ve tansiyon normale döndü',                   descEn: 'Heart rate and blood pressure normalized',  icon: '💓' },
  { id: 2,  minutes: 480,     label: '8 Saat',    labelEn: '8 Hours',    desc: 'Kan oksijen seviyesi yükseldi',                     descEn: 'Blood oxygen levels improved',              icon: '🩸' },
  { id: 3,  minutes: 1440,    label: '1 Gün',     labelEn: '1 Day',      desc: 'Nikotin vücuttan çıkmaya başladı',                  descEn: 'Nicotine begins leaving the body',          icon: '✨' },
  { id: 4,  minutes: 2880,    label: '2 Gün',     labelEn: '2 Days',     desc: 'Koku ve tat alma duyusu güçlendi',                  descEn: 'Sense of smell and taste improves',         icon: '👃' },
  { id: 5,  minutes: 10080,   label: '1 Hafta',   labelEn: '1 Week',     desc: 'Kan dolaşımı iyileşti',                             descEn: 'Blood circulation improves',                icon: '🏃' },
  { id: 6,  minutes: 20160,   label: '2 Hafta',   labelEn: '2 Weeks',    desc: 'Akciğer temizlenmeye başladı',                      descEn: 'Lungs begin to clear',                      icon: '🫁' },
  { id: 7,  minutes: 43200,   label: '1 Ay',      labelEn: '1 Month',    desc: 'Öksürük ve nefes darlığı azaldı',                   descEn: 'Cough and shortness of breath reduced',     icon: '😮‍💨' },
  { id: 8,  minutes: 131400,  label: '3 Ay',      labelEn: '3 Months',   desc: 'Akciğer kapasitesi arttı',                          descEn: 'Lung capacity increased',                   icon: '💨' },
  { id: 9,  minutes: 262800,  label: '6 Ay',      labelEn: '6 Months',   desc: 'Ciddi enfeksiyon riski düştü',                      descEn: 'Risk of serious infection reduced',         icon: '🛡️' },
  { id: 10, minutes: 525600,  label: '1 Yıl',     labelEn: '1 Year',     desc: 'Kalp krizi riski yarıya indi',                      descEn: 'Heart attack risk cut in half',             icon: '❤️' },
  { id: 11, minutes: 2628000, label: '5 Yıl',     labelEn: '5 Years',    desc: 'İnme riski sigara içmeyenlerle eşitlendi',          descEn: 'Stroke risk equals a non-smoker',           icon: '🧠' },
  { id: 12, minutes: 5256000, label: '10 Yıl',    labelEn: '10 Years',   desc: 'Akciğer kanseri riski yarıya düştü',                descEn: 'Lung cancer risk halved',                   icon: '🏆' },
];

function CurrentPulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.35, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(6,182,212,0.2)',
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(6,182,212,0.15)',
    borderWidth: 2,
    borderColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 12px rgba(6,182,212,0.6)' } as any,
      default: { shadowColor: '#06B6D4', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
    }),
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06B6D4',
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

  const prevMilestone = [...MILESTONES].filter(m => elapsedMinutes >= m.minutes).pop();
  const currMilestone = MILESTONES.find(m => elapsedMinutes < m.minutes);
  const currProgress = prevMilestone && currMilestone
    ? Math.min((elapsedMinutes - prevMilestone.minutes) / (currMilestone.minutes - prevMilestone.minutes), 1)
    : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Header */}
      <Text style={[s.title, { color: colors.text }]}>{t.healthTimeline}</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>
        {achievedCount}/{MILESTONES.length} {lang === 'tr' ? 'dönüm noktası tamamlandı' : 'milestones completed'}
      </Text>

      {/* Timeline */}
      <View style={s.timeline}>
        {MILESTONES.map((m, i) => {
          const achieved = elapsedMinutes >= m.minutes;
          const isCurrent = !achieved && MILESTONES.findIndex(x => elapsedMinutes < x.minutes) === i;
          const locked = !achieved && !isCurrent;

          const cardBg = achieved
            ? (isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.08)')
            : isCurrent
            ? (isDark ? 'rgba(6,182,212,0.06)' : 'rgba(6,182,212,0.08)')
            : (isDark ? 'rgba(18,18,42,0.5)' : colors.card);

          const cardBorder = achieved
            ? 'rgba(16,185,129,0.25)'
            : isCurrent
            ? 'rgba(6,182,212,0.4)'
            : colors.border;

          return (
            <View key={m.id} style={s.timelineItem}>
              {/* Left track column */}
              <View style={s.trackCol}>
                {achieved ? (
                  <View style={s.nodeAchieved}>
                    <Text style={{ fontSize: 11, color: '#fff', fontWeight: '800' }}>✓</Text>
                  </View>
                ) : isCurrent ? (
                  <CurrentPulse />
                ) : (
                  <View style={[s.nodeLocked, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                    <Text style={{ fontSize: 9 }}>🔒</Text>
                  </View>
                )}
                {i < MILESTONES.length - 1 && (
                  <View style={[s.connector, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }, achieved && s.connectorDone]} />
                )}
              </View>

              {/* Card */}
              <View style={[
                s.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
                locked && s.cardLocked,
                isCurrent && Platform.OS === 'web' ? { boxShadow: '0 0 20px rgba(6,182,212,0.15)' } as any : {},
              ]}>
                <View style={s.cardHeader}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      s.cardTitle,
                      achieved && { color: '#10B981' },
                      isCurrent && { color: colors.text, fontWeight: '700' },
                      locked && { color: colors.textTertiary },
                    ]}>
                      {lang === 'tr' ? m.label : m.labelEn}
                    </Text>
                  </View>
                  {achieved && (
                    <View style={s.badgeAchieved}>
                      <Text style={s.badgeAchievedText}>{t.achieved}</Text>
                    </View>
                  )}
                  {isCurrent && (
                    <View style={s.badgeCurrent}>
                      <Text style={s.badgeCurrentText}>{t.inProgress}</Text>
                    </View>
                  )}
                </View>

                {(achieved || isCurrent) && (
                  <Text style={[s.cardDesc, { color: achieved ? colors.textTertiary : colors.textSecondary }]}>
                    {lang === 'tr' ? m.desc : m.descEn}
                  </Text>
                )}

                {isCurrent && (
                  <View style={s.progressSection}>
                    <View style={[s.progressTrack, { backgroundColor: 'rgba(6,182,212,0.15)' }]}>
                      <View style={[s.progressFill, { width: `${Math.round(currProgress * 100)}%` as any }]} />
                    </View>
                    <Text style={s.progressPct}>{Math.round(currProgress * 100)}%</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 120 },

  title: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 24 },

  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },

  // Left track
  trackCol: {
    width: 40,
    alignItems: 'center',
    paddingTop: 12,
  },
  nodeAchieved: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 0 10px rgba(16,185,129,0.5)' } as any,
      default: { shadowColor: '#10B981', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
    }),
  },
  nodeLocked: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    width: 2,
    minHeight: 20,
    marginTop: 4,
    borderRadius: 1,
  },
  connectorDone: {
    backgroundColor: '#10B981',
    opacity: 0.5,
  },

  // Cards
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardLocked: { opacity: 0.5 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardDesc: { fontSize: 12, lineHeight: 18, marginBottom: 8 },

  badgeAchieved: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  badgeAchievedText: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  badgeCurrent: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(6,182,212,0.2)',
  },
  badgeCurrentText: { fontSize: 10, color: '#06B6D4', fontWeight: '600' },

  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    ...Platform.select({
      web: { background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' } as any,
      default: { backgroundColor: '#06B6D4' },
    }),
  },
  progressPct: { fontSize: 12, fontWeight: '700', color: '#06B6D4', minWidth: 32, textAlign: 'right' },
});
