import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Modal, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { Theme, getColors } from '../theme/Theme';
import { useThemeMode } from '../context/ThemeContext';

const POST_TYPES = [
  { key: 'all', label: 'Tümü' },
  { key: 'motivation', label: 'Motivasyon' },
  { key: 'milestone', label: 'Kilometre Taşı' },
  { key: 'tip', label: 'İpucu' },
  { key: 'story', label: 'Hikaye' },
  { key: 'question', label: 'Soru' },
];

// Badge color keys resolved at render time from live colors
const POST_TYPE_BADGE_KEY: Record<string, { label: string; colorKey: keyof ReturnType<typeof getColors> }> = {
  motivation: { label: 'Motivasyon', colorKey: 'primary' },
  milestone:  { label: 'Kilometre Taşı', colorKey: 'success' },
  tip:        { label: 'İpucu', colorKey: 'secondary' },
  story:      { label: 'Hikaye', colorKey: 'warning' },
  question:   { label: 'Soru', colorKey: 'textTertiary' },
};

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
}

export default function CommunityScreen({ session, journey }: { session: any; journey: any }) {
  const { mode } = useThemeMode();
  const colors = getColors(mode);

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
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: colors.primary }]}>TOPLULUK</Text>
          <Text style={[s.title, { color: colors.text }]}>Birlikte Güçlüyüz</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>Yolculuğunu paylaş, ilham ver</Text>
        </View>
        <TouchableOpacity
          style={[s.shareBtn, { backgroundColor: colors.primary }, Theme.shadows.primary]}
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
              style={[
                s.chip,
                { borderColor: colors.border },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setFilterType(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[
                s.chipText,
                { color: colors.textSecondary },
                active && s.chipTextActive,
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>AKIŞ</Text>

          {filteredPosts.length === 0 && (
            <View style={[s.emptyState, { backgroundColor: colors.card, borderColor: colors.border }, Theme.shadows.card]}>
              <View style={[s.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="people-outline" size={36} color={colors.primary} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>Henüz paylaşım yok</Text>
              <Text style={[s.emptyDesc, { color: colors.textTertiary }]}>
                İlk paylaşımı sen yap ve topluluğa ilham ver.
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: colors.primary }, Theme.shadows.primary]}
                onPress={() => setShowForm(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={s.emptyBtnText}>İlk paylaşımı yap</Text>
              </TouchableOpacity>
            </View>
          )}

          {filteredPosts.map(post => {
            const name = post.is_anonymous ? 'Anonim' : (post.profiles?.display_name ?? 'Kullanıcı');
            const initials = post.is_anonymous ? '?' : name.charAt(0).toUpperCase();
            const badgeDef = POST_TYPE_BADGE_KEY[post.post_type];
            const badgeColor = badgeDef ? colors[badgeDef.colorKey] as string : colors.textTertiary;
            const liked = likedIds.has(post.id);

            return (
              <View
                key={post.id}
                style={[s.postCard, { backgroundColor: colors.card, borderColor: colors.border }, Theme.shadows.card]}
              >
                <View style={s.postHeader}>
                  <View style={[s.avatar, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[s.avatarText, { color: colors.primary }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.authorName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[s.postTime, { color: colors.textTertiary }]}>{timeAgo(post.created_at)}</Text>
                  </View>
                  {badgeDef && (
                    <View style={s.badge}>
                      <View style={[s.badgeDot, { backgroundColor: badgeColor }]} />
                      <Text style={[s.badgeText, { color: badgeColor }]}>{badgeDef.label}</Text>
                    </View>
                  )}
                </View>

                <Text style={[s.postContent, { color: colors.text }]}>{post.content}</Text>

                <View style={[s.postActions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={s.actionBtn}
                    onPress={() => handleLike(post)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={20}
                      color={liked ? colors.error : colors.textSecondary}
                    />
                    <Text style={[
                      s.actionCount,
                      { color: colors.textSecondary },
                      liked && { color: colors.error, fontWeight: '700' },
                    ]}>
                      {post.likes_count ?? 0}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.actionBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chatbubble-outline" size={19} color={colors.textSecondary} />
                    <Text style={[s.actionCount, { color: colors.textSecondary }]}>{post.comments_count ?? 0}</Text>
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
          <TouchableOpacity
            activeOpacity={1}
            style={[s.modal, { backgroundColor: colors.surface, borderColor: colors.borderLight }, Theme.shadows.medium]}
            onPress={() => {}}
          >
            <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[s.modalTitle, { color: colors.text }]}>Yeni Paylaşım</Text>
            <Text style={[s.modalSubtitle, { color: colors.textSecondary }]}>Düşüncelerini toplulukla paylaş</Text>

            <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>TÜR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
                {POST_TYPES.filter(t => t.key !== 'all').map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      s.modalChip,
                      { borderColor: colors.border },
                      type === t.key && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setType(t.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      s.modalChipText,
                      { color: colors.textSecondary },
                      type === t.key && s.modalChipTextActive,
                    ]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[s.fieldLabel, { color: colors.textTertiary }]}>MESAJIN</Text>
            <TextInput
              style={[s.textarea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="Sigarasız yolculuğunu paylaş..."
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={s.anonRow} onPress={() => setAnon(a => !a)} activeOpacity={0.7}>
              <View style={[s.checkbox, { borderColor: colors.borderLight }, anon && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {anon && <Ionicons name="checkmark" size={15} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.anonText, { color: colors.text }]}>Anonim olarak paylaş</Text>
                <Text style={[s.anonHint, { color: colors.textTertiary }]}>İsmin gizli kalır</Text>
              </View>
            </TouchableOpacity>

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={[s.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowForm(false)}
                activeOpacity={0.8}
              >
                <Text style={[s.cancelBtnText, { color: colors.textSecondary }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.postBtn, { backgroundColor: colors.primary }, Theme.shadows.primary, (!content.trim() || posting) && { opacity: 0.5 }]}
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
  container: { flex: 1 },

  // Header
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
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Theme.rounded.full,
    paddingLeft: 14,
    paddingRight: 18,
    paddingVertical: 11,
    minHeight: 44,
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
    minHeight: 44,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  // Posts list
  list: { paddingHorizontal: 20, paddingTop: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 14,
  },

  // Empty state — card format per spec
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: Theme.rounded.xl,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: Theme.rounded.full,
    minHeight: 44,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Post card
  postCard: {
    borderRadius: Theme.rounded.xl,  // 18
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '800' },
  authorName: { fontSize: 15, fontWeight: '700' },
  postTime: { fontSize: 12, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },

  postContent: { fontSize: 15, lineHeight: 23, marginBottom: 14, opacity: 0.94 },
  postActions: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    paddingTop: 13,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
    minHeight: 44,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  actionCount: { fontSize: 13, fontWeight: '600' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 22,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  modalSubtitle: { fontSize: 14, marginTop: 4, marginBottom: 22 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 11,
    letterSpacing: 1.2,
  },
  modalChip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: Theme.rounded.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  modalChipText: { fontSize: 13, fontWeight: '600' },
  modalChipTextActive: { color: '#fff', fontWeight: '700' },
  textarea: {
    borderRadius: Theme.rounded.lg,
    borderWidth: 1,
    padding: 15,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 112,
    marginBottom: 20,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonText: { fontSize: 15, fontWeight: '600' },
  anonHint: { fontSize: 12, marginTop: 1 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    minHeight: 44,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  cancelBtnText: { fontWeight: '700', fontSize: 15 },
  postBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 15,
    borderRadius: Theme.rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
