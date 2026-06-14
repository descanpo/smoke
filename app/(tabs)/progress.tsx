import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useJourneyStore } from '@/store/journeyStore';
import { supabase } from '@/lib/supabase';
import { HEALTH_MILESTONES } from '@/constants/milestones';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface DbMilestone {
  id: string;
  minutes_elapsed: number;
  title_tr: string;
  description_tr: string;
  icon: string;
  body_system: string;
  severity: string;
}

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const { stats } = useJourneyStore();
  const [milestones, setMilestones] = useState<DbMilestone[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    fetchMilestones();
    if (user) fetchAchievements(user.id);
  }, [user]);

  const fetchMilestones = async () => {
    const { data } = await supabase
      .from('health_milestones')
      .select('*')
      .order('minutes_elapsed', { ascending: true });
    if (data) setMilestones(data);
  };

  const fetchAchievements = async (userId: string) => {
    const { data } = await supabase
      .from('user_achievements')
      .select('*, achievements(*)')
      .eq('user_id', userId);
    if (data) setAchievements(data);
  };

  const minutesSmokeeFree = stats?.minutesSmokeeFree ?? 0;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return Colors.info;
      case 'moderate': return Colors.warning;
      case 'major': return Colors.success;
      case 'life_changing': return Colors.primary;
      default: return Colors.dark.textSecondary;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'minor': return 'Küçük İyileşme';
      case 'moderate': return 'Orta İyileşme';
      case 'major': return 'Büyuk İyileşme';
      case 'life_changing': return 'Hayat Değiştirici!';
      default: return '';
    }
  };

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.pageTitle}>Sağlık İlerlemen</Text>
          <Text style={styles.pageSubtitle}>
            Sigarayı bıraktığında vücudunda neler oluyor
          </Text>

          <View style={styles.timeline}>
            {milestones.map((milestone, index) => {
              const achieved = minutesSmokeeFree >= milestone.minutes_elapsed;
              const isNext = !achieved &&
                milestones.slice(0, index).every((m) => minutesSmokeeFree >= m.minutes_elapsed);

              return (
                <View key={milestone.id} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        achieved && styles.timelineDotAchieved,
                        isNext && styles.timelineDotNext,
                      ]}
                    >
                      <Text style={styles.timelineDotIcon}>
                        {achieved ? '✓' : milestone.icon}
                      </Text>
                    </View>
                    {index < milestones.length - 1 && (
                      <View
                        style={[
                          styles.timelineConnector,
                          achieved && styles.timelineConnectorAchieved,
                        ]}
                      />
                    )}
                  </View>

                  <View
                    style={[
                      styles.timelineCard,
                      achieved && styles.timelineCardAchieved,
                      isNext && styles.timelineCardNext,
                      !achieved && !isNext && styles.timelineCardLocked,
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Text
                        style={[
                          styles.cardTitle,
                          !achieved && !isNext && styles.cardTitleLocked,
                        ]}
                      >
                        {milestone.title_tr}
                      </Text>
                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: getSeverityColor(milestone.severity) + '22' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityText,
                            { color: getSeverityColor(milestone.severity) },
                          ]}
                        >
                          {getSeverityLabel(milestone.severity)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.cardDesc,
                        !achieved && !isNext && styles.cardDescLocked,
                      ]}
                    >
                      {milestone.description_tr}
                    </Text>
                    {achieved && (
                      <Text style={styles.achievedBadge}>✅ Ulaştın!</Text>
                    )}
                    {isNext && (
                      <Text style={styles.nextBadge}>⏰ Sıradaki hedef</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {achievements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kazanılan Rozetler 🏅</Text>
              <View style={styles.badgesGrid}>
                {achievements.map((ua) => (
                  <View key={ua.id} style={styles.badgeCard}>
                    <Text style={styles.badgeIcon}>{ua.achievements?.icon}</Text>
                    <Text style={styles.badgeTitle}>{ua.achievements?.title_tr}</Text>
                  </View>
                ))}
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
  pageSubtitle: { ...Typography.body, color: Colors.dark.textSecondary },
  timeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: Spacing.md },
  timelineLeft: { alignItems: 'center', width: 40 },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.card,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotAchieved: { backgroundColor: Colors.success + '33', borderColor: Colors.success },
  timelineDotNext: { backgroundColor: Colors.primary + '33', borderColor: Colors.primary },
  timelineDotIcon: { fontSize: 16 },
  timelineConnector: { width: 2, flex: 1, backgroundColor: Colors.dark.border, marginVertical: 4 },
  timelineConnectorAchieved: { backgroundColor: Colors.success },
  timelineCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  timelineCardAchieved: { borderColor: Colors.success + '44' },
  timelineCardNext: { borderColor: Colors.primary + '66' },
  timelineCardLocked: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  cardTitle: { ...Typography.label, color: Colors.dark.text, flex: 1 },
  cardTitleLocked: { color: Colors.dark.textTertiary },
  cardDesc: { ...Typography.bodySmall, color: Colors.dark.textSecondary, lineHeight: 20 },
  cardDescLocked: { color: Colors.dark.textTertiary },
  severityBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  severityText: { fontSize: 10, fontWeight: '600' },
  achievedBadge: { ...Typography.caption, color: Colors.success, marginTop: Spacing.xs },
  nextBadge: { ...Typography.caption, color: Colors.primary, marginTop: Spacing.xs },
  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.h3, color: Colors.dark.text },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minWidth: 80,
    gap: 4,
  },
  badgeIcon: { fontSize: 28 },
  badgeTitle: { ...Typography.caption, color: Colors.dark.textSecondary, textAlign: 'center' },
});
