import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { haptics } from '../utils/haptics';

const MOODS = [
  { key: 'great', emoji: '😄', tr: 'Harika', en: 'Great' },
  { key: 'good', emoji: '🙂', tr: 'İyi', en: 'Good' },
  { key: 'ok', emoji: '😐', tr: 'İdare eder', en: 'Okay' },
  { key: 'low', emoji: '😔', tr: 'Düşük', en: 'Low' },
  { key: 'struggling', emoji: '😣', tr: 'Zorlanıyorum', en: 'Struggling' },
];

export default function CheckInModal({
  session, journey, onClose,
}: {
  session: any;
  journey: any;
  onClose: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang } = useLanguage();
  const colors = getColors(mode);
  const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  const [mood, setMood] = useState('good');
  const [cravings, setCravings] = useState(0);
  const [smoked, setSmoked] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (saving) return;
    setSaving(true); setError('');
    const today = new Date().toISOString().slice(0, 10);
    const { error: e } = await supabase.from('daily_check_ins').upsert({
      user_id: session.user.id,
      journey_id: journey?.id ?? null,
      check_in_date: today,
      mood,
      craving_count: cravings,
      smoked,
      note: note ? note.trim().slice(0, 500) : null,
    }, { onConflict: 'user_id,check_in_date' });
    setSaving(false);
    if (e) { haptics.error(); setError(L('Kaydedilemedi, tekrar dene.', 'Could not save, please retry.')); return; }
    haptics.success();
    setDone(true);
    setTimeout(onClose, 1500);
  };

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />
        <SafeAreaView>
          {done ? (
            <View style={s.doneState}>
              <Text style={{ fontSize: 50, marginBottom: 14 }}>🌟</Text>
              <Text style={[s.doneTitle, { color: colors.text }]}>{L('Check-in kaydedildi', 'Check-in saved')}</Text>
              <Text style={[s.doneDesc, { color: colors.textSecondary }]}>{L('Kendini takip etmen çok değerli.', 'Tracking yourself matters a lot.')}</Text>
            </View>
          ) : (
            <>
              <Text style={[s.title, { color: colors.text }]}>{L('Bugün nasılsın?', 'How are you today?')}</Text>
              <Text style={[s.subtitle, { color: colors.textTertiary }]}>{L('Günlük check-in', 'Daily check-in')}</Text>

              {/* Mood */}
              <Text style={[s.label, { color: colors.textTertiary }]}>{L('RUH HALİ', 'MOOD')}</Text>
              <View style={s.moodRow}>
                {MOODS.map(m => {
                  const active = mood === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[s.moodChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }]}
                      onPress={() => { haptics.selection(); setMood(m.key); }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                      <Text style={[s.moodLabel, { color: active ? colors.primary : colors.textSecondary }]} numberOfLines={1}>
                        {lang === 'tr' ? m.tr : m.en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Cravings */}
              <Text style={[s.label, { color: colors.textTertiary }]}>{L('BUGÜN KAÇ İSTEK YAŞADIN?', 'CRAVINGS TODAY')}</Text>
              <View style={s.stepper}>
                <TouchableOpacity style={[s.stepBtn, { borderColor: colors.border }]} onPress={() => { haptics.tapLight(); setCravings(c => Math.max(0, c - 1)); }} activeOpacity={0.8}>
                  <Ionicons name="remove" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[s.stepValue, { color: colors.text }]}>{cravings}</Text>
                <TouchableOpacity style={[s.stepBtn, { borderColor: colors.border }]} onPress={() => { haptics.tapLight(); setCravings(c => c + 1); }} activeOpacity={0.8}>
                  <Ionicons name="add" size={22} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Smoked */}
              <TouchableOpacity
                style={[s.smokedRow, { borderColor: smoked ? colors.sos : colors.border, backgroundColor: smoked ? colors.sosSoft : colors.surface }]}
                onPress={() => { haptics.tapLight(); setSmoked(v => !v); }}
                activeOpacity={0.8}
              >
                <Ionicons name={smoked ? 'checkbox' : 'square-outline'} size={22} color={smoked ? colors.sos : colors.textTertiary} />
                <Text style={[s.smokedText, { color: colors.text }]}>{L('Bugün sigara içtim', 'I smoked today')}</Text>
              </TouchableOpacity>

              {/* Note */}
              <TextInput
                style={[s.textarea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={note}
                onChangeText={setNote}
                placeholder={L('Not (isteğe bağlı)', 'Note (optional)')}
                placeholderTextColor={colors.textTertiary}
                maxLength={500}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />

              {!!error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}

              <View style={s.btnRow}>
                <TouchableOpacity style={[s.cancelBtn, { borderColor: colors.borderLight }]} onPress={onClose} activeOpacity={0.8}>
                  <Text style={[s.cancelText, { color: colors.textSecondary }]}>{L('Vazgeç', 'Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving} activeOpacity={0.9}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>{L('Kaydet', 'Save')}</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0,
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, maxHeight: '92%',
    ...Platform.select({ web: { boxShadow: '0 -6px 24px rgba(15,23,42,0.10)' } as any, default: { elevation: 12 } }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 4, marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 3, fontWeight: '500' },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 22, marginBottom: 12 },
  moodRow: { flexDirection: 'row', gap: 7 },
  moodChip: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 12, borderRadius: 14, borderWidth: 1 },
  moodLabel: { fontSize: 10.5, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  stepBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 34, fontWeight: '800', minWidth: 56, textAlign: 'center' },
  smokedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 22 },
  smokedText: { fontSize: 14.5, fontWeight: '600' },
  textarea: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14.5, minHeight: 70, marginTop: 16, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 14 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 8 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1.5 },
  cancelText: { fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#7C3AED', ...Theme.shadows.primary },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15.5 },
  doneState: { alignItems: 'center', paddingVertical: 40 },
  doneTitle: { fontSize: 21, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  doneDesc: { fontSize: 14.5, textAlign: 'center', lineHeight: 21, paddingHorizontal: 12 },
});
