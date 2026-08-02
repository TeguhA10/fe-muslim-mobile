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
import { CustomAlert } from '../../../components/common/CustomAlert';
import { ImageViewerModal } from '../../../components/common/ImageViewerModal';
import { PostDetailScreen } from '../../home/screens/PostDetailScreen';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useCategories } from '../../../hooks/useCategories';
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
  Search,
  Zap,
  Flame,
  Image as ImageIcon,
} from 'lucide-react-native';
import { formatRelativeTime } from '../../../utils/dateFormatter';

interface MyPostsScreenProps {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bio?: string;
  onBack: () => void;
  onPostDeleted?: () => void;
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
  const { categories, loading: categoriesLoading } = useCategories();

  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedPostToDelete, setSelectedPostToDelete] = useState<string | null>(null);

  // Detail & Image Viewer State
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

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortFilters, setSortFilters] = useState<string[]>(['terbaru']);
  const [mediaFilter, setMediaFilter] = useState<'semua' | 'gambar_saja'>('semua');
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);

  // Comments Modal state
  const [selectedPostForComment, setSelectedPostForComment] = useState<any | null>(null);
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

  const PAGE_SIZE = 10;

  const toggleSortFilter = (filterKey: string) => {
    if (sortFilters.includes(filterKey)) {
      const updated = sortFilters.filter((s) => s !== filterKey);
      setSortFilters(updated.length > 0 ? updated : ['terbaru']);
    } else {
      setSortFilters([...sortFilters, filterKey]);
    }
  };

  const fetchMyPostsData = async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const categoryParam = selectedCategoryFilters.length > 0 ? selectedCategoryFilters.join(',') : 'semua';
      const sortParam = sortFilters.length > 0 ? sortFilters.join(',') : 'terbaru';

      const res = await apiClient.get(ENDPOINTS.POSTS.FEED, {
        params: {
          author_id: userId,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
          sort: sortParam,
          media: mediaFilter,
          search: searchQuery.trim(),
          category: categoryParam,
        },
      });

      const newPosts: any[] = res.data?.data || [];

      if (isRefresh || pageNum === 0) {
        setPosts(newPosts);
        setPage(0);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (error: any) {
      console.log('[MyPosts] Error fetching my posts:', error?.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setPage(0);
      setHasMore(true);
      fetchMyPostsData(0, true);
    }
  }, [userId, sortFilters, mediaFilter, searchQuery, selectedCategoryFilters]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMyPostsData(nextPage, false);
    }
  };

  const handleRefresh = () => {
    fetchMyPostsData(0, true);
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

  const handleOpenComments = async (post: any) => {
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
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Postingan Anda telah dihapus.',
      });
      if (onPostDeleted) onPostDeleted();
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

  if (selectedPostForDetail) {
    return (
      <>
        <PostDetailScreen
          post={{
            ...selectedPostForDetail,
            author_name: selectedPostForDetail.author_name || userName,
            author_avatar: selectedPostForDetail.author_avatar || avatarUrl,
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
          onClose={() => setImageViewerConfig({ visible: false, urls: [], index: 0 })}
        />
      </>
    );
  }

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

      {/* Stable Search & Filter Bar Section */}
      <View style={{ marginBottom: SPACING.xs }}>
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
                Kelola & Cari Postingan Anda
              </Text>
            </View>
          </View>
        </Card>

        {/* Search Bar */}
        <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.primary} size={18} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cari postingan saya..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={colors.textMuted} size={16} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Scrollable Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              sortFilters.includes('terbaru') && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => toggleSortFilter('terbaru')}
          >
            <Zap color={sortFilters.includes('terbaru') ? '#FFFFFF' : colors.text} size={14} />
            <Text style={[styles.chipText, { color: colors.text }, sortFilters.includes('terbaru') && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              ⚡ Terbaru
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              sortFilters.includes('terpopuler') && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => toggleSortFilter('terpopuler')}
          >
            <Flame color={sortFilters.includes('terpopuler') ? '#FFFFFF' : '#EF4444'} size={14} />
            <Text style={[styles.chipText, { color: colors.text }, sortFilters.includes('terpopuler') && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              🔥 Terpopuler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              sortFilters.includes('paling_banyak_diskusi') && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => toggleSortFilter('paling_banyak_diskusi')}
          >
            <MessageCircle color={sortFilters.includes('paling_banyak_diskusi') ? '#FFFFFF' : colors.primary} size={14} />
            <Text style={[styles.chipText, { color: colors.text }, sortFilters.includes('paling_banyak_diskusi') && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              💬 Banyak Diskusi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              mediaFilter === 'gambar_saja' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setMediaFilter(mediaFilter === 'gambar_saja' ? 'semua' : 'gambar_saja')}
          >
            <ImageIcon color={mediaFilter === 'gambar_saja' ? '#FFFFFF' : colors.accent} size={14} />
            <Text style={[styles.chipText, { color: colors.text }, mediaFilter === 'gambar_saja' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              🖼️ Ada Gambar
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterRow}>
          <TouchableOpacity
            style={[
              styles.catFilterChip,
              { backgroundColor: colors.surface, borderColor: colors.border },
              selectedCategoryFilters.length === 0 && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setSelectedCategoryFilters([])}
          >
            <Text style={[styles.catFilterText, { color: colors.text }, selectedCategoryFilters.length === 0 && { color: '#FFFFFF', fontWeight: 'bold' }]}>
              Semua Kategori
            </Text>
          </TouchableOpacity>
          {categoriesLoading && categories.length === 0 ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginHorizontal: 8 }} />
          ) : (
            categories.map((cat) => {
              const isSelected = selectedCategoryFilters.includes(cat.name);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catFilterChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedCategoryFilters(selectedCategoryFilters.filter((c) => c !== cat.name));
                    } else {
                      setSelectedCategoryFilters([...selectedCategoryFilters, cat.name]);
                    }
                  }}
                >
                  <Text style={[styles.catFilterText, { color: colors.text }, isSelected && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Memuat postingan Anda...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Memuat postingan lainnya...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FileText color={colors.textMuted} size={40} style={{ marginBottom: 10 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Postingan</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {searchQuery || selectedCategoryFilters.length > 0
                  ? 'Tidak ada postingan yang cocok dengan kriteria pencarian/filter.'
                  : 'Anda belum pernah membagikan postingan. Bagikan kalimat hikmah atau motivasi di Feed!'}
              </Text>
            </Card>
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item: post }) => {
            const formattedItem = {
              ...post,
              author_name: userName,
              author_avatar: avatarUrl,
            };
            return (
              <PostCard
                key={post.id}
                item={formattedItem}
                onPressPost={(item) => setSelectedPostForDetail(item)}
                onPressImage={(urls, index) =>
                  setImageViewerConfig({ visible: true, urls, index })
                }
                onLike={() => handleToggleLike(post.id)}
                onComment={() => setSelectedPostForDetail(formattedItem)}
                onBookmark={() => handleToggleBookmark(post.id)}
                onDelete={() => confirmDeletePost(post.id)}
              />
            );
          }}
        />
      )}

      {/* ImageViewerModal */}
      <ImageViewerModal
        visible={imageViewerConfig.visible}
        imageUrls={imageViewerConfig.urls}
        initialIndex={imageViewerConfig.index}
        onClose={() => setImageViewerConfig({ visible: false, urls: [], index: 0 })}
      />

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.type === 'warning' ? 'Ya, Hapus' : 'OK'}
        cancelText={alertConfig.type === 'warning' ? 'Batal' : undefined}
        onConfirm={() => {
          if (alertConfig.type === 'warning') executeDeletePost();
          else setAlertConfig((prev) => ({ ...prev, visible: false }));
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
    borderRadius: 16,
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 40,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.xs,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    gap: 8,
  },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  catFilterText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
