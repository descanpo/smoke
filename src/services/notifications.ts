import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleStreakReminder(lang: 'tr' | 'en') {
  if (Platform.OS === 'web') return;
  // Cancel existing streak reminders before re-scheduling
  await cancelNotificationsByTag('streak');

  const title = lang === 'tr' ? '🚭 Sigara İçmedin!' : '🚭 Smoke-Free Streak!';
  const body = lang === 'tr'
    ? 'Bugün de harika gidiyorsun. Streakini koru!'
    : 'You\'re doing great today. Keep your streak going!';

  // Daily at 09:00
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { tag: 'streak' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

export async function scheduleEveningCheckIn(lang: 'tr' | 'en') {
  if (Platform.OS === 'web') return;
  await cancelNotificationsByTag('evening');

  const title = lang === 'tr' ? '🌙 Bugün nasıldı?' : '🌙 How was today?';
  const body = lang === 'tr'
    ? 'İstek yaşadıysan kaydet, kendine iyi bak!'
    : 'Log any cravings you had today. Take care of yourself!';

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { tag: 'evening' } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 0,
    },
  });
}

export async function scheduleMilestoneNotification(
  milestoneLabel: string,
  triggerMs: number,
  lang: 'tr' | 'en',
) {
  if (Platform.OS === 'web') return;
  if (triggerMs <= 0) return;

  const title = lang === 'tr'
    ? `🎉 Dönüm Noktası: ${milestoneLabel}`
    : `🎉 Milestone: ${milestoneLabel}`;
  const body = lang === 'tr'
    ? 'Tebrikler! Yeni bir sağlık hedefine ulaştın.'
    : 'Congratulations! You\'ve reached a new health milestone.';

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { tag: 'milestone', label: milestoneLabel } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.ceil(triggerMs / 1000),
      repeats: false,
    },
  });
}

export async function cancelAllNotifications() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function cancelNotificationsByTag(tag: string) {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

// Schedule all milestone notifications from the journey quit date
export async function scheduleMilestoneNotifications(
  quitDateIso: string,
  lang: 'tr' | 'en',
) {
  if (Platform.OS === 'web') return;
  await cancelNotificationsByTag('milestone');

  const MILESTONES = [
    { minutes: 20,      labelTr: '20 Dakika', labelEn: '20 Minutes' },
    { minutes: 480,     labelTr: '8 Saat',    labelEn: '8 Hours' },
    { minutes: 1440,    labelTr: '1 Gün',     labelEn: '1 Day' },
    { minutes: 10080,   labelTr: '1 Hafta',   labelEn: '1 Week' },
    { minutes: 43200,   labelTr: '1 Ay',      labelEn: '1 Month' },
    { minutes: 131400,  labelTr: '3 Ay',      labelEn: '3 Months' },
    { minutes: 525600,  labelTr: '1 Yıl',     labelEn: '1 Year' },
  ];

  const quitTime = new Date(quitDateIso).getTime();
  const now = Date.now();

  for (const m of MILESTONES) {
    const triggerAt = quitTime + m.minutes * 60000;
    const msFromNow = triggerAt - now;
    if (msFromNow > 0) {
      const label = lang === 'tr' ? m.labelTr : m.labelEn;
      await scheduleMilestoneNotification(label, msFromNow, lang);
    }
  }
}
