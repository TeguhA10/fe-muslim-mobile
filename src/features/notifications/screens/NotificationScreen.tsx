import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  UserPlus,
  Bell,
  CheckCheck,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useThemeStore } from '../../../store/useThemeStore';
import { useNotificationStore, AppNotification } from '../../../store/useNotificationStore';
import { IslamicTexture } from '../../../components/layout/IslamicTexture';

interface NotificationScreenProps {
  onBack?: () => void;
  onSelectNotification?: (notification: AppNotification) => void;
}

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onBack,
  onSelectNotification,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const {
    notifications,
    isLoading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications(1, true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(1, true);
    setRefreshing(false);
  };

  const handleItemPress = (item: AppNotification) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    if (onSelectNotification) {
      onSelectNotification(item);
    }
  };

  const handleConfirmDeleteAll = () => {
    Alert.alert(
      'Hapus Semua Notifikasi',
      'Apakah Anda yakin ingin menghapus seluruh riwayat notifikasi?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: () => deleteAllNotifications(),
        },
      ]
    );
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} mnt lalu`;
      if (diffHour < 24) return `${diffHour} jam lalu`;
      if (diffDay < 7) return `${diffDay} hr lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'LIKE_POST':
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Heart size={16} color="#EF4444" fill="#EF4444" />
          </View>
        );
      case 'COMMENT_POST':
      case 'REPLY_COMMENT':
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <MessageSquare size={16} color="#3B82F6" />
          </View>
        );
      case 'FOLLOW_USER':
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <UserPlus size={16} color="#10B981" />
          </View>
        );
      case 'ADZAN_REMINDER':
      default:
        return (
          <View style={[styles.iconBadge, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
            <Bell size={16} color="#D4AF37" />
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleItemPress(item)}
        style={[
          styles.itemCard,
          {
            backgroundColor: !item.is_read
              ? isDarkMode
                ? 'rgba(22, 101, 52, 0.15)'
                : '#F0FDF4'
              : colors.surface,
            borderColor: !item.is_read
              ? isDarkMode
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(34, 197, 94, 0.2)'
              : colors.border,
          },
        ]}
      >
        <View style={styles.avatarWrapper}>
          {item.actor_avatar ? (
            <Image source={{ uri: item.actor_avatar }} style={styles.actorAvatar} />
          ) : (
            <View style={[styles.actorAvatarPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={[styles.avatarInitial, { color: colors.text }]}>
                {item.actor_name ? item.actor_name.charAt(0).toUpperCase() : '🕌'}
              </Text>
            </View>
          )}
          <View style={styles.badgeOverlay}>{renderIcon(item.type)}</View>
        </View>

        <View style={styles.itemBody}>
          <View style={styles.itemHeaderRow}>
            <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.itemTime, { color: colors.textMuted }]}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </View>

          <Text
            style={[
              styles.itemMessage,
              { color: !item.is_read ? colors.text : colors.textMuted },
            ]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        </View>

        {!item.is_read && <View style={styles.unreadDot} />}

        {/* Delete single item button */}
        <TouchableOpacity
          style={styles.deleteSingleBtn}
          onPress={() => deleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
          <Trash2 size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: statusBarHeight },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent
      />
      <IslamicTexture opacity={0.05} tint={isDarkMode ? 'gold' : 'light'} absolute />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.headerLeftGroup}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.backButton,
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
              ]}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifikasi</Text>
            {unreadCount > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerRightActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={[
                styles.readAllButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  borderColor: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                },
              ]}
              activeOpacity={0.7}
            >
              <CheckCheck size={14} color={colors.primary} />
              <Text style={[styles.readAllText, { color: colors.primary }]}>Dibaca</Text>
            </TouchableOpacity>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleConfirmDeleteAll}
              style={[
                styles.deleteAllButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                  borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                },
              ]}
              activeOpacity={0.7}
            >
              <Trash2 size={15} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.1)' : '#DCFCE7' },
                ]}
              >
                <Sparkles size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Notifikasi</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Semua aktivitas seperti sapaan, komentar, dan pengingat sholat akan muncul di sini.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading && !refreshing ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteAllButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  actorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  actorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  deleteSingleBtn: {
    padding: 4,
    marginLeft: 4,
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
