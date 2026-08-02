import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { Heart, MessageSquare, Share2, Bookmark, Tag, Trash2 } from 'lucide-react-native';
import { Card } from './Card';
import { useThemeStore } from '../../store/useThemeStore';
import { SPACING } from '../../constants/theme';

// ─────────────────────────────────────────────
// Tipe data satu postingan — kompatibel dengan
// Post (types/index.ts) maupun UserPost di
// UserProfileScreen.
// ─────────────────────────────────────────────
export interface PostCardItem {
  id: string;
  user_id?: string;
  content: string;
  image_url?: string;
  media_urls?: Array<{ id?: string; media_type?: 'IMAGE' | 'LINK'; type?: 'IMAGE' | 'LINK'; url: string }>;
  category?: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  /** fallback: user_avatar dipakai di UserProfileScreen */
  user_avatar?: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_me?: boolean;
  is_bookmarked_by_me?: boolean;
}

export interface PostCardProps {
  item: PostCardItem;
  /** Dipanggil saat klik avatar/nama penulis — opsional */
  onPressAuthor?: (userId: string) => void;
  /** Dipanggil saat klik seluruh area postingan — opsional */
  onPressPost?: (item: PostCardItem) => void;
  /** Dipanggil saat klik gambar postingan — opsional */
  onPressImage?: (imageUrls: string[], initialIndex: number) => void;
  /** Dipanggil saat klik tombol Like */
  onLike: (postId: string) => void;
  /** Dipanggil saat klik tombol Komentar */
  onComment: (item: PostCardItem) => void;
  /** Dipanggil saat klik tombol Bookmark */
  onBookmark: (postId: string) => void;
  /** Dipanggil saat klik tombol Hapus */
  onDelete?: (postId: string) => void;
  /** Override style container card */
  style?: object;
}

import { formatRelativeTime } from '../../utils/dateFormatter';

