import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const POST_TYPES = [
  { key: 'motivation', label: 'Motivasyon', icon: '💪' },
  { key: 'milestone', label: 'Kilometre Taşı', icon: '🏆' },
  { key: 'tip', label: 'İpucu', icon: '💡' },
  { key: 'story', label: 'Hikaye', icon: '📖' },
  { key: 'question', label: 'Soru', icon: '❓' },
];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function Community({ session, journey }: { session: Session; journey: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('motivation');
  const [anon, setAnon] = useState(false);
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('community_posts')
      .select('*, profiles(display_name)').order('created_at', { ascending: false }).limit(50);
    if (data) setPosts(data);
    const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', session.user.id);
    if (likes) setLikedIds(new Set(likes.map(l => l.post_id)));
  };

  const handleLike = async (post: any) => {
    if (likedIds.has(post.id)) {
      await supabase.from('post_likes').delete().eq('user_id', session.user.id).eq('post_id', post.id);
      setLikedIds(s => { const n = new Set(s); n.delete(post.id); return n; });
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from('post_likes').insert({ user_id: session.user.id, post_id: post.id });
      setLikedIds(s => new Set([...s, post.id]));
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    await supabase.from('community_posts').insert({
      user_id: session.user.id, journey_id: journey?.id ?? null,
      content: content.trim(), post_type: type, is_anonymous: anon,
    });
    setContent(''); setShowForm(false); setPosting(false);
    fetchPosts();
  };

  const typeIcon = (t: string) => POST_TYPES.find(p => p.key === t)?.icon ?? '💬';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div className="page-title">Topluluk</div>
          <div className="page-subtitle" style={{ marginBottom: 0 }}>Deneyimlerini paylaş</div>
        </div>
        <button style={{ background: 'var(--primary)', color: '#fff', padding: '10px 18px', borderRadius: 10 }}
          onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Kapat' : '+ Paylaş'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: '#6c63ff44' }}>
          <div style={{ marginBottom: 12 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Tür</div>
            <div className="chip-row">
              {POST_TYPES.map(t => (
                <button key={t.key} className={`chip${type === t.key ? ' active' : ''}`} onClick={() => setType(t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Sigarasız yolculuğunu paylaş..." rows={4} style={{ marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14 }}>
              <input type="checkbox" checked={anon} onChange={e => setAnon(e.target.checked)} style={{ width: 'auto', cursor: 'pointer' }} />
              Anonim paylaş
            </label>
            <button style={{ background: 'var(--primary)', color: '#fff', padding: '9px 20px', borderRadius: 9 }}
              onClick={handlePost} disabled={posting || !content.trim()}>
              {posting ? '...' : 'Paylaş 🚀'}
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Henüz paylaşım yok</div>
          <div style={{ marginTop: 6 }}>İlk paylaşımı sen yap!</div>
        </div>
      )}

      {posts.map(post => (
        <div key={post.id} className="post-card">
          <div className="post-header">
            <div className="avatar">
              {post.is_anonymous ? '👤' : (post.profiles?.display_name?.[0] ?? '?')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {post.is_anonymous ? 'Anonim' : (post.profiles?.display_name ?? 'Kullanıcı')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{timeAgo(post.created_at)}</div>
            </div>
            <span style={{ fontSize: 20 }}>{typeIcon(post.post_type)}</span>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.65 }}>{post.content}</div>
          <div className="post-actions">
            <button className={`like-btn${likedIds.has(post.id) ? ' liked' : ''}`} onClick={() => handleLike(post)}>
              {likedIds.has(post.id) ? '❤️' : '🤍'} {post.likes_count}
            </button>
            <button className="like-btn">💬 {post.comments_count}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
