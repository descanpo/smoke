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

  const currentColor = done ? '#10B981' : running ? phase.color : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)');

  const sheetBg = isDark ? '#0F0F1F' : '#FFFFFF';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <TouchableOpacity
      style={s.overlay}
      activeOpacity={1}
      onPress={() => { stop(); onClose(); }}
    >
      <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: sheetBg, borderColor: colors.border }]} onPress={() => {}}>
        {/* Drag handle */}
        <View style={[s.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

        <SafeAreaView>
          <Text style={[s.title, { color: colors.text }]}>🌬️ {t.breathingTitle}</Text>

          {/* Exercise selector */}
          {!running && !done && (
            <View style={s.exList}>
              {EXERCISES.map((e, i) => (
                <TouchableOpacity
                  key={e.key}
                  style={[s.exCard, {
                    backgroundColor: exIdx === i ? 'rgba(124,58,237,0.12)' : cardBg,
                    borderColor: exIdx === i ? '#7C3AED' : cardBorder,
                  }]}
                  onPress={() => setExIdx(i)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.exName, { color: exIdx === i ? '#8B5CF6' : colors.text }]}>{e.name}</Text>
                    <Text style={[s.exDesc, { color: colors.textSecondary }]}>{e.desc}</Text>
                  </View>
                  {exIdx === i && <Text style={{ color: '#7C3AED', fontSize: 16 }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Animated circle */}
          <View style={s.circleArea}>
            <Animated.View style={[
              s.circle,
              {
                width: circleSize,
                height: circleSize,
                borderColor: currentColor,
                backgroundColor: currentColor + '22',
              },
            ]}>
              {done ? (
                <>
                  <Text style={{ fontSize: 36 }}>🏆</Text>
                  <Text style={[s.phaseLabel, { color: '#10B981' }]}>{t.complete}</Text>
                </>
              ) : running ? (
                <>
                  <Text style={[s.phaseLabel, { color: phase.color }]}>{getPhaseLabel(phase.labelKey)}</Text>
                  <Text style={[s.countdown, { color: phase.color }]}>{countdown}</Text>
                </>
              ) : (
                <Text style={{ fontSize: 44 }}>🌬️</Text>
              )}
            </Animated.View>
            {running && (
              <Text style={[s.cycleText, { color: colors.textSecondary }]}>
                {lang === 'tr' ? `Döngü ${cycle + 1}/${ex.cycles}` : `Cycle ${cycle + 1}/${ex.cycles}`}
              </Text>
            )}
          </View>

          {/* Controls */}
          <View style={s.controls}>
            {!running && !done && (
              <TouchableOpacity style={s.startBtn} onPress={start} activeOpacity={0.85}>
                <Text style={s.startBtnText}>{t.start} ▶</Text>
              </TouchableOpacity>
            )}
            {running && (
              <TouchableOpacity
                style={[s.stopBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={stop}
                activeOpacity={0.85}
              >
                <Text style={[s.stopBtnText, { color: colors.text }]}>{t.stop} ⏹</Text>
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
                    {lang === 'tr' ? 'Tekrar 🔄' : 'Again 🔄'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.startBtn} onPress={onClose} activeOpacity={0.85}>
                  <Text style={s.startBtnText}>{lang === 'tr' ? 'Tamam ✔' : 'Done ✔'}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  exList: { gap: 8, marginBottom: 16 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  exName: { fontSize: 15, fontWeight: '600' },
  exDesc: { fontSize: 12, marginTop: 2 },
  circleArea: { alignItems: 'center', paddingVertical: 20 },
  circle: {
    borderRadius: 9999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    minHeight: 130,
  },
  phaseLabel: { fontSize: 14, fontWeight: '600' },
  countdown: { fontSize: 48, fontWeight: '800', lineHeight: 52 },
  cycleText: { fontSize: 13, marginTop: 10 },
  controls: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  startBtn: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
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
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stopBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  stopBtnText: { fontWeight: '600', fontSize: 15 },
  closeBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  closeBtnText: { fontWeight: '600' },
});
