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
import { CustomAlert } from '../../../components/common/CustomAlert';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  ArrowLeft,
  Trash2,
  Heart,
  MessageCircle,
  FileText,
  Bookmark,
  Send,
  X,
  CornerDownRight,
  Share2,
} from 'lucide-react-native';

interface MyPostsScreenProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bio?: string;
  onBack: () => void;
  onPostDeleted?: () => void;
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

export const MyPostsScreen: React.FC<MyPostsScreenProps> = ({
  userId,
  userName,
  avatarUrl,
  bio,
  onBack,
  onPostDeleted,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [selectedPostToDelete, setSelectedPostToDelete] = useState<string | null>(null);

  // Comments Modal state
  const [selectedPostForComment, setSelectedPostForComment] = useState<UserPost | null>(null);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState<string>('');
  const [replyToComment, setReplyToComment] = useState<{ id: string; user_name?: string } | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(ENDPOINTS.AUTH.PUBLIC_PROFILE(userId));
      if (res.data?.data?.posts) {
        setPosts(res.data.data.posts);
      }
    } catch (error: any) {
      console.log('[MyPosts] Error fetching my posts:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMyPosts();
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
    } catch (error) {}
  };

  const handleToggleBookmark = async (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            is_bookmarked_by_me: !post.is_bookmarked_by_me,
          };
        }
        return post;
      })
    );

    try {
      await apiClient.post(ENDPOINTS.POSTS.BOOKMARK(postId));
    } catch (error) {}
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
    } catch (error) {}
  };

  const handleSharePost = async (postId: string, authorName: string, content: string, imageUrl?: string) => {
    try {
      const postUrl = `https://muslimapp.com/post/${postId}`;
      const shareMessage = `🕌 Hikmah dari ${authorName} di Muslim App:\n\n"${content}"${
        imageUrl ? `\n\n📷 Lampiran: ${imageUrl}` : ''
      }\n\n🔗 Lihat postingan selengkapnya: ${postUrl}`;

      await Share.share(
        {
          message: shareMessage,
          url: postUrl,
          title: `Postingan dari ${authorName} - Muslim App`,
        },
        {
          dialogTitle: 'Bagikan Postingan ke...',
        }
      );
    } catch (error: any) {
      console.log('[Share] Error sharing post:', error.message);
    }
  };

  const confirmDeletePost = (postId: string) => {
    setSelectedPostToDelete(postId);
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Hapus Postingan',
      message: 'Apakah Anda yakin ingin menghapus postingan ini secara permanen?',
    });
  };

  const executeDeletePost = async () => {
    if (!selectedPostToDelete) return;
    try {
      await apiClient.delete(ENDPOINTS.POSTS.DELETE(selectedPostToDelete));
      setPosts((prev) => prev.filter((p) => p.id !== selectedPostToDelete));
      if (onPostDeleted) onPostDeleted();
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Postingan Anda telah berhasil dihapus.',
      });
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Gagal Hapus',
        message: 'Terjadi kesalahan saat menghapus postingan.',
      });
    } finally {
      setSelectedPostToDelete(null);
    }
  };

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Postingan Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Memuat postingan Anda...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <Card style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarBox, { backgroundColor: colors.primaryDark }]}>
                  <Text style={styles.avatarText}>{(userName || 'U')[0]}</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
                <Text style={[styles.totalPostsText, { color: colors.primary }]}>
                  Total {posts.length} Postingan Dipublikasikan
                </Text>
              </View>
            </View>
          </Card>

          {/* Posts List */}
          {posts.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FileText color={colors.textMuted} size={40} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Postingan</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Anda belum pernah membagikan postingan. Bagikan kalimat hikmah atau motivasi di Feed!
              </Text>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.postHeader}>
                  <View style={styles.postHeaderLeft}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.miniAvatarImage} />
                    ) : (
                      <View style={[styles.miniAvatarPlaceholder, { backgroundColor: colors.primaryDark }]}>
                        <Text style={styles.miniAvatarText}>{(userName || 'U')[0]}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={[styles.postAuthorName, { color: colors.text }]}>{userName}</Text>
                      <Text style={[styles.postTime, { color: colors.textMuted }]}>
                        {new Date(post.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => handleToggleBookmark(post.id)}>
                      <Bookmark
                        color={post.is_bookmarked_by_me ? colors.accent : colors.textMuted}
                        fill={post.is_bookmarked_by_me ? colors.accent : 'transparent'}
                        size={20}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDeletePost(post.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 color="#DC2626" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

                {!!post.image_url && (
                  <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
                )}

                <View style={[styles.postFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={styles.footerActionBtn} onPress={() => handleToggleLike(post.id)}>
                    <Heart
                      color={post.is_liked_by_me ? '#EF4444' : colors.textMuted}
                      fill={post.is_liked_by_me ? '#EF4444' : 'transparent'}
                      size={18}
                    />
                    <Text style={[styles.actionCount, { color: post.is_liked_by_me ? '#EF4444' : colors.textMuted }]}>
                      {post.likes_count || 0}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.footerActionBtn} onPress={() => handleOpenComments(post)}>
                    <MessageCircle color={colors.textMuted} size={18} />
                    <Text style={[styles.actionCount, { color: colors.textMuted }]}>{post.comments_count || 0}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.footerActionBtn} onPress={() => handleSharePost(post.id, userName, post.content, post.image_url)}>
                    <Share2 color={colors.textMuted} size={18} />
                  </TouchableOpacity>
                </View>
              </Card>
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

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.type === 'warning' ? 'Ya, Hapus' : 'OK'}
        cancelText={alertConfig.type === 'warning' ? 'Batal' : undefined}
        onConfirm={() => {
          if (alertConfig.type === 'warning') {
            executeDeletePost();
          }
          setAlertConfig((prev) => ({ ...prev, visible: false }));
        }}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
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
  summaryCard: {
    padding: SPACING.md,
    borderRadius: 18,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPostsText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyCard: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  postCard: {
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  miniAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginVertical: SPACING.xs,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    marginTop: SPACING.xs,
    borderTopWidth: 1,
    gap: 20,
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: 13,
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