// ─────────────────────────────────────────────
// Komponen PostCard
// ─────────────────────────────────────────────
export const PostCard: React.FC<PostCardProps> = ({
  item,
  onPressAuthor,
  onPressPost,
  onPressImage,
  onLike,
  onComment,
  onBookmark,
  onDelete,
  style,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const avatarUri = item.author_avatar || item.user_avatar;
  const authorName = item.author_name || 'Pengguna Muslim';
  const initial = authorName[0].toUpperCase();

  const handleShare = async () => {
    try {
      const postUrl = `https://muslimapp.com/post/${item.id}`;
      const shareMessage =
        `🕌 Hikmah dari ${authorName} di Muslim App:\n\n"${item.content}"` +
        (item.image_url ? `\n\n📷 Lampiran: ${item.image_url}` : '') +
        `\n\n🔗 Lihat selengkapnya: ${postUrl}`;

      await Share.share(
        { message: shareMessage, url: postUrl, title: `Postingan dari ${authorName} - Muslim App` },
        { dialogTitle: 'Bagikan Postingan ke...' }
      );
    } catch (error: any) {
      console.log('[PostCard] Share error:', error?.message);
    }
  };

  return (
    <Card style={[styles.card, style]}>
      {/* ── Header: avatar + nama + waktu + kategori + bookmark ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (avatarUri && onPressImage) {
                onPressImage([avatarUri], 0);
              } else if (item.user_id && onPressAuthor) {
                onPressAuthor(item.user_id);
              }
            }}
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
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerMeta}
            activeOpacity={0.7}
            onPress={() => item.user_id && onPressAuthor?.(item.user_id)}
            disabled={!onPressAuthor || !item.user_id}
          >
            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
              {authorName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.postTime, { color: colors.textMuted }]}>
                {formatRelativeTime(item.created_at)}
              </Text>
              {!!item.category && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: isDarkMode ? '#065F46' : '#D1E7DD' },
                  ]}
                >
                  <Tag color={colors.primary} size={10} />
                  <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>
                    {item.category}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Right: Delete & Bookmark */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={styles.bookmarkBtn}
            onPress={() => onBookmark(item.id)}
            activeOpacity={0.7}
          >
            <Bookmark
              color={item.is_bookmarked_by_me ? colors.accent : colors.textMuted}
              fill={item.is_bookmarked_by_me ? colors.accent : 'transparent'}
              size={22}
            />
          </TouchableOpacity>

          {!!onDelete && (
            <TouchableOpacity
              style={styles.bookmarkBtn}
              onPress={() => onDelete(item.id)}
              activeOpacity={0.7}
            >
              <Trash2 color="#DC2626" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Konten teks ── */}
      <TouchableOpacity
        activeOpacity={onPressPost ? 0.7 : 1}
        onPress={() => onPressPost?.(item)}
        disabled={!onPressPost}
      >
        <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>
      </TouchableOpacity>

      {/* ── Media Lampiran (Image & Link) ── */}
      {(() => {
        const images = (item.media_urls || []).filter((m) => (m.media_type || m.type) === 'IMAGE');
        const links = (item.media_urls || []).filter((m) => (m.media_type || m.type) === 'LINK');

        // Fallback for old posts with single image_url
        if (images.length === 0 && item.image_url) {
          images.push({ type: 'IMAGE', url: item.image_url } as any);
        }

        const allImageUrls = images.map((img) => img.url);

        const handleImagePress = (index: number) => {
          if (onPressImage && allImageUrls.length > 0) {
            onPressImage(allImageUrls, index);
          } else if (onPressPost) {
            onPressPost(item);
          }
        };

        return (
          <View style={styles.mediaContainer}>
            {/* Render Links */}
            {links.map((link, idx) => (
              <View key={`link-${idx}`} style={[styles.linkContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>{link.url}</Text>
              </View>
            ))}

            {/* Render Images */}
            {images.length === 1 && (
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleImagePress(0)}>
                <Image source={{ uri: images[0].url }} style={styles.imageSingle} resizeMode="cover" />
              </TouchableOpacity>
            )}
            
            {images.length === 2 && (
              <View style={styles.imageGrid2}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => handleImagePress(0)}>
                  <Image source={{ uri: images[0].url }} style={styles.imageHalf} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => handleImagePress(1)}>
                  <Image source={{ uri: images[1].url }} style={styles.imageHalf} resizeMode="cover" />
                </TouchableOpacity>
              </View>
            )}

            {images.length >= 3 && (
              <View style={styles.imageGridMulti}>
                <TouchableOpacity style={{ flex: 2 }} activeOpacity={0.9} onPress={() => handleImagePress(0)}>
                  <Image source={{ uri: images[0].url }} style={styles.imageMain} resizeMode="cover" />
                </TouchableOpacity>
                <View style={styles.imageSide}>
                  <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.9} onPress={() => handleImagePress(1)}>
                    <Image source={{ uri: images[1].url }} style={styles.imageSideItem} resizeMode="cover" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageSideItemWrapper} activeOpacity={0.9} onPress={() => handleImagePress(2)}>
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
        );
      })()}

      {/* ── Action bar: Like | Komentar | Share ── */}
      <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
        {/* Like */}
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => onLike(item.id)}
          activeOpacity={0.7}
        >
          <Heart
            color={item.is_liked_by_me ? colors.error : colors.textMuted}
            fill={item.is_liked_by_me ? colors.error : 'transparent'}
            size={20}
          />
          <Text
            style={[
              styles.actionText,
              { color: item.is_liked_by_me ? colors.error : colors.textMuted },
              item.is_liked_by_me && { fontWeight: 'bold' },
            ]}
          >
            {item.likes_count ?? 0}
          </Text>
        </TouchableOpacity>

        {/* Komentar */}
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => onComment(item)}
          activeOpacity={0.7}
        >
          <MessageSquare color={colors.textMuted} size={20} />
          <Text style={[styles.actionText, { color: colors.textMuted }]}>
            {item.comments_count ?? 0}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.actionItem} onPress={handleShare} activeOpacity={0.7}>
          <Share2 color={colors.textMuted} size={20} />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarInitial: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerMeta: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
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
    marginLeft: SPACING.xs,
  },
  // Content
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  // Media
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
    height: 220,
    borderRadius: 14,
  },
  imageGrid2: {
    flexDirection: 'row',
    gap: 4,
    height: 200,
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
    height: 240,
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
  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
  },
});
