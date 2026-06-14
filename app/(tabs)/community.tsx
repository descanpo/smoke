import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useJourneyStore } from '@/store/journeyStore';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  comments_count: number;
  is_anonymous: boolean;
  created_at: string;
  profiles: { display_name: string | null } | null;
  liked?: boolean;
}

const POST_TYPES = [
  { key: 'motivation', label: 'Motivasyon', icon: '💪' },
  { key: 'milestone', label: 'Kilometre Taşı', icon: '🏆' },
  { key: 'tip', label: 'İpuçu', icon: '💡' },
  { key: 'story', label: 'Hikaye', icon: '📖' },
  { key: 'question', label: 'Soru', icon: '❓' },
];

export default function CommunityScreen() {
  const { user } = useAuthStore();
  const { journey } = useJourneyStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('motivation');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('community_posts')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && user) {
      const likedRes = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      const likedIds = new Set(likedRes.data?.map((l) => l.post_id) ?? []);
      setPosts(data.map((p) => ({ ...p, liked: likedIds.has(p.id) })));
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleLike = async (post: Post) => {
    if (!user) return;
    if (post.liked) {
      await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post.id);
      setPosts((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, liked: false, likes_count: p.likes_count - 1 } : p)
      );
    } else {
      await supabase.from('post_likes').insert({ user_id: user.id, post_id: post.id });
      setPosts((prev) =>
        prev.map((p) => p.id === post.id ? { ...p, liked: true, likes_count: p.likes_count + 1 } : p)
      );
    }
  };

  const handlePost = async () => {
    if (!user || !newContent.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('community_posts').insert({
      user_id: user.id,
      journey_id: journey?.id ?? null,
      content: newContent.trim(),
      post_type: newType,
      is_anonymous: isAnonymous,
    });
    setPosting(false);
    if (error) {
      Alert.alert('Hata', 'Paylaşım yapılamadı.');
    } else {
      setNewContent('');
      setShowModal(false);
      fetchPosts();
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
  };

  const getTypeEmoji = (type: string) =>
    POST_TYPES.find((t) => t.key === type)?.icon ?? '💬';

  return (
    <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Topluluk</Text>
          <TouchableOpacity
            style={styles.newPostBtn}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.newPostBtnText}>+ Paylaş</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await fetchPosts(); setRefreshing(false); }} tintColor={Colors.primary} />
          }
        >
          {posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {post.is_anonymous
                      ? '👤'
                      : (post.profiles?.display_name?.[0] ?? '?')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postAuthor}>
                    {post.is_anonymous ? 'Anonim' : (post.profiles?.display_name ?? 'Kullanıcı')}
                  </Text>
                  <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                </View>
                <Text style={styles.postTypeEmoji}>{getTypeEmoji(post.post_type)}</Text>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLike(post)}
                >
                  <Text style={[styles.actionBtnText, post.liked && { color: Colors.error }]}>
                    {post.liked ? '❤️' : '🧡'} {post.likes_count}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>💬 {post.comments_count}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {!loading && posts.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>Henüz paylaşım yok.</Text>
              <Text style={styles.emptySubtext}>Yolculuğunu topluluktla paylaş!</Text>
            </View>
          )}
        </ScrollView>

        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <LinearGradient colors={['#0A0A14', '#1A1A2E']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Yeni Paylaşım</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.label}>Tür</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.typeRow}>
                    {POST_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.typeBtn, newType === t.key && styles.typeBtnActive]}
                        onPress={() => setNewType(t.key)}
                      >
                        <Text>{t.icon} {t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={[styles.label, { marginTop: Spacing.md }]}>Ne paylaşmak istiyorsun?</Text>
                <TextInput
                  style={styles.textarea}
                  value={newContent}
                  onChangeText={setNewContent}
                  placeholder="Sigarasız yolculuğunu paylaş..."
                  placeholderTextColor={Colors.dark.textTertiary}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={styles.anonToggle}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                >
                  <Text style={styles.anonText}>
                    {isAnonymous ? '✅' : '□'} Anonim olarak paylaş
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, posting && { opacity: 0.6 }]}
                  onPress={handlePost}
                  disabled={posting}
                >
                  <Text style={styles.submitBtnText}>
                    {posting ? 'Paylaşılıyor...' : 'Paylaş 🚀'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm },
  pageTitle: { ...Typography.h2, color: Colors.dark.text },
  newPostBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  newPostBtnText: { ...Typography.label, color: '#fff' },
  container: { padding: Spacing.md, gap: Spacing.md },
  postCard: { backgroundColor: Colors.dark.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.dark.border, gap: Spacing.sm },
  postHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18 },
  postAuthor: { ...Typography.label, color: Colors.dark.text },
  postDate: { ...Typography.caption, color: Colors.dark.textTertiary },
  postTypeEmoji: { fontSize: 20 },
  postContent: { ...Typography.body, color: Colors.dark.text, lineHeight: 24 },
  postActions: { flexDirection: 'row', gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: Spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtnText: { ...Typography.bodySmall, color: Colors.dark.textSecondary },
  empty: { alignItems: 'center', padding: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...Typography.h4, color: Colors.dark.text },
  emptySubtext: { ...Typography.body, color: Colors.dark.textSecondary, textAlign: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  modalTitle: { ...Typography.h3, color: Colors.dark.text },
  modalClose: { fontSize: 20, color: Colors.dark.textSecondary },
  modalBody: { padding: Spacing.lg, gap: Spacing.sm },
  label: { ...Typography.label, color: Colors.dark.textSecondary },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.sm },
  typeBtn: { backgroundColor: Colors.dark.card, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.dark.border },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  textarea: { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border, borderRadius: BorderRadius.lg, padding: Spacing.md, color: Colors.dark.text, minHeight: 120, marginTop: Spacing.xs },
  anonToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  anonText: { ...Typography.bodySmall, color: Colors.dark.textSecondary },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg },
  submitBtnText: { ...Typography.label, color: '#fff', fontSize: 16 },
});
