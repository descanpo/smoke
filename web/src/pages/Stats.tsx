import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';

function calcStats(journey: any) {
  const mins = (Date.now() - new Date(journey.quit_date).getTime()) / 60000;
  const days = Math.floor(mins / 1440);
  const avoided = Math.floor(mins * journey.cigarettes_per_day / 1440);
  const saved = Math.round(avoided * (journey.cost_per_pack / journey.cigarettes_per_pack) * 100) / 100;
  return { days, avoided, saved };
}

const TRIGGER_LABELS: Record<string, string> = {
  stress: 'Stres', boredom: 'Sıkıntı', social: 'Sosyal',
  after_meal: 'Yemek Sonrası', coffee: 'Kahve',
  alcohol: 'Alkol', habit: 'Alışkanlık', emotion: 'Duygusal', other: 'Diğer',
};

export default function Stats({ session, journey }: { session: Session; journey: any }) {
  const stats = calcStats(journey);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [cravingStats, setCravingStats] = useState({ total: 0, resisted: 0 });

  useEffect(() => {
    fetchWeekly();
    fetchTriggers();
  }, []);

  const fetchWeekly = async () => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const results = await Promise.all(days.map(async day => {
      const start = new Date(day); start.setHours(0, 0, 0, 0);
      const end = new Date(day); end.setHours(23, 59, 59, 999);
      const { data } = await supabase.from('craving_logs').select('resisted')
        .eq('user_id', session.user.id).gte('logged_at', start.toISOString()).lte('logged_at', end.toISOString());
      return { label: format(day, 'EEE', { locale: tr }), total: data?.length ?? 0, resisted: data?.filter(c => c.resisted).length ?? 0 };
    }));
    setWeekly(results);
    const total = results.reduce((s, r) => s + r.total, 0);
    const resisted = results.reduce((s, r) => s + r.resisted, 0);
    setCravingStats({ total, resisted });
  };

  const fetchTriggers = async () => {
    const { data } = await supabase.from('craving_logs').select('trigger_type')
      .eq('user_id', session.user.id).not('trigger_type', 'is', null);
    if (!data) return;
    const counts: Record<string, number> = {};
    data.forEach(c => { if (c.trigger_type) counts[c.trigger_type] = (counts[c.trigger_type] ?? 0) + 1; });
    setTriggers(Object.entries(counts).map(([k, v]) => ({ key: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 5));
  };

  const resistPct = cravingStats.total > 0 ? Math.round((cravingStats.resisted / cravingStats.total) * 100) : 100;
  const maxBar = Math.max(...weekly.map(d => d.total), 1);

  return (
    <div>
      <div className="page-title">İstatistikler</div>
      <div className="page-subtitle" style={{ marginBottom: 28 }}>Yolculuğunun detaylı analizi</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div className="gradient-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700 }}>{stats.days}</div>
          <div style={{ opacity: 0.8, marginTop: 4 }}>Gün Sigarasız</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.avoided}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Sigara İçmedin</div>
          </div>
          <div className="card" style={{ borderColor: '#4caf5033' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success)' }}>
              {stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Tasarruf</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600 }}>İstek Direnme Oranı</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{resistPct}%</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${resistPct}%` }} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {cravingStats.resisted}/{cravingStats.total} isteğe direndin
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>Haftalık İstek Grafiği</div>
        <div className="bar-chart">
          {weekly.map((d, i) => (
            <div key={i} className="bar-group">
              <div className="bar-wrap">
                <div className="bar" style={{ height: `${(d.total / maxBar) * 100}%`, background: 'var(--primary)', opacity: 0.5 }} />
                <div className="bar" style={{ height: `${(d.resisted / maxBar) * 100}%`, background: 'var(--success)' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)', opacity: 0.5 }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>İstekler</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Direnilenler</span>
          </div>
        </div>
      </div>

      {triggers.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14 }}>En Sık Tetikleyiciler</div>
          {triggers.map((t, i) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--text-tertiary)', width: 20 }}>#{i+1}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)', width: 110 }}>{TRIGGER_LABELS[t.key] ?? t.key}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--warning)', width: `${(t.count / triggers[0].count) * 100}%`, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, width: 20, textAlign: 'right' }}>{t.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
