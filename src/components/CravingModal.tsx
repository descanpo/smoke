import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, ActivityIndicator, Platform, SafeAreaView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const TRIGGERS_TR = [
  { key: 'stress', label: 'Stres', icon: '😰' },
  { key: 'boredom', label: 'Sıkıntı', icon: '😑' },
  { key: 'social', label: 'Sosyal', icon: '👥' },
  { key: 'after_meal', label: 'Yemek Sonrası', icon: '🍽️' },
  { key: 'coffee', label: 'Kahve', icon: '☕' },
  { key: 'alcohol', label: 'Alkol', icon: '🍺' },
  { key: 'habit', label: 'Alışkanlık', icon: '🔄' },
  { key: 'emotion', label: 'Duygusal', icon: '💔' },
  { key: 'other', label: 'Diğer', icon: '❓' },
];

const TRIGGERS_EN = [
  { key: 'stress', label: 'Stress', icon: '😰' },
  { key: 'boredom', label: 'Boredom', icon: '😑' },
  { key: 'social', label: 'Social', icon: '👥' },
  { key: 'after_meal', label: 'After Meal', icon: '🍽️' },
  { key: 'coffee', label: 'Coffee', icon: '☕' },
  { key: 'alcohol', label: 'Alcohol', icon: '🍺' },
  { key: 'habit', label: 'Habit', icon: '🔄' },
  { key: 'emotion', label: 'Emotional', icon: '💔' },
  { key: 'other', label: 'Other', icon: '❓' },
];

export default function CravingModal({
  session,
  journey,
  onClose,
}: {
  session: any;
  journey: any;
  onClose: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const colors = getColors(mode);

  const TRIGGERS = lang === 'tr' ? TRIGGERS_TR : TRIGGERS_EN;

  const [resisted, setResisted] = useState(true);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('craving_logs').insert({
      user_id: session.user.id,
      journey_id: journey?.id ?? null,
      intensity,
      trigger_type: trigger || null,
      trigger_notes: notes || null,
      resisted,
    });
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1800);
  };

  const sheetBg = isDark ? '#0F0F1F' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const outcomeBorderDefault = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const outcomeBgDefault = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  return (
    <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: sheetBg, borderColor: colors.border }]} onPress={() => {}}>
        {/* Drag handle */}
        <View style={[s.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

        <SafeAreaView>
          {done ? (
            <View style={s.doneState}>
              <Text style={s.doneIcon}>{resisted ? '🏆' : '😌'}</Text>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.title, { color: colors.text }]}>🔥 {t.cravingTitle}</Text>

              {/* Resisted / Smoked */}
              <View style={s.outcomeRow}>
                {[
                  { val: true, label: lang === 'tr' ? '💪 Direnebildim' : '💪 Resisted', color: '#10B981' },
                  { val: false, label: lang === 'tr' ? '😔 İçtim' : '😔 Smoked', color: '#EF4444' },
                ].map(({ val, label, color }) => (
                  <TouchableOpacity
                    key={String(val)}
                    style={[s.outcomeBtn, {
                      borderColor: resisted === val ? color : outcomeBorderDefault,
                      backgroundColor: resisted === val ? color + '22' : outcomeBgDefault,
                    }]}
                    onPress={() => setResisted(val)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.outcomeBtnText, { color: resisted === val ? color : colors.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Intensity */}
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>{t.intensity}: {intensity}/10</Text>
              <View style={s.intensityRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[s.intensityDot, {
                      backgroundColor: v <= intensity
                        ? (v <= 3 ? '#10B981' : v <= 6 ? '#F59E0B' : '#EF4444')
                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
                    }]}
                    onPress={() => setIntensity(v)}
                  />
                ))}
              </View>

              {/* Trigger */}
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>{t.trigger}</Text>
              <View style={s.chipWrap}>
                {TRIGGERS.map(trig => (
                  <TouchableOpacity
                    key={trig.key}
                    style={[s.chip, {
                      backgroundColor: trigger === trig.key
                        ? 'rgba(124,58,237,0.2)'
                        : inputBg,
                      borderColor: trigger === trig.key ? '#7C3AED' : inputBorder,
                    }]}
                    onPress={() => setTrigger(trigger === trig.key ? '' : trig.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, { color: trigger === trig.key ? '#8B5CF6' : colors.textSecondary }]}>
                      {trig.icon} {trig.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>
                {t.notes} ({lang === 'tr' ? 'isteğe bağlı' : 'optional'})
              </Text>
              <TextInput
                style={[s.textarea, { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={s.btnRow}>
                <TouchableOpacity
                  style={[s.cancelBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={onClose}
                >
                  <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.saveBtnText}>{t.save} ✔</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 8,
    maxHeight: '92%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  doneState: { alignItems: 'center', paddingVertical: 32 },
  doneIcon: { fontSize: 64, marginBottom: 14 },
  doneTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  doneDesc: { fontSize: 15, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  outcomeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  outcomeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 2,
  },
  outcomeBtnText: { fontSize: 14, fontWeight: '600' },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  intensityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  intensityDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  textarea: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 20,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1,
  },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: {
    flex: 2, padding: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#7C3AED',
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        boxShadow: '0 0 20px rgba(124,58,237,0.4)',
      } as any,
      default: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5,
      },
    }),
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
