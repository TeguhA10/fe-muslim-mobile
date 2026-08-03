import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
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
import { ImageViewerModal } from '../../../components/common/ImageViewerModal';
import { PostDetailScreen } from './PostDetailScreen';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Post } from '../../../types';
import { Plus, X, Send, CornerDownRight, Search, Zap, Flame, Image as ImageIcon, MessageCircle, Tag, Bookmark, Heart, Users, Bell } from 'lucide-react-native';
import { UserProfileScreen } from '../../profile/screens/UserProfileScreen';
import { NotificationScreen } from '../../notifications/screens/NotificationScreen';
import { useCategories } from '../../../hooks/useCategories';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNotificationStore } from '../../../store/useNotificationStore';
import { NotificationService } from '../../../services/notification.service';
import { socketService } from '../../../services/socket.service';
import { formatRelativeTime } from '../../../utils/dateFormatter';

export const HomeScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, isDarkMode } = useThemeStore();
  const { guardAction, requestRegister } = useGuestGuard();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<any | null>(null);
  const [showNotificationScreen, setShowNotificationScreen] = useState<boolean>(false);
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUnreadCount();
      socketService.connect(user.id);
      NotificationService.registerPushToken();
      NotificationService.setupNotificationListeners();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('tabPress', () => {
      setSelectedPostForDetail(null);
      setSelectedUserId(null);
      setShowNotificationScreen(false);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  // Full-screen Image Viewer State
  const [imageViewerConfig, setImageViewerConfig] = useState<{
    visible: boolean;
    urls: string[];
    index: number;
  }>({
    visible: false,
    urls: [],
    index: 0,
  });

  // Categories from DB (cached in AsyncStorage)
  const { categories, loading: categoriesLoading } = useCategories();

  const [activeTab, setActiveTab] = useState<'following' | 'feed' | 'bookmarks' | 'liked'>('following');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filter States
  const [sortFilters, setSortFilters] = useState<string[]>(['terbaru']);
  const [mediaFilter, setMediaFilter] = useState<'semua' | 'gambar_saja'>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);

  // Debounce search query input (400ms delay to prevent rate limit & loading spam)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const toggleSortFilter = (filterKey: string) => {
    if (sortFilters.includes(filterKey)) {
      const updated = sortFilters.filter((s) => s !== filterKey);
      setSortFilters(updated.length > 0 ? updated : ['terbaru']);
    } else {
      setSortFilters([...sortFilters, filterKey]);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [postLinks, setPostLinks] = useState<string[]>([]);
  const [currentLinkInput, setCurrentLinkInput] = useState<string>('');
  const [newPostCategory, setNewPostCategory] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingPostBanner, setUploadingPostBanner] = useState<string | null>(null);

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

      const categoryParam = selectedCategoryFilters.length > 0 ? selectedCategoryFilters.join(',') : 'semua';
      const sortParam = sortFilters.length > 0 ? sortFilters.join(',') : 'terbaru';
      const isFollowingOnly = activeTab === 'following';

      const res = await apiClient.get(url, {
        params: {
          user_id: useAuthStore.getState().user?.id,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
          sort: sortParam,
          media: mediaFilter,
          search: debouncedSearchQuery,
          category: categoryParam,
          following: isFollowingOnly ? 'true' : 'false',
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

  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    fetchPostsData(0, true);
  }, [activeTab, sortFilters, mediaFilter, debouncedSearchQuery, selectedCategoryFilters]);

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

  const handleAddLink = () => {
    if (postLinks.length >= 4) {
      showAlert('Perhatian', 'Maksimal 4 tautan link per postingan.', 'warning');
      return;
    }
    if (!currentLinkInput.trim()) return;

    try {
      new URL(currentLinkInput.trim());
    } catch (_) {
      showAlert('Format Salah', 'Tautan harus diawali dengan http:// atau https://', 'warning');
      return;
    }

    if (!postLinks.includes(currentLinkInput.trim())) {
      setPostLinks([...postLinks, currentLinkInput.trim()]);
      setCurrentLinkInput('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setPostLinks(postLinks.filter((_, i) => i !== index));
  };

  const handleLinkSubmit = () => {
    if (currentLinkInput.trim()) {
      setPostLinks([...postLinks, currentLinkInput.trim()]);
      setCurrentLinkInput('');
    }
  };

  const handlePickImages = async () => {
    if (selectedImages.length >= 4) {
      showAlert('Perhatian', 'Maksimal 4 gambar yang dapat dipilih.', 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 4 - selectedImages.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = [...selectedImages, ...result.assets].slice(0, 4);
      setSelectedImages(newImages);
    }
  };

  // Handle Create Post (Background Process / Non-blocking UX)
  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showAlert('Perhatian', 'Isi postingan tidak boleh kosong', 'warning');
      return;
    }

    if (!newPostCategory) {
      showAlert('Perhatian', 'Kategori postingan wajib dipilih!', 'warning');
      return;
    }

    // Capture values to upload
    const contentToUpload = newPostContent.trim();
    const categoryToUpload = newPostCategory;
    const linksToUpload = [...postLinks];
    const imagesToUpload = [...selectedImages];

    // Immediately close modal & reset form inputs for instant non-blocking UX
    setIsModalOpen(false);
    setNewPostContent('');
    setSelectedImages([]);
    setPostLinks([]);
    setCurrentLinkInput('');
    setNewPostCategory(categories[0]?.name ?? '');

    // Background Async Execution
    (async () => {
      setUploadingPostBanner('Mengirim postingan Anda...');
      try {
        const formData = new FormData();
        formData.append('content', contentToUpload);
        formData.append('category', categoryToUpload);

        if (linksToUpload.length > 0) {
          formData.append('links', JSON.stringify(linksToUpload));
        }

        imagesToUpload.forEach((img, index) => {
          const fileExt = img.uri.split('.').pop() || 'jpg';
          const fileName = `upload_${Date.now()}_${index}.${fileExt}`;
          formData.append('images', {
            uri: img.uri,
            name: fileName,
            type: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
          } as any);
        });

        const res = await apiClient.post(ENDPOINTS.POSTS.CREATE, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        });

        if (res.data?.data) {
          setPosts((prev) => [res.data.data, ...prev]);
        } else {
          fetchPostsData(0, true);
        }

        showAlert('Berhasil', 'Postingan Anda berhasil dipublikasikan!', 'success');
      } catch (error: any) {
        console.error('[CreatePost Background] Error:', error?.response?.data || error?.message || error);
        const errMsg = error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat mempublikasikan postingan';
        showAlert('Gagal', errMsg, 'error');
      } finally {
        setUploadingPostBanner(null);
      }
    })();
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

  // Open Comments (Navigate directly to Detail Feed)
  const handleOpenComments = (post: Post) => {
    setSelectedPostForDetail(post);
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

  if (showNotificationScreen) {
    return (
      <NotificationScreen
        onBack={() => setShowNotificationScreen(false)}
        onSelectNotification={async (item) => {
          setShowNotificationScreen(false);
          if (item.entity_type === 'POST' && item.entity_id) {
            try {
              const res = await apiClient.get(ENDPOINTS.POSTS.FEED + `?id=${item.entity_id}`);
              const fetchedPost = res.data?.data?.[0];
              if (fetchedPost) {
                setSelectedPostForDetail(fetchedPost);
              }
            } catch {}
          } else if (item.entity_type === 'USER' && item.entity_id) {
            setSelectedUserId(item.entity_id);
          }
        }}
      />
    );
  }

  if (selectedUserId) {
    return <UserProfileScreen userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  if (selectedPostForDetail) {
    return (
      <>
        <PostDetailScreen
          post={selectedPostForDetail}
          onBack={() => setSelectedPostForDetail(null)}
          onPressAuthor={(userId) => {
            guardAction(
              () => {
                setSelectedPostForDetail(null);
                setSelectedUserId(userId);
              },
              () => setIsGuestModalOpen(true)
            )();
          }}
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

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Muslim Feed</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
            onPress={guardAction(
              () => setShowNotificationScreen(true),
              () => setIsGuestModalOpen(true)
            )}
            activeOpacity={0.8}
          >
            <Bell size={20} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

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
      </View>

      {/* Navigation Tabs (Horizontal Scrollable) */}
      <View style={[styles.tabContainerWrapper, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'following' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('following')}
          >
            <Users color={activeTab === 'following' ? colors.primary : colors.textMuted} size={15} />
            <Text
              style={[
                styles.tabText,
                { marginLeft: 4, color: colors.textMuted },
                activeTab === 'following' && { color: colors.primary, fontWeight: 'bold' },
              ]}
            >
              Mengikuti
            </Text>
          </TouchableOpacity>

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
              Suka
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Background Uploading Progress Banner */}
      {uploadingPostBanner && (
        <View
          style={[
            styles.uploadingBanner,
            {
              backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
              borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
            },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.uploadingBannerText, { color: colors.primary }]}>{uploadingPostBanner}</Text>
        </View>
      )}

      {/* Search & Filter Bar */}
      {(activeTab === 'feed' || activeTab === 'following') && (
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

          {/* Category Filter Chips Row (Multi-select) */}
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
          ) : activeTab === 'following' ? (
            <Users color={colors.textMuted} size={48} />
          ) : (
            <Bookmark color={colors.textMuted} size={48} />
          )}
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeTab === 'following'
              ? 'Belum Ada Post dari Akun Diikuti'
              : activeTab === 'bookmarks'
                ? 'Belum Ada Post Tersimpan'
                : activeTab === 'liked'
                  ? 'Belum Ada Post Disukai'
                  : 'Belum Ada Postingan'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {activeTab === 'following'
              ? 'Ikuti pengguna lain untuk melihat postingan terbaru mereka di sini.'
              : activeTab === 'bookmarks'
                ? 'Tekan ikon bookmark pada postingan untuk menyimpannya di sini.'
                : activeTab === 'liked'
                  ? 'Tekan ikon menyukai (hati) pada postingan untuk melihatnya di sini.'
                  : 'Jadilah yang pertama membuat postingan hari ini!'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
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
              onPressAuthor={(userId) =>
                guardAction(
                  () => setSelectedUserId(userId),
                  () => setIsGuestModalOpen(true)
                )()
              }
              onPressPost={(postItem) => setSelectedPostForDetail(postItem)}
              onPressImage={(urls, index) =>
                setImageViewerConfig({ visible: true, urls, index })
              }
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

            {/* Image Uploader & Links */}
            <View style={styles.mediaUploadContainer}>
              <TouchableOpacity style={[styles.imageUploadBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={handlePickImages}>
                <ImageIcon color={colors.primary} size={20} />
                <Text style={[styles.imageUploadText, { color: colors.primary }]}>Tambah Gambar (Max 4)</Text>
              </TouchableOpacity>

              {selectedImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
                  {selectedImages.map((img, idx) => (
                    <View key={idx} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                      <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}>
                        <X color="white" size={14} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={[styles.linkInputRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.linkInput, { color: colors.text }]}
                  placeholder="Tambahkan URL Tautan..."
                  placeholderTextColor={colors.textMuted}
                  value={currentLinkInput}
                  onChangeText={setCurrentLinkInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={[styles.linkAddBtn, { backgroundColor: colors.primary }]} onPress={handleAddLink}>
                  <Text style={styles.linkAddText}>Tambah</Text>
                </TouchableOpacity>
              </View>

              {postLinks.length > 0 && (
                <View style={styles.linkListContainer}>
                  {postLinks.map((link, idx) => (
                    <View key={idx} style={[styles.linkBadge, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                      <Text style={[styles.linkBadgeText, { color: colors.text }]} numberOfLines={1}>{link}</Text>
                      <TouchableOpacity onPress={() => setPostLinks(postLinks.filter((_, i) => i !== idx))}>
                        <X color={colors.error} size={14} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

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

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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

      {/* Full-screen Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerConfig.visible}
        imageUrls={imageViewerConfig.urls}
        initialIndex={imageViewerConfig.index}
        onClose={() => setImageViewerConfig((prev) => ({ ...prev, visible: false }))}
      />

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
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
  tabContainerWrapper: {
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.md,
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
  mediaUploadContainer: {
    marginBottom: SPACING.md,
  },
  imageUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  imageUploadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  imagePreviewScroll: {
    marginVertical: SPACING.xs,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    height: 42,
    marginTop: 6,
  },
  linkInput: {
    flex: 1,
    fontSize: 13,
  },
  linkAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  linkListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  linkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '100%',
    gap: 6,
  },
  linkBadgeText: {
    fontSize: 12,
    maxWidth: 200,
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  uploadingBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

