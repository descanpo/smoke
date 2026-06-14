import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Platform, ActivityIndicator,
} from 'react-native';
import { supabase } from '../services/supabase';
import { Theme } from '../theme/Theme';

const POST_TYPES = [
  { key: 'all', label: 'Tümü' },
  { key: 'motivation', label: 'Motivasyon' },
  { key: 'milestone', label: 'Kilometre Taşı' },
  { key: 'tip', label: 'İpucu' },
  { key: 'story', label: 'Hikaye' },
  { key: 'question', label: 'Soru' },
];

const POST_TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  motivation: { label: 'Motivasyon', color: Theme.colors.primary, bg: 'rgba(124,58,237,0.15)' },
  milestone:  { label: 'Kilometre Taşı', color: Theme.colors.success, bg: 'rgba(16,185,129,0.15)' },
  tip:        { label: 'İpucu', color: Theme.colors.secondary, bg: 'rgba(6,182,212,0.15)' },
  story:      { label: 'Hikaye', color: Theme.colors.warning, bg: 'rgba(245,158,11,0.15)' },
  question:   { label: 'Soru', color: '#A3A3C2', bg: 'rgba(163,163,194,0.15)' },
};

const AVATAR_COLORS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function CommunityScreen({ session, journey }: { session: any; journey: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState('motivation');
  const [anon, setAnon] = useState(false);
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from('community_posts')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPosts(data);
    const { data: likes } = await supabase.from('post_likes')
      .select('post_id')
      .eq('user_id', session.user.id);
    if (likes) setLikedIds(new Set(likes.map((l: any) => l.post_id)));
    setLoading(false);
  };

  const handleLike = async (post: any) => {
    if (likedIds.has(post.id)) {
      await supabase.from('post_likes').delete()
        .eq('user_id', session.user.id).eq('post_id', post.id);
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
      user_id: session.user.id,
      journey_id: journey?.id ?? null,
      content: content.trim(),
      post_type: type,
      is_anonymous: anon,
    });
    setContent(''); setShowForm(false); setPosting(false);
    fetchPosts();
  };

  const filteredPosts = filterType === 'all'
    ? posts
    : posts.filter(p => p.post_type === filterType);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.headerRow}>
        <View>
          <Text style={s.title}>Topluluk</Text>
          <Text style={s.subtitle}>Birlikte daha güçlüsünüz 💪</Text>
        </View>
        <TouchableOpacity
          style={s.shareBtn}
          onPress={() => setShowForm(true)}
          activeOpacity={0.85}
        >
          <Text style={s.shareBtnText}>+ Paylaşım Yap</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        {POST_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.chip, filterType === t.key && s.chipActive]}
            onPress={() => setFilterType(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, filterType === t.key && s.chipTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Theme.colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filteredPosts.length === 0 && (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👥</Text>
              <Text style={s.emptyTitle}>Henüz paylaşım yok</Text>
              <Text style={s.emptyDesc}>İlk paylaşımı sen yap!</Text>
            </View>
          )}

          {filteredPosts.map(post => {
            const name = post.is_anonymous ? 'Anonim' : (post.profiles?.display_name ?? 'Kullanıcı');
            const initials = post.is_anonymous ? '?' : name.charAt(0).toUpperCase();
            const avatarColor = post.is_anonymous ? '#4B4B6B' : getAvatarColor(name);
            const badge = POST_TYPE_BADGE[post.post_type];

            return (
              <View key={post.id} style={s.postCard}>
                <View style={s.postHeader}>
                  <View style={[s.avatar, { backgroundColor: avatarColor + '30', borderColor: avatarColor + '60', borderWidth: 1.5 }]}>
                    <Text style={[s.avatarText, { color: avatarColor }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.authorName}>{name}</Text>
                    <Text style={s.postTime}>{timeAgo(post.created_at)}</Text>
                  </View>
                  {badge && (
                    <View style={[s.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.postContent}>{post.content}</Text>
                <View style={s.postActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleLike(post)} activeOpacity={0.7}>
                    <Text style={s.actionIcon}>{likedIds.has(post.id) ? '❤️' : '🤍'}</Text>
                    <Text style={s.actionCount}>{post.likes_count ?? 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
                    <Text style={s.actionIcon}>💬</Text>
                    <Text style={s.actionCount}>{post.comments_count ?? 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* New Post Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setShowForm(false)}
        >
          <TouchableOpacity activeOpacity={1} style={s.modal} onPress={() => {}}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>💬 Yeni Paylaşım</Text>

            <Text style={s.fieldLabel}>Tür</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {POST_TYPES.filter(t => t.key !== 'all').map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.modalChip, type === t.key && s.modalChipActive]}
                    onPress={() => setType(t.key)}
                  >
                    <Text style={[s.modalChipText, type === t.key && s.modalChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={s.textarea}
              placeholder="Sigarasız yolculuğunu paylaş..."
              placeholderTextColor={Theme.colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={s.anonRow} onPress={() => setAnon(a => !a)} activeOpacity={0.7}>
              <View style={[s.checkbox, anon && s.checkboxActive]}>
                {anon && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
              </View>
              <Text style={s.anonText}>Anonim olarak paylaş</Text>
            </TouchableOpacity>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={s.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.postBtn, (!content.trim() || posting) && { opacity: 0.5 }]}
                onPress={handlePost}
                disabled={posting || !content.trim()}
                activeOpacity={0.85}
              >
                {posting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.postBtnText}>Paylaş 🚀</Text>
                }
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: Theme.colors.text },
  subtitle: { fontSize: 13, color: Theme.colors.textSecondary, marginTop: 2 },
  shareBtn: {
    borderRadius: Theme.rounded.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Platform.select({
      web: {
        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
        boxShadow: '0 0 20px rgba(124,58,237,0.35)',
      } as any,
      default: {
        backgroundColor: Theme.colors.primary,
        shadowColor: '#7C3AED',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 4,
      },
    }),
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Filter chips
  filterScroll: { maxHeight: 48 },
  filterContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.rounded.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: Theme.colors.primary,
  },
  chipText: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Theme.colors.primary, fontWeight: '700' },

  // Posts list
  list: { paddingHorizontal: 20, paddingTop: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Theme.colors.textSecondary },
  emptyDesc: { fontSize: 14, color: Theme.colors.textTertiary, marginTop: 6 },

  // Post card
  postCard: {
    backgroundColor: 'rgba(18,18,42,0.7)',
    borderRadius: Theme.rounded.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 12,
    ...Platform.select({ web: { backdropFilter: 'blur(20px)' } as any }),
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  authorName: { fontSize: 14, fontWeight: '600', color: Theme.colors.text },
  postTime: { fontSize: 12, color: Theme.colors.textTertiary, marginTop: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.rounded.full,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  postContent: { fontSize: 14, color: Theme.colors.textSecondary, lineHeight: 22, marginBottom: 12 },
  postActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  actionIcon: { fontSize: 16 },
  actionCount: { fontSize: 13, color: Theme.colors.textSecondary },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#0F0F1F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    color: Theme.colors.textTertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.rounded.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalChipActive: { borderColor: Theme.colors.primary, backgroundColor: 'rgba(124,58,237,0.2)' },
  modalChipText: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '500' },
  modalChipTextActive: { color: Theme.colors.primary },
  textarea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Theme.rounded.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    fontSize: 14,
    color: Theme.colors.text,
    minHeight: 100,
    marginBottom: 12,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  anonText: { fontSize: 14, color: Theme.colors.textSecondary },
  modalBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: Theme.rounded.md, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtnText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  postBtn: {
    flex: 2, padding: 14, borderRadius: Theme.rounded.md, alignItems: 'center',
    backgroundColor: Theme.colors.primary,
  },
  postBtnText: { color: '#fff', fontWeight: '700' },
});
