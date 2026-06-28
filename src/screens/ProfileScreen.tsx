import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Linking, Platform, Alert, SafeAreaView, Switch, Modal, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getColors, Theme } from '../theme/Theme';
import { haptics } from '../utils/haptics';
import { useNavigation } from '../navigation/Navigator';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

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

type EditField = 'display_name' | 'quit_date' | 'cigarettes_per_day' | 'cost_per_pack' | 'motivation';

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
  const { navigate } = useNavigation();
  const colors = getColors(mode);

  const [editField, setEditField] = useState<EditField | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const openEdit = (field: EditField) => {
    setEditError('');
    if (field === 'display_name') {
      setDraft(displayName === 'Kahraman' ? '' : displayName);
      setEditField(field);
      return;
    }
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
    if (!editField || saving) return;
    setEditError('');

    // Ad Soyad: auth metadata + profiles (yolculuktan bağımsız kaydedilir).
    if (editField === 'display_name') {
      const v = draft.trim();
      if (v.length < 2) {
        setEditError(lang === 'tr' ? 'Lütfen geçerli bir ad gir.' : 'Please enter a valid name.');
        haptics.error();
        return;
      }
      setSaving(true);
      const { error: e1 } = await supabase.auth.updateUser({ data: { display_name: v } });
      await supabase.from('profiles').update({ display_name: v }).eq('id', session.user.id).then(() => {}, () => {});
      setSaving(false);
      if (e1) {
        setEditError(lang === 'tr' ? 'Kaydedilemedi, tekrar dene.' : 'Could not save, please retry.');
        haptics.error();
        return;
      }
      haptics.success();
      setEditField(null);
      onJourneyUpdate?.();
      return;
    }

    if (!journey) return;
    let value: any;
    if (editField === 'quit_date') {
      const d = new Date(draft);
      if (isNaN(d.getTime()) || d.getTime() > Date.now()) {
        setEditError(lang === 'tr' ? 'Geçerli, geçmiş bir tarih gir.' : 'Enter a valid past date.');
        haptics.error();
        return;
      }
      value = d.toISOString();
    } else if (editField === 'cigarettes_per_day') {
      value = Math.max(0, parseInt(draft, 10) || 0);
    } else if (editField === 'cost_per_pack') {
      value = Math.max(0, parseFloat(draft.replace(',', '.')) || 0);
    } else {
      value = draft;
    }
    setSaving(true);
    const { error } = await supabase.from('quit_journeys').update({ [editField]: value }).eq('id', journey.id);
    setSaving(false);
    if (error) {
      setEditError(lang === 'tr' ? 'Kaydedilemedi, tekrar dene.' : 'Could not save, please retry.');
      haptics.error();
      return;
    }
    haptics.success();
    setEditField(null);
    onJourneyUpdate?.();
  };

  const stats = journey ? calcStats(journey) : { days: 0, avoided: 0, saved: 0 };
  const meta = session.user?.user_metadata ?? {};
  const displayName = meta.display_name ?? meta.full_name ?? meta.name ?? 'Kahraman';
  const email = session.user?.email ?? '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  // Google/Apple ile giriş yapanların profil fotoğrafı (varsa) — yoksa baş harf.
  const avatarUrl: string | undefined = meta.avatar_url ?? meta.picture;

  const signOut = async () => { await supabase.auth.signOut(); };

  // Hesap silme (Apple App Store zorunluluğu). delete-account Edge Function'ı
  // çağıranın JWT'sini doğrular, tüm kullanıcı verisini ve auth kaydını siler.
  const deleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError('');
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) {
      setDeleting(false);
      setDeleteError(t.deleteFailed);
      haptics.error();
      return;
    }
    haptics.success();
    // Kullanıcı silindi; yerel oturumu kapat → onAuthStateChange Welcome'a yönlendirir.
    await supabase.auth.signOut();
  };

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

  // Solid card style per spec — neutral shadow, no neon glow
  const cardStyle = {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    ...Theme.shadows.card,
  };

  const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  // Icon well — tinted background from theme colors
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
    { field: 'quit_date', icon: 'calendar-outline', accent: colors.primary, label: t.quitDate,
      value: journey ? new Date(journey.quit_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric', month: 'long', year: 'numeric',
      }) : '' },
    { field: 'cigarettes_per_day', icon: 'flame-outline', accent: colors.warning, label: t.dailyCigs, value: journey ? `${journey.cigarettes_per_day}` : '' },
    { field: 'cost_per_pack', icon: 'wallet-outline', accent: colors.success, label: t.packPrice, value: journey ? `₺${journey.cost_per_pack}` : '' },
    { field: 'motivation', icon: 'heart-outline', accent: colors.error, label: t.motivation,
      value: journey && journey.motivation ? getMotivationLabel(journey.motivation, lang) : (lang === 'tr' ? 'Seçilmedi' : 'Not set') },
  ];

  // DESTEK — link rows
  const supportRows: { icon: IconName; accent: string; label: string; url: string; external?: boolean }[] = [
    { icon: 'call-outline', accent: colors.success, label: t.quitHelpline, url: 'tel:171', external: true },
    { icon: 'document-text-outline', accent: colors.textSecondary, label: t.termsLink, url: 'https://descanpo.github.io/smoke/terms.html' },
    { icon: 'shield-checkmark-outline', accent: colors.secondary, label: t.kvkkLink, url: 'https://descanpo.github.io/smoke/kvkk.html' },
  ];

  // Stat chips
  const statChips: { accent: string; icon: IconName; value: string; label: string }[] = [
    { accent: colors.primary, icon: 'calendar-clear-outline', value: `${stats.days}`, label: t.daysClean },
    { accent: colors.secondary, icon: 'wallet-outline', value: `₺${stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, label: t.savings },
    { accent: colors.warning, icon: 'ban-outline', value: stats.avoided.toLocaleString('tr-TR'), label: t.avoided },
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
        {/* Screen header per spec */}
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {lang === 'tr' ? 'Profil' : 'Profile'}
          </Text>
          <Text style={[s.headerSub, { color: colors.textSecondary }]}>
            {lang === 'tr' ? 'Hesap ve ayarlar' : 'Account & settings'}
          </Text>
        </View>

        {/* User identity — professional horizontal account card */}
        <View style={[s.accountCard, cardStyle]}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[s.avatarCircle, { borderColor: colors.primarySoft }]}
            />
          ) : (
            <View style={[s.avatarCircle, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}>
              <Text style={[s.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
          )}
          <TouchableOpacity
            style={{ flex: 1, minWidth: 0 }}
            activeOpacity={0.6}
            onPress={() => { haptics.tapLight(); openEdit('display_name'); }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[s.displayName, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>{displayName}</Text>
              <Ionicons name="pencil" size={13} color={colors.textTertiary} />
            </View>
            <Text style={[s.email, { color: colors.textSecondary }]} numberOfLines={1}>{email}</Text>
          </TouchableOpacity>
          {journey && (
            <View style={[s.streakBadge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[s.streakNum, { color: colors.primary }]}>{stats.days}</Text>
              <Text style={[s.streakLbl, { color: colors.primary }]}>{lang === 'tr' ? 'GÜN' : 'DAYS'}</Text>
            </View>
          )}
        </View>

        {/* Stat chips card */}
        {journey && (
          <View style={[s.chipsCard, cardStyle]}>
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
            <View style={[s.groupCard, cardStyle]}>
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
          <View style={[s.groupCard, cardStyle]}>
            {/* Dark mode toggle */}
            <View style={[s.row, { borderBottomWidth: 1, borderBottomColor: dividerColor }]}>
              <View style={well('#6366F1')}>
                <Ionicons name="moon-outline" size={20} color="#818CF8" />
              </View>
              <Text style={[s.rowLabel, { color: colors.text, flex: 1 }]}>{t.darkMode}</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', true: colors.primary }}
                thumbColor="#fff"
                ios_backgroundColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
                {...Platform.select({ web: { activeThumbColor: '#fff' } as any, default: {} })}
              />
            </View>

            {/* Language segmented control */}
            <View style={s.row}>
              <View style={well(colors.secondary)}>
                <Ionicons name="language-outline" size={20} color={colors.secondary} />
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
                    style={[s.langSegBtn, lang === l && { backgroundColor: colors.primary }]}
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
          <View style={[s.groupCard, cardStyle]}>
            <TouchableOpacity
              style={[s.row, { borderBottomWidth: 1, borderBottomColor: dividerColor }]}
              onPress={() => { haptics.tapLight(); navigate('Support'); }}
              activeOpacity={0.6}
            >
              <View style={well(colors.primary)}>
                <Ionicons name="heart-circle-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[s.rowLabel, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {lang === 'tr' ? 'Destek Merkezi' : 'Support Center'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
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

          {/* Reset (destructive — subtle error accent) */}
          <TouchableOpacity
            style={[s.resetBtn, {
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.error + '33',
              ...Theme.shadows.card,
            }]}
            onPress={newJourney}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[s.resetText, { color: colors.error }]}>{resetLabel}</Text>
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

          {/* Delete account (Apple zorunluluğu) — düşük vurgulu metin bağlantısı */}
          <TouchableOpacity
            style={s.deleteLink}
            onPress={() => { haptics.tapLight(); setDeleteError(''); setShowDeleteConfirm(true); }}
            activeOpacity={0.6}
          >
            <Text style={[s.deleteLinkText, { color: colors.textTertiary }]}>{t.deleteAccount}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hesap silme onay modalı */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => !deleting && setShowDeleteConfirm(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => !deleting && setShowDeleteConfirm(false)}>
          <TouchableOpacity activeOpacity={1} style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[s.deleteIconWell, { backgroundColor: colors.error + '1A' }]}>
              <Ionicons name="warning-outline" size={26} color={colors.error} />
            </View>
            <Text style={[s.modalTitle, { color: colors.text, textAlign: 'center', marginBottom: 10 }]}>
              {t.deleteAccountTitle}
            </Text>
            <Text style={[s.deleteWarning, { color: colors.textSecondary }]}>
              {t.deleteAccountWarning}
            </Text>

            {!!deleteError && (
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600', marginTop: 14, textAlign: 'center' }}>{deleteError}</Text>
            )}

            <View style={[s.modalActions, { flexDirection: 'column', gap: 10 }]}>
              <TouchableOpacity
                style={[s.modalBtn, { width: '100%', backgroundColor: colors.error, ...Theme.shadows.card }]}
                onPress={deleteAccount}
                disabled={deleting}
                activeOpacity={0.85}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '800' }}>{t.deleteAccountConfirm}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { width: '100%', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                activeOpacity={0.7}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editField !== null} transparent animationType="fade" onRequestClose={() => setEditField(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditField(null)}>
          <TouchableOpacity activeOpacity={1} style={[s.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              {editField === 'display_name' ? (lang === 'tr' ? 'Ad Soyad' : 'Full name')
                : editField === 'quit_date' ? t.quitDate
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
                        backgroundColor: active ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                        borderColor: active ? colors.primary : colors.border,
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
                  keyboardType={editField === 'cigarettes_per_day' || editField === 'cost_per_pack' ? 'decimal-pad' : 'default'}
                  autoCapitalize={editField === 'display_name' ? 'words' : 'none'}
                  placeholder={editField === 'display_name' ? (lang === 'tr' ? 'Adın Soyadın' : 'Your full name') : editField === 'quit_date' ? 'YYYY-AA-GG' : ''}
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

            {!!editError && (
              <Text style={{ color: colors.error, fontSize: 13, fontWeight: '600', marginTop: 12 }}>{editError}</Text>
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
                style={[s.modalBtn, s.modalSave, { backgroundColor: colors.primary, ...Theme.shadows.primary }]}
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
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },

  // Screen header per spec
  header: {
    paddingTop: 16,
    paddingBottom: 8,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 14,
  },

  // User identity — horizontal account card
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  displayName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 3 },
  email: { fontSize: 13, fontWeight: '500' },

  // Streak badge (right side of account card)
  streakBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 52,
  },
  streakNum: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5 },
  streakLbl: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },

  // Stat chips card
  chipsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 20,
    marginBottom: 28,
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
  section: { marginBottom: 24 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Grouped cards — borderRadius applied via cardStyle object inline
  groupCard: {
    paddingHorizontal: 16,
    overflow: 'hidden',
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    minHeight: 44,
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
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSegText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // Reset (destructive)
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 12,
    minHeight: 52,
  },
  resetText: { fontWeight: '700', fontSize: 14 },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    minHeight: 52,
  },
  signOutText: { fontWeight: '700', fontSize: 14 },

  // Delete account link
  deleteLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 4,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  deleteIconWell: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  deleteWarning: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },

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
    borderRadius: 20,
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
    minHeight: 48,
  },
  modalSave: {
    // backgroundColor and shadow applied inline via colors.primary + Theme.shadows.primary
  },
});
