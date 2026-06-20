import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { HEALTH_MILESTONES as MILESTONES } from '../../constants/milestones';

function CurrentPulse({ primaryColor }: { primaryColor: string }) {
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
        backgroundColor: primaryColor + '2A',
        transform: [{ scale: anim }],
      }} />
      <View style={[nodeStyles.current, { borderColor: primaryColor }]}>
        <View style={[nodeStyles.currentDot, { backgroundColor: primaryColor }]} />
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
    borderColor: '#7C3AED', // overridden inline
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  currentDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#7C3AED', // overridden inline
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

  const cardStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    ...Theme.shadows.card,
  };

  const trackMuted = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[s.eyebrow, { color: colors.textSecondary }]}>
        {lang === 'tr' ? 'İYİLEŞME' : 'RECOVERY'}
      </Text>
      <Text style={[s.title, { color: colors.text }]}>{t.healthTimeline}</Text>
      <Text style={[s.subtitle, { color: colors.textSecondary }]}>
        {lang === 'tr'
          ? 'Vücudun her geçen gün daha iyiye gidiyor'
          : 'Your body keeps getting better every day'}
      </Text>

      {/* Summary card */}
      <View style={[s.summaryCard, cardStyle]}>
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
          <Text style={[s.summaryPctText, { color: colors.secondary }]}>{overallPct}%</Text>
        </View>

        <View style={[s.summaryTrack, { backgroundColor: trackMuted }]}>
          <View style={[s.summaryFill, { width: `${overallPct}%` as any, backgroundColor: colors.primary }]} />
        </View>
      </View>

      {/* Timeline */}
      <View style={s.timeline}>
        {MILESTONES.map((m, i) => {
          const achieved = elapsedMinutes >= m.minutes;
          const isCurrent = !achieved && MILESTONES.findIndex(x => elapsedMinutes < x.minutes) === i;
          const locked = !achieved && !isCurrent;
          const prevAchieved = i > 0 && elapsedMinutes >= MILESTONES[i - 1].minutes;

          const iconColor = achieved ? colors.success : isCurrent ? colors.primary : colors.textTertiary;

          const cardBorder = achieved
            ? (isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.20)')
            : isCurrent
            ? (isDark ? 'rgba(124,58,237,0.30)' : 'rgba(124,58,237,0.22)')
            : colors.border;

          const iconWellBg = achieved
            ? (isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.10)')
            : isCurrent
            ? colors.primarySoft
            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');

          // Neutral card shadow for all states; isCurrent gets slightly more elevation
          const cardShadow = isCurrent ? Theme.shadows.medium : Theme.shadows.card;

          // Continuous connector
          const connectorColor = achieved
            ? colors.success
            : isCurrent
            ? colors.primary
            : trackMuted;
          const connectorOpacity = achieved ? 0.55 : isCurrent ? 0.45 : 1;

          return (
            <View key={m.id} style={s.timelineItem}>
              {/* Left track column */}
              <View style={s.trackCol}>
                {i > 0 && (
                  <View style={[
                    s.connectorTop,
                    { backgroundColor: prevAchieved ? colors.success : achieved ? colors.success : isCurrent ? colors.primary : trackMuted,
                      opacity: prevAchieved || achieved ? 0.55 : isCurrent ? 0.45 : 1 },
                  ]} />
                )}
                <View style={s.nodeSlot}>
                  {achieved ? (
                    <View style={[s.nodeAchievedRing, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : 'rgba(16,185,129,0.10)' }]}>
                      <View style={[s.nodeAchieved, { backgroundColor: colors.success, ...Theme.shadows.soft }]}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    </View>
                  ) : isCurrent ? (
                    <CurrentPulse primaryColor={colors.primary} />
                  ) : (
                    <View style={[s.nodeLocked, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                      <Ionicons name="lock-closed" size={12} color={colors.textTertiary} />
                    </View>
                  )}
                </View>
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
                      {lang === 'tr' ? m.titleTr : m.titleEn}
                    </Text>
                    <Text style={[s.cardDesc, { color: locked ? colors.textTertiary : colors.textSecondary }]}>
                      {lang === 'tr' ? m.descTr : m.descEn}
                    </Text>
                  </View>
                  {achieved && (
                    <View style={[s.pillAchieved, { backgroundColor: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.10)' }]}>
                      <Text style={[s.pillAchievedText, { color: colors.success }]}>{t.achieved}</Text>
                    </View>
                  )}
                  {isCurrent && (
                    <View style={[s.pillCurrent, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[s.pillCurrentText, { color: colors.primary }]}>{t.inProgress}</Text>
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
                      <Text style={[s.progressPct, { color: colors.primary }]}>{Math.round(currProgress * 100)}%</Text>
                    </View>
                    <View style={[s.progressTrack, { backgroundColor: colors.primarySoft }]}>
                      <View style={[s.progressFill, { width: `${Math.round(currProgress * 100)}%` as any, backgroundColor: colors.primary }]} />
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
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginTop: 8, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  // Summary card
  summaryCard: {
    borderRadius: 18,
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
  nodeSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeAchievedRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeAchieved: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 18,
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
  },
  pillAchievedText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  pillCurrent: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pillCurrentText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
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
  },
  progressPct: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});
