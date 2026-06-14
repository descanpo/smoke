import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Theme } from '../theme/Theme';

const HEALTH_MILESTONES = [
  { minutes: 20, title: 'Nabız Normale Döndü', icon: '💓' },
  { minutes: 480, title: 'Kan Oksijeni Arttı', icon: '🩸' },
  { minutes: 1440, title: 'Nikotin Vücudu Terk Etti', icon: '✨' },
  { minutes: 4320, title: 'Öksürük Azaldı', icon: '😮‍💨' },
  { minutes: 10080, title: 'Tat ve Koku Güçlendi', icon: '👃' },
  { minutes: 20160, title: '2 Hafta — Kan Dolaşımı İyileşti', icon: '🏃' },
  { minutes: 43200, title: '1 Ay — Akciğerler Temizleniyor', icon: '?al⁩' },
  { minutes: 131400, title: '3 Ay — Nefes Rahatlandı', icon: '🌬️' },
  { minutes: 525600, title: '1 Yıl — Kalp Krizi Riski Yarıya İndi', icon: '❤️' },
];

const QUOTES = [
  'Her gün sigara içmediğin, bedenine verdiğin en büyük armaganıdır.',
  'Bırakma yolculuğun, yarattığın en cesur hikayedir.',
  'Güçlü olmak, başlamakla değil devam etmekle ölçülür.',
  'Bugün içmediğin her sigara, yarın daha derin bir nefes almamı sağlıyor.',
  'Sigara bırakmak bir son değil, gerçek özgürlüğün başlangıcı.',
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

export default function HomeScreen({
  session, journey, onLogCraving, onBreathing,
}: {
  session: any; journey: any; onLogCraving: () => void; onBreathing: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [cravingCount, setCravingCount] = useState(0);
  const [resistedCount, setResistedCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
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
    fetchBadges();
  }, [session?.user?.id, journey?.id]);

  const fetchCravingStats = async () => {
    const { data } = await supabase.from('craving_logs').select('resisted').eq('user_id', session.user.id).eq('journey_id', journey.id);
    if (data) { setCravingCount(data.length); setResistedCount(data.filter((c: any) => c.resisted).length); }
  };

  const fetchBadges = async () => {
    const { count } = await supabase.from('user_achievements').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
    setBadgeCount(count ?? 0);
  };

  if (!journey) return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: Theme.colors.textSecondary }}>Yüküyor...</Text></View>;

  const stats = calcStats(journey, elapsed);
  const nextMs = getNextMilestone(elapsed);
  const displayName = session.user?.user_metadata?.display_name ?? 'Kahraman';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Merhaba, {displayName} 👋</Text>
          <Text style={s.subGreeting}>Sigarasız güçlü bir gün daha!</Text>
        </View>
        <View style={s.timerBadge}>
          <Text style={s.timerDays}>{stats.days}</Text>
          <Text style={s.timerDaysLabel}>GÜN</Text>
        </View>
      </View>

      <View style={s.timerCard}>
        <Text style={s.timerTitle}>⏱ Sigarasız Süre</Text>
        <Text style={s.timerMain}>
          {String(stats.days).padStart(2,'0')}g{' '}
          {String(stats.hours).padStart(2,'0')}s{' '}
          {String(stats.minutes).padStart(2,'0')}dk
        </Text>
        <Text style={s.timerSince}>
          {new Date(journey.quit_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinden beri
        </Text>
      </View>

      <View style={s.statsGrid}>
        {[
          { icon: '🚬', value: stats.avoided.toLocaleString('tr-TR'), label: 'İçilmeyen Sigara', color: Theme.colors.primary },
          { icon: '💰', value: `${stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`, label: 'Tasarruf', color: Theme.colors.success },
          { icon: '💪', value: resistedCount.toString(), label: 'Direnilen İstek', color: Theme.colors.warning },
          { icon: '🏆', value: badgeCount.toString(), label: 'Rozet', color: '#FFD700' },
        ].map((item, i) => (
          <View key={i} style={s.statCard}>
            <Text style={s.statIcon}>{item.icon}</Text>
            <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {nextMs && (
        <View style={s.milestoneCard}>
          <Text style={s.milestoneTitle}>🎯 Sonraki Dönüm Noktası</Text>
          <View style={s.milestoneRow}>
            <Text style={s.milestoneIcon}>{nextMs.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.milestoneName}>{nextMs.title}</Text>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${Math.round(nextMs.progress * 100)}%` as any }]} />
              </View>
              <Text style={s.milestonePercent}>{Math.round(nextMs.progress * 100)}% tamamlandı</Text>
            </View>
          </View>
        </View>
      )}

      <View style={s.actionsRow}>
        <TouchableOpacity style={[s.actionBtn, s.cravingBtn]} onPress={onLogCraving} activeOpacity={0.85}>
          <Text style={s.actionIcon}>🔥</Text>
          <Text style={s.actionText}>İstek Kaydet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, s.breathingBtn]} onPress={onBreathing} activeOpacity={0.85}>
          <Text style={s.actionIcon}>🌬️</Text>
          <Text style={s.actionText}>Nefes Egzersizi</Text>
        </TouchableOpacity>
      </View>

      <View style={s.quoteCard}>
        <Text style={s.quoteIcon}>💬</Text>
        <Text style={s.quoteText}>“{quote}”</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 20, paddingTop: 52, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: Theme.colors.text },
  subGreeting: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 4 },
  timerBadge: { backgroundColor: Theme.colors.primary + '22', borderWidth: 1, borderColor: Theme.colors.primary, borderRadius: Theme.rounded.md, padding: 10, alignItems: 'center', minWidth: 60 },
  timerDays: { fontSize: 24, fontWeight: '800', color: Theme.colors.primary },
  timerDaysLabel: { fontSize: 9, color: Theme.colors.primary, fontWeight: '700', letterSpacing: 1 },
  timerCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.xl, borderWidth: 1, borderColor: Theme.colors.border, padding: 20, marginBottom: 16, alignItems: 'center', ...Theme.shadows.medium },
  timerTitle: { fontSize: 13, color: Theme.colors.textTertiary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  timerMain: { fontSize: 36, fontWeight: '800', color: Theme.colors.text, letterSpacing: 2 },
  timerSince: { fontSize: 12, color: Theme.colors.textTertiary, marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%' as any, backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.lg, borderWidth: 1, borderColor: Theme.colors.border, padding: 14, alignItems: 'center' },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: Theme.colors.textTertiary, textAlign: 'center' },
  milestoneCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.xl, borderWidth: 1, borderColor: Theme.colors.primary + '44', padding: 16, marginBottom: 16 },
  milestoneTitle: { fontSize: 12, color: Theme.colors.textTertiary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  milestoneIcon: { fontSize: 28 },
  milestoneName: { fontSize: 14, fontWeight: '600', color: Theme.colors.text, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: Theme.colors.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%' as any, backgroundColor: Theme.colors.primary, borderRadius: 3 },
  milestonePercent: { fontSize: 11, color: Theme.colors.textTertiary },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, borderRadius: Theme.rounded.lg, padding: 16, alignItems: 'center', borderWidth: 1, gap: 8 },
  cravingBtn: { backgroundColor: Theme.colors.error + '18', borderColor: Theme.colors.error + '66' },
  breathingBtn: { backgroundColor: Theme.colors.info + '18', borderColor: Theme.colors.info + '66' },
  actionIcon: { fontSize: 28 },
  actionText: { fontSize: 13, fontWeight: '600', color: Theme.colors.text },
  quoteCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.rounded.xl, borderWidth: 1, borderColor: Theme.colors.border, borderLeftWidth: 3, borderLeftColor: Theme.colors.primary, padding: 16, flexDirection: 'row', gap: 10 },
  quoteIcon: { fontSize: 20, marginTop: 2 },
  quoteText: { flex: 1, fontSize: 14, color: Theme.colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
});
