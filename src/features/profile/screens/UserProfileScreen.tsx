import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { PostCard } from '../../../components/common/PostCard';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  ArrowLeft,
  User,
  Sparkles,
  Heart,
  Award,
  Send,
  X,
  CornerDownRight,
} from 'lucide-react-native';

interface PublicUserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  gender?: string;
  birth_date?: string;
  bio?: string;
  created_at: string;
}

interface UserPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked_by_me?: boolean;
  is_bookmarked_by_me?: boolean;
  category?: string;
}

interface CommentItem {
  id: string;
  post_id?: string;
  user_id?: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  parent_id?: string | null;
  parent_user_name?: string | null;
}

interface UserProfileScreenProps {
  userId: string;
  onBack: () => void;
}

export const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ userId, onBack }) => {
  const { colors, isDarkMode } = useThemeStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [posts, setPosts] = useState<UserPost[]>([]);

  // Comments Modal state
  const [selectedPostForComment, setSelectedPostForComment] = useState<UserPost | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [replyToComment, setReplyToComment] = useState<{ id: string; user_name?: string } | null>(null);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(ENDPOINTS.AUTH.PUBLIC_PROFILE(userId));
        if (res.data?.data) {
          setProfile(res.data.data.user);
          setPostsCount(res.data.data.stats?.posts_count || 0);
          setPosts(res.data.data.posts || []);
        }
      } catch (error: any) {
        console.log('[UserProfile] Error fetching public profile:', error?.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPublicProfile();
    }
  }, [userId]);

  const handleToggleLike = async (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = post.is_liked_by_me;
          return {
            ...post,
            is_liked_by_me: !isLiked,
            likes_count: isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
          };
        }
        return post;
      })
    );

    try {
      await apiClient.post(ENDPOINTS.POSTS.LIKE(postId));
    } catch (error) { }
  };

  const handleToggleBookmark = async (postId: string) => {
    let prevBookmarked: boolean | undefined;

    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          prevBookmarked = post.is_bookmarked_by_me;
          return { ...post, is_bookmarked_by_me: !prevBookmarked };
        }
        return post;
      })
    );

    try {
      const res = await apiClient.post(ENDPOINTS.POSTS.BOOKMARK(postId));
      const bookmarked: boolean = res.data?.data?.bookmarked ?? !prevBookmarked;

      // Sync dengan nilai aktual dari server
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, is_bookmarked_by_me: bookmarked } : post
        )
      );
    } catch (error) {
      // Revert jika API gagal
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, is_bookmarked_by_me: prevBookmarked } : post
        )
      );
    }
  };

  const handleOpenComments = async (post: UserPost) => {
    setSelectedPostForComment(post);
    setReplyToComment(null);
    try {
      const res = await apiClient.get(ENDPOINTS.POSTS.COMMENTS(post.id));
      setCommentsList(res.data?.data || []);
    } catch (error) {
      setCommentsList([]);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPostForComment) return;

    const textToSend = commentText.trim();
    const targetPostId = selectedPostForComment.id;
    const parentIdToSend = replyToComment?.id || null;
    setCommentText('');
    setReplyToComment(null);

    try {
      await apiClient.post(ENDPOINTS.POSTS.COMMENTS(targetPostId), {
        content: textToSend,
        parent_id: parentIdToSend,
      });

      const commentsRes = await apiClient.get(ENDPOINTS.POSTS.COMMENTS(targetPostId));
      if (commentsRes.data?.data && Array.isArray(commentsRes.data.data)) {
        setCommentsList(commentsRes.data.data);
      }

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === targetPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        )
      );
    } catch (error) { }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formattedJoinDate = () => {
    if (!profile?.created_at) return 'Terbaru';
    const d = new Date(profile.created_at);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil Pengguna</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Memuat profil pengguna...</Text>
        </View>
      ) : !profile ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Pengguna tidak ditemukan.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* User Hero Profile Card */}
          <Card style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
                {profile.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarBox, { backgroundColor: colors.primaryDark }]}>
                    <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{profile.name}</Text>
              <Award color={colors.accent} size={18} />
            </View>

            {!!profile.bio && (
              <Text style={[styles.userBio, { color: colors.text }]}>"{profile.bio}"</Text>
            )}

            {!!(profile.gender || profile.birth_date) && (
              <Text style={[styles.userMeta, { color: colors.textMuted }]}>
                {profile.gender ? `👤 ${profile.gender}` : ''}
                {profile.gender && profile.birth_date ? ' • ' : ''}
                {profile.birth_date ? `🎂 ${profile.birth_date}` : ''}
              </Text>
            )}

            <View style={[styles.badgeTag, { backgroundColor: isDarkMode ? '#065F46' : '#D1E7DD' }]}>
              <Sparkles color={colors.primary} size={13} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>Anggota Sejak {formattedJoinDate()}</Text>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{postsCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Postingan</Text>
              </View>
            </View>
          </Card>

          {/* Posts Header */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Postingan {profile.name}</Text>

          {posts.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyCardText, { color: colors.textMuted }]}>
                Pengguna ini belum membagikan postingan.
              </Text>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                item={{
                  ...post,
                  author_name: profile?.name,
                  author_avatar: profile?.avatar_url,
                }}
                onLike={() => handleToggleLike(post.id)}
                onComment={() => handleOpenComments(post)}
                onBookmark={() => handleToggleBookmark(post.id)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Modal Komentar */}
      <Modal visible={!!selectedPostForComment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Komentar</Text>
              <TouchableOpacity onPress={() => setSelectedPostForComment(null)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={commentsList}
              keyExtractor={(c) => c.id}
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isReply = !!item.parent_id;
                return (
                  <View
                    style={[
                      styles.commentItem,
                      { borderBottomColor: colors.border },
                      isReply && [styles.replyItem, { borderLeftColor: colors.primary }],
                    ]}
                  >
                    <View style={styles.commentHeaderRow}>
                      <Text style={[styles.commentUser, { color: colors.primary }]}>{item.user_name || 'Pengguna'}</Text>
                      {isReply && item.parent_user_name && (
                        <Text style={[styles.replyTag, { color: colors.textMuted }]}>
                          {' '}• membalas <Text style={{ color: colors.primary, fontWeight: '600' }}>@{item.parent_user_name}</Text>
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.commentText, { color: colors.text }]}>{item.content}</Text>

                    <TouchableOpacity
                      style={styles.replyButton}
                      onPress={() => setReplyToComment({ id: item.id, user_name: item.user_name })}
                      activeOpacity={0.7}
                    >
                      <CornerDownRight color={colors.textMuted} size={12} />
                      <Text style={[styles.replyButtonText, { color: colors.textMuted }]}>Balas</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>Belum ada komentar. Jadilah yang pertama!</Text>
                </View>
              }
            />

            {replyToComment && (
              <View style={[styles.replyBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.replyBannerText, { color: colors.textMuted }]}>
                  Membalas <Text style={{ color: colors.primary, fontWeight: 'bold' }}>@{replyToComment.user_name}</Text>
                </Text>
                <TouchableOpacity onPress={() => setReplyToComment(null)}>
                  <X color={colors.textMuted} size={16} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentTextInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder={replyToComment ? `Balas @${replyToComment.user_name}...` : 'Tulis komentar santun...'}
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={[styles.commentSendBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddComment}
              >
                <Send color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  avatarWrapper: {
    marginBottom: SPACING.sm,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 6,
  },
  userBio: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  userMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  emptyCard: {
    padding: SPACING.lg,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  replyItem: {
    marginLeft: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  replyTag: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 13,
    marginTop: 2,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  replyButtonText: {
    fontSize: 11,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  replyBannerText: {
    fontSize: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  commentTextInput: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 13,
  },
  commentSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
