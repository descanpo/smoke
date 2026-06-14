import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import CravingModal from '../components/CravingModal';
import BreathingModal from '../components/BreathingModal';

const MILESTONES = [
  { min: 20, title: '20 Dakika', desc: 'Kalp atış hızın normale döndü.', icon: '❤️' },
  { min: 480, title: '8 Saat', desc: 'Karbon monoksit normale indi.', icon: '🫁' },
  { min: 1440, title: '24 Saat', desc: 'Kalp krizi riskin azalmaya başladı.', icon: '💪' },
  { min: 4320, title: '72 Saat', desc: 'Nikotin vücudundan tamamen çıktı!', icon: '🌬️' },
  { min: 20160, title: '2 Hafta', desc: 'Akciğer fonksiyonu %30 arttı.', icon: '🫀' },
  { min: 43200, title: '1 Ay', desc: 'Bağışıklık sistemi güçlendi.', icon: '🛡️' },
  { min: 525600, title: '1 Yıl', desc: 'Kalp hastalığı riski yarıya indi!', icon: '🏆' },
];

function calcStats(journey: any) {
  const now = Date.now();
  const quit = new Date(journey.quit_date).getTime();
  const mins = (now - quit) / 60000;
  const hours = mins / 60;
  const days = hours / 24;
  const cigPerMin = journey.cigarettes_per_day / 1440;
  const avoided = Math.floor(mins * cigPerMin);
  const saved = Math.round(avoided * (journey.cost_per_pack / journey.cigarettes_per_pack) * 100) / 100;
  return { days: Math.floor(days), hours: Math.floor(hours % 24), mins: Math.floor(mins % 60), avoided, saved, minsTotal: Math.floor(mins) };
}

export default function Home({ session, journey }: { session: Session; journey: any }) {
  const [stats, setStats] = useState(() => calcStats(journey));
  const [quote, setQuote] = useState<any>(null);
  const [cravingOpen, setCravingOpen] = useState(false);
  const [breathOpen, setBreathOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setStats(calcStats(journey)), 60000);
    return () => clearInterval(id);
  }, [journey]);

  useEffect(() => {
    supabase.from('motivational_quotes').select('text_tr,author').limit(10)
      .then(({ data }) => {
        if (data?.length) setQuote(data[Math.floor(Math.random() * data.length)]);
      });
  }, []);

  const next = MILESTONES.find(m => m.min > stats.minsTotal);
  const prev = [...MILESTONES].reverse().find(m => m.min <= stats.minsTotal);
  const pct = next
    ? prev ? Math.round(((stats.minsTotal - prev.min) / (next.min - prev.min)) * 100) : Math.round((stats.minsTotal / next.min) * 100)
    : 100;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="page-title">🖐️ Merhaba!</div>
          <div className="page-subtitle">Sigarasız hayata devam ediyorsun</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setBreathOpen(true)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px 16px', borderRadius: 10, fontSize: 13 }}>
            🌬️ Nefes
          </button>
          <button onClick={() => setCravingOpen(true)} style={{ background: '#ff444422', border: '1px solid #ff444444', color: '#ff6b6b', padding: '10px 16px', borderRadius: 10, fontSize: 13 }}>
            🔥 İstek Var
          </button>
        </div>
      </div>

      <div className="gradient-card" style={{ marginBottom: 20 }}>
        <div className="timer-display">
          <div className="timer-label">Sigarasız geçen süre</div>
          <div className="timer-row">
            <div className="timer-unit">
              <div className="timer-value">{stats.days}</div>
              <div className="timer-unit-label">Gün</div>
            </div>
            <div className="timer-sep">:</div>
            <div className="timer-unit">
              <div className="timer-value">{String(stats.hours).padStart(2,'0')}</div>
              <div className="timer-unit-label">Saat</div>
            </div>
            <div className="timer-sep">:</div>
            <div className="timer-unit">
              <div className="timer-value">{String(stats.mins).padStart(2,'0')}</div>
              <div className="timer-unit-label">Dakika</div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon">🚭</div>
          <div className="stat-value">{stats.avoided}</div>
          <div className="stat-label">Sigara İçmedin</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#4caf5033' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-value" style={{ color: 'var(--success)', fontSize: 18 }}>
            {stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </div>
          <div className="stat-label">TL Biriktirdin</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.days}</div>
          <div className="stat-label">Gün Sigarasız</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{stats.minsTotal.toLocaleString()}</div>
          <div className="stat-label">Dakika Sigarasız</div>
        </div>
      </div>

      {next && (
        <div className="card" style={{ marginBottom: 20, borderColor: '#6c63ff33' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{next.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>Sonraki: {next.title}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{next.desc}</div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'right', marginTop: 6 }}>{pct}% tamamlandı</div>
        </div>
      )}

      {quote && (
        <div className="card" style={{ borderLeft: '3px solid var(--primary)', marginBottom: 20 }}>
          <div style={{ fontStyle: 'italic', lineHeight: 1.7, marginBottom: quote.author ? 8 : 0 }}>"{quote.text_tr}"</div>
          {quote.author && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>— {quote.author}</div>}
        </div>
      )}

      {cravingOpen && <CravingModal session={session} journey={journey} onClose={() => setCravingOpen(false)} />}
      {breathOpen && <BreathingModal onClose={() => setBreathOpen(false)} session={session} />}
    </div>
  );
}
