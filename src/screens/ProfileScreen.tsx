import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Linking, Platform, Alert, SafeAreaView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getColors } from '../theme/Theme';

function calcStats(journey: any) {
  const mins = (Date.now() - new Date(journey.quit_date).getTime()) / 60000;
  const days = Math.floor(mins / 1440);
  const avoided = Math.floor(mins * journey.cigarettes_per_day / 1440);
  const saved = Math.round(avoided * (journey.cost_per_pack / (journey.cigarettes_per_pack || 20)) * 100) / 100;
  return { days, avoided, saved };
}

function openURL(url: string) {
  if (Platform.OS === 'web') {
    (window as any).open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

const MOTIVATION_LABELS: Record<string, { tr: string; en: string }> = {
  health:   { tr: '❤️ Sağlık', en: '❤️ Health' },
  money:    { tr: '💰 Para', en: '💰 Money' },
  family:   { tr: '👨‍👩‍👧 Aile', en: '👨‍👩‍👧 Family' },
  sports:   { tr: '🏃 Spor', en: '🏃 Sports' },
  smell:    { tr: '🌸 Koku', en: '🌸 Smell' },
  freedom:  { tr: '🦋 Özgürlük', en: '🦋 Freedom' },
};

function getMotivationLabel(key: string, l: string): string {
  const m = MOTIVATION_LABELS[key];
  if (!m) return key;
  return l === 'tr' ? m.tr : m.en;
}

export default function ProfileScreen({
  session,
  journey,
  onJourneyReset,
}: {
  session: any;
  journey: any;
  onJourneyReset: () => void;
}) {
  const { mode, isDark, toggleTheme } = useThemeMode();
  const { lang, t, setLang } = useLanguage();
  const colors = getColors(mode);

  const stats = journey ? calcStats(journey) : { days: 0, avoided: 0, saved: 0 };
  const displayName = session.user?.user_metadata?.display_name ?? 'Kahraman';
  const email = session.user?.email ?? '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const signOut = async () => { await supabase.auth.signOut(); };

  const newJourney = async () => {
    const confirmMsg = lang === 'tr'
      ? 'Mevcut yolculuğun sona erecek. Yeni bir başlangıç yapmak istiyor musun?'
      : 'Your current journey will end. Do you want to start a new one?';
    const confirmTitle = lang === 'tr' ? 'Yeni Yolculuk' : 'New Journey';
    const cancelText = t.cancel;
    const yesText = lang === 'tr' ? 'Evet' : 'Yes';

    if (Platform.OS === 'web') {
      if ((window as any).confirm(confirmMsg)) {
        await supabase.from('quit_journeys').update({ is_active: false }).eq('user_id', session.user.id);
        onJourneyReset();
      }
    } else {
      Alert.alert(
        confirmTitle,
        confirmMsg,
        [
          { text: cancelText, style: 'cancel' },
          {
            text: yesText, style: 'destructive', onPress: async () => {
              await supabase.from('quit_journeys').update({ is_active: false }).eq('user_id', session.user.id);
              onJourneyReset();
            }
          }
        ]
      );
    }
  };

  const glassCardStyle = {
    backgroundColor: isDark ? 'rgba(18,18,42,0.6)' : colors.card,
    borderRadius: 20,
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
        <View style={s.pageHeader}>
          <Text style={[s.pageTitle, { color: colors.text }]}>{t.profile}</Text>
          <TouchableOpacity
            style={[s.settingsBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Card */}
        <View style={[glassCardStyle, s.avatarCard]}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={[s.displayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[s.email, { color: colors.textSecondary }]}>{email}</Text>
          {journey && (
            <View style={s.memberBadge}>
              <Text style={s.memberBadgeText}>🚭 {stats.days} {t.daysClean}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats Row */}
        <View style={s.statsRow}>
          <View style={[glassCardStyle, s.statPill]}>
            <Text style={[s.statValue, { color: '#10B981' }]}>
              ₺{stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[s.statLabel, { color: colors.textTertiary }]}>{t.savings}</Text>
          </View>
          <View style={[glassCardStyle, s.statPill]}>
            <Text style={[s.statValue, { color: '#7C3AED' }]}>
              {stats.avoided.toLocaleString('tr-TR')}
            </Text>
            <Text style={[s.statLabel, { color: colors.textTertiary }]}>{t.avoided}</Text>
          </View>
          <View style={[glassCardStyle, s.statPill]}>
            <Text style={[s.statValue, { color: '#06B6D4' }]}>{stats.days}</Text>
            <Text style={[s.statLabel, { color: colors.textTertiary }]}>{t.day ?? 'Gün'}</Text>
          </View>
        </View>

        {/* Journey Info Card */}
        {journey && (
          <View style={[glassCardStyle, s.glassCard]}>
            <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>{t.journeyInfo}</Text>
            {[
              {
                icon: '📅',
                label: t.quitDate,
                value: new Date(journey.quit_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                  day: 'numeric', month: 'long', year: 'numeric',
                }),
              },
              { icon: '🚬', label: t.dailyCigs, value: `${journey.cigarettes_per_day} ${lang === 'tr' ? 'adet' : 'pcs'}` },
              { icon: '💰', label: t.packPrice, value: `₺${journey.cost_per_pack}` },
              journey.motivation && { icon: '🎯', label: t.motivation, value: getMotivationLabel(journey.motivation, lang) },
            ].filter(Boolean).map((row: any, i, arr) => (
              <View key={i} style={[s.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <Text style={s.infoIcon}>{row.icon}</Text>
                <Text style={[s.infoLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                <Text style={[s.infoValue, { color: colors.text }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Support & Links Card */}
        <View style={[glassCardStyle, s.glassCard]}>
          <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>{t.supportLinks}</Text>

          <TouchableOpacity
            style={[s.supportRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={() => openURL('tel:171')}
            activeOpacity={0.7}
          >
            <Text style={s.infoIcon}>🆘</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.supportLabel, { color: '#06B6D4' }]}>{t.quitHelpline}</Text>
              <Text style={[s.supportSub, { color: colors.textTertiary }]}>{lang === 'tr' ? 'Ücretsiz 7/24' : 'Free 24/7'}</Text>
            </View>
            <Text style={[s.chevron, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          {[
            { icon: '🔒', label: t.privacyPolicy, url: 'https://descanpo.github.io/smoke/privacy.html' },
            { icon: '📄', label: t.termsLink, url: 'https://descanpo.github.io/smoke/terms.html' },
            { icon: '🇹🇷', label: t.kvkkLink, url: 'https://descanpo.github.io/smoke/kvkk.html' },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[s.supportRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => openURL(item.url)}
              activeOpacity={0.7}
            >
              <Text style={s.infoIcon}>{item.icon}</Text>
              <Text style={[s.supportLabel, { color: colors.text }]}>{item.label}</Text>
              <Text style={[s.chevron, { color: colors.textTertiary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings Card */}
        <View style={[glassCardStyle, s.glassCard]}>
          <Text style={[s.sectionTitle, { color: colors.textTertiary }]}>{t.settings}</Text>

          {/* Theme Toggle Row */}
          <View style={[s.settingsRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={s.infoIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <Text style={[s.settingsRowLabel, { color: colors.text }]}>
              {isDark ? t.darkMode : t.lightMode}
            </Text>
            <TouchableOpacity
              onPress={toggleTheme}
              activeOpacity={0.8}
              style={[
                s.togglePill,
                { backgroundColor: isDark ? '#7C3AED' : 'rgba(0,0,0,0.12)' },
              ]}
            >
              <View style={[
                s.toggleCircle,
                { transform: [{ translateX: isDark ? 20 : 0 }] },
              ]} />
            </TouchableOpacity>
          </View>

          {/* Language Toggle Row */}
          <View style={s.settingsRow}>
            <Text style={s.infoIcon}>🌐</Text>
            <Text style={[s.settingsRowLabel, { color: colors.text }]}>{t.language}</Text>
            <View style={s.langPillRow}>
              {(['tr', 'en'] as const).map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLang(l)}
                  activeOpacity={0.75}
                  style={[
                    s.langPill,
                    lang === l
                      ? { backgroundColor: '#7C3AED', borderColor: '#7C3AED' }
                      : { backgroundColor: 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
                  ]}
                >
                  <Text style={[
                    s.langPillText,
                    { color: lang === l ? '#fff' : colors.textSecondary },
                  ]}>
                    {l === 'tr' ? 'TR' : 'EN'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={[s.dangerSectionTitle, { color: colors.textTertiary }]}>{t.account}</Text>

        <TouchableOpacity style={s.resetBtn} onPress={newJourney} activeOpacity={0.8}>
          <Text style={s.resetBtnText}>{t.resetJourney}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.signOutBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <Text style={[s.signOutText, { color: colors.textSecondary }]}>{t.signOut}</Text>
        </TouchableOpacity>

        <Text style={[s.version, { color: colors.textTertiary }]}>Smoke v1.0.0 · ozgeee.od@gmail.com</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 16, paddingBottom: 120 },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Avatar card
  avatarCard: {
    alignItems: 'center',
    padding: 28,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: '#7C3AED',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        boxShadow: '0 0 30px rgba(124,58,237,0.5)',
      } as any,
      default: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
        elevation: 6,
      },
    }),
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  displayName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 13, marginBottom: 12 },
  memberBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  memberBadgeText: { fontSize: 12, fontWeight: '600', color: '#10B981' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statPill: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  // Glass card
  glassCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
    fontWeight: '600',
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  infoIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  infoLabel: { flex: 1, fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },

  // Support rows
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  supportLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  supportSub: { fontSize: 11, marginTop: 1 },
  chevron: { fontSize: 20 },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  settingsRowLabel: { flex: 1, fontSize: 14, fontWeight: '500' },

  // Toggle pill (theme switch)
  togglePill: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.3)' } as any,
      default: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    }),
  },

  // Language pills
  langPillRow: { flexDirection: 'row', gap: 6 },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  langPillText: { fontSize: 12, fontWeight: '700' },

  // Danger zone
  dangerSectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    fontWeight: '600',
  },
  resetBtn: {
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.5)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  resetBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },

  signOutBtn: {
    borderRadius: 20,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  signOutText: { fontWeight: '600', fontSize: 14 },

  version: { textAlign: 'center', fontSize: 12 },
});
