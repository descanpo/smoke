import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

function calcMins(journey: any) {
  return Math.floor((Date.now() - new Date(journey.quit_date).getTime()) / 60000);
}

const SEVERITY_COLOR: Record<string, string> = {
  minor: 'var(--info)', moderate: 'var(--warning)',
  major: 'var(--success)', life_changing: 'var(--primary)',
};
const SEVERITY_LABEL: Record<string, string> = {
  minor: 'Küçük İyileşme', moderate: 'Orta İyileşme',
  major: 'Büyük İyileşme', life_changing: 'Hayat Değiştirici!',
};

export default function Progress({ session, journey }: { session: Session; journey: any }) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const mins = calcMins(journey);

  useEffect(() => {
    supabase.from('health_milestones').select('*').order('minutes_elapsed').then(({ data }) => setMilestones(data ?? []));
    supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', session.user.id)
      .then(({ data }) => setAchievements(data ?? []));
  }, []);

  return (
    <div>
      <div className="page-title">Sağlık İlerlemen</div>
      <div className="page-subtitle">Sigarayı bıraktığında vücudunda neler oluyor</div>

      <div className="timeline">
        {milestones.map((m, i) => {
          const achieved = mins >= m.minutes_elapsed;
          const isNext = !achieved && milestones.slice(0, i).every(prev => mins >= prev.minutes_elapsed);
          return (
            <div key={m.id} className="timeline-item">
              <div className="timeline-left">
                <div className={`timeline-dot${achieved ? ' achieved' : isNext ? ' next' : ' locked'}`}>
                  {achieved ? '✓' : m.icon}
                </div>
                {i < milestones.length - 1 && (
                  <div className={`timeline-connector${achieved ? ' achieved' : ''}`} style={{ minHeight: 24 }} />
                )}
              </div>
              <div className={`timeline-card${achieved ? ' achieved' : isNext ? ' next' : ' locked'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{m.title_tr}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: SEVERITY_COLOR[m.severity] + '22', color: SEVERITY_COLOR[m.severity] }}>
                    {SEVERITY_LABEL[m.severity]}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{m.description_tr}</div>
                {achieved && <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 6 }}>✅ Ulaştın!</div>}
                {isNext && <div style={{ fontSize: 13, color: 'var(--primary)', marginTop: 6 }}>⏰ Sıradaki hedef</div>}
              </div>
            </div>
          );
        })}
      </div>

      {achievements.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Kazanılan Rozetler 🏅</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {achievements.map(ua => (
              <div key={ua.id} className="card" style={{ textAlign: 'center', padding: '16px 14px', minWidth: 90 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{ua.achievements?.icon}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ua.achievements?.title_tr}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
