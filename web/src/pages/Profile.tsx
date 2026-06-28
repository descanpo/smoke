import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

function calcStats(journey: any) {
  const mins = (Date.now() - new Date(journey.quit_date).getTime()) / 60000;
  return {
    days: Math.floor(mins / 1440),
    saved: Math.round(Math.floor(mins * journey.cigarettes_per_day / 1440) * (journey.cost_per_pack / journey.cigarettes_per_pack) * 100) / 100,
  };
}

export default function Profile({ session, journey, onJourneyChange }: { session: Session; journey: any; onJourneyChange: () => void }) {
  const stats = calcStats(journey);

  const signOut = async () => { await supabase.auth.signOut(); };

  const newJourney = async () => {
    if (!confirm('Mevcut yolculuğun sona erecek. Yeni bir başlangıç yapmak istiyor musun?')) return;
    await supabase.from('quit_journeys').update({ is_active: false }).eq('user_id', session.user.id);
    onJourneyChange();
  };

  return (
    <div>
      <div className="page-title">Profil</div>

      <div className="card" style={{ textAlign: 'center', marginBottom: 20, padding: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>
          {session.user.email?.[0]?.toUpperCase() ?? '👤'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {session.user.user_metadata?.display_name ?? 'Kahraman'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
          {session.user.email ?? 'Anonim Kullanıcı'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.days}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Gün</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>
              {stats.saved.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>TL Tasarruf</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        {[
          { icon: '🗓️', label: 'Yeni Yolculuk Başlat', color: 'var(--primary)', onClick: newJourney },
          { icon: '🔒', label: 'KVKK Aydınlatma Metni', onClick: () => window.open('https://descanpo.github.io/smoke/legal/kvkk.html', '_blank') },
          { icon: '📧', label: 'Gizlilik Politikası', onClick: () => window.open('https://descanpo.github.io/smoke/legal/privacy.html', '_blank') },
          { icon: '📄', label: 'Kullanım Koşulları', onClick: () => window.open('https://descanpo.github.io/smoke/legal/terms.html', '_blank') },
          { icon: '📩', label: 'Geri Bildirim Gönder', onClick: () => window.open('mailto:descanpo2@gmail.com?subject=Smoke App Geri Bildirim', '_blank') },
        ].map((item, i, arr) => (
          <button key={i} onClick={item.onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', background: 'none', border: 'none', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', padding: '14px 4px', color: item.color ?? 'var(--text)', fontWeight: 500, fontSize: 15, cursor: 'pointer', textAlign: 'left', borderRadius: 0 }}>
            <span style={{ fontSize: 20, width: 26 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>

      <button onClick={signOut} className="btn-danger" style={{ width: '100%' }}>🚪 Çıkış Yap</button>

      <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-tertiary)', fontSize: 12 }}>
        Smoke v1.0.0 · descanpo2@gmail.com
      </div>
    </div>
  );
}
