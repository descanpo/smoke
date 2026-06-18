import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Linking, Platform, Alert, SafeAreaView, Switch, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getColors } from '../theme/Theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ACCENT = '#8B5CF6';
const CYAN = '#06B6D4';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const ERROR = '#EF4444';

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
  health:   { tr: 'Sağlık', en: 'Health' },
  money:    { tr: 'Para', en: 'Money' },
  family:   { tr: 'Aile', en: 'Family' },
  sports:   { tr: 'Spor', en: 'Sports' },
  smell:    { tr: 'Koku', en: 'Smell' },
  freedom:  { tr: 'Özgürlük', en: 'Freedom' },
};

function getMotivationLabel(key: string, l: string): string {
  const m = MOTIVATION_LABELS[key];
  if (!m) return key;
  return l === 'tr' ? m.tr : m.en;
}

type EditField = 'quit_date' | 'cigarettes_per_day' | 'cost_per_pack' | 'motivation';

export default function ProfileScreen({
  session,
  journey,
  onJourneyReset,
  onJourneyUpdate,
}: {
  session: any;
  journey: any;
  onJourneyReset: () => void;
  onJourneyUpdate?: () => void;
}) {
  const { mode, isDark, toggleTheme } = useThemeMode();
  const { lang, t, setLang } = useLanguage();
  const colors = getColors(mode);

  const [editField, setEditField] = useState<EditField | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (field: EditField) => {
    if (!journey) return;
    if (field === 'quit_date') {
      setDraft(new Date(journey.quit_date).toISOString().slice(0, 10));
    } else if (field === 'motivation') {
      setDraft(journey.motivation ?? '');
    } else {
      setDraft(String(journey[field] ?? ''));
    }
    setEditField(field);
  };

  const saveEdit = async () => {
    if (!editField || !journey) return;
    let value: any;
    if (editField === 'quit_date') {
      const d = new Date(draft);
      if (isNaN(d.getTime())) return;
      value = d.toISOString();
    } else if (editField === 'cigarettes_per_day') {
      value = Math.max(0, parseInt(draft, 10) || 0);
    } else if (editField === 'cost_per_pack') {
      value = Math.max(0, parseFloat(draft.replace(',', '.')) || 0);
    } else {
      value = draft;
    }
    setSaving(true);
    await supabase.from('quit_journeys').update({ [editField]: value }).eq('id', journey.id);
    setSaving(false);
    setEditField(null);
    onJourneyUpdate?.();
  };

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

  // ---- Canonical card (mirrors HomeScreen) ----
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

  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  // Icon well — accent-tinted, mirrors HomeScreen stat/milestone wells
  const well = (accent: string) => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: accent + (isDark ? '1A' : '14'),
  });

  // YOLCULUK BİLGİLERİ — editable info rows
  const journeyRows: { field: EditField; icon: IconName; accent: string; label: string; value: string }[] = [
    { field: 'quit_date', icon: 'calendar-outline', accent: ACCENT, label: t.quitDate,
      value: journey ? new Date(journey.quit_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      }) : '' },
    { field: 'cigarettes_per_day', icon: 'flame-outline', accent: WARNING, label: t.dailyCigs, value: journey ? `${journey.cigarettes_per_day}` : '' },
    { field: 'cost_per_pack', icon: 'wallet-outline', accent: SUCCESS, label: t.packPrice, value: journey ? `₺${journey.cost_per_pack}` : '' },
    { field: 'motivation', icon: 'heart-outline', accent: ERROR, label: t.motivation,
      value: journey && journey.motivation ? getMotivationLabel(journey.motivation, lang) : (lang === 'tr' ? 'Seçilmedi' : 'Not set') },
  ];

  // DESTEK — link rows
  const supportRows: { icon: IconName; accent: string; label: string; url: string; external?: boolean }[] = [
    { icon: 'call-outline', accent: SUCCESS, label: t.quitHelpline, url: 'tel:171', external: true },
    { icon: 'document-text-outline', accent: colors.textSecondary, label: t.termsLink, url: 'https://descanpo.github.io/smoke/terms.html' },
    { icon: 'shield-checkmark-outline', accent: CYAN, label: t.kvkkLink, url: 'https://descanpo.github.io/smoke/kvkk.html' },
  ];

  // Stat chips — uses calcStats data
  const statChips: { accent: string; icon: IconName; value: string; label: string }[] = [
    { accent: ACCENT, icon: 'calendar-clear-outline', value: `${stats.days}`, label: t.daysClean },
    { accent: CYAN, icon: 'wallet-outline', value: `₺${stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, label: t.savings },
    { accent: WARNING, icon: 'ban-outline', value: stats.avoided.toLocaleString('tr-TR'), label: t.avoided },
  ];

  // Strip leading emoji/symbol prefix from reset label (no new t. keys)
  const resetLabel = t.resetJourney.replace(/^[^\p{L}]+/u, '').trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* TopAppBar: centered logo + settings */}
        <View style={s.topBar}>
          <View style={s.topBarSide} />
          <Text style={[s.logo, { color: ACCENT }]}>Smoke</Text>
          <View style={[s.topBarSide, { alignItems: 'flex-end' }]}>
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </View>
        </View>

        {/* User identity — centered avatar with gradient ring */}
        <View style={s.identity}>
          <View style={s.avatarRing}>
            <View style={[s.avatarInner, { borderColor: colors.background }]}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={[s.displayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[s.email, { color: colors.textSecondary }]} numberOfLines={1}>{email}</Text>
        </View>

        {/* Stat chips card */}
        {journey && (
          <View style={[s.chipsCard, card]}>
            {statChips.map((chip, i) => (
              <React.Fragment key={chip.label}>
                {i > 0 && <View style={[s.chipSep, { backgroundColor: dividerColor }]} />}
                <View style={s.statChip}>
                  <Ionicons name={chip.icon} size={20} color={chip.accent} style={{ marginBottom: 5 }} />
                  <Text style={[s.chipValue, { color: colors.text }]} numberOfLines={1}>{chip.value}</Text>
                  <Text style={[s.chipLabel, { color: colors.textTertiary }]}>{chip.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* YOLCULUK BİLGİLERİ */}
        {journey && (
          <View style={s.section}>
            <Text style={[s.eyebrow, { color: colors.textTertiary }]}>{t.journeyInfo}</Text>
            <View style={[s.groupCard, card]}>
              {journeyRows.map((row, i) => (
                <TouchableOpacity
                  key={row.label}
                  style={[s.row, i < journeyRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: dividerColor }]}
                  onPress={() => openEdit(row.field)}
                  activeOpacity={0.6}
                >
                  <View style={well(row.accent)}>
                    <Ionicons name={row.icon} size={20} color={row.accent} />
                  </View>
                  <Text style={[s.rowLabel, { color: colors.text, flex: 1 }]} numberOfLines={1}>{row.label}</Text>
                  <Text style={[s.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>{row.value}</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AYARLAR */}
        <View style={s.section}>
          <Text style={[s.eyebrow, { color: colors.textTertiary }]}>{t.settings}</Text>
          <View style={[s.groupCard, card]}>
            {/* Dark mode toggle */}
            <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: dividerColor }]}>
              <View style={well('#6366F1')}>
                <Ionicons name="moon-outline" size={20} color="#818CF8" />
              </View>
              <Text style={[s.rowLabel, { color: colors.text, flex: 1 }]}>{t.darkMode}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', true: ACCENT }}
                thumbColor="#fff"
                ios_backgroundColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
                {...Platform.select({ web: { activeThumbColor: '#fff' } as any, default: {} })}
              />
            </View>

            {/* Language segmented control */}
            <View style={s.row}>
              <View style={well(CYAN)}>
                <Ionicons name="language-outline" size={20} color={CYAN} />
              </View>
              <Text style={[s.rowLabel, { color: colors.text, flex: 1 }]}>{t.language}</Text>
              <View style={[s.langSegment, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              }]}>
                {(['tr', 'en'] as const).map(l => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setLang(l)}
                    activeOpacity={0.8}
                    style={[s.langSegBtn, lang === l && s.langSegBtnActive]}
                  >
                    <Text style={[
                      s.langSegText,
                      { color: lang === l ? '#fff' : colors.textSecondary },
                    ]}>
                      {l === 'tr' ? 'TR' : 'EN'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* DESTEK */}
        <View style={s.section}>
          <Text style={[s.eyebrow, { color: colors.textTertiary }]}>{lang === 'tr' ? 'DESTEK' : 'SUPPORT'}</Text>
          <View style={[s.groupCard, card]}>
            {supportRows.map((row, i) => (
              <TouchableOpacity
                key={row.label}
                style={[s.row, i < supportRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: dividerColor }]}
                onPress={() => openURL(row.url)}
                activeOpacity={0.6}
              >
                <View style={well(row.accent)}>
                  <Ionicons name={row.icon} size={20} color={row.accent} />
                </View>
                <Text style={[s.rowLabel, { color: colors.text, flex: 1 }]} numberOfLines={1}>{row.label}</Text>
                <Ionicons
                  name={row.external ? 'open-outline' : 'chevron-forward'}
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* HESAP */}
        <View style={s.section}>
          <Text style={[s.eyebrow, { color: colors.textTertiary }]}>{t.account}</Text>

          {/* Reset (destructive) */}
          <TouchableOpacity
            style={[s.resetBtn, card]}
            onPress={newJourney}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={ERROR} />
            <Text style={[s.resetText, { color: ERROR }]}>{resetLabel}</Text>
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity
            style={[s.signOutBtn, {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              borderColor: colors.border,
            }]}
            onPress={signOut}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.text} />
            <Text style={[s.signOutText, { color: colors.text }]}>{t.signOut}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editField !== null} transparent animationType="fade" onRequestClose={() => setEditField(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditField(null)}>
          <TouchableOpacity activeOpacity={1} style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editField === 'quit_date' ? t.quitDate
                : editField === 'cigarettes_per_day' ? t.dailyCigs
                : editField === 'cost_per_pack' ? t.packPrice
                : editField === 'motivation' ? t.motivation : ''}
            </Text>

            {editField === 'motivation' ? (
              <View style={s.motivationGrid}>
                {Object.entries(MOTIVATION_LABELS).map(([key, m]) => {
                  const active = draft === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setDraft(key)}
                      activeOpacity={0.8}
                      style={[s.motivationChip, {
                        backgroundColor: active ? ACCENT : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                        borderColor: active ? ACCENT : colors.border,
                      }]}
                    >
                      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '600', fontSize: 14 }}>
                        {lang === 'tr' ? m.tr : m.en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <>
                <TextInput
                  style={[s.modalInput, {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }]}
                  value={draft}
                  onChangeText={setDraft}
                  keyboardType={editField === 'quit_date' ? 'default' : 'decimal-pad'}
                  placeholder={editField === 'quit_date' ? 'YYYY-AA-GG' : ''}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                />
                {editField === 'quit_date' && (
                  <Text style={[s.modalHint, { color: colors.textTertiary }]}>
                    {lang === 'tr' ? 'Biçim: Yıl-Ay-Gün (örn. 2026-06-18)' : 'Format: Year-Month-Day (e.g. 2026-06-18)'}
                  </Text>
                )}
              </>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => setEditField(null)}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalSave]}
                onPress={saveEdit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>{t.save}</Text>}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 120 },

  // TopAppBar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  topBarSide: { width: 32, justifyContent: 'center' },
  logo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },

  // User identity
  identity: { alignItems: 'center', marginTop: 12, marginBottom: 36 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 4,
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' } as any,
      default: { backgroundColor: ACCENT },
    }),
  },
  avatarInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    backgroundColor: ACCENT,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  displayName: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 },
  email: { fontSize: 13, fontWeight: '500', maxWidth: '90%' },

  // Stat chips card
  chipsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 28,
    paddingVertical: 20,
    marginBottom: 36,
    overflow: 'hidden',
  },
  statChip: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chipSep: { width: 1, alignSelf: 'stretch' },
  chipValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  chipLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Sections
  section: { marginBottom: 32 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },

  // Grouped cards
  groupCard: {
    borderRadius: 28,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '500', maxWidth: '46%', textAlign: 'right' },

  // Language segmented control
  langSegment: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 2,
  },
  langSegBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 7,
  },
  langSegBtnActive: {
    backgroundColor: ACCENT,
  },
  langSegText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Reset (destructive)
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 28,
    paddingVertical: 18,
    marginBottom: 12,
  },
  resetText: { fontWeight: '700', fontSize: 14 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderRadius: 28,
    paddingVertical: 18,
    borderWidth: 1,
  },
  signOutText: { fontWeight: '700', fontSize: 14 },

  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 18 },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  modalHint: { fontSize: 12, fontWeight: '500', marginTop: 8 },
  motivationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  motivationChip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalSave: {
    ...Platform.select({
      web: { backgroundImage: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' } as any,
      default: { backgroundColor: ACCENT },
    }),
  },
});
