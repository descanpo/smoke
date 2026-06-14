import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useJourneyStore } from '@/store/journeyStore';
import { TRIGGER_TYPES, COPING_STRATEGIES } from '@/constants/milestones';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

export default function CravingScreen() {
  const { user } = useAuthStore();
  const { journey } = useJourneyStore();
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [copingStrategy, setCopingStrategy] = useState('');
  const [resisted, setResisted] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('craving_logs').insert({
      user_id: user.id,
      journey_id: journey?.id ?? null,
      intensity,
      trigger_type: trigger || null,
      trigger_notes: notes || null,
      coping_strategy: copingStrategy || null,
      resisted,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Hata', 'Kaydedilemedi.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        resisted ? 'Bravo! 🏆' : 'İyi ki kaydettinsin',
        resisted
          ? 'İstekle başa çıktın! Her direniş seni daha güçlü yapar.'
          : 'Sorun değil. Yarın daha güçlü olacaksın.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    }
  };

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔥 İstek Kaydet</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.resistedSection}>
            <TouchableOpacity
              style={[
                styles.resistedBtn,
                resisted && styles.resistedBtnActive,
              ]}
              onPress={() => setResisted(true)}
            >
              <Text style={styles.resistedIcon}>💪</Text>
              <Text style={[styles.resistedLabel, resisted && { color: Colors.success }]}>
                Direnebildim
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.resistedBtn,
                !resisted && styles.failedBtnActive,
              ]}
              onPress={() => setResisted(false)}
            >
              <Text style={styles.resistedIcon}>😔</Text>
              <Text style={[styles.resistedLabel, !resisted && { color: Colors.error }]}>
                İçtim
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şiddet: {intensity}/10</Text>
            <View style={styles.intensityRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.intensityDot,
                    v <= intensity && {
                      backgroundColor:
                        v <= 3 ? Colors.success : v <= 6 ? Colors.warning : Colors.error,
                    },
                  ]}
                  onPress={() => setIntensity(v)}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tetikleyici</Text>
            <View style={styles.triggerGrid}>
              {TRIGGER_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.triggerBtn,
                    trigger === t.key && styles.triggerBtnActive,
                  ]}
                  onPress={() => setTrigger(trigger === t.key ? '' : t.key)}
                >
                  <Text style={styles.triggerIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.triggerLabel,
                      trigger === t.key && { color: Colors.primary },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {resisted && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Başa Çıkma Yöntemi</Text>
              <View style={styles.strategyList}>
                {COPING_STRATEGIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.strategyBtn,
                      copingStrategy === s && styles.strategyBtnActive,
                    ]}
                    onPress={() => setCopingStrategy(copingStrategy === s ? '' : s)}
                  >
                    <Text
                      style={[
                        styles.strategyText,
                        copingStrategy === s && { color: Colors.primary },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not (isteğe bağlı)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ne düşündün? Nasıl hissettin?"
              placeholderTextColor={Colors.dark.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Kaydediliyor...' : 'Kaydet ✔'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.breathingShortcut}
            onPress={() => {
              router.back();
              setTimeout(() => router.push('/breathing'), 100);
            }}
          >
            <Text style={styles.breathingShortcutText}>
              🌬️ Nefes egzersizi yap
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  closeBtn: { fontSize: 22, color: Colors.dark.textSecondary, width: 32 },
  title: { ...Typography.h3, color: Colors.dark.text },
  container: { padding: Spacing.lg, gap: Spacing.xl },
  resistedSection: { flexDirection: 'row', gap: Spacing.md },
  resistedBtn: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.border,
    gap: Spacing.xs,
  },
  resistedBtnActive: { borderColor: Colors.success, backgroundColor: Colors.success + '22' },
  failedBtnActive: { borderColor: Colors.error, backgroundColor: Colors.error + '22' },
  resistedIcon: { fontSize: 32 },
  resistedLabel: { ...Typography.label, color: Colors.dark.textSecondary },
  section: { gap: Spacing.md },
  sectionTitle: { ...Typography.label, color: Colors.dark.text },
  intensityRow: { flexDirection: 'row', gap: Spacing.sm },
  intensityDot: {
    flex: 1,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.border,
  },
  triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  triggerBtn: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  triggerBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  triggerIcon: { fontSize: 16 },
  triggerLabel: { ...Typography.bodySmall, color: Colors.dark.textSecondary },
  strategyList: { gap: Spacing.xs },
  strategyBtn: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  strategyBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  strategyText: { ...Typography.bodySmall, color: Colors.dark.textSecondary },
  notesInput: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    minHeight: 80,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { ...Typography.label, color: '#fff', fontSize: 16 },
  breathingShortcut: { alignItems: 'center', padding: Spacing.md },
  breathingShortcutText: { ...Typography.body, color: Colors.primary },
});
