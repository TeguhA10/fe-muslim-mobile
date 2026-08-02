import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Share,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { PostCardItem } from '../../../components/common/PostCard';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Tag,
  Send,
  CornerDownRight,
  X,
} from 'lucide-react-native';
import { formatRelativeTime } from '../../../utils/dateFormatter';

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

interface PostDetailScreenProps {
  post: PostCardItem;
  onBack: () => void;
  onPressAuthor?: (userId: string) => void;
  onPressImage?: (imageUrls: string[], initialIndex: number) => void;
}

export const PostDetailScreen: React.FC<PostDetailScreenProps> = ({
  post: initialPost,
  onBack,
  onPressAuthor,
  onPressImage,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const [post, setPost] = useState<PostCardItem>(initialPost);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [replyToComment, setReplyToComment] = useState<{ id: string; user_name?: string } | null>(null);

  const authorName = post.author_name || 'Pengguna Muslim';
  const avatarUri = post.author_avatar || post.user_avatar;
  const initial = authorName[0].toUpperCase();

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const res = await apiClient.get(ENDPOINTS.POSTS.COMMENTS(post.id));
      if (res.data?.data && Array.isArray(res.data.data)) {
        setComments(res.data.data);
      }
    } catch (error: any) {
      console.log('[PostDetailScreen] Error fetching comments:', error?.message);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handleToggleLike = async () => {
    const prevLiked = post.is_liked_by_me;
    const prevLikesCount = post.likes_count;

    setPost((prev) => ({
      ...prev,
      is_liked_by_me: !prevLiked,
      likes_count: prevLiked ? Math.max(0, prevLikesCount - 1) : prevLikesCount + 1,
    }));

    try {
      await apiClient.post(ENDPOINTS.POSTS.LIKE(post.id));
    } catch (error) {
      setPost((prev) => ({
        ...prev,
        is_liked_by_me: prevLiked,
        likes_count: prevLikesCount,
      }));
    }
  };

  const handleToggleBookmark = async () => {
    const prevBookmarked = post.is_bookmarked_by_me;

    setPost((prev) => ({
      ...prev,
      is_bookmarked_by_me: !prevBookmarked,
    }));

    try {
      const res = await apiClient.post(ENDPOINTS.POSTS.BOOKMARK(post.id));
      const isBookmarked = res.data?.data?.bookmarked ?? !prevBookmarked;
      setPost((prev) => ({
        ...prev,
        is_bookmarked_by_me: isBookmarked,
      }));
    } catch (error) {
      setPost((prev) => ({
        ...prev,
        is_bookmarked_by_me: prevBookmarked,
      }));
    }
  };

  const handleShare = async () => {
    try {
      const postUrl = `https://muslimapp.com/post/${post.id}`;
      const shareMessage =
        `🕌 Hikmah dari ${authorName} di Muslim App:\n\n"${post.content}"` +
        (post.image_url ? `\n\n📷 Lampiran: ${post.image_url}` : '') +
        `\n\n🔗 Lihat selengkapnya: ${postUrl}`;

      await Share.share(
        { message: shareMessage, url: postUrl, title: `Postingan dari ${authorName} - Muslim App` },
        { dialogTitle: 'Bagikan Postingan ke...' }
      );
    } catch (error: any) {
      console.log('[PostDetailScreen] Share error:', error?.message);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const textToSend = commentText.trim();
    const parentIdToSend = replyToComment?.id || null;
    setCommentText('');
    setReplyToComment(null);
    setSubmittingComment(true);

    try {
      await apiClient.post(ENDPOINTS.POSTS.COMMENTS(post.id), {
        content: textToSend,
        parent_id: parentIdToSend,
      });

      // Refetch comments
      await fetchComments();

      // Increment comments count in local post state
      setPost((prev) => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1,
      }));
    } catch (error: any) {
      console.log('[PostDetailScreen] Error adding comment:', error?.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const images = (post.media_urls || []).filter((m) => (m.media_type || m.type) === 'IMAGE');
  const links = (post.media_urls || []).filter((m) => (m.media_type || m.type) === 'LINK');

  if (images.length === 0 && post.image_url) {
    images.push({ type: 'IMAGE', url: post.image_url } as any);
  }

  const allImageUrls = images.map((img) => img.url);

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Detail Post</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
            <Share2 color={colors.text} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Main Post Card */}
          <Card style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Author Header */}
            <View style={styles.authorHeader}>
              <TouchableOpacity
                style={styles.authorLeft}
                activeOpacity={0.7}
                onPress={() => post.user_id && onPressAuthor?.(post.user_id)}
                disabled={!onPressAuthor || !post.user_id}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: isDarkMode ? colors.primaryDark : '#E0E7FF' },
                    ]}
                  >
                    <Text style={[styles.avatarInitial, { color: colors.primary }]}>{initial}</Text>
                  </View>
                )}

                <View style={styles.authorMeta}>
                  <Text style={[styles.authorName, { color: colors.text }]}>{authorName}</Text>
                  <View style={styles.metaRow}>
                    <Text style={[styles.postTime, { color: colors.textMuted }]}>
                      {formatRelativeTime(post.created_at)}
                    </Text>
                    {!!post.category && (
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: isDarkMode ? '#065F46' : '#D1E7DD' },
                        ]}
                      >
                        <Tag color={colors.primary} size={10} />
                        <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                          {post.category}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bookmarkBtn} onPress={handleToggleBookmark} activeOpacity={0.7}>
                <Bookmark
                  color={post.is_bookmarked_by_me ? colors.accent : colors.textMuted}
                  fill={post.is_bookmarked_by_me ? colors.accent : 'transparent'}
                  size={22}
                />
              </TouchableOpacity>
            </View>

            {/* Post Content */}
            <Text style={[styles.postContentText, { color: colors.text }]}>{post.content}</Text>

            {/* Media Lampiran */}
            <View style={styles.mediaContainer}>
              {/* Links */}
              {links.map((link, idx) => (
                <View key={`link-${idx}`} style={[styles.linkContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                  <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>{link.url}</Text>
                </View>
              ))}

              {/* Images Grid */}
              {images.length === 1 && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => onPressImage?.(allImageUrls, 0)}
                >
                  <Image source={{ uri: images[0].url }} style={styles.imageSingle} resizeMode="cover" />
                </TouchableOpacity>
              )}

              {images.length === 2 && (
                <View style={styles.imageGrid2}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.9}
                    onPress={() => onPressImage?.(allImageUrls, 0)}
                  >
                    <Image source={{ uri: images[0].url }} style={styles.imageHalf} resizeMode="cover" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.9}
                    onPress={() => onPressImage?.(allImageUrls, 1)}
                  >
                    <Image source={{ uri: images[1].url }} style={styles.imageHalf} resizeMode="cover" />
                  </TouchableOpacity>
                </View>
              )}

              {images.length >= 3 && (
                <View style={styles.imageGridMulti}>
                  <TouchableOpacity
                    style={{ flex: 2 }}
                    activeOpacity={0.9}
                    onPress={() => onPressImage?.(allImageUrls, 0)}
                  >
                    <Image source={{ uri: images[0].url }} style={styles.imageMain} resizeMode="cover" />
                  </TouchableOpacity>
                  <View style={styles.imageSide}>
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={0.9}
                      onPress={() => onPressImage?.(allImageUrls, 1)}
                    >
                      <Image source={{ uri: images[1].url }} style={styles.imageSideItem} resizeMode="cover" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imageSideItemWrapper}
                      activeOpacity={0.9}
                      onPress={() => onPressImage?.(allImageUrls, 2)}
                    >
                      <Image source={{ uri: images[2].url }} style={styles.imageSideItem} resizeMode="cover" />
                      {images.length > 3 && (
                        <View style={styles.imageOverlay}>
                          <Text style={styles.imageOverlayText}>+{images.length - 3}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Action Bar */}
            <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={styles.actionItem} onPress={handleToggleLike} activeOpacity={0.7}>
                <Heart
                  color={post.is_liked_by_me ? colors.error : colors.textMuted}
                  fill={post.is_liked_by_me ? colors.error : 'transparent'}
                  size={20}
                />
                <Text
                  style={[
                    styles.actionText,
                    { color: post.is_liked_by_me ? colors.error : colors.textMuted },
                    post.is_liked_by_me && { fontWeight: 'bold' },
                  ]}
                >
                  {post.likes_count ?? 0} Menyukai
                </Text>
              </TouchableOpacity>

              <View style={styles.actionItem}>
                <MessageSquare color={colors.textMuted} size={20} />
                <Text style={[styles.actionText, { color: colors.textMuted }]}>
                  {post.comments_count ?? 0} Komentar
                </Text>
              </View>
            </View>
          </Card>

          {/* Comments Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Thread Komentar ({comments.length})
          </Text>

          {loadingComments ? (
            <View style={styles.loadingComments}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingCommentsText, { color: colors.textMuted }]}>
                Memuat komentar...
              </Text>
            </View>
          ) : comments.length === 0 ? (
            <Card style={[styles.emptyCommentsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyCommentsText, { color: colors.textMuted }]}>
                Belum ada komentar. Jadilah yang pertama memberikan inspirasi!
              </Text>
            </Card>
          ) : (
            comments.map((item) => {
              const isReply = !!item.parent_id;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.commentCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isReply && [styles.replyCard, { borderLeftColor: colors.primary }],
                  ]}
                >
                  <View style={styles.commentHeaderRow}>
                    <Text style={[styles.commentUser, { color: colors.primary }]}>
                      {item.user_name || 'Pengguna Muslim'}
                    </Text>
                    {isReply && item.parent_user_name && (
                      <Text style={[styles.replyTag, { color: colors.textMuted }]}>
                        {' '}• membalas <Text style={{ color: colors.primary, fontWeight: '600' }}>@{item.parent_user_name}</Text>
                      </Text>
                    )}
                  </View>

                  <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>

                  <View style={styles.commentFooter}>
                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => setReplyToComment({ id: item.parent_id || item.id, user_name: item.user_name })}
                      activeOpacity={0.7}
                    >
                      <CornerDownRight color={colors.textMuted} size={12} />
                      <Text style={[styles.replyBtnText, { color: colors.textMuted }]}>Balas</Text>
                    </TouchableOpacity>
                    {item.created_at && (
                      <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                        {formatRelativeTime(item.created_at)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Reply Indicator Banner */}
        {replyToComment && (
          <View style={[styles.replyBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
            <Text style={[styles.replyBannerText, { color: colors.textMuted }]}>
              Membalas <Text style={{ color: colors.primary, fontWeight: 'bold' }}>@{replyToComment.user_name}</Text>
            </Text>
            <TouchableOpacity onPress={() => setReplyToComment(null)}>
              <X color={colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Input Box */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.inputBox, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder={replyToComment ? `Tulis balasan untuk @${replyToComment.user_name}...` : 'Tulis komentar santun...'}
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }, (!commentText.trim() || submittingComment) && { opacity: 0.6 }]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send color="#FFFFFF" size={18} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareBtn: {
    padding: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 20,
  },
  postCard: {
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.md,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarInitial: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  postTime: {
    fontSize: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookmarkBtn: {
    padding: SPACING.xs,
  },
  postContentText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  mediaContainer: {
    marginBottom: SPACING.md,
  },
  linkContainer: {
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  linkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  imageSingle: {
    width: '100%',
    height: 240,
    borderRadius: 14,
  },
  imageGrid2: {
    flexDirection: 'row',
    gap: 4,
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageHalf: {
    flex: 1,
    height: '100%',
  },
  imageGridMulti: {
    flexDirection: 'row',
    gap: 4,
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imageMain: {
    flex: 2,
    height: '100%',
  },
  imageSide: {
    flex: 1,
    gap: 4,
    height: '100%',
  },
  imageSideItem: {
    flex: 1,
    width: '100%',
  },
  imageSideItemWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: SPACING.md,
    gap: SPACING.xl,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  loadingComments: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingCommentsText: {
    fontSize: 12,
    marginTop: 6,
  },
  emptyCommentsCard: {
    padding: SPACING.lg,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontSize: 13,
  },
  commentCard: {
    padding: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  replyCard: {
    marginLeft: 18,
    borderLeftWidth: 3,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  replyTag: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentTime: {
    fontSize: 11,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderWidth: 1,
  },
  replyBannerText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
  },
  inputBox: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
});
