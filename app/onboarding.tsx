import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJourneyStore } from '@/store/journeyStore';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const MOTIVATIONS = [
  { key: 'health', label: 'Sağlığım için', icon: '❤️' },
  { key: 'family', label: 'Ailem için', icon: '👨‍👩‍👧' },
  { key: 'money', label: 'Para biriktirmek', icon: '💰' },
  { key: 'sport', label: 'Spor yapabilmek', icon: '🏃' },
  { key: 'baby', label: 'Bebeğim/hamilelik', icon: '👶' },
  { key: 'other', label: 'Diğer', icon: '✨' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [quitDate] = useState(new Date().toISOString());
  const [cigarettesPerDay, setCigarettesPerDay] = useState('20');
  const [costPerPack, setCostPerPack] = useState('100');
  const [cigarettesPerPack, setCigarettesPerPack] = useState('20');
  const [brand, setBrand] = useState('');
  const [motivation, setMotivation] = useState('');
  const [loading, setLoading] = useState(false);
  const createJourney = useJourneyStore((s) => s.createJourney);

  const steps = [
    {
      title: 'Sigarayı Bıraktığın Tarih',
      subtitle: 'Bugun bırakma günün!',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.bigEmoji}>📅</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.stepDescription}>
            Bugun sigarayı bırakma günün! Saat bu andan itibaren saymaya başliyor.
          </Text>
        </View>
      ),
    },
    {
      title: 'Sigara Alışkanlığın',
      subtitle: 'Bize biçraz anlat',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.label}>Günde kaç sigara içiyordun?</Text>
          <TextInput
            style={styles.input}
            value={cigarettesPerDay}
            onChangeText={setCigarettesPerDay}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor={Colors.dark.textTertiary}
          />

          <Text style={styles.label}>Sigara markan</Text>
          <TextInput
            style={styles.input}
            value={brand}
            onChangeText={setBrand}
            placeholder="Maltepe, Parliament..."
            placeholderTextColor={Colors.dark.textTertiary}
          />
        </View>
      ),
    },
    {
      title: 'Maliyet Hesabı',
      subtitle: 'Kaç TL tasarruf edeceksin?',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.label}>Bir paket sigara kaç TL?</Text>
          <TextInput
            style={styles.input}
            value={costPerPack}
            onChangeText={setCostPerPack}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={Colors.dark.textTertiary}
          />

          <Text style={styles.label}>Pakette kaç sigara var?</Text>
          <TextInput
            style={styles.input}
            value={cigarettesPerPack}
            onChangeText={setCigarettesPerPack}
            keyboardType="numeric"
            placeholder="20"
            placeholderTextColor={Colors.dark.textTertiary}
          />

          {cigarettesPerDay && costPerPack && cigarettesPerPack && (
            <View style={styles.savingsCard}>
              <Text style={styles.savingsLabel}>Yılda tasarruf edeceksin:</Text>
              <Text style={styles.savingsAmount}>
                {Math.round(
                  (parseInt(cigarettesPerDay) / parseInt(cigarettesPerPack)) *
                  parseInt(costPerPack) *
                  365
                ).toLocaleString('tr-TR')}{' '}
                TL
              </Text>
            </View>
          )}
        </View>
      ),
    },
    {
      title: 'Motivasyonun',
      subtitle: 'Neden bırakıyorsun?',
      content: (
        <View style={styles.stepContent}>
          <View style={styles.motivationGrid}>
            {MOTIVATIONS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.motivationBtn,
                  motivation === m.key && styles.motivationBtnActive,
                ]}
                onPress={() => setMotivation(m.key)}
              >
                <Text style={styles.motivationIcon}>{m.icon}</Text>
                <Text
                  style={[
                    styles.motivationLabel,
                    motivation === m.key && styles.motivationLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ),
    },
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await createJourney({
          quit_date: quitDate,
          cigarettes_per_day: parseInt(cigarettesPerDay) || 20,
          cost_per_pack: parseFloat(costPerPack) || 100,
          cigarettes_per_pack: parseInt(cigarettesPerPack) || 20,
          currency: 'TRY',
          brand: brand || null,
          motivation: motivation || null,
        });
        router.replace('/(tabs)');
      } catch {
        Alert.alert('Hata', 'Bir şeyler ters gitti. Tekrar dene.');
      } finally {
        setLoading(false);
      }
    }
  };

  const currentStep = steps[step];

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.progressBar}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i <= step && styles.progressDotActive,
                  i < step && styles.progressDotDone,
                ]}
              />
            ))}
          </View>

          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>

          {currentStep.content}

          <View style={styles.footer}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                <Text style={styles.backBtnText}>← Geri</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.disabledBtn]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.nextBtnText}>
                {loading ? 'Kaydediliyor...' : step === steps.length - 1 ? 'Başla! 🚀' : 'Devam Et →'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: Spacing.lg },
  progressBar: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xl, justifyContent: 'center' },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.border },
  progressDotActive: { backgroundColor: Colors.primary, width: 24 },
  progressDotDone: { backgroundColor: Colors.primaryDark, width: 8 },
  stepHeader: { marginBottom: Spacing.xl },
  stepTitle: { ...Typography.h2, color: Colors.dark.text, marginBottom: Spacing.xs },
  stepSubtitle: { ...Typography.body, color: Colors.dark.textSecondary },
  stepContent: { flex: 1, gap: Spacing.md },
  bigEmoji: { fontSize: 72, textAlign: 'center', marginVertical: Spacing.lg },
  dateText: { ...Typography.h3, color: Colors.primary, textAlign: 'center' },
  stepDescription: { ...Typography.body, color: Colors.dark.textSecondary, textAlign: 'center', lineHeight: 24 },
  label: { ...Typography.label, color: Colors.dark.textSecondary },
  input: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    ...Typography.body,
  },
  savingsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
    marginTop: Spacing.md,
  },
  savingsLabel: { ...Typography.bodySmall, color: Colors.dark.textSecondary },
  savingsAmount: { ...Typography.h2, color: Colors.success, marginTop: Spacing.xs },
  motivationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  motivationBtn: {
    width: '47%',
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.xs,
  },
  motivationBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.dark.cardElevated },
  motivationIcon: { fontSize: 32 },
  motivationLabel: { ...Typography.bodySmall, color: Colors.dark.textSecondary, textAlign: 'center' },
  motivationLabelActive: { color: Colors.primary },
  footer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xxl, paddingBottom: Spacing.lg },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  backBtnText: { ...Typography.label, color: Colors.dark.textSecondary },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  nextBtnText: { ...Typography.label, color: '#fff', fontSize: 16 },
});
