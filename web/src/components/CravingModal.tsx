import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const TRIGGERS = [
  { key: 'stress', label: 'Stres', icon: '😰' }, { key: 'boredom', label: 'Sıkıntı', icon: '😑' },
  { key: 'social', label: 'Sosyal', icon: '👥' }, { key: 'after_meal', label: 'Yemek Sonrası', icon: '🍽️' },
  { key: 'coffee', label: 'Kahve', icon: '☕' }, { key: 'alcohol', label: 'Alkol', icon: '🍺' },
  { key: 'habit', label: 'Alışkanlık', icon: '🔄' }, { key: 'emotion', label: 'Duygusal', icon: '💔' },
  { key: 'other', label: 'Diğer', icon: '❓' },
];

export default function CravingModal({ session, journey, onClose }: { session: Session; journey: any; onClose: () => void }) {
  const [resisted, setResisted] = useState(true);
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('craving_logs').insert({
      user_id: session.user.id, journey_id: journey?.id ?? null,
      intensity, trigger_type: trigger || null, trigger_notes: notes || null, resisted,
    });
    setSaving(false);
    setDone(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 60, marginBottom: 12 }}>{resisted ? '🏆' : '😌'}</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              {resisted ? 'Bravo! İsteği yendin!' : 'İyi ki kaydettin'}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {resisted ? 'Her direnç seni daha güçlü yapar.' : 'Yarın daha güçlü olacaksın.'}
            </div>
          </div>
        ) : (
          <>
            <div className="modal-title">🔥 İstek Kaydet</div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { val: true, label: '💪 Direnebildim', color: 'var(--success)' },
                { val: false, label: '😔 İçtim', color: 'var(--error)' },
              ].map(({ val, label, color }) => (
                <button key={String(val)} onClick={() => setResisted(val)}
                  style={{ flex: 1, background: resisted === val ? color + '22' : 'var(--card)', border: `2px solid ${resisted === val ? color : 'var(--border)'}`, color: resisted === val ? color : 'var(--text-secondary)', borderRadius: 12, padding: '14px 0' }}>
                  {label}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Şiddet: {intensity}/10</label>
              <div className="intensity-row">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(v => (
                  <button key={v} className="intensity-dot" onClick={() => setIntensity(v)}
                    style={{ background: v <= intensity ? (v <= 3 ? 'var(--success)' : v <= 6 ? 'var(--warning)' : 'var(--error)') : 'var(--border)' }} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tetikleyici</label>
              <div className="chip-row">
                {TRIGGERS.map(t => (
                  <button key={t.key} className={`chip${trigger === t.key ? ' active' : ''}`}
                    onClick={() => setTrigger(trigger === t.key ? '' : t.key)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Not (isteğe bağlı)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Ne düşündün?" rows={3} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={onClose}>İptal</button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Kaydet ✔'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
