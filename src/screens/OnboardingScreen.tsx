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
import { haptics } from '../utils/haptics';
import { requestNotificationPermission } from '../services/notifications';
import {
  FAGERSTROM_QUESTIONS, dependenceLevel, dependenceLabel, dependenceAdvice,
} from '../constants/fagerstrom';

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

const INTRO_SLIDES_TR = [
  { icon: 'leaf-outline' as IconName, title: 'Türkçe, ücretsiz, gerçekten çalışan', desc: 'Sigarayı bırakma yolculuğun için Türkiye’ye özel, sade ve güvenilir bir arkadaş.' },
  { icon: 'pulse-outline' as IconName, title: 'Bilimsel kişisel plan', desc: 'Fagerström testiyle bağımlılık düzeyini ölçüp planını sana göre ayarlıyoruz.' },
  { icon: 'shield-checkmark-outline' as IconName, title: 'Zor anda yanında', desc: 'SOS/panik modu, nefes egzersizleri ve ALO 171 desteğine tek dokunuşla ulaş.' },
];
const INTRO_SLIDES_EN = [
  { icon: 'leaf-outline' as IconName, title: 'Turkish, free, and it actually works', desc: 'A calm, trustworthy companion built for your quit-smoking journey.' },
  { icon: 'pulse-outline' as IconName, title: 'A science-based personal plan', desc: 'The Fagerström test measures your dependence so we tailor the plan to you.' },
  { icon: 'shield-checkmark-outline' as IconName, title: 'There in the hard moments', desc: 'SOS/panic mode, breathing exercises and ALO 171 support — one tap away.' },
];

type StepKey = 'name' | 'date' | 'habit' | 'cost' | 'fagerstrom' | 'plan' | 'motivation' | 'notify';
const STEPS: StepKey[] = ['name', 'date', 'habit', 'cost', 'fagerstrom', 'plan', 'motivation', 'notify'];

