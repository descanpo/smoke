import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

type IconName = keyof typeof Ionicons.glyphMap;

const MOTIVATIONS_TR: { key: string; label: string; desc: string; icon: IconName }[] = [
  { key: 'health', label: 'Sağlık', desc: 'Daha uzun, daha sağlıklı yaşamak', icon: 'heart-outline' },
  { key: 'money', label: 'Para', desc: 'Tasarruf etmek, biriktirmek', icon: 'wallet-outline' },
  { key: 'family', label: 'Aile', desc: 'Sevdiklerim için sağlıklı olmak', icon: 'people-outline' },
  { key: 'sports', label: 'Spor', desc: 'Fiziksel performansımı artırmak', icon: 'fitness-outline' },
  { key: 'smell', label: 'Koku', desc: 'Daha iyi kokmak, temiz nefes', icon: 'leaf-outline' },
  { key: 'freedom', label: 'Özgürlük', desc: 'Bağımlılıktan kurtulmak', icon: 'happy-outline' },
];

const MOTIVATIONS_EN: { key: string; label: string; desc: string; icon: IconName }[] = [
  { key: 'health', label: 'Health', desc: 'Live longer and healthier', icon: 'heart-outline' },
  { key: 'money', label: 'Money', desc: 'Save and build savings', icon: 'wallet-outline' },
  { key: 'family', label: 'Family', desc: 'Stay healthy for my loved ones', icon: 'people-outline' },
  { key: 'sports', label: 'Sports', desc: 'Improve my physical performance', icon: 'fitness-outline' },
  { key: 'smell', label: 'Smell', desc: 'Smell better, breathe clean', icon: 'leaf-outline' },
  { key: 'freedom', label: 'Freedom', desc: 'Break free from addiction', icon: 'happy-outline' },
];

