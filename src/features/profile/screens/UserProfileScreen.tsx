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
  Share,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { PostCard } from '../../../components/common/PostCard';
import { ImageViewerModal } from '../../../components/common/ImageViewerModal';
import { UserListModal } from '../../../components/common/UserListModal';
import { GuestGuardModal } from '../../../components/common/GuestGuardModal';
import { PostDetailScreen } from '../../home/screens/PostDetailScreen';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
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
  UserCheck,
  UserPlus,
  Share2,
  CornerDownRight,
} from 'lucide-react-native';
import { formatRelativeTime } from '../../../utils/dateFormatter';

interface PublicUserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  gender?: string;
  birth_date?: string;
  bio?: string;
  created_at: string;
  is_following_by_me?: boolean;
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
  const { user: currentUser } = useAuthStore();
  const { guardAction, requestRegister } = useGuestGuard();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [posts, setPosts] = useState<UserPost[]>([]);

  // UserListModal state (Instagram followers/following list)
  const [userListModalConfig, setUserListModalConfig] = useState<{
    visible: boolean;
    tab: 'followers' | 'following';
  }>({
    visible: false,
    tab: 'followers',
  });

  // Comments Modal state
  const [selectedPostForComment, setSelectedPostForComment] = useState<UserPost | null>(null);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<any | null>(null);
  const [imageViewerConfig, setImageViewerConfig] = useState<{
    visible: boolean;
    urls: string[];
    index: number;
  }>({
    visible: false,
    urls: [],
    index: 0,
  });
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [replyToComment, setReplyToComment] = useState<{ id: string; user_name?: string } | null>(null);
  const [viewAvatarModal, setViewAvatarModal] = useState<boolean>(false);

  const [targetUserId, setTargetUserId] = useState<string>(userId);

  useEffect(() => {
    setTargetUserId(userId);
  }, [userId]);

  useEffect(() => {
    fetchPublicProfile(targetUserId);
  }, [targetUserId]);

  const fetchPublicProfile = async (idToFetch = targetUserId) => {
    try {
      setLoading(true);
      const res = await apiClient.get(ENDPOINTS.AUTH.PUBLIC_PROFILE(idToFetch));
      if (res.data?.data) {
        const uData = res.data.data.user;
        const statsData = res.data.data.stats;

        setProfile(uData);
        setIsFollowing(!!uData?.is_following_by_me);
        setPostsCount(statsData?.posts_count || 0);
        setFollowersCount(statsData?.followers_count || 0);
        setFollowingCount(statsData?.following_count || 0);
        setPosts(res.data.data.posts || []);
      }
    } catch (error: any) {
      console.log('[UserProfile] Error fetching public profile:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser || !profile || currentUser.id === profile.id) return;

    setFollowLoading(true);
    const prevFollowing = isFollowing;
    const prevFollowersCount = followersCount;

    // Optimistic Update
    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevFollowersCount - 1) : prevFollowersCount + 1);

    try {
      const res = await apiClient.post(ENDPOINTS.AUTH.FOLLOW(profile.id));
      if (res.data?.data) {
        setIsFollowing(res.data.data.is_following);
        setFollowersCount(res.data.data.followers_count);
      }
    } catch (error) {
      // Revert if error
      setIsFollowing(prevFollowing);
      setFollowersCount(prevFollowersCount);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = async () => {
    if (!profile) return;
    try {
      await Share.share({
        message: `Lihat profil ${profile.name} di Aplikasi Muslim!`,
      });
    } catch (e) {}
  };

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

  if (selectedPostForDetail) {
    return (
      <>
        <PostDetailScreen
          post={{
            ...selectedPostForDetail,
            author_name: profile?.name,
            author_avatar: profile?.avatar_url,
          }}
          onBack={() => setSelectedPostForDetail(null)}
          onPressImage={(urls, index) =>
            setImageViewerConfig({ visible: true, urls, index })
          }
        />
        <ImageViewerModal
          visible={imageViewerConfig.visible}
          imageUrls={imageViewerConfig.urls}
          initialIndex={imageViewerConfig.index}
          onClose={() => setImageViewerConfig((prev) => ({ ...prev, visible: false }))}
        />
      </>
    );
  }

  const isMe = currentUser?.id === profile?.id;

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{profile?.name || 'Profil Pengguna'}</Text>
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
          {/* Instagram-Style Hero Profile Card */}
          <Card style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Instagram Header Grid: Avatar on Left, Stats on Right */}
            <View style={styles.igHeaderGrid}>
              {/* Avatar Ring */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (profile?.avatar_url) {
                    setViewAvatarModal(true);
                  }
                }}
              >
                <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarBox, { backgroundColor: colors.primaryDark }]}>
                      <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Instagram Stats Row */}
              <View style={styles.igStatsRow}>
                <View style={styles.igStatItem}>
                  <Text style={[styles.igStatValue, { color: colors.text }]}>{postsCount}</Text>
                  <Text style={[styles.igStatLabel, { color: colors.textMuted }]}>Postingan</Text>
                </View>

                <TouchableOpacity
                  style={styles.igStatItem}
                  activeOpacity={0.7}
                  onPress={guardAction(
                    () => setUserListModalConfig({ visible: true, tab: 'followers' }),
                    () => setIsGuestModalOpen(true)
                  )}
                >
                  <Text style={[styles.igStatValue, { color: colors.text }]}>{followersCount}</Text>
                  <Text style={[styles.igStatLabel, { color: colors.textMuted }]}>Pengikut</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.igStatItem}
                  activeOpacity={0.7}
                  onPress={guardAction(
                    () => setUserListModalConfig({ visible: true, tab: 'following' }),
                    () => setIsGuestModalOpen(true)
                  )}
                >
                  <Text style={[styles.igStatValue, { color: colors.text }]}>{followingCount}</Text>
                  <Text style={[styles.igStatLabel, { color: colors.textMuted }]}>Mengikuti</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Name & Bio Section */}
            <View style={styles.infoSection}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>{profile.name}</Text>
                <Award color={colors.accent} size={18} style={{ marginLeft: 6 }} />
              </View>

              {!!profile.bio && (
                <Text style={[styles.userBio, { color: colors.text }]}>{profile.bio}</Text>
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
            </View>

            {/* Instagram Action Buttons Row */}
            {!isMe && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[
                    styles.igMainBtn,
                    isFollowing
                      ? [styles.igFollowingBtn, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]
                      : [styles.igFollowBtn, { backgroundColor: colors.primary }],
                  ]}
                  onPress={handleToggleFollow}
                  disabled={followLoading}
                  activeOpacity={0.85}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? colors.text : '#FFFFFF'} />
                  ) : isFollowing ? (
                    <View style={styles.igBtnInner}>
                      <UserCheck color={colors.text} size={16} style={{ marginRight: 6 }} />
                      <Text style={[styles.igFollowingBtnText, { color: colors.text }]}>Mengikuti</Text>
                    </View>
                  ) : (
                    <View style={styles.igBtnInner}>
                      <UserPlus color="#FFFFFF" size={16} style={{ marginRight: 6 }} />
                      <Text style={styles.igFollowBtnText}>Ikuti</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.igSecondaryBtn, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}
                  onPress={handleShareProfile}
                  activeOpacity={0.85}
                >
                  <Share2 color={colors.text} size={16} />
                </TouchableOpacity>
              </View>
            )}
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
                onPressPost={(item) => setSelectedPostForDetail(item)}
                onPressImage={(urls, index) =>
                  setImageViewerConfig({ visible: true, urls, index })
                }
                onLike={() => handleToggleLike(post.id)}
                onComment={() => setSelectedPostForDetail({ ...post, author_name: profile?.name, author_avatar: profile?.avatar_url })}
                onBookmark={() => handleToggleBookmark(post.id)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* UserListModal for Followers / Following */}
      {!!profile && (
        <UserListModal
          visible={userListModalConfig.visible}
          initialTab={userListModalConfig.tab}
          userId={profile.id}
          userName={profile.name}
          onClose={() => setUserListModalConfig((prev) => ({ ...prev, visible: false }))}
          onSelectUser={(selectedUserId) => {
            setUserListModalConfig((prev) => ({ ...prev, visible: false }));
            setTargetUserId(selectedUserId);
          }}
        />
      )}

      <ImageViewerModal
        visible={imageViewerConfig.visible}
        imageUrls={imageViewerConfig.urls}
        initialIndex={imageViewerConfig.index}
        onClose={() => setImageViewerConfig((prev) => ({ ...prev, visible: false }))}
      />


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

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <TouchableOpacity
                        style={styles.replyButton}
                        onPress={() => setReplyToComment({ id: item.parent_id || item.id, user_name: item.user_name })}
                        activeOpacity={0.7}
                      >
                        <CornerDownRight color={colors.textMuted} size={12} />
                        <Text style={[styles.replyButtonText, { color: colors.textMuted }]}>Balas</Text>
                      </TouchableOpacity>
                      {item.created_at && (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {formatRelativeTime(item.created_at)}
                        </Text>
                      )}
                    </View>
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

      {/* Full-Screen Avatar Image Viewer */}
      <ImageViewerModal
        visible={viewAvatarModal}
        imageUrls={profile?.avatar_url ? [profile.avatar_url] : []}
        onClose={() => setViewAvatarModal(false)}
      />

      <GuestGuardModal
        visible={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onNavigateRegister={requestRegister}
        featureName="melihat detail profil pengguna lain"
      />
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
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  igHeaderGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  igStatsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: SPACING.md,
  },
  igStatItem: {
    alignItems: 'center',
  },
  igStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  igStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  infoSection: {
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: 8,
  },
  igMainBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  igFollowBtn: {},
  igFollowingBtn: {},
  igBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  igFollowBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  igFollowingBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  igSecondaryBtn: {
    width: 42,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: SPACING.sm,
  },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userBio: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  userMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
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
