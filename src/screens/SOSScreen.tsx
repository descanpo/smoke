import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Platform, Linking, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { getColors, Theme } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../navigation/Navigator';
import { haptics } from '../utils/haptics';

type IconName = keyof typeof Ionicons.glyphMap;
const COUNTDOWN_SECONDS = 180; // istek genellikle 3-5 dk'da geçer

export default function SOSScreen({
  session, journey, onBreathing, onLogCraving,
}: {
  session: any;
  journey: any;
  onBreathing: () => void;
  onLogCraving: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang } = useLanguage();
  const { navigate, goBack } = useNavigation();
  const colors = getColors(mode);
  const L = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  const [left, setLeft] = useState(COUNTDOWN_SECONDS);
  const startRef = useRef(Date.now());
  const pulse = useRef(new Animated.Value(1)).current;
  const logged = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(l => (l > 0 ? l - 1 : 0));
    }, 1000);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 2600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => { clearInterval(timer); loop.stop(); };
  }, []);

  const logPanic = async (resolvedWith: string, passed: boolean) => {
    if (logged.current) return;
    logged.current = true;
    const duration = Math.round((Date.now() - startRef.current) / 1000);
    await supabase.from('panic_events').insert({
      user_id: session.user.id,
      journey_id: journey?.id ?? null,
      resolved_with: resolvedWith,
      passed,
      duration_seconds: duration,
    }).then(() => {}, () => {}); // tablo yoksa sessizce geç
  };

  const finishPassed = async () => {
    haptics.success();
    await logPanic('passed', true);
    navigate('Home');
  };

  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');

  const actions: { icon: IconName; label: string; accent: string; onPress: () => void }[] = [
    { icon: 'leaf', label: L('Nefes Egzersizi', 'Breathing'), accent: colors.secondary, onPress: () => { haptics.tapMedium(); logPanic('breathing', false); onBreathing(); } },
    { icon: 'create', label: L('İsteği Kaydet', 'Log Craving'), accent: colors.warning, onPress: () => { haptics.tapMedium(); logPanic('craving_log', false); onLogCraving(); } },
    { icon: 'call', label: L('ALO 171’i Ara', 'Call ALO 171'), accent: colors.success, onPress: () => { haptics.tapMedium(); logPanic('call', false); Platform.OS === 'web' ? (window as any).open('tel:171') : Linking.openURL('tel:171').catch(() => {}); } },
    { icon: 'heart', label: L('Destek Merkezi', 'Support Center'), accent: colors.primary, onPress: () => { haptics.tapLight(); navigate('Support'); } },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <View style={[s.sosTag, { backgroundColor: colors.sosSoft, borderColor: colors.sos + '55' }]}>
            <View style={[s.sosDot, { backgroundColor: colors.sos }]} />
            <Text style={[s.sosTagText, { color: colors.sos }]}>{L('PANİK MODU', 'PANIC MODE')}</Text>
          </View>
          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
            onPress={() => { haptics.tapLight(); goBack(); }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={[s.title, { color: colors.text }]}>
          {L('Derin bir nefes al.', 'Take a deep breath.')}
        </Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          {L('Bu his bir dalga gibi; yükselir ve geçer. Sen kıyıda kalmayı seçtin.',
             'This feeling is a wave; it rises and passes. You chose to stay on shore.')}
        </Text>

        {/* Countdown orb */}
        <View style={s.orbArea}>
          <Animated.View style={[s.orb, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '55', transform: [{ scale: pulse }] }]}>
            <Text style={[s.timer, { color: colors.primary }]}>{mm}:{ss}</Text>
            <Text style={[s.timerCaption, { color: colors.textSecondary }]}>
              {left > 0 ? L('istek azalıyor', 'craving fading') : L('aferin sana', 'well done')}
            </Text>
          </Animated.View>
        </View>

        <Text style={[s.hint, { color: colors.textTertiary }]}>
          {L('İstekler genellikle 3-5 dakikada geçer. Bu süreyi birlikte atlatalım.',
             'Cravings usually pass in 3-5 minutes. Let’s get through it together.')}
        </Text>

        {/* Actions */}
        <View style={s.actionsGrid}>
          {actions.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionCard, { backgroundColor: colors.card, borderColor: colors.border, ...Theme.shadows.card }]}
              onPress={a.onPress}
              activeOpacity={0.85}
            >
              <View style={[s.actionIcon, { backgroundColor: a.accent + (isDark ? '22' : '14') }]}>
                <Ionicons name={a.icon} size={22} color={a.accent} />
              </View>
              <Text style={[s.actionLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.passedBtn, { backgroundColor: colors.success }]} onPress={finishPassed} activeOpacity={0.9}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={s.passedText}>{L('Geçti, iyiyim 💪', 'It passed, I’m good 💪')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, paddingBottom: 60, maxWidth: 540, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  sosTag: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9999, borderWidth: 1 },
  sosDot: { width: 7, height: 7, borderRadius: 4 },
  sosTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },

  orbArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  orb: { width: 220, height: 220, borderRadius: 110, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 56, fontWeight: '800', letterSpacing: -2 },
  timerCaption: { fontSize: 13, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },

  hint: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 24, paddingHorizontal: 16 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionCard: { flex: 1, minWidth: '45%', borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'center', gap: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },

  passedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16, ...Theme.shadows.card },
  passedText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