export default function OnboardingScreen({
  session,
  onComplete,
}: {
  session: any;
  onComplete: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const colors = getColors(mode);

  const MOTIVATIONS = lang === 'tr' ? MOTIVATIONS_TR : MOTIVATIONS_EN;

  const [step, setStep] = useState(0);
  const [quitDate, setQuitDate] = useState(new Date().toISOString().slice(0, 10));
  const [cigsPerDay, setCigsPerDay] = useState('20');
  const [costPerPack, setCostPerPack] = useState('75');
  const [cigsPerPack, setCigsPerPack] = useState('20');
  const [motivation, setMotivation] = useState('health');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const steps = lang === 'tr'
    ? ['Bırakma Tarihi', 'Sigara Alışkanlığı', 'Maliyet', 'Motivasyon']
    : ['Quit Date', 'Smoking Habit', 'Cost', 'Motivation'];

  const handleFinish = async () => {
    setLoading(true); setError('');
    const { error: e } = await supabase.from('quit_journeys').insert({
      user_id: session.user.id,
      quit_date: new Date(quitDate).toISOString(),
      cigarettes_per_day: parseInt(cigsPerDay) || 20,
      cost_per_pack: parseFloat(costPerPack) || 75,
      cigarettes_per_pack: parseInt(cigsPerPack) || 20,
      currency: 'TRY',
      motivation,
      is_active: true,
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    onComplete();
  };

  const next = () => {
    if (step < 3) setStep(s => s + 1);
    else handleFinish();
  };

  const back = () => setStep(s => s - 1);

  const stepIcons: IconName[] = ['calendar-outline', 'flame-outline', 'cash-outline', 'sparkles-outline'];

  const surface = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';

  const inputStyle = (key: string) => ({
    backgroundColor: surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: focused === key ? colors.primary : colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  });

  const quickBtnStyle = (active: boolean) => ({
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Theme.rounded.full,
    backgroundColor: active ? (colors.primary + '14') : 'transparent',
    borderWidth: 1.5,
    borderColor: active ? colors.primary : colors.border,
  });

  const motivCardStyle = (active: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? (colors.primary + '0F') : surface,
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.kicker, { color: colors.primary }]}>
            {t.onboardingTitle}
          </Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {lang === 'tr' ? 'Yolculuğunu kuralım' : "Let's set up your journey"}
          </Text>
          <Text style={[s.headerSubtitle, { color: colors.textSecondary }]}>
            {lang === 'tr'
              ? 'Birkaç soruyla ilerlemeni kişiselleştirelim.'
              : 'A few quick questions to personalize your progress.'}
          </Text>
        </View>

        {/* Progress */}
        <View style={s.progressBlock}>
          <View style={s.progressRow}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  s.progressTrack,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' },
                ]}
              >
                <View
                  style={[
                    s.progressFill,
                    {
                      width: i <= step ? '100%' : '0%',
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <Text style={[s.stepLabel, { color: colors.textTertiary }]}>
            {lang === 'tr' ? 'Adım' : 'Step'} {step + 1}/{steps.length} — {steps[step]}
          </Text>
        </View>

        {/* Card */}
        <View style={[s.card, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
          borderColor: colors.border,
        }]}>
          {/* Step icon */}
          <View style={[s.iconBadge, { backgroundColor: colors.primary + '14' }]}>
            <Ionicons name={stepIcons[step]} size={26} color={colors.primary} />
          </View>

          {/* Step 0: Quit Date */}
          {step === 0 && (
            <View style={s.stepContent}>
              <Text style={[s.stepTitle, { color: colors.text }]}>
                {lang === 'tr' ? 'Ne zaman bıraktın?' : 'When did you quit?'}
              </Text>
              <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
                {lang === 'tr'
                  ? 'Sigaranı bıraktığın tarihi veya bırakmayı planladığın tarihi gir.'
                  : 'Enter the date you quit or plan to quit smoking.'}
              </Text>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>
                {t.quitDateLabel}
              </Text>
              <View style={s.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} style={s.inputIcon} />
                <TextInput
                  style={[inputStyle('quitDate'), s.inputWithIcon]}
                  value={quitDate}
                  onChangeText={setQuitDate}
                  onFocus={() => setFocused('quitDate')}
                  onBlur={() => setFocused(null)}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="default"
                />
              </View>
              <Text style={[s.inputHint, { color: colors.textTertiary }]}>
                {lang === 'tr' ? 'Örnek' : 'Example'}: {new Date().toISOString().slice(0, 10)}
              </Text>
              <View style={s.quickRow}>
                {(lang === 'tr'
                  ? [
                      { label: 'Bugün', days: 0 },
                      { label: 'Dün', days: 1 },
                      { label: '3 gün önce', days: 3 },
                      { label: '1 hafta önce', days: 7 },
                    ]
                  : [
                      { label: 'Today', days: 0 },
                      { label: 'Yesterday', days: 1 },
                      { label: '3 days ago', days: 3 },
                      { label: '1 week ago', days: 7 },
                    ]
                ).map(({ label, days }) => (
                  <TouchableOpacity key={label} style={quickBtnStyle(false)} activeOpacity={0.8} onPress={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - days);
                    setQuitDate(d.toISOString().slice(0, 10));
                  }}>
                    <Text style={[s.quickBtnText, { color: colors.textSecondary }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 1: Cigarettes per day */}
          {step === 1 && (
            <View style={s.stepContent}>
              <Text style={[s.stepTitle, { color: colors.text }]}>
                {lang === 'tr' ? 'Günde kaç sigara içiyordun?' : 'How many cigarettes per day?'}
              </Text>
              <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
                {lang === 'tr'
                  ? 'Kaçırdığın sigaraları ve tasarrufu hesaplamak için kullanılır.'
                  : 'Used to calculate cigarettes avoided and money saved.'}
              </Text>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>
                {t.cigPerDayLabel}
              </Text>
              <TextInput
                style={[inputStyle('cigsPerDay'), s.bigInput]}
                value={cigsPerDay}
                onChangeText={setCigsPerDay}
                onFocus={() => setFocused('cigsPerDay')}
                onBlur={() => setFocused(null)}
                keyboardType="number-pad"
                placeholder="20"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[s.inputHint, { color: colors.textTertiary }]}>
                {lang === 'tr' ? 'adet / gün' : 'pcs / day'}
              </Text>
              <View style={s.quickRow}>
                {['10', '15', '20', '25', '30', '40'].map(v => (
                  <TouchableOpacity key={v} style={quickBtnStyle(cigsPerDay === v)} activeOpacity={0.8} onPress={() => setCigsPerDay(v)}>
                    <Text style={[s.quickBtnText, { color: cigsPerDay === v ? colors.primary : colors.textSecondary }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Step 2: Cost */}
          {step === 2 && (
            <View style={s.stepContent}>
              <Text style={[s.stepTitle, { color: colors.text }]}>
                {lang === 'tr' ? 'Bir paket sigara kaç TL?' : 'How much is a pack of cigarettes?'}
              </Text>
              <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
                {lang === 'tr'
                  ? 'Tasarrufunu TL cinsinden göstermek için kullanılır.'
                  : 'Used to show your savings in Turkish Lira.'}
              </Text>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>
                {t.costPerPackLabel}
              </Text>
              <TextInput
                style={[inputStyle('costPerPack'), s.bigInput]}
                value={costPerPack}
                onChangeText={setCostPerPack}
                onFocus={() => setFocused('costPerPack')}
                onBlur={() => setFocused(null)}
                keyboardType="decimal-pad"
                placeholder="75"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[s.inputHint, { color: colors.textTertiary }]}>TL / {lang === 'tr' ? 'paket' : 'pack'}</Text>
              <View style={s.quickRow}>
                {['65', '70', '75', '80', '85', '90'].map(v => (
                  <TouchableOpacity key={v} style={quickBtnStyle(costPerPack === v)} activeOpacity={0.8} onPress={() => setCostPerPack(v)}>
                    <Text style={[s.quickBtnText, { color: costPerPack === v ? colors.primary : colors.textSecondary }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }, s.fieldLabelSpaced]}>
                {lang === 'tr' ? 'Pakette kaç sigara var?' : 'How many cigarettes per pack?'}
              </Text>
              <TextInput
                style={inputStyle('cigsPerPack')}
                value={cigsPerPack}
                onChangeText={setCigsPerPack}
                onFocus={() => setFocused('cigsPerPack')}
                onBlur={() => setFocused(null)}
                keyboardType="number-pad"
                placeholder="20"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          )}

          {/* Step 3: Motivation */}
          {step === 3 && (
            <View style={s.stepContent}>
              <Text style={[s.stepTitle, { color: colors.text }]}>
                {lang === 'tr' ? 'Neden bırakıyorsun?' : 'Why are you quitting?'}
              </Text>
              <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
                {lang === 'tr'
                  ? 'Zorlandığında seni hatırlatmak için motivasyonunu seç.'
                  : 'Choose your motivation to remind you when times get tough.'}
              </Text>
              <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>
                {t.motivationLabel}
              </Text>
              <View style={s.motivGrid}>
                {MOTIVATIONS.map(m => {
                  const active = motivation === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={motivCardStyle(active)}
                      onPress={() => setMotivation(m.key)}
                      activeOpacity={0.85}
                    >
                      <View style={[s.motivIconWrap, {
                        backgroundColor: active ? colors.primary + '18' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                      }]}>
                        <Ionicons name={m.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.motivLabel, { color: active ? colors.primary : colors.text }]}>{m.label}</Text>
                        <Text style={[s.motivDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
                      </View>
                      {active
                        ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        : <Ionicons name="ellipse-outline" size={24} color={colors.border} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {!!error && (
            <View style={[s.errorBox, {
              backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
              borderColor: 'rgba(239,68,68,0.3)',
            }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={s.navRow}>
          {step > 0 && (
            <TouchableOpacity
              style={[s.backBtn, {
                backgroundColor: 'transparent',
                borderColor: colors.border,
              }]}
              onPress={back}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[s.backBtnText, { color: colors.textSecondary }]}>
                {lang === 'tr' ? 'Geri' : 'Back'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.nextBtn, step === 0 && { marginLeft: 'auto' as any }]}
            onPress={next}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <View style={s.nextBtnInner}>
                  <Text style={s.nextBtnText}>
                    {step === 3
                      ? t.startJourney
                      : (lang === 'tr' ? 'İleri' : 'Next')}
                  </Text>
                  <Ionicons name={step === 3 ? 'rocket-outline' : 'arrow-forward'} size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, paddingTop: 64, paddingBottom: 60, maxWidth: 540, width: '100%', alignSelf: 'center' },

  // Header
  header: { marginBottom: 28 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36, marginBottom: 8 },
  headerSubtitle: { fontSize: 15, lineHeight: 22 },

  // Progress
  progressBlock: { marginBottom: 24 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  progressTrack: { height: 4, flex: 1, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },

  // Card
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 24,
  },
  iconBadge: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },

  stepContent: {},
  stepTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8, lineHeight: 28 },
  stepDesc: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2, marginBottom: 10 },
  fieldLabelSpaced: { marginTop: 24 },
  bigInput: { fontSize: 32, fontWeight: '800', textAlign: 'center', paddingVertical: 18 },
  inputHint: { fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 18 },

  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  inputWithIcon: { paddingLeft: 44 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtnText: { fontSize: 13, fontWeight: '600' },

  // Motivation
  motivGrid: { gap: 10 },
  motivIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  motivLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  motivDesc: { fontSize: 12, lineHeight: 16 },

  // Error
  errorBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 20 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backBtn: {
    flex: 1, flexDirection: 'row', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  backBtnText: { fontSize: 15, fontWeight: '700' },
  nextBtn: {
    flex: 2, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(124,58,237,0.35)' } as any,
      default: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      },
    }),
  },
  nextBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
