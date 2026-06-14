import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function AuthPage({ onAuth }: { onAuth: (s: Session) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setError(''); setLoading(true);
    if (tab === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else if (data.session) onAuth(data.session);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name } },
      });
      if (error) setError(error.message);
      else if (data.session) onAuth(data.session);
      else setError('E-postanı doğrula, sonra giriş yap!');
    }
    setLoading(false);
  };

  const handleAnon = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) setError(error.message);
    else if (data.session) onAuth(data.session);
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <span className="emoji">🚭</span>
          <h1>Smoke</h1>
          <p>Sigarasız bir hayata hoş geldin</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Giriş Yap</button>
          <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Kaydol</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Adın</label>
              <input placeholder="Adı Soyadı" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">E-posta</label>
            <input type="email" placeholder="ornek@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Parola</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
          <button className="btn-primary" onClick={handle} disabled={loading}>
            {loading ? 'Yükleniyor...' : tab === 'login' ? 'Giriş Yap' : 'Kaydol'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>veya</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <button className="btn-outline" onClick={handleAnon} disabled={loading}>
            Hesap olmadan devam et
          </button>
        </div>
      </div>
    </div>
  );
}
