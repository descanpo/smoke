import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const MOTIVATIONS_TR = [
  { key: 'health', label: '❤️ Sağlık', desc: 'Daha uzun, daha sağlıklı yaşamak' },
  { key: 'money', label: '💰 Para', desc: 'Tasarruf etmek, biriktirmek' },
  { key: 'family', label: '👨‍👩‍👧 Aile', desc: 'Sevdiklerim için sağlıklı olmak' },
  { key: 'sports', label: '🏃 Spor', desc: 'Fiziksel performansımı artırmak' },
  { key: 'smell', label: '🌸 Koku', desc: 'Daha iyi kokmak, temiz nefes' },
  { key: 'freedom', label: '🦋 Özgürlük', desc: 'Bağımlılıktan kurtulmak' },
];

const MOTIVATIONS_EN = [
  { key: 'health', label: '❤️ Health', desc: 'Live longer and healthier' },
  { key: 'money', label: '💰 Money', desc: 'Save and build savings' },
  { key: 'family', label: '👨‍👩‍👧 Family', desc: 'Stay healthy for my loved ones' },
  { key: 'sports', label: '🏃 Sports', desc: 'Improve my physical performance' },
  { key: 'smell', label: '🌸 Smell', desc: 'Smell better, breathe clean' },
  { key: 'freedom', label: '🦋 Freedom', desc: 'Break free from addiction' },
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

  const inputStyle = {
    backgroundColor: colors.card,
    borderRadius: Theme.rounded.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  };

  const quickBtnStyle = (active: boolean) => ({
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.rounded.md,
    backgroundColor: active ? (colors.primary + '33') : colors.card,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
  });

  const motivCardStyle = (active: boolean) => ({
    padding: 14,
    borderRadius: Theme.rounded.md,
    borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? (colors.primary + '33') : colors.card,
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={s.content}
    >
      {/* Progress */}
      <View style={s.progressRow}>
        {steps.map((_, i) => (
          <View key={i} style={[
            s.progressDot,
            { backgroundColor: i <= step ? (i === step ? colors.primary : colors.primaryLight) : colors.border },
          ]} />
        ))}
      </View>
      <Text style={[s.stepLabel, { color: colors.textTertiary }]}>
        {step + 1}/{steps.length} — {steps[step]}
      </Text>

      {/* Step 0: Quit Date */}
      {step === 0 && (
        <View style={s.stepContent}>
          <Text style={[s.stepTitle, { color: colors.text }]}>
            🚭 {lang === 'tr' ? 'Ne zaman bıraktın?' : 'When did you quit?'}
          </Text>
          <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
            {lang === 'tr'
              ? 'Sigaranı bıraktığın tarihi veya bırakmayı planladığın tarihi gir.'
              : 'Enter the date you quit or plan to quit smoking.'}
          </Text>
          <TextInput
            style={inputStyle}
            value={quitDate}
            onChangeText={setQuitDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textTertiary}
            keyboardType="default"
          />
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
              <TouchableOpacity key={label} style={quickBtnStyle(false)} onPress={() => {
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
            🚬 {lang === 'tr' ? 'Günde kaç sigara içiyordun?' : 'How many cigarettes per day?'}
          </Text>
          <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
            {lang === 'tr'
              ? 'Kaçırdığın sigaraları ve tasarrufu hesaplamak için kullanılır.'
              : 'Used to calculate cigarettes avoided and money saved.'}
          </Text>
          <TextInput
            style={[inputStyle, s.bigInput]}
            value={cigsPerDay}
            onChangeText={setCigsPerDay}
            keyboardType="number-pad"
            placeholder="20"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[s.inputHint, { color: colors.textTertiary }]}>
            {lang === 'tr' ? 'adet / gün' : 'pcs / day'}
          </Text>
          <View style={s.quickRow}>
            {['10', '15', '20', '25', '30', '40'].map(v => (
              <TouchableOpacity key={v} style={quickBtnStyle(cigsPerDay === v)} onPress={() => setCigsPerDay(v)}>
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
            💰 {lang === 'tr' ? 'Bir paket sigara kaç TL?' : 'How much is a pack of cigarettes?'}
          </Text>
          <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
            {lang === 'tr'
              ? 'Tasarrufunu TL cinsinden göstermek için kullanılır.'
              : 'Used to show your savings in Turkish Lira.'}
          </Text>
          <TextInput
            style={[inputStyle, s.bigInput]}
            value={costPerPack}
            onChangeText={setCostPerPack}
            keyboardType="decimal-pad"
            placeholder="75"
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[s.inputHint, { color: colors.textTertiary }]}>TL / {lang === 'tr' ? 'paket' : 'pack'}</Text>
          <View style={s.quickRow}>
            {['65', '70', '75', '80', '85', '90'].map(v => (
              <TouchableOpacity key={v} style={quickBtnStyle(costPerPack === v)} onPress={() => setCostPerPack(v)}>
                <Text style={[s.quickBtnText, { color: costPerPack === v ? colors.primary : colors.textSecondary }]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.stepDesc2, { color: colors.textSecondary }]}>
            {lang === 'tr' ? 'Pakette kaç sigara var?' : 'How many cigarettes per pack?'}
          </Text>
          <TextInput
            style={inputStyle}
            value={cigsPerPack}
            onChangeText={setCigsPerPack}
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
            🌟 {lang === 'tr' ? 'Neden bırakıyorsun?' : 'Why are you quitting?'}
          </Text>
          <Text style={[s.stepDesc, { color: colors.textSecondary }]}>
            {lang === 'tr'
              ? 'Zorlandığında seni hatırlatmak için motivasyonunu seç.'
              : 'Choose your motivation to remind you when times get tough.'}
          </Text>
          <View style={s.motivGrid}>
            {MOTIVATIONS.map(m => (
              <TouchableOpacity
                key={m.key}
                style={motivCardStyle(motivation === m.key)}
                onPress={() => setMotivation(m.key)}
                activeOpacity={0.75}
              >
                <Text style={[s.motivLabel, { color: colors.text }]}>{m.label}</Text>
                <Text style={[s.motivDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!!error && <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>}

      {/* Navigation */}
      <View style={s.navRow}>
        {step > 0 && (
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={back}
          >
            <Text style={[s.backBtnText, { color: colors.textSecondary }]}>
              ← {lang === 'tr' ? 'Geri' : 'Back'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, step === 0 && { marginLeft: 'auto' as any }, { backgroundColor: colors.primary }, Theme.shadows.glow]}
          onPress={next}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.nextBtnText}>
                {step === 3
                  ? (lang === 'tr' ? 'Başla! 🚀' : 'Start! 🚀')
                  : (lang === 'tr' ? 'İleri →' : 'Next →')}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, paddingTop: 56, paddingBottom: 60 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  progressDot: { height: 4, flex: 1, borderRadius: 2 },
  stepLabel: { fontSize: 12, marginBottom: 32, textTransform: 'uppercase', letterSpacing: 1 },
  stepContent: { marginBottom: 32 },
  stepTitle: { fontSize: 24, fontWeight: '700', marginBottom: 10, lineHeight: 32 },
  stepDesc: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  stepDesc2: { fontSize: 14, marginBottom: 8, marginTop: 12 },
  bigInput: { fontSize: 32, fontWeight: '700', textAlign: 'center', padding: 20 },
  inputHint: { fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtnText: { fontSize: 13, fontWeight: '500' },
  motivGrid: { gap: 10 },
  motivLabel: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  motivDesc: { fontSize: 12 },
  errorText: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  navRow: { flexDirection: 'row', gap: 12 },
  backBtn: {
    flex: 1, padding: 16, borderRadius: Theme.rounded.md, alignItems: 'center',
    borderWidth: 1,
  },
  backBtnText: { fontSize: 16, fontWeight: '600' },
  nextBtn: {
    flex: 2, padding: 16, borderRadius: Theme.rounded.md, alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
