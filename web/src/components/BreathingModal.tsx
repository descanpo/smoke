import { useState, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const EXERCISES = [
  { key: 'box_breathing', name: 'Kutu Nefesi', desc: '4-4-4-4 döngüsü — stresi azaltır', cycles: 4,
    phases: [{ label: 'İçine çek', dur: 4, color: '#6C63FF' }, { label: 'Tut', dur: 4, color: '#FF9800' }, { label: 'Bırak', dur: 4, color: '#4CAF50' }, { label: 'Bekle', dur: 4, color: '#2196F3' }] },
  { key: '4_7_8', name: '4-7-8 Nefesi', desc: 'Anksiyeteyi hızla azaltır', cycles: 3,
    phases: [{ label: 'İçine çek', dur: 4, color: '#6C63FF' }, { label: 'Tut', dur: 7, color: '#FF9800' }, { label: 'Bırak', dur: 8, color: '#4CAF50' }] },
  { key: 'deep_breath', name: 'Derin Nefes', desc: 'Basit ve etkili rahatlama', cycles: 6,
    phases: [{ label: 'İçine çek', dur: 5, color: '#6C63FF' }, { label: 'Bırak', dur: 5, color: '#4CAF50' }] },
];

export default function BreathingModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const [exIdx, setExIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const ex = EXERCISES[exIdx];
  const phase = ex.phases[phaseIdx];
  const expand = phaseIdx === 0;
  const circleSize = running ? (expand ? 200 : 140) : 160;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const runPhase = (pi: number, ci: number) => {
    const p = ex.phases[pi];
    setPhaseIdx(pi); setCountdown(p.dur);
    let rem = p.dur;
    timerRef.current = setInterval(() => {
      rem--;
      setCountdown(rem);
      if (rem <= 0) {
        clearInterval(timerRef.current!);
        const nextPi = pi + 1;
        if (nextPi < ex.phases.length) { runPhase(nextPi, ci); }
        else {
          const nextCi = ci + 1;
          setCycle(nextCi);
          if (nextCi < ex.cycles) runPhase(0, nextCi);
          else complete();
        }
      }
    }, 1000);
  };

  const start = () => {
    setRunning(true); setDone(false); setPhaseIdx(0); setCycle(0);
    startRef.current = Date.now();
    runPhase(0, 0);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
  };

  const complete = async () => {
    setRunning(false); setDone(true);
    const dur = Math.round((Date.now() - startRef.current) / 1000);
    await supabase.from('breathing_exercise_logs').insert({ user_id: session.user.id, exercise_type: ex.key, duration_seconds: dur, completed: true });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>🌬️ Nefes Egzersizi</div>
          <button onClick={() => { stop(); onClose(); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, padding: 4, width: 'auto' }}>✕</button>
        </div>

        {!running && !done && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {EXERCISES.map((e, i) => (
              <button key={e.key} onClick={() => setExIdx(i)}
                style={{ display: 'flex', gap: 14, alignItems: 'center', background: exIdx === i ? '#6c63ff22' : 'var(--card)', border: `1px solid ${exIdx === i ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 16px', width: '100%', textAlign: 'left', color: 'var(--text)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: exIdx === i ? 'var(--primary)' : 'var(--text)' }}>{e.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{e.desc}</div>
                </div>
                {exIdx === i && <span style={{ color: 'var(--primary)' }}>✓</span>}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%',
            border: `3px solid ${done ? '#4CAF50' : running ? phase.color : 'var(--border)'}`,
            background: done ? '#4caf5022' : running ? phase.color + '22' : 'var(--card)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.8s ease',
          }}>
            {done ? (
              <>
                <div style={{ fontSize: 36 }}>🏆</div>
                <div style={{ fontWeight: 700, color: '#4CAF50', marginTop: 6 }}>Harika!</div>
              </>
            ) : running ? (
              <>
                <div style={{ fontWeight: 600, color: phase.color, fontSize: 14 }}>{phase.label}</div>
                <div style={{ fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{countdown}</div>
              </>
            ) : (
              <div style={{ fontSize: 40 }}>🌬️</div>
            )}
          </div>
          {running && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 14 }}>
              Döngü {cycle + 1}/{ex.cycles}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {!running && !done && <button className="btn-primary" onClick={start}>Başlat ▶</button>}
          {running && <button className="btn-outline" onClick={stop}>Durdur ⏹</button>}
          {done && (
            <>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => { setDone(false); setPhaseIdx(0); setCycle(0); }}>Tekrar 🔄</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={onClose}>Tamam ✔</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
