import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { ImageViewerModal } from '../../../components/common/ImageViewerModal';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Post } from '../../../types';
import {
  ArrowLeft,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { formatRelativeTime } from '../../../utils/dateFormatter';

interface TrashPostsScreenProps {
  onBack: () => void;
  onPostRestored?: () => void;
}

export const TrashPostsScreen: React.FC<TrashPostsScreenProps> = ({
  onBack,
  onPostRestored,
}) => {
  const { isDarkMode, colors } = useThemeStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [trashPosts, setTrashPosts] = useState<Post[]>([]);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // ImageViewer state
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [isViewerVisible, setIsViewerVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchTrashPosts();
  }, []);

  const fetchTrashPosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(ENDPOINTS.POSTS.TRASH);
      const posts: Post[] = response.data?.data?.posts || [];
      setTrashPosts(posts);
    } catch {
      setTrashPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrashPosts();
  };

  const handleRestore = async (postId: string) => {
    try {
      await apiClient.post(ENDPOINTS.POSTS.RESTORE(postId));
      setTrashPosts((prev) => prev.filter((p) => p.id !== postId));
      setAlertConfig({
        visible: true,
        title: 'Berhasil Dipulihkan',
        message: 'Postingan Anda telah dikembalikan ke Feed utama.',
        type: 'success',
      });
      if (onPostRestored) onPostRestored();
    } catch (error: any) {
      setAlertConfig({
        visible: true,
        title: 'Gagal Memulihkan',
        message: error?.response?.data?.message || 'Terjadi kesalahan saat memulihkan postingan.',
        type: 'error',
      });
    }
  };

  const handlePermanentDeleteConfirm = (postId: string) => {
    Alert.alert(
      'Hapus Secara Permanen?',
      'Postingan ini akan terhapus selamanya dan tidak dapat dikembalikan lagi.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Permanen',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(ENDPOINTS.POSTS.PERMANENT_DELETE(postId));
              setTrashPosts((prev) => prev.filter((p) => p.id !== postId));
              setAlertConfig({
                visible: true,
                title: 'Terhapus Permanen',
                message: 'Postingan telah dihapus secara permanen dari database.',
                type: 'success',
              });
            } catch (error: any) {
              setAlertConfig({
                visible: true,
                title: 'Gagal Menghapus',
                message: error?.response?.data?.message || 'Terjadi kesalahan saat menghapus permanen.',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  const renderTrashItem = ({ item }: { item: Post }) => {
    const images = (item.media_urls || []).filter(
      (m: any) => (m.media_type || m.type) === 'IMAGE'
    );
    if (images.length === 0 && item.image_url) {
      images.push({ url: item.image_url } as any);
    }

    return (
      <Card style={[styles.cardItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.authorInfo}>
            {item.author_avatar ? (
              <Image source={{ uri: item.author_avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                  {item.author_name ? item.author_name.charAt(0).toUpperCase() : '🕌'}
                </Text>
              </View>
            )}
            <View>
              <Text style={[styles.authorName, { color: colors.text }]}>{item.author_name || 'Saya'}</Text>
              <View style={styles.timeRow}>
                <Clock size={12} color={colors.textMuted} />
                <Text style={[styles.deletedTime, { color: colors.textMuted }]}>
                  Dihapus {formatRelativeTime(item.deleted_at || item.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {item.category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <Text style={[styles.postContent, { color: colors.text }]}>{item.content}</Text>

        {/* Images thumbnail */}
        {images.length > 0 && (
          <TouchableOpacity
            style={styles.imageThumbnailWrapper}
            onPress={() => {
              setViewerImages(images.map((img) => img.url));
              setViewerIndex(0);
              setIsViewerVisible(true);
            }}
          >
            <Image source={{ uri: images[0].url }} style={styles.imageThumbnail} resizeMode="cover" />
            {images.length > 1 && (
              <View style={styles.multiImageCount}>
                <Text style={styles.multiImageText}>+{images.length - 1}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Card Actions */}
        <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.restoreBtn, { backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7' }]}
            onPress={() => handleRestore(item.id)}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color="#166534" />
            <Text style={[styles.restoreBtnText, { color: '#166534' }]}>Pulihkan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn, { backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2' }]}
            onPress={() => handlePermanentDeleteConfirm(item.id)}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color="#991B1B" />
            <Text style={[styles.deleteBtnText, { color: '#991B1B' }]}>Hapus Permanen</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      {/* Custom Header */}
      <View style={[styles.screenHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.screenHeaderTitle, { color: colors.text }]}>Sampah Postingan</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={trashPosts}
        keyExtractor={(item) => item.id}
        renderItem={renderTrashItem}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3', borderColor: isDarkMode ? 'rgba(234, 179, 8, 0.3)' : '#FEF08A' }]}>
            <AlertTriangle size={20} color="#D97706" />
            <Text style={[styles.infoBannerText, { color: isDarkMode ? '#FDE047' : '#854D0E' }]}>
              Postingan yang berada di Sampah akan disimpan selama <Text style={{ fontWeight: '700' }}>30 hari</Text> sebelum dihapus permanen secara otomatis oleh sistem.
            </Text>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.1)' : '#DCFCE7' }]}>
                <Sparkles size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sampah Kosong</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Tidak ada postingan yang berada di folder sampah.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && !refreshing ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      <ImageViewerModal
        visible={isViewerVisible}
        imageUrls={viewerImages}
        initialIndex={viewerIndex}
        onClose={() => setIsViewerVisible(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screenHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  cardItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deletedTime: {
    fontSize: 11,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  imageThumbnailWrapper: {
    position: 'relative',
    height: 140,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  multiImageCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  multiImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  restoreBtn: {},
  restoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {},
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