// Tarih girişi: web'de gerçek tarih seçici (<input type="date">), native'de ikonlu metin alanı.
function DateField({
  value, onChange, colors, isDark, focusKey, focused, setFocused, max,
}: {
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof getColors>;
  isDark: boolean;
  focusKey: string;
  focused: string | null;
  setFocused: (k: string | null) => void;
  max?: string;
}) {
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date',
      value,
      max,
      onChange: (e: any) => onChange(e.target.value),
      style: {
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: colors.card,
        borderRadius: 14,
        border: `1px solid ${colors.border}`,
        padding: '13px 16px',
        fontSize: 16,
        fontWeight: 600,
        color: colors.text,
        fontFamily: 'inherit',
        outline: 'none',
        colorScheme: isDark ? 'dark' : 'light',
        cursor: 'pointer',
      },
    });
  }
  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <Ionicons name="calendar-outline" size={18} color={colors.textTertiary} style={{ position: 'absolute', left: 16, zIndex: 1 }} />
      <TextInput
        style={{
          backgroundColor: colors.card, borderRadius: 14, borderWidth: 1,
          borderColor: focused === focusKey ? colors.primary : colors.border,
          paddingHorizontal: 16, paddingVertical: 14, paddingLeft: 44,
          fontSize: 16, color: colors.text,
        }}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(focusKey)}
        onBlur={() => setFocused(null)}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

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
  const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  const MOTIVATIONS = lang === 'tr' ? MOTIVATIONS_TR : MOTIVATIONS_EN;
  const SLIDES = lang === 'tr' ? INTRO_SLIDES_TR : INTRO_SLIDES_EN;

  const [started, setStarted] = useState(false);
  const [slide, setSlide] = useState(0);
  const [step, setStep] = useState(0);

  const [name, setName] = useState(session?.user?.user_metadata?.display_name ?? '');
  const [quitDate, setQuitDate] = useState(new Date().toISOString().slice(0, 10));
  const [cigsPerDay, setCigsPerDay] = useState('20');
  const [costPerPack, setCostPerPack] = useState('75');
  const [cigsPerPack, setCigsPerPack] = useState('20');
  const [fagAnswers, setFagAnswers] = useState<Record<string, number>>({});
  const [planType, setPlanType] = useState<'cold_turkey' | 'gradual'>('cold_turkey');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [motivation, setMotivation] = useState('health');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const stepKey = STEPS[step];

  const fagScore = Object.values(fagAnswers).reduce((a, b) => a + b, 0);
  const fagAnswered = Object.keys(fagAnswers).length;
  const fagComplete = fagAnswered === FAGERSTROM_QUESTIONS.length;
  const fagRemaining = FAGERSTROM_QUESTIONS.length - fagAnswered;
  const level = dependenceLevel(fagScore);

  const stepMeta: Record<StepKey, { title: string; desc: string; icon: IconName }> = {
    name:       { title: L('Sana nasıl hitap edelim?', 'What should we call you?'), desc: L('İsmin, ekranlarda seni karşılamak için kullanılır.', 'Your name is used to greet you across the app.'), icon: 'person-outline' },
    date:       { title: L('Ne zaman bıraktın?', 'When did you quit?'), desc: L('Bıraktığın ya da bırakmayı planladığın tarihi gir.', 'Enter the date you quit or plan to quit.'), icon: 'calendar-outline' },
    habit:      { title: L('Günde kaç sigara içiyordun?', 'How many cigarettes per day?'), desc: L('Kaçırdığın sigaraları hesaplamak için kullanılır.', 'Used to calculate cigarettes avoided.'), icon: 'flame-outline' },
    cost:       { title: L('Bir paket kaç TL?', 'How much is a pack?'), desc: L('Tasarrufunu TL cinsinden göstermek için.', 'Used to show your savings in Lira.'), icon: 'cash-outline' },
    fagerstrom: { title: L('Bağımlılık düzeyin', 'Your dependence level'), desc: L('6 kısa soru — planını sana göre ayarlayalım.', '6 short questions to tailor your plan.'), icon: 'pulse-outline' },
    plan:       { title: L('Nasıl bırakmak istersin?', 'How do you want to quit?'), desc: L('Sana uygun yöntemi seç.', 'Pick the approach that fits you.'), icon: 'git-branch-outline' },
    motivation: { title: L('Neden bırakıyorsun?', 'Why are you quitting?'), desc: L('Zorlandığında bunu sana hatırlatırız.', 'We’ll remind you of this when it’s tough.'), icon: 'sparkles-outline' },
    notify:     { title: L('Yanında olalım', 'Let us be there'), desc: L('Günlük hatırlatma ve kilometre taşı bildirimleri.', 'Daily reminders and milestone notifications.'), icon: 'notifications-outline' },
  };

  const canAdvance = (): boolean => {
    if (stepKey === 'name') return name.trim().length >= 2;
    if (stepKey === 'fagerstrom') return fagComplete;
    return true;
  };

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
      plan_type: planType,
      fagerstrom_score: fagComplete ? fagScore : null,
      dependence_level: fagComplete ? level : null,
      target_quit_date: planType === 'gradual' ? targetDate : null,
      is_active: true,
    });
    if (e) { setLoading(false); setError(e.message); return; }

    // İsim: profiles + auth metadata (HomeScreen selamlaması metadata'dan okur).
    const trimmed = name.trim();
    if (trimmed) {
      supabase.auth.updateUser({ data: { display_name: trimmed } }).catch(() => {});
      supabase.from('profiles').update({ display_name: trimmed }).eq('id', session.user.id).then(() => {}, () => {});
    }
    setLoading(false);
    haptics.success();
    onComplete();
  };

  const next = async () => {
    if (!canAdvance()) {
      haptics.warning();
      if (stepKey === 'name') setError(L('Lütfen ismini gir.', 'Please enter your name.'));
      else if (stepKey === 'fagerstrom') setError(L(
        `Devam etmek için ${fagRemaining} soruyu daha yanıtla.`,
        `Answer ${fagRemaining} more question${fagRemaining === 1 ? '' : 's'} to continue.`,
      ));
      return;
    }
    setError('');
    haptics.tapLight();
    if (stepKey === 'notify') {
      // Son adım: bildirim izni iste, sonra yolculuğu oluştur.
      await requestNotificationPermission();
      await handleFinish();
      return;
    }
    setStep(s => s + 1);
  };

  const back = () => { setError(''); setStep(s => Math.max(0, s - 1)); };

  // ---- shared styles ----
  const inputStyle = (key: string) => ({
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: focused === key ? colors.primary : colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  });
  const quickBtnStyle = (active: boolean) => ({
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: Theme.rounded.full,
    backgroundColor: active ? colors.primarySoft : 'transparent',
    borderWidth: 1, borderColor: active ? colors.primary : colors.border,
  });
  const motivCardStyle = (active: boolean) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 14,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1,
    borderColor: active ? colors.primary : colors.border,
    backgroundColor: active ? colors.primarySoft : colors.card,
  });

  // ===================================================================
  // Intro carousel
  // ===================================================================
  if (!started) {
    const s0 = SLIDES[slide];
    const isLast = slide === SLIDES.length - 1;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={[s.content, { justifyContent: 'center', flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
          <View style={s.introMark}>
            <Text style={{ fontSize: 40 }}>🚭</Text>
          </View>
          <View style={[s.iconBadge, { backgroundColor: colors.primary + '14', alignSelf: 'center', marginTop: 12 }]}>
            <Ionicons name={s0.icon} size={28} color={colors.primary} />
          </View>
          <Text style={[s.introTitle, { color: colors.text }]}>{s0.title}</Text>
          <Text style={[s.introDesc, { color: colors.textSecondary }]}>{s0.desc}</Text>

          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i === slide ? colors.primary : colors.border, width: i === slide ? 22 : 8 }]} />
            ))}
          </View>

          <TouchableOpacity
            style={[s.nextBtn, { marginTop: 8 }]}
            onPress={() => { haptics.tapLight(); isLast ? setStarted(true) : setSlide(v => v + 1); }}
            activeOpacity={0.9}
          >
            <View style={s.nextBtnInner}>
              <Text style={s.nextBtnText}>{isLast ? L('Başlayalım', 'Let’s start') : L('Devam', 'Next')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>
          {!isLast && (
            <TouchableOpacity onPress={() => { haptics.tapLight(); setStarted(true); }} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 16 }}>
              <Text style={{ color: colors.textTertiary, fontWeight: '600', fontSize: 14 }}>{L('Atla', 'Skip')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  const meta = stepMeta[stepKey];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={[s.kicker, { color: colors.primary }]}>{t.onboardingTitle}</Text>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {L('Yolculuğunu kuralım', 'Let’s set up your journey')}
          </Text>
          <Text style={[s.headerSubtitle, { color: colors.textSecondary }]}>
            {L('Birkaç soruyla ilerlemeni kişiselleştirelim.', 'A few quick questions to personalize your progress.')}
          </Text>
        </View>

        {/* Progress */}
        <View style={s.progressBlock}>
          <View style={s.progressRow}>
            {STEPS.map((_, i) => (
              <View key={i} style={[s.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[s.progressFill, { width: i <= step ? '100%' : '0%', backgroundColor: colors.primary }]} />
              </View>
            ))}
          </View>
          <Text style={[s.stepLabel, { color: colors.textTertiary }]}>
            {L('Adım', 'Step')} {step + 1}/{STEPS.length}
          </Text>
        </View>

        {/* Card */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border, ...Theme.shadows.card }]}>
          <View style={[s.iconBadge, { backgroundColor: colors.primary + '14' }]}>
            <Ionicons name={meta.icon} size={26} color={colors.primary} />
          </View>
          <Text style={[s.stepTitle, { color: colors.text }]}>{meta.title}</Text>
          <Text style={[s.stepDesc, { color: colors.textSecondary }]}>{meta.desc}</Text>

          {/* NAME */}
          {stepKey === 'name' && (
            <TextInput
              style={[inputStyle('name'), { fontSize: 18 }]}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder={L('Adın', 'Your name')}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          )}

          {/* DATE */}
          {stepKey === 'date' && (
            <>
              <DateField
                value={quitDate}
                onChange={setQuitDate}
                colors={colors}
                isDark={isDark}
                focusKey="quitDate"
                focused={focused}
                setFocused={setFocused}
              />
              <View style={[s.quickRow, { marginTop: 14 }]}>
                {(lang === 'tr'
                  ? [{ label: 'Bugün', days: 0 }, { label: 'Dün', days: 1 }, { label: '3 gün önce', days: 3 }, { label: '1 hafta önce', days: 7 }]
                  : [{ label: 'Today', days: 0 }, { label: 'Yesterday', days: 1 }, { label: '3 days ago', days: 3 }, { label: '1 week ago', days: 7 }]
                ).map(({ label, days }) => (
                  <TouchableOpacity key={label} style={quickBtnStyle(false)} activeOpacity={0.8} onPress={() => {
                    const d = new Date(); d.setDate(d.getDate() - days); setQuitDate(d.toISOString().slice(0, 10));
                  }}>
                    <Text style={[s.quickBtnText, { color: colors.textSecondary }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* HABIT */}
          {stepKey === 'habit' && (
            <>
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
              <Text style={[s.inputHint, { color: colors.textTertiary }]}>{L('adet / gün', 'pcs / day')}</Text>
              <View style={s.quickRow}>
                {['10', '15', '20', '25', '30', '40'].map(v => (
                  <TouchableOpacity key={v} style={quickBtnStyle(cigsPerDay === v)} activeOpacity={0.8} onPress={() => setCigsPerDay(v)}>
                    <Text style={[s.quickBtnText, { color: cigsPerDay === v ? colors.primary : colors.textSecondary }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* COST */}
          {stepKey === 'cost' && (
            <>
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
              <Text style={[s.inputHint, { color: colors.textTertiary }]}>TL / {L('paket', 'pack')}</Text>
              <View style={s.quickRow}>
                {['65', '70', '75', '80', '85', '90'].map(v => (
                  <TouchableOpacity key={v} style={quickBtnStyle(costPerPack === v)} activeOpacity={0.8} onPress={() => setCostPerPack(v)}>
                    <Text style={[s.quickBtnText, { color: costPerPack === v ? colors.primary : colors.textSecondary }]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[s.fieldLabel, { color: colors.textSecondary, marginTop: 24 }]}>
                {L('Pakette kaç sigara var?', 'Cigarettes per pack?')}
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
            </>
          )}

          {/* FAGERSTROM */}
          {stepKey === 'fagerstrom' && (
            <View style={{ gap: 20 }}>
              {FAGERSTROM_QUESTIONS.map((q, qi) => (
                <View key={q.key}>
                  <Text style={[s.fagQ, { color: colors.text }]}>{qi + 1}. {lang === 'tr' ? q.tr : q.en}</Text>
                  <View style={s.fagOpts}>
                    {q.options.map(opt => {
                      const active = fagAnswers[q.key] === opt.score && fagAnswers[q.key] !== undefined;
                      return (
                        <TouchableOpacity
                          key={opt.en}
                          style={[quickBtnStyle(active), { paddingVertical: 10 }]}
                          activeOpacity={0.8}
                          onPress={() => { haptics.selection(); setFagAnswers(a => ({ ...a, [q.key]: opt.score })); }}
                        >
                          <Text style={[s.quickBtnText, { color: active ? colors.primary : colors.textSecondary }]}>
                            {lang === 'tr' ? opt.tr : opt.en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              {fagComplete ? (
                <View style={[s.resultBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '44' }]}>
                  <Text style={[s.resultLevel, { color: colors.primary }]}>
                    {dependenceLabel(level, lang)} · {fagScore}/10
                  </Text>
                  <Text style={[s.resultAdvice, { color: colors.textSecondary }]}>{dependenceAdvice(level, lang)}</Text>
                </View>
              ) : (
                <View style={[s.fagHint, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} style={{ marginRight: 8 }} />
                  <Text style={[s.fagHintText, { color: colors.textSecondary }]}>
                    {L(
                      `Planını oluşturmak için ${fagRemaining} soru kaldı. Tüm soruları yanıtlayınca "İleri" açılır.`,
                      `${fagRemaining} question${fagRemaining === 1 ? '' : 's'} left to build your plan. "Next" unlocks once all are answered.`,
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* PLAN */}
          {stepKey === 'plan' && (
            <View style={{ gap: 12 }}>
              {([
                { key: 'cold_turkey', icon: 'flash-outline' as IconName, title: L('Bir anda bırak', 'Quit at once'), desc: L('Bugünden itibaren sigarasız. Net ve kararlı.', 'Smoke-free from today. Clear and committed.') },
                { key: 'gradual', icon: 'trending-down-outline' as IconName, title: L('Kademeli azalt', 'Reduce gradually'), desc: L('Hedef tarihe kadar yavaşça azalt.', 'Cut down slowly until a target date.') },
              ] as const).map(p => {
                const active = planType === p.key;
                return (
                  <TouchableOpacity key={p.key} style={motivCardStyle(active)} activeOpacity={0.85}
                    onPress={() => { haptics.selection(); setPlanType(p.key); }}>
                    <View style={[s.motivIconWrap, { backgroundColor: active ? colors.primarySoft : colors.surface }]}>
                      <Ionicons name={p.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.motivLabel, { color: active ? colors.primary : colors.text }]}>{p.title}</Text>
                      <Text style={[s.motivDesc, { color: colors.textSecondary }]}>{p.desc}</Text>
                    </View>
                    {active
                      ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      : <Ionicons name="ellipse-outline" size={24} color={colors.border} />}
                  </TouchableOpacity>
                );
              })}
              {planType === 'gradual' && (
                <View style={{ marginTop: 6 }}>
                  <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{L('Hedef bırakma tarihi', 'Target quit date')}</Text>
                  <DateField
                    value={targetDate}
                    onChange={setTargetDate}
                    colors={colors}
                    isDark={isDark}
                    focusKey="targetDate"
                    focused={focused}
                    setFocused={setFocused}
                  />
                </View>
              )}
            </View>
          )}

          {/* MOTIVATION */}
          {stepKey === 'motivation' && (
            <View style={s.motivGrid}>
              {MOTIVATIONS.map(m => {
                const active = motivation === m.key;
                return (
                  <TouchableOpacity key={m.key} style={motivCardStyle(active)} activeOpacity={0.85}
                    onPress={() => { haptics.selection(); setMotivation(m.key); }}>
                    <View style={[s.motivIconWrap, { backgroundColor: active ? colors.primarySoft : colors.surface }]}>
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
          )}

          {/* NOTIFY */}
          {stepKey === 'notify' && (
            <View style={{ gap: 12 }}>
              {[
                { icon: 'flame-outline' as IconName, text: L('Günlük seri hatırlatması', 'Daily streak reminder') },
                { icon: 'trophy-outline' as IconName, text: L('Kilometre taşı kutlamaları', 'Milestone celebrations') },
                { icon: 'moon-outline' as IconName, text: L('Akşam check-in daveti', 'Evening check-in nudge') },
              ].map(item => (
                <View key={item.text} style={[s.notifyRow, { borderColor: colors.border }]}>
                  <View style={[s.motivIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={item.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={[s.motivLabel, { color: colors.text, flex: 1 }]}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}

          {!!error && (
            <View style={[s.errorBox, { backgroundColor: colors.cardElevated, borderColor: colors.error }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={s.navRow}>
          {step > 0 && (
            <TouchableOpacity style={[s.backBtn, { borderColor: colors.border }]} onPress={back} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[s.backBtnText, { color: colors.textSecondary }]}>{L('Geri', 'Back')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              s.nextBtn,
              step === 0 && { marginLeft: 'auto' as any },
              !canAdvance() && !loading && { opacity: 0.55 },
            ]}
            onPress={next}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={s.nextBtnInner}>
                  <Text style={s.nextBtnText}>
                    {stepKey === 'notify' ? (lang === 'tr' ? 'Bildirimleri Aç' : 'Enable Notifications')
                      : stepKey === 'motivation' ? t.startJourney
                      : (lang === 'tr' ? 'İleri' : 'Next')}
                  </Text>
                  <Ionicons
                    name={stepKey === 'notify' ? 'notifications' : 'arrow-forward'}
                    size={18} color="#fff" style={{ marginLeft: 8 }}
                  />
                </View>
              )}
          </TouchableOpacity>
        </View>

        {/* On the notify step, allow finishing without enabling notifications */}
        {stepKey === 'notify' && !loading && (
          <TouchableOpacity onPress={handleFinish} activeOpacity={0.7} style={{ alignSelf: 'center', marginTop: 16 }}>
            <Text style={{ color: colors.textTertiary, fontWeight: '600', fontSize: 14 }}>{L('Şimdi değil', 'Not now')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 24, paddingTop: 64, paddingBottom: 60, maxWidth: 540, width: '100%', alignSelf: 'center' },

  // Intro
  introMark: {
    width: 84, height: 84, borderRadius: 26, alignSelf: 'center',
    backgroundColor: 'rgba(124,58,237,0.14)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.22)',
  },
  introTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center', marginTop: 24, lineHeight: 32 },
  introDesc: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
  dots: { flexDirection: 'row', gap: 8, alignSelf: 'center', marginVertical: 30 },
  dot: { height: 8, borderRadius: 4 },

  // Header
  header: { marginBottom: 28 },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36, marginBottom: 8 },
  headerSubtitle: { fontSize: 15, lineHeight: 22 },

  // Progress
  progressBlock: { marginBottom: 24 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  progressTrack: { height: 4, flex: 1, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },

  // Card
  card: { borderRadius: 18, borderWidth: 1, padding: 24 },
  iconBadge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8, lineHeight: 28 },
  stepDesc: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2, marginBottom: 10 },
  bigInput: { fontSize: 32, fontWeight: '800', textAlign: 'center', paddingVertical: 18 },
  inputHint: { fontSize: 12, textAlign: 'center', marginTop: 10, marginBottom: 18 },

  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  inputWithIcon: { paddingLeft: 44 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtnText: { fontSize: 13, fontWeight: '600' },

  // Fagerström
  fagQ: { fontSize: 14.5, fontWeight: '700', marginBottom: 10, lineHeight: 20 },
  fagOpts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 4 },
  resultLevel: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  resultAdvice: { fontSize: 13, lineHeight: 19 },
  fagHint: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 4 },
  fagHintText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },

  // Motivation / plan
  motivGrid: { gap: 10 },
  motivIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  motivLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  motivDesc: { fontSize: 12, lineHeight: 16 },

  notifyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },

  // Error
  errorBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 20 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '600' },

  // Navigation
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  backBtn: { flex: 1, flexDirection: 'row', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backBtnText: { fontSize: 15, fontWeight: '700' },
  nextBtn: { flex: 2, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.primary, ...Theme.shadows.primary },
  nextBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
