import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform, SafeAreaView,
} from 'react-native';
import { supabase } from '../services/supabase';
import { getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const EXERCISES_TR = [
  {
    key: 'box_breathing',
    name: 'Kutu Nefesi',
    desc: '4-4-4-4 döngüsü — stresi azaltır',
    cycles: 4,
    phases: [
      { labelKey: 'inhale', dur: 4, color: '#7C3AED' },
      { labelKey: 'hold', dur: 4, color: '#F59E0B' },
      { labelKey: 'exhale', dur: 4, color: '#10B981' },
      { labelKey: 'rest', dur: 4, color: '#06B6D4' },
    ],
  },
  {
    key: '4_7_8',
    name: '4-7-8 Nefesi',
    desc: 'Anksiyeteyi hızla azaltır',
    cycles: 3,
    phases: [
      { labelKey: 'inhale', dur: 4, color: '#7C3AED' },
      { labelKey: 'hold', dur: 7, color: '#F59E0B' },
      { labelKey: 'exhale', dur: 8, color: '#10B981' },
    ],
  },
  {
    key: 'deep_breath',
    name: 'Derin Nefes',
    desc: 'Basit ve etkili rahatlama',
    cycles: 6,
    phases: [
      { labelKey: 'inhale', dur: 5, color: '#7C3AED' },
      { labelKey: 'exhale', dur: 5, color: '#10B981' },
    ],
  },
];

const EXERCISES_EN = [
  {
    key: 'box_breathing',
    name: 'Box Breathing',
    desc: '4-4-4-4 cycle — reduces stress',
    cycles: 4,
    phases: [
      { labelKey: 'inhale', dur: 4, color: '#7C3AED' },
      { labelKey: 'hold', dur: 4, color: '#F59E0B' },
      { labelKey: 'exhale', dur: 4, color: '#10B981' },
      { labelKey: 'rest', dur: 4, color: '#06B6D4' },
    ],
  },
  {
    key: '4_7_8',
    name: '4-7-8 Breathing',
    desc: 'Rapidly reduces anxiety',
    cycles: 3,
    phases: [
      { labelKey: 'inhale', dur: 4, color: '#7C3AED' },
      { labelKey: 'hold', dur: 7, color: '#F59E0B' },
      { labelKey: 'exhale', dur: 8, color: '#10B981' },
    ],
  },
  {
    key: 'deep_breath',
    name: 'Deep Breathing',
    desc: 'Simple and effective relaxation',
    cycles: 6,
    phases: [
      { labelKey: 'inhale', dur: 5, color: '#7C3AED' },
      { labelKey: 'exhale', dur: 5, color: '#10B981' },
    ],
  },
];

export default function BreathingModal({
  session,
  onClose,
}: {
  session: any;
  onClose: () => void;
}) {
  const { mode, isDark } = useThemeMode();
  const { lang, t } = useLanguage();
  const colors = getColors(mode);

  const EXERCISES = lang === 'tr' ? EXERCISES_TR : EXERCISES_EN;

  const [exIdx, setExIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<any>(null);
  const startRef = useRef(0);
  const circleAnim = useRef(new Animated.Value(0)).current;

  const ex = EXERCISES[exIdx];
  const phase = ex.phases[phaseIdx];

  // Map labelKey to translated label
  const getPhaseLabel = (labelKey: string) => {
    switch (labelKey) {
      case 'inhale': return t.inhale;
      case 'hold': return t.hold;
      case 'exhale': return t.exhale;
      case 'rest': return t.rest;
      default: return labelKey;
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (running) {
      Animated.timing(circleAnim, {
        toValue: phaseIdx === 0 ? 1 : 0,
        duration: (phase?.dur ?? 4) * 900,
        useNativeDriver: false,
      }).start();
    }
  }, [phaseIdx, running]);

  const runPhase = (pi: number, ci: number) => {
    const p = ex.phases[pi];
    setPhaseIdx(pi);
    setCountdown(p.dur);
    let rem = p.dur;
    timerRef.current = setInterval(() => {
      rem--;
      setCountdown(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current);
        const nextPi = pi + 1;
        if (nextPi < ex.phases.length) {
          runPhase(nextPi, ci);
        } else {
          const nextCi = ci + 1;
          setCycle(nextCi);
          if (nextCi < ex.cycles) runPhase(0, nextCi);
          else complete();
        }
      }
    }, 1000);
  };

  const start = () => {
    setRunning(true);
    setDone(false);
    setPhaseIdx(0);
    setCycle(0);
    circleAnim.setValue(0);
    startRef.current = Date.now();
    runPhase(0, 0);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
  };

  const complete = async () => {
    setRunning(false);
    setDone(true);
    const dur = Math.round((Date.now() - startRef.current) / 1000);
    try {
      await supabase.from('breathing_exercise_logs').insert({
        user_id: session.user.id,
        exercise_type: ex.key,
        duration_seconds: dur,
        completed: true,
      });
    } catch {}
  };

  const circleSize = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [130, 200],
  });
  // Outer glow ring scales slightly more than the core orb (purely presentational, derived from same Animated value).
  const haloSize = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 320],
  });
  const haloOpacity = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  const currentColor = done ? '#10B981' : running ? phase.color : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(124,58,237,0.55)');
  const orbActive = done || running;

  const sheetBg = isDark ? '#0B0B16' : '#FBFAFF';
  const ambientTop = isDark ? '#1A1330' : '#F1ECFF';
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(124,58,237,0.05)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(124,58,237,0.12)';
  const cycleLabel = lang === 'tr' ? `Döngü ${cycle + 1} / ${ex.cycles}` : `Cycle ${cycle + 1} / ${ex.cycles}`;

  return (
    <TouchableOpacity
      style={s.overlay}
      activeOpacity={1}
      onPress={() => { stop(); onClose(); }}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={[
          s.sheet,
          { backgroundColor: sheetBg, borderColor: colors.border },
          Platform.select({
            web: {
              backgroundImage: isDark
                ? `linear-gradient(180deg, ${ambientTop} 0%, ${sheetBg} 55%)`
                : `linear-gradient(180deg, ${ambientTop} 0%, ${sheetBg} 60%)`,
            } as any,
            default: {},
          }),
        ]}
        onPress={() => {}}
      >
        {/* Ambient blurred orbs */}
        <View pointerEvents="none" style={[s.ambientOrb, s.ambientOrbA]} />
        <View pointerEvents="none" style={[s.ambientOrb, s.ambientOrbB]} />

        {/* Drag handle */}
        <View style={[s.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(124,58,237,0.25)' }]} />

        <SafeAreaView>
          <View style={s.header}>
            <Text style={[s.eyebrow, { color: '#06B6D4' }]}>
              {lang === 'tr' ? 'NEFES MOLASI' : 'BREATHE'}
            </Text>
            <Text style={[s.title, { color: colors.text }]}>{t.breathingTitle}</Text>
          </View>

          {/* Exercise selector */}
          {!running && !done && (
            <View style={s.exList}>
              {EXERCISES.map((e, i) => {
                const selected = exIdx === i;
                return (
                  <TouchableOpacity
                    key={e.key}
                    style={[
                      s.exCard,
                      {
                        backgroundColor: selected ? 'rgba(124,58,237,0.14)' : cardBg,
                        borderColor: selected ? '#7C3AED' : cardBorder,
                      },
                      selected && Platform.select({
                        web: { boxShadow: '0 8px 28px rgba(124,58,237,0.18)' } as any,
                        default: {
                          shadowColor: '#7C3AED',
                          shadowOpacity: 0.22,
                          shadowRadius: 12,
                          shadowOffset: { width: 0, height: 6 },
                          elevation: 3,
                        },
                      }),
                    ]}
                    onPress={() => setExIdx(i)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.exDot, { backgroundColor: selected ? '#7C3AED' : 'transparent', borderColor: selected ? '#7C3AED' : cardBorder }]}>
                      {selected && <Text style={s.exDotCheck}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.exName, { color: selected ? (isDark ? '#C4B5FD' : '#6D28D9') : colors.text }]}>{e.name}</Text>
                      <Text style={[s.exDesc, { color: colors.textSecondary }]}>{e.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Animated breathing orb */}
          <View style={s.circleArea}>
            {/* Soft outer halo — concentric ring driven by the same Animated value */}
            <Animated.View
              pointerEvents="none"
              style={[
                s.halo,
                {
                  width: haloSize,
                  height: haloSize,
                  opacity: orbActive ? haloOpacity : 0.28,
                  backgroundColor: currentColor + '1A',
                  borderColor: currentColor + '33',
                },
              ]}
            />
            <Animated.View style={[
              s.circle,
              {
                width: circleSize,
                height: circleSize,
                borderColor: currentColor,
                backgroundColor: currentColor + '22',
              },
              Platform.select({
                web: {
                  backgroundImage: `radial-gradient(circle at 35% 30%, ${currentColor}3D, ${currentColor}14 70%)`,
                  boxShadow: orbActive
                    ? `0 0 60px ${currentColor}66, inset 0 0 30px ${currentColor}33`
                    : `0 0 30px ${currentColor}33`,
                } as any,
                default: {
                  shadowColor: currentColor,
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                },
              }),
            ]}>
              {/* Inner ring for depth */}
              <View style={[s.innerRing, { borderColor: currentColor + '44' }]} />
              {done ? (
                <>
                  <Text style={s.orbEmoji}>🏆</Text>
                  <Text style={[s.phaseLabel, { color: '#10B981' }]}>{t.complete}</Text>
                </>
              ) : running ? (
                <>
                  <Text style={[s.phaseLabel, { color: phase.color }]}>{getPhaseLabel(phase.labelKey)}</Text>
                  <Text style={[s.countdown, { color: phase.color }]}>{countdown}</Text>
                </>
              ) : (
                <Text style={s.orbEmojiIdle}>🌬️</Text>
              )}
            </Animated.View>

            {running ? (
              <View style={[s.cyclePill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[s.cycleText, { color: colors.textSecondary }]}>{cycleLabel}</Text>
              </View>
            ) : (
              <Text style={[s.hint, { color: colors.textSecondary }]}>
                {done
                  ? (lang === 'tr' ? 'Harika iş. Daha sakin hissettin mi?' : 'Well done. Feeling calmer?')
                  : (lang === 'tr' ? 'Rahat bir pozisyon al ve orbu takip et' : 'Settle in and follow the orb')}
              </Text>
            )}
          </View>

          {/* Controls */}
          <View style={s.controls}>
            {!running && !done && (
              <TouchableOpacity style={s.startBtn} onPress={start} activeOpacity={0.88}>
                <Text style={s.startBtnText}>{t.start}  ▶</Text>
              </TouchableOpacity>
            )}
            {running && (
              <TouchableOpacity
                style={[s.stopBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={stop}
                activeOpacity={0.85}
              >
                <Text style={[s.stopBtnText, { color: colors.text }]}>{t.stop}  ⏹</Text>
              </TouchableOpacity>
            )}
            {done && (
              <>
                <TouchableOpacity
                  style={[s.stopBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={() => {
                    setDone(false);
                    setPhaseIdx(0);
                    setCycle(0);
                    circleAnim.setValue(0);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[s.stopBtnText, { color: colors.text }]}>
                    {lang === 'tr' ? 'Tekrar  🔄' : 'Again  🔄'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.startBtn} onPress={onClose} activeOpacity={0.88}>
                  <Text style={s.startBtnText}>{lang === 'tr' ? 'Tamam  ✔' : 'Done  ✔'}</Text>
                </TouchableOpacity>
              </>
            )}
            {!running && !done && (
              <TouchableOpacity
                style={[s.closeBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <Text style={[s.closeBtnText, { color: colors.textSecondary }]}>{t.close}</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6,4,18,0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: 'hidden',
  },
  ambientOrb: {
    position: 'absolute',
    borderRadius: 9999,
    ...Platform.select({
      web: { filter: 'blur(60px)' } as any,
      default: { opacity: 0.45 },
    }),
  },
  ambientOrbA: {
    width: 260,
    height: 260,
    top: -90,
    right: -70,
    backgroundColor: 'rgba(124,58,237,0.35)',
  },
  ambientOrbB: {
    width: 220,
    height: 220,
    bottom: -60,
    left: -60,
    backgroundColor: 'rgba(6,182,212,0.28)',
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: { alignItems: 'center', marginBottom: 18 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  exList: { gap: 10, marginBottom: 8 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  exDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exDotCheck: { color: '#fff', fontSize: 12, fontWeight: '800' },
  exName: { fontSize: 15.5, fontWeight: '700' },
  exDesc: { fontSize: 12.5, marginTop: 3 },
  circleArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 34, minHeight: 280 },
  halo: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  circle: {
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    minHeight: 130,
  },
  innerRing: {
    position: 'absolute',
    width: '78%',
    height: '78%',
    borderRadius: 9999,
    borderWidth: 1,
  },
  orbEmoji: { fontSize: 38 },
  orbEmojiIdle: { fontSize: 46, opacity: 0.9 },
  phaseLabel: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  countdown: { fontSize: 54, fontWeight: '800', lineHeight: 60, marginTop: 2 },
  cyclePill: {
    marginTop: 22,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  cycleText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  hint: { fontSize: 13.5, marginTop: 22, textAlign: 'center', maxWidth: 260, lineHeight: 19 },
  controls: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 6 },
  startBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 55%, #06B6D4 140%)',
        boxShadow: '0 10px 30px rgba(124,58,237,0.45)',
      } as any,
      default: {
        shadowColor: '#7C3AED',
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      },
    }),
  },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 15.5, letterSpacing: 0.3 },
  stopBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  stopBtnText: { fontWeight: '700', fontSize: 15 },
  closeBtn: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtnText: { fontWeight: '700' },
});
