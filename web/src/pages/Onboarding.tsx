import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const MOTIVATIONS = [
  { key: 'health', label: 'Sağlığım için', icon: '❤️' },
  { key: 'family', label: 'Ailem için', icon: '👨‍👩‍👧' },
  { key: 'money', label: 'Para biriktirmek', icon: '💰' },
  { key: 'sport', label: 'Spor yapabilmek', icon: '🏃' },
  { key: 'baby', label: 'Hamilelik/bebek', icon: '👶' },
  { key: 'other', label: 'Diğer', icon: '✨' },
];

export default function Onboarding({ session, onDone }: { session: Session; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [cigs, setCigs] = useState('20');
  const [cost, setCost] = useState('100');
  const [pack, setPack] = useState('20');
  const [brand, setBrand] = useState('');
  const [motivation, setMotivation] = useState('');
  const [saving, setSaving] = useState(false);

  const yearly = Math.round((parseInt(cigs || '0') / parseInt(pack || '20')) * parseInt(cost || '0') * 365);

  const save = async () => {
    setSaving(true);
    await supabase.from('quit_journeys').insert({
      user_id: session.user.id,
      quit_date: new Date().toISOString(),
      cigarettes_per_day: parseInt(cigs) || 20,
      cost_per_pack: parseFloat(cost) || 100,
      cigarettes_per_pack: parseInt(pack) || 20,
      currency: 'TRY',
      brand: brand || null,
      motivation: motivation || null,
      is_active: true,
    });
    setSaving(false);
    onDone();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(135deg,#0A0A14,#1A1A2E)' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 6, borderRadius: 3, background: i <= step ? 'var(--primary)' : 'var(--border)', width: i === step ? 32 : 20, transition: 'all 0.3s' }} />
          ))}
        </div>

        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>📅</div>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Bugün Bırakma Günün!</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
              Bu andan itibaren sayaç başlıyor.
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 6 }}>Sigara Alışkanlığın</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Bize biraz anlat</p>
            <div className="form-group">
              <label className="form-label">Günde kaç sigara içiyordun?</label>
              <input type="number" value={cigs} onChange={e => setCigs(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sigara markası (isteğe bağlı)</label>
              <input placeholder="Maltepe, Parliament..." value={brand} onChange={e => setBrand(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 6 }}>Maliyet Hesabı</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Kaç TL tasarruf edeceksin?</p>
            <div className="form-group">
              <label className="form-label">Bir paket sigara kaç TL?</label>
              <input type="number" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Pakette kaç sigara var?</label>
              <input type="number" value={pack} onChange={e => setPack(e.target.value)} />
            </div>
            {yearly > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--success)', borderRadius: 14, padding: '16px 20px', textAlign: 'center', marginTop: 8 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Yılda tasarruf edeceksin</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>
                  {yearly.toLocaleString('tr-TR')} TL
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, marginBottom: 6 }}>Motivasyonun</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Neden bırakıyorsun?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MOTIVATIONS.map(m => (
                <button key={m.key} onClick={() => setMotivation(m.key)}
                  style={{ background: motivation === m.key ? '#6c63ff22' : 'var(--card)', border: `1px solid ${motivation === m.key ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 12, padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: motivation === m.key ? 'var(--primary)' : 'var(--text-secondary)', width: '100%', cursor: 'pointer' }}>
                  <span style={{ fontSize: 28 }}>{m.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          {step > 0 && (
            <button className="btn-outline" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Geri</button>
          )}
          {step < 3 ? (
            <button className="btn-primary" style={{ flex: 2 }} onClick={() => setStep(s => s + 1)}>Devam Et →</button>
          ) : (
            <button className="btn-primary" style={{ flex: 2 }} onClick={save} disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Başla! 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
