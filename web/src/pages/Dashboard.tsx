import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Home from './Home';
import Progress from './Progress';
import Stats from './Stats';
import Community from './Community';
import Profile from './Profile';
import Onboarding from './Onboarding';

type Tab = 'home' | 'progress' | 'stats' | 'community' | 'profile';

const NAV = [
  { key: 'home', icon: '🏠', label: 'Ana Sayfa' },
  { key: 'progress', icon: '❤️', label: 'Sağlık' },
  { key: 'stats', icon: '📊', label: 'İstatistikler' },
  { key: 'community', icon: '👥', label: 'Topluluk' },
  { key: 'profile', icon: '👤', label: 'Profil' },
] as const;

export default function Dashboard({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>('home');
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchJourney(); }, [session]);

  const fetchJourney = async () => {
    const { data } = await supabase
      .from('quit_journeys').select('*')
      .eq('user_id', session.user.id).eq('is_active', true)
      .order('quit_date', { ascending: false }).limit(1).single();
    setJourney(data ?? null);
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!journey) return <Onboarding session={session} onDone={fetchJourney} />;

  const pageProps = { session, journey, onJourneyChange: fetchJourney };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🚭</span><span>Smoke</span>
        </div>
        <nav>
          {NAV.map(n => (
            <button
              key={n.key}
              className={`nav-item${tab === n.key ? ' active' : ''}`}
              onClick={() => setTab(n.key as Tab)}
            >
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        {tab === 'home' && <Home {...pageProps} />}
        {tab === 'progress' && <Progress {...pageProps} />}
        {tab === 'stats' && <Stats {...pageProps} />}
        {tab === 'community' && <Community {...pageProps} />}
        {tab === 'profile' && <Profile {...pageProps} />}
      </main>
    </div>
  );
}
