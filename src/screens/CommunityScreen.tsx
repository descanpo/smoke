import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

const POST_TYPE_BADGE: Record<string, { label: string; color: string }> = {
  motivation: { label: 'Motivasyon', color: Theme.colors.primary },
  milestone:  { label: 'Kilometre Taşı', color: Theme.colors.success },
  tip:        { label: 'İpucu', color: Theme.colors.secondary },
  story:      { label: 'Hikaye', color: Theme.colors.warning },
  question:   { label: 'Soru', color: '#A3A3C2' },
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
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>TOPLULUK</Text>
          <Text style={s.title}>Birlikte Güçlüyüz</Text>
          <Text style={s.subtitle}>Yolculuğunu paylaş, ilham ver</Text>
        </View>
        <TouchableOpacity
          style={s.shareBtn}
          onPress={() => setShowForm(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.shareBtnText}>Paylaş</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterContent}
      >
        {POST_TYPES.map(t => {
          const active = filterType === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setFilterType(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Theme.colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          <Text style={s.sectionLabel}>AKIŞ</Text>

          {filteredPosts.length === 0 && (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="people-outline" size={38} color={Theme.colors.primary} />
              </View>
              <Text style={s.emptyTitle}>Henüz paylaşım yok</Text>
              <Text style={s.emptyDesc}>İlk paylaşımı sen yap ve topluluğa ilham ver.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => setShowForm(true)} activeOpacity={0.85}>
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={s.emptyBtnText}>İlk paylaşımı yap</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredPosts.map(post => {
            const name = post.is_anonymous ? 'Anonim' : (post.profiles?.display_name ?? 'Kullanıcı');
            const initials = post.is_anonymous ? '?' : name.charAt(0).toUpperCase();
            const avatarColor = post.is_anonymous ? '#6B6B8F' : getAvatarColor(name);
            const badge = POST_TYPE_BADGE[post.post_type];
            const liked = likedIds.has(post.id);

            return (
              <View key={post.id} style={s.postCard}>
                <View style={s.postHeader}>
                  <View style={[s.avatar, { backgroundColor: avatarColor }]}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.authorName} numberOfLines={1}>{name}</Text>
                    <Text style={s.postTime}>{timeAgo(post.created_at)}</Text>
                  </View>
                  {badge && (
                    <View style={s.badge}>
                      <View style={[s.badgeDot, { backgroundColor: badge.color }]} />
                      <Text style={[s.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  )}
                </View>

                <Text style={s.postContent}>{post.content}</Text>

                <View style={s.postActions}>
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => handleLike(post)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={20}
                      color={liked ? Theme.colors.error : Theme.colors.textSecondary}
                    />
                    <Text style={[s.actionCount, liked && s.actionCountLiked]}>{post.likes_count ?? 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.actionBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chatbubble-outline" size={19} color={Theme.colors.textSecondary} />
                    <Text style={s.actionCount}>{post.comments_count ?? 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 110 }} />
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
            <Text style={s.modalTitle}>Yeni Paylaşım</Text>
            <Text style={s.modalSubtitle}>Düşüncelerini toplulukla paylaş</Text>

            <Text style={s.fieldLabel}>TÜR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {POST_TYPES.filter(t => t.key !== 'all').map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.modalChip, type === t.key && s.modalChipActive]}
                    onPress={() => setType(t.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.modalChipText, type === t.key && s.modalChipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.fieldLabel}>MESAJIN</Text>
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
                {anon && <Ionicons name="checkmark" size={15} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.anonText}>Anonim olarak paylaş</Text>
                <Text style={s.anonHint}>İsmin gizli kalır</Text>
              </View>
            </TouchableOpacity>

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)} activeOpacity={0.8}>
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
                  : (
                    <>
                      <Ionicons name="paper-plane-outline" size={17} color="#fff" />
                      <Text style={s.postBtnText}>Paylaş</Text>
                    </>
                  )
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
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: Theme.colors.text, letterSpacing: -0.6 },
  subtitle: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 5 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.rounded.full,
    paddingLeft: 14,
    paddingRight: 18,
    paddingVertical: 11,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Filter chips
  filterScroll: { maxHeight: 50, flexGrow: 0 },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Theme.rounded.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  // Posts list
  list: { paddingHorizontal: 20, paddingTop: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textTertiary,
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  emptyState: { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(124,58,237,0.10)',
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: Theme.colors.text, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14, color: Theme.colors.textTertiary, marginTop: 8, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: Theme.rounded.full,
    backgroundColor: Theme.colors.primary,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Post card
  postCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 18,
    marginBottom: 12,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '800', color: '#fff' },
  authorName: { fontSize: 15, fontWeight: '700', color: Theme.colors.text },
  postTime: { fontSize: 12.5, color: Theme.colors.textTertiary, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },

  postContent: { fontSize: 15, color: Theme.colors.text, opacity: 0.94, lineHeight: 23, marginBottom: 14 },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: 13,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  actionCount: { fontSize: 13.5, color: Theme.colors.textSecondary, fontWeight: '600' },
  actionCountLiked: { color: Theme.colors.error, fontWeight: '700' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: Theme.colors.borderLight,
    padding: 24,
    paddingBottom: 40,
    ...Platform.select({
      web: { boxShadow: '0 -12px 48px rgba(0,0,0,0.5)' } as any,
      default: {},
    }),
  },
  modalHandle: {
    width: 40, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 22,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Theme.colors.text, letterSpacing: -0.4 },
  modalSubtitle: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, marginBottom: 22 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textTertiary,
    marginBottom: 11,
    letterSpacing: 1.2,
  },
  modalChip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: Theme.rounded.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  modalChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  modalChipText: { fontSize: 13, color: Theme.colors.textSecondary, fontWeight: '600' },
  modalChipTextActive: { color: '#fff', fontWeight: '700' },
  textarea: {
    backgroundColor: Theme.colors.cardGlass,
    borderRadius: Theme.rounded.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 15,
    fontSize: 15,
    color: Theme.colors.text,
    lineHeight: 22,
    minHeight: 112,
    marginBottom: 20,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  checkbox: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 1.5,
    borderColor: Theme.colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  anonText: { fontSize: 15, color: Theme.colors.text, fontWeight: '600' },
  anonHint: { fontSize: 12.5, color: Theme.colors.textTertiary, marginTop: 1 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 15, borderRadius: Theme.rounded.lg, alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  cancelBtnText: { color: Theme.colors.textSecondary, fontWeight: '700', fontSize: 15 },
  postBtn: {
    flex: 2, flexDirection: 'row', gap: 8, paddingVertical: 15,
    borderRadius: Theme.rounded.lg, alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
