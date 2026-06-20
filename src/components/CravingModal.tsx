import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, ActivityIndicator, Platform, SafeAreaView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TRIGGER_TYPES } from '../../constants/milestones';
import { haptics } from '../utils/haptics';

export default function CravingModal({
  session,
  journey,
  onClose,
  onRelapse,
}: {
  session: any;
  journey: any;
  onClose: () => void;
  onRelapse?: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const colors = getColors(mode);

  const TRIGGERS = TRIGGER_TYPES;
  const triggerLabel = (trig: typeof TRIGGER_TYPES[number]) => (lang === 'tr' ? trig.labelTr : trig.labelEn);

  const [resisted, setResisted] = useState(true);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (saving) return; // çift dokunuşa karşı koruma
    setSaving(true);
    setError('');
    const { error: e } = await supabase.from('craving_logs').insert({
      user_id: session.user.id,
      journey_id: journey?.id ?? null,
      intensity,
      trigger_type: trigger || null,
      // not alanını mantıklı bir uzunlukta sınırla (DB şişmesini önle)
      trigger_notes: notes ? notes.trim().slice(0, 500) : null,
      resisted,
    });
    setSaving(false);
    if (e) {
      haptics.error();
      setError(lang === 'tr' ? 'Kaydedilemedi, tekrar dene.' : 'Could not save, please retry.');
      return;
    }
    resisted ? haptics.success() : haptics.warning();
    setDone(true);
    // "İçtim" durumunda nazik relaps kurtarma akışına yönlendir.
    setTimeout(() => {
      if (!resisted && onRelapse) onRelapse();
      else onClose();
    }, 1800);
  };

  // ---- palette helpers (presentation only) ----
  const SUCCESS = colors.success;
  const ERROR = colors.error;
  const PRIMARY = colors.primary;

  const intensityColor = (v: number) => (v <= 3 ? colors.success : v <= 6 ? colors.warning : colors.sos);
  const liveColor = intensityColor(intensity);

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={[s.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {}}
      >
        {/* Drag handle */}
        <View style={[s.dragHandle, { backgroundColor: colors.border }]} />

        <SafeAreaView>
          {done ? (
            <View style={s.doneState}>
              <View
                style={[
                  s.doneBadge,
                  {
                    borderColor: (resisted ? SUCCESS : '#F59E0B') + '55',
                    backgroundColor: (resisted ? SUCCESS : '#F59E0B') + '1A',
                  },
                ]}
              >
                <Text style={s.doneIcon}>{resisted ? '🏆' : '😌'}</Text>
              </View>
              <Text style={[s.doneTitle, { color: colors.text }]}>
                {resisted
                  ? (lang === 'tr' ? 'Bravo! İsteği yendin!' : 'Well done! You resisted!')
                  : (lang === 'tr' ? 'İyi ki kaydettin' : 'Good that you logged it')}
              </Text>
              <Text style={[s.doneDesc, { color: colors.textSecondary }]}>
                {resisted
                  ? (lang === 'tr' ? 'Her direnç seni daha güçlü yapar.' : 'Every resistance makes you stronger.')
                  : (lang === 'tr' ? 'Yarın daha güçlü olacaksın.' : "You'll be stronger tomorrow.")}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
              {/* Header */}
              <View style={s.header}>
                <View style={s.headerLeft}>
                  <View style={s.headerIconWrap}>
                    <Text style={s.headerIcon}>🔥</Text>
                  </View>
                  <View style={s.headerTextWrap}>
                    <Text style={[s.title, { color: colors.text }]}>{t.cravingTitle}</Text>
                    <Text style={[s.subtitle, { color: colors.textTertiary }]}>
                      {lang === 'tr' ? 'Bu anı kaydet, gücünü gör' : 'Log this moment, see your strength'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[s.closeBtnText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Resisted / Smoked */}
              <View style={s.outcomeRow}>
                {[
                  { val: true, label: lang === 'tr' ? 'Direnebildim' : 'Resisted', emoji: '💪', color: SUCCESS },
                  { val: false, label: lang === 'tr' ? 'İçtim' : 'Smoked', emoji: '😔', color: ERROR },
                ].map(({ val, label, emoji, color }) => {
                  const active = resisted === val;
                  return (
                    <TouchableOpacity
                      key={String(val)}
                      style={[
                        s.outcomeBtn,
                        {
                          borderColor: active ? color : colors.border,
                          backgroundColor: active ? color + '1F' : colors.surface,
                        },
                      ]}
                      onPress={() => setResisted(val)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.outcomeEmoji}>{emoji}</Text>
                      <Text style={[s.outcomeBtnText, { color: active ? color : colors.textSecondary }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Intensity */}
              <View style={s.labelRow}>
                <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>{t.intensity}</Text>
                <View style={[s.intensityBadge, { backgroundColor: liveColor + '22', borderColor: liveColor + '4D' }]}>
                  <Text style={[s.intensityBadgeText, { color: liveColor }]}>{intensity}/10</Text>
                </View>
              </View>
              <View style={[s.intensityTrack, { backgroundColor: colors.surface }]}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(v => {
                  const filled = v <= intensity;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={s.intensitySegment}
                      onPress={() => setIntensity(v)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          s.intensityFill,
                          { backgroundColor: filled ? intensityColor(v) : 'transparent' },
                          filled && v === intensity && s.intensityFillActive,
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Trigger */}
              <Text style={[s.fieldLabel, s.sectionTopGap, { color: colors.textTertiary }]}>{t.trigger}</Text>
              <View style={s.chipWrap}>
                {TRIGGERS.map(trig => {
                  const active = trigger === trig.key;
                  return (
                    <TouchableOpacity
                      key={trig.key}
                      style={[
                        s.chip,
                        {
                          backgroundColor: active ? colors.primarySoft : colors.surface,
                          borderColor: active ? PRIMARY : colors.border,
                        },
                      ]}
                      onPress={() => setTrigger(active ? '' : trig.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.chipIcon}>{trig.icon}</Text>
                      <Text style={[s.chipText, { color: active ? colors.primaryLight : colors.textSecondary }]}>
                        {triggerLabel(trig)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes */}
              <Text style={[s.fieldLabel, s.sectionTopGap, { color: colors.textTertiary }]}>
                {t.notes} · {lang === 'tr' ? 'isteğe bağlı' : 'optional'}
              </Text>
              <TextInput
                style={[s.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {!!error && (
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              )}

              <View style={s.btnRow}>
                <TouchableOpacity
                  style={[s.cancelBtn, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving} activeOpacity={0.9}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.saveBtnText}>{t.save}  ✔</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    maxHeight: '92%',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 -6px 24px rgba(15,23,42,0.10)' } as any,
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.10,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 12,
      },
    }),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  scrollContent: { paddingBottom: 4 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.14)',
  },
  headerIcon: { fontSize: 22 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.2 },
  subtitle: { fontSize: 12.5, marginTop: 2, fontWeight: '500' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  closeBtnText: { fontSize: 15, fontWeight: '700', lineHeight: 18 },

  // Done state
  doneState: { alignItems: 'center', paddingVertical: 36 },
  doneBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  doneIcon: { fontSize: 52 },
  doneTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  doneDesc: { fontSize: 15, textAlign: 'center', lineHeight: 21, paddingHorizontal: 12 },

  // Outcome
  outcomeRow: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  outcomeBtn: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 6,
  },
  outcomeEmoji: { fontSize: 24 },
  outcomeBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  // Labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  sectionTopGap: { marginTop: 26, marginBottom: 12 },

  // Intensity
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  intensityBadgeText: { fontSize: 12.5, fontWeight: '800' },
  intensityTrack: {
    flexDirection: 'row',
    gap: 5,
    padding: 5,
    borderRadius: 14,
  },
  intensitySegment: {
    flex: 1,
    height: 22,
    borderRadius: 7,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  intensityFill: {
    flex: 1,
    borderRadius: 7,
  },
  intensityFillActive: {},

  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9999,
    borderWidth: 1.5,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  chipIcon: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '600' },

  // Notes
  textarea: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 14.5,
    lineHeight: 20,
    minHeight: 90,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 26, marginBottom: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  cancelBtnText: { fontWeight: '700', fontSize: 15 },
  saveBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    ...Theme.shadows.primary,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15.5, letterSpacing: 0.3 },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 16 },
});
