import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import { Heart, MessageSquare, Share2, Bookmark, Tag } from 'lucide-react-native';
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
  /** Dipanggil saat klik tombol Like */
  onLike: (postId: string) => void;
  /** Dipanggil saat klik tombol Komentar */
  onComment: (item: PostCardItem) => void;
  /** Dipanggil saat klik tombol Bookmark */
  onBookmark: (postId: string) => void;
  /** Override style container card */
  style?: object;
}

// ─────────────────────────────────────────────
// Helper: format tanggal ke "2 Jan, 14:05"
// ─────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
// Komponen PostCard
// ─────────────────────────────────────────────
export const PostCard: React.FC<PostCardProps> = ({
  item,
  onPressAuthor,
  onLike,
  onComment,
  onBookmark,
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
        <TouchableOpacity
          style={styles.headerLeft}
          activeOpacity={0.7}
          onPress={() => item.user_id && onPressAuthor?.(item.user_id)}
          disabled={!onPressAuthor || !item.user_id}
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

          <View style={styles.headerMeta}>
            <Text style={[styles.authorName, { color: colors.text }]} numberOfLines={1}>
              {authorName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.postTime, { color: colors.textMuted }]}>
                {formatDate(item.created_at)}
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
          </View>
        </TouchableOpacity>

        {/* Bookmark di pojok kanan atas */}
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
      </View>

      {/* ── Konten teks ── */}
      <Text style={[styles.content, { color: colors.text }]}>{item.content}</Text>

      {/* ── Gambar lampiran ── */}
      {!!item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

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
  // Image
  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
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
