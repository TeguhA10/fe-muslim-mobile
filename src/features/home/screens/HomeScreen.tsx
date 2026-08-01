import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { GuestGuardModal } from '../../../components/common/GuestGuardModal';
import { PostCard } from '../../../components/common/PostCard';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Post } from '../../../types';
import { Plus, X, Send, CornerDownRight, Search, Zap, Flame, Image as ImageIcon, MessageCircle, Tag, Bookmark, Heart } from 'lucide-react-native';
import { UserProfileScreen } from '../../profile/screens/UserProfileScreen';
import { useCategories } from '../../../hooks/useCategories';
import { useAuthStore } from '../../../store/useAuthStore';

export const HomeScreen: React.FC = () => {
  const { colors, isDarkMode } = useThemeStore();
  const { guardAction, requestRegister } = useGuestGuard();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Categories from DB (cached in AsyncStorage)
  const { categories, loading: categoriesLoading } = useCategories();

  const [activeTab, setActiveTab] = useState<'feed' | 'bookmarks' | 'liked'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter States
  const [sortFilter, setSortFilter] = useState<'terbaru' | 'terpopuler' | 'paling_banyak_diskusi'>('terbaru');
  const [mediaFilter, setMediaFilter] = useState<'semua' | 'gambar_saja'>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [newPostImageUrl, setNewPostImageUrl] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Comment Modal State
  const [selectedPostForComment, setSelectedPostForComment] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState<string>('');
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [replyToComment, setReplyToComment] = useState<{ id: string; user_name: string } | null>(null);

  // Custom Alert State
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

  const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Fetch Posts from Backend with Pagination (Infinity Scroll)
  const PAGE_SIZE = 10;

  const fetchPostsData = async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let url = ENDPOINTS.POSTS.FEED;
      if (activeTab === 'bookmarks') url = ENDPOINTS.POSTS.BOOKMARKS;
      if (activeTab === 'liked') url = ENDPOINTS.POSTS.LIKED_POSTS;

      const res = await apiClient.get(url, {
        params: {
          user_id: useAuthStore.getState().user?.id,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
          sort: sortFilter,
          media: mediaFilter,
          search: searchQuery.trim(),
          category: selectedCategoryFilter,
        },
      });

      const newPosts: Post[] = res.data?.data || [];

      if (isRefresh || pageNum === 0) {
        setPosts(newPosts);
        setPage(0);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (error) {
      console.log('[Feed] Error fetching posts, using local state');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchPostsData(0, true);
  }, [activeTab, sortFilter, mediaFilter, searchQuery, selectedCategoryFilter]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPostsData(nextPage, false);
    }
  };

  const handleRefresh = () => {
    fetchPostsData(0, true);
  };

  // Handle Create Post
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showAlert('Perhatian', 'Isi postingan tidak boleh kosong', 'warning');
      return;
    }

    if (!newPostCategory) {
      showAlert('Perhatian', 'Kategori postingan wajib dipilih!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(ENDPOINTS.POSTS.CREATE, {
        content: newPostContent.trim(),
        image_url: newPostImageUrl.trim() || undefined,
        category: newPostCategory,
      });

      if (res.data?.data) {
        setPosts((prev) => [res.data.data, ...prev]);
      } else {
        fetchPostsData(0, true);
      }

      setIsModalOpen(false);
      setNewPostContent('');
      setNewPostImageUrl('');
      setNewPostCategory(categories[0]?.name ?? '');
      showAlert('Berhasil', 'Postingan Anda berhasil dipublikasikan!', 'success');
    } catch (error: any) {
      showAlert('Gagal', 'Terjadi kesalahan saat mempublikasikan postingan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Like
  const handleToggleLike = async (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === postId) {
          const isLiked = post.is_liked_by_me;
          return {
            ...post,
            is_liked_by_me: !isLiked,
            likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
          };
        }
        return post;
      })
    );

    try {
      await apiClient.post(ENDPOINTS.POSTS.LIKE(postId));
    } catch (error) { }
  };

  // Handle Toggle Bookmark (Save Post)
  const handleToggleBookmark = async (postId: string) => {
    // Simpan nilai lama untuk revert jika API gagal
    let prevBookmarked: boolean | undefined;

    // Optimistic update: flip icon langsung sebelum API selesai
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

      // Sync state dengan nilai aktual dari server (bukan asumsi optimistic)
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, is_bookmarked_by_me: bookmarked } : post
        )
      );

      showAlert(
        bookmarked ? '✅ Disimpan' : '🗑️ Dihapus',
        bookmarked
          ? 'Postingan berhasil disimpan ke daftar tersimpan Anda!'
          : 'Postingan dihapus dari daftar tersimpan.',
        'info'
      );
    } catch (error) {
      // Revert ke nilai sebelumnya jika API gagal
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, is_bookmarked_by_me: prevBookmarked } : post
        )
      );
      showAlert('Gagal', 'Tidak dapat mengubah status simpan. Coba lagi.', 'error');
    }
  };

  // Open Comments
  const handleOpenComments = async (post: Post) => {
    setSelectedPostForComment(post);
    setReplyToComment(null);
    try {
      const res = await apiClient.get(ENDPOINTS.POSTS.COMMENTS(post.id));
      setCommentsList(res.data?.data || []);
    } catch (error) {
      setCommentsList([
        { id: '1', user_name: 'Siti Nurhaliza', content: 'MasyaAllah barakallah 🤲', created_at: '5m' },
      ]);
    }
  };

  // Add Comment with Automatic DB Refresh & Instant Feed Sync
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPostForComment) return;

    const textToSend = commentText.trim();
    const targetPostId = selectedPostForComment.id;
    const parentIdToSend = replyToComment?.id || null;
    setCommentText('');
    setReplyToComment(null);

    try {
      // 1. Post comment/reply to backend API
      const res = await apiClient.post(ENDPOINTS.POSTS.COMMENTS(targetPostId), {
        content: textToSend,
        parent_id: parentIdToSend,
      });

      // 2. Automatically re-fetch fresh comments list from backend DB
      const commentsRes = await apiClient.get(ENDPOINTS.POSTS.COMMENTS(targetPostId));
      if (commentsRes.data?.data && Array.isArray(commentsRes.data.data)) {
        setCommentsList(commentsRes.data.data);
      } else if (res.data?.data) {
        setCommentsList((prev) => [...prev, res.data.data]);
      }

      // 3. Automatically update comment count on the post item in feed
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === targetPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        )
      );
    } catch (error) {
      console.log('[Comments] Failed to post comment to backend, using optimistic update');
      const fallbackComment = {
        id: `c_${Date.now()}`,
        user_name: 'Pengguna Muslim',
        content: textToSend,
        created_at: 'Baru saja',
      };
      setCommentsList((prev) => [...prev, fallbackComment]);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === targetPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
        )
      );
    }
  };

  if (selectedUserId) {
    return <UserProfileScreen userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Muslim Feed</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={guardAction(
            () => setIsModalOpen(true),
            () => setIsGuestModalOpen(true)
          )}
          activeOpacity={0.85}
        >
          <Plus color="#FFFFFF" size={20} />
          <Text style={styles.createButtonText}>Buat Post</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'feed' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'feed' && { color: colors.primary, fontWeight: 'bold' }]}>
            Semua Post
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bookmarks' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Bookmark color={activeTab === 'bookmarks' ? colors.primary : colors.textMuted} size={15} />
          <Text
            style={[
              styles.tabText,
              { marginLeft: 4, color: colors.textMuted },
              activeTab === 'bookmarks' && { color: colors.primary, fontWeight: 'bold' },
            ]}
          >
            Tersimpan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'liked' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('liked')}
        >
          <Heart
            color={activeTab === 'liked' ? colors.error : colors.textMuted}
            fill={activeTab === 'liked' ? colors.error : 'transparent'}
            size={15}
          />
          <Text
            style={[
              styles.tabText,
              { marginLeft: 4, color: colors.textMuted },
              activeTab === 'liked' && { color: colors.error, fontWeight: 'bold' },
            ]}
          >
            Disukai
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      {activeTab === 'feed' && (
        <View style={styles.filterSection}>
          {/* Search Input Box */}
          <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search color={colors.primary} size={18} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Cari kata kunci postingan atau pengarang..."
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
                sortFilter === 'terbaru' && mediaFilter === 'semua' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                setSortFilter('terbaru');
                setMediaFilter('semua');
              }}
            >
              <Zap color={sortFilter === 'terbaru' && mediaFilter === 'semua' ? '#FFFFFF' : colors.text} size={14} />
              <Text style={[styles.chipText, { color: colors.text }, sortFilter === 'terbaru' && mediaFilter === 'semua' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                ⚡ Terbaru
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                sortFilter === 'terpopuler' && mediaFilter === 'semua' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                setSortFilter('terpopuler');
                setMediaFilter('semua');
              }}
            >
              <Flame color={sortFilter === 'terpopuler' && mediaFilter === 'semua' ? '#FFFFFF' : '#EF4444'} size={14} />
              <Text style={[styles.chipText, { color: colors.text }, sortFilter === 'terpopuler' && mediaFilter === 'semua' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                🔥 Terpopuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                sortFilter === 'paling_banyak_diskusi' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                setSortFilter('paling_banyak_diskusi');
                setMediaFilter('semua');
              }}
            >
              <MessageCircle color={sortFilter === 'paling_banyak_diskusi' ? '#FFFFFF' : colors.primary} size={14} />
              <Text style={[styles.chipText, { color: colors.text }, sortFilter === 'paling_banyak_diskusi' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                💬 Banyak Diskusi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                mediaFilter === 'gambar_saja' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => {
                setMediaFilter(mediaFilter === 'gambar_saja' ? 'semua' : 'gambar_saja');
              }}
            >
              <ImageIcon color={mediaFilter === 'gambar_saja' ? '#FFFFFF' : colors.accent} size={14} />
              <Text style={[styles.chipText, { color: colors.text }, mediaFilter === 'gambar_saja' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                🖼️ Ada Gambar
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Category Filter Chips Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryFilterRow}>
            <TouchableOpacity
              style={[
                styles.catFilterChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedCategoryFilter === 'semua' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedCategoryFilter('semua')}
            >
              <Text style={[styles.catFilterText, { color: colors.text }, selectedCategoryFilter === 'semua' && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                Semua Kategori
              </Text>
            </TouchableOpacity>
            {categoriesLoading && categories.length === 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginHorizontal: 8 }} />
            ) : (
              categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catFilterChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedCategoryFilter === cat.name && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedCategoryFilter(cat.name)}
                >
                  <Text style={[styles.catFilterText, { color: colors.text }, selectedCategoryFilter === cat.name && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Feed List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          {activeTab === 'liked' ? (
            <Heart color={colors.textMuted} size={48} />
          ) : (
            <Bookmark color={colors.textMuted} size={48} />
          )}
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeTab === 'bookmarks'
              ? 'Belum Ada Post Tersimpan'
              : activeTab === 'liked'
                ? 'Belum Ada Post Disukai'
                : 'Belum Ada Postingan'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {activeTab === 'bookmarks'
              ? 'Tekan ikon bookmark pada postingan untuk menyimpannya di sini.'
              : activeTab === 'liked'
                ? 'Tekan ikon menyukai (hati) pada postingan untuk melihatnya di sini.'
                : 'Jadilah yang pertama membuat postingan hari ini!'}
          </Text>
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
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PostCard
              item={item}
              onPressAuthor={(userId) => setSelectedUserId(userId)}
              onLike={guardAction(
                () => handleToggleLike(item.id),
                () => setIsGuestModalOpen(true)
              )}
              onComment={guardAction(
                () => handleOpenComments(item),
                () => setIsGuestModalOpen(true)
              )}
              onBookmark={guardAction(
                () => handleToggleBookmark(item.id),
                () => setIsGuestModalOpen(true)
              )}
            />
          )}
        />
      )}

      {/* Modal Buat Postingan Baru */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Buat Postingan Baru</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Bagikan kalimat hikmah, quotes, atau info kajian..."
              placeholderTextColor={colors.textMuted}
              multiline
              value={newPostContent}
              onChangeText={setNewPostContent}
              autoFocus
            />

            <TextInput
              style={[styles.imageInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="URL Gambar Lampiran (Opsional)"
              placeholderTextColor={colors.textMuted}
              value={newPostImageUrl}
              onChangeText={setNewPostImageUrl}
            />

            <Text style={[styles.categorySelectLabel, { color: colors.text }]}>
              Pilih Kategori Postingan <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={styles.categoryChipsGrid}>
              {categoriesLoading && categories.length === 0 ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                categories.map((cat) => {
                  const isSelected = newPostCategory === cat.name || (!newPostCategory && categories.indexOf(cat) === 0);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.modalCategoryChip,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => setNewPostCategory(cat.name)}
                    >
                      <Tag color={isSelected ? '#FFFFFF' : colors.primary} size={12} />
                      <Text
                        style={[
                          styles.modalCategoryText,
                          { color: colors.text },
                          isSelected && { color: '#FFFFFF', fontWeight: 'bold' },
                        ]}
                      >
                        {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            <Button
              title="Kirim & Simpan Post"
              onPress={handleCreatePost}
              loading={submitting}
              style={styles.sendButton}
            />
          </View>
        </View>
      </Modal>

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
                      <Text style={[styles.commentUser, { color: colors.primary }]}>{item.user_name}</Text>
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
            />

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

            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder={replyToComment ? `Tulis balasan untuk @${replyToComment.user_name}...` : 'Tulis komentar...'}
                placeholderTextColor={colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity style={[styles.commentSendBtn, { backgroundColor: colors.primary }]} onPress={handleAddComment}>
                <Send color="#FFFFFF" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Rich Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />

      {/* Guest Guard Modal */}
      <GuestGuardModal
        visible={isGuestModalOpen}
        featureName="fitur komunitas Muslim Feed"
        onClose={() => setIsGuestModalOpen(false)}
        onNavigateRegister={() => { setIsGuestModalOpen(false); requestRegister(); }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: SPACING.md,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  },
  postCard: {
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    fontWeight: 'bold',
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  postTime: {
    fontSize: 12,
  },
  bookmarkIconBtn: {
    padding: SPACING.xs,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
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
  textInput: {
    minHeight: 120,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  imageInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  sendButton: {
    marginTop: SPACING.xs,
  },
  commentItem: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    marginBottom: SPACING.xs,
  },
  replyItem: {
    marginLeft: 18,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 0,
    marginBottom: 6,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyTag: {
    fontSize: 12,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  commentText: {
    fontSize: 14,
    marginTop: 2,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
  },
  replyButtonText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: SPACING.xs,
    marginBottom: 2,
  },
  replyBannerText: {
    fontSize: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  commentInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  commentSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  filterSection: {
    marginVertical: SPACING.xs,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
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
    fontWeight: '500',
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
  categoryFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 6,
    paddingBottom: 2,
  },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  catFilterText: {
    fontSize: 12,
  },
  categorySelectLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  modalCategoryText: {
    fontSize: 12,
  },
});
