import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import type { Session } from '@supabase/supabase-js';
import './App.css';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return session ? <Dashboard session={session} /> : <AuthPage onAuth={setSession} />;
}
