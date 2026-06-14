import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const EXERCISES = [
  {
    key: 'box_breathing',
    name: 'Kutu Nefesi',
    description: '4-4-4-4 döngüsü — stresi azaltır',
    phases: [
      { label: 'İçine çek', duration: 4, color: Colors.primary },
      { label: 'Tut', duration: 4, color: Colors.warning },
      { label: 'Bırak', duration: 4, color: Colors.success },
      { label: 'Bekle', duration: 4, color: Colors.info },
    ],
    cycles: 4,
    icon: '□',
  },
  {
    key: '4_7_8',
    name: '4-7-8 Nefesi',
    description: 'Anksiyeteyi hızla azaltır',
    phases: [
      { label: 'İçine çek', duration: 4, color: Colors.primary },
      { label: 'Tut', duration: 7, color: Colors.warning },
      { label: 'Bırak', duration: 8, color: Colors.success },
    ],
    cycles: 3,
    icon: '⧗',
  },
  {
    key: 'deep_breath',
    name: 'Derin Nefes',
    description: 'Basit ve etkili rahatlama',
    phases: [
      { label: 'İçine çek', duration: 5, color: Colors.primary },
      { label: 'Bırak', duration: 5, color: Colors.success },
    ],
    cycles: 6,
    icon: '⭕',
  },
];

export default function BreathingScreen() {
  const { user } = useAuthStore();
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [completed, setCompleted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const exercise = EXERCISES[selectedExercise];

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startAnimation = (duration: number, expand: boolean) => {
    Animated.timing(scaleAnim, {
      toValue: expand ? 1.4 : 0.8,
      duration: duration * 1000,
      useNativeDriver: true,
    }).start();
  };

  const handleStart = () => {
    setIsRunning(true);
    setCurrentPhase(0);
    setCurrentCycle(0);
    setCompleted(false);
    startTimeRef.current = Date.now();
    runPhase(0, 0);
  };

  const runPhase = (phaseIndex: number, cycleIndex: number) => {
    const ex = EXERCISES[selectedExercise];
    const phase = ex.phases[phaseIndex];
    setCurrentPhase(phaseIndex);
    setCountdown(phase.duration);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const expand = phaseIndex === 0;
    startAnimation(phase.duration, expand);

    let remaining = phase.duration;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const nextPhase = phaseIndex + 1;
        if (nextPhase < ex.phases.length) {
          runPhase(nextPhase, cycleIndex);
        } else {
          const nextCycle = cycleIndex + 1;
          setCurrentCycle(nextCycle);
          if (nextCycle < ex.cycles) {
            runPhase(0, nextCycle);
          } else {
            handleComplete();
          }
        }
      }
    }, 1000);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    setCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (user) {
      await supabase.from('breathing_exercise_logs').insert({
        user_id: user.id,
        exercise_type: exercise.key,
        duration_seconds: duration,
        completed: true,
      });
    }
  };

  const handleStop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    Animated.timing(scaleAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const phase = exercise.phases[currentPhase];

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { handleStop(); router.back(); }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🌬️ Nefes Egzersizi</Text>
          <View style={{ width: 32 }} />
        </View>

        {!isRunning && !completed && (
          <View style={styles.exerciseList}>
            {EXERCISES.map((ex, i) => (
              <TouchableOpacity
                key={ex.key}
                style={[
                  styles.exerciseCard,
                  selectedExercise === i && styles.exerciseCardActive,
                ]}
                onPress={() => setSelectedExercise(i)}
              >
                <Text style={styles.exerciseIcon}>{ex.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exerciseName, selectedExercise === i && { color: Colors.primary }]}>
                    {ex.name}
                  </Text>
                  <Text style={styles.exerciseDesc}>{ex.description}</Text>
                </View>
                {selectedExercise === i && <Text style={styles.checkmark}>✔</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.breathingArea}>
          {(isRunning || completed) && (
            <>
              <Animated.View
                style={[
                  styles.breathCircle,
                  { transform: [{ scale: scaleAnim }] },
                  isRunning && { backgroundColor: (phase?.color ?? Colors.primary) + '33', borderColor: phase?.color ?? Colors.primary },
                  completed && { backgroundColor: Colors.success + '33', borderColor: Colors.success },
                ]}
              >
                {isRunning ? (
                  <>
                    <Text style={[styles.phaseLabel, { color: phase?.color ?? Colors.primary }]}>
                      {phase?.label}
                    </Text>
                    <Text style={styles.countdown}>{countdown}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.completedEmoji}>🏆</Text>
                    <Text style={styles.completedText}>Harika!</Text>
                  </>
                )}
              </Animated.View>

              {isRunning && (
                <Text style={styles.cycleInfo}>
                  Döngü {currentCycle + 1}/{exercise.cycles}
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          {!isRunning && !completed && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnText}>Başlat ▶️</Text>
            </TouchableOpacity>
          )}
          {isRunning && (
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopBtnText}>Durdur ⏹</Text>
            </TouchableOpacity>
          )}
          {completed && (
            <View style={styles.completedActions}>
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => router.back()}
              >
                <Text style={styles.doneBtnText}>Tamam ✔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => { setCompleted(false); setCurrentPhase(0); setCurrentCycle(0); }}
              >
                <Text style={styles.retryBtnText}>Tekrar 🔄</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  closeBtn: { fontSize: 22, color: Colors.dark.textSecondary, width: 32 },
  title: { ...Typography.h3, color: Colors.dark.text },
  exerciseList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  exerciseCardActive: { borderColor: Colors.primary },
  exerciseIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  exerciseName: { ...Typography.label, color: Colors.dark.text },
  exerciseDesc: { ...Typography.bodySmall, color: Colors.dark.textSecondary, marginTop: 2 },
  checkmark: { color: Colors.primary, fontSize: 18 },
  breathingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary + '33',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: { ...Typography.label, fontSize: 16 },
  countdown: { fontSize: 48, fontWeight: '700', color: '#fff', lineHeight: 56 },
  cycleInfo: { ...Typography.bodySmall, color: Colors.dark.textSecondary, marginTop: Spacing.xl },
  completedEmoji: { fontSize: 48 },
  completedText: { ...Typography.h3, color: Colors.success, marginTop: 8 },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  startBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  startBtnText: { ...Typography.label, color: '#fff', fontSize: 18 },
  stopBtn: { backgroundColor: Colors.error + '33', borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  stopBtnText: { ...Typography.label, color: Colors.error, fontSize: 16 },
  completedActions: { flexDirection: 'row', gap: Spacing.md },
  doneBtn: { flex: 1, backgroundColor: Colors.success, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  doneBtnText: { ...Typography.label, color: '#fff', fontSize: 16 },
  retryBtn: { flex: 1, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  retryBtnText: { ...Typography.label, color: Colors.dark.textSecondary, fontSize: 16 },
});
