import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { X, Search, UserCheck, UserPlus } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { apiClient } from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { useAuthStore } from '../../store/useAuthStore';

export interface UserFollowItem {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  is_following_by_me?: boolean;
}

interface UserListModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: 'followers' | 'following';
  userName?: string;
  onSelectUser?: (userId: string) => void;
}

export const UserListModal: React.FC<UserListModalProps> = ({
  visible,
  onClose,
  userId,
  initialTab = 'followers',
  userName,
  onSelectUser,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const { user: currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersList, setUsersList] = useState<UserFollowItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});

  // Pagination & Infinite Scroll States
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const PAGE_SIZE = 15;

  const fetchList = async (
    tab: 'followers' | 'following',
    pageNum = 0,
    isRefresh = false,
    query = searchQuery
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const endpoint =
        tab === 'followers'
          ? ENDPOINTS.AUTH.FOLLOWERS(userId)
          : ENDPOINTS.AUTH.FOLLOWING(userId);

      const res = await apiClient.get(endpoint, {
        params: {
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
          search: query.trim(),
        },
      });

      const newUsers: UserFollowItem[] = res.data?.data || [];

      if (isRefresh || pageNum === 0) {
        setUsersList(newUsers);
        setPage(0);
      } else {
        setUsersList((prev) => [...prev, ...newUsers]);
      }

      setHasMore(newUsers.length === PAGE_SIZE);
    } catch (error) {
      console.log('[UserListModal] Error fetching list:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && userId) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setPage(0);
      setHasMore(true);
      fetchList(initialTab, 0, true, '');
    }
  }, [visible, userId, initialTab]);

  useEffect(() => {
    if (visible && userId) {
      setPage(0);
      setHasMore(true);
      fetchList(activeTab, 0, true, searchQuery);
    }
  }, [searchQuery]);

  const flatListRef = React.useRef<FlatList>(null);

  const handleTabChange = (tab: 'followers' | 'following') => {
    setActiveTab(tab);
    setSearchQuery('');
    setPage(0);
    setHasMore(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    fetchList(tab, 0, true, '');
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchList(activeTab, nextPage, false, searchQuery);
    }
  };

  const handleRefresh = () => {
    setPage(0);
    setHasMore(true);
    fetchList(activeTab, 0, true, searchQuery);
  };

  const handleToggleFollow = async (targetUser: UserFollowItem) => {
    if (!currentUser || currentUser.id === targetUser.id) return;

    setFollowLoadingMap((prev) => ({ ...prev, [targetUser.id]: true }));

    // Optimistic UI update
    setUsersList((prev) =>
      prev.map((item) =>
        item.id === targetUser.id
          ? { ...item, is_following_by_me: !item.is_following_by_me }
          : item
      )
    );

    try {
      await apiClient.post(ENDPOINTS.AUTH.FOLLOW(targetUser.id));
    } catch (error) {
      // Revert if error
      setUsersList((prev) =>
        prev.map((item) =>
          item.id === targetUser.id
            ? { ...item, is_following_by_me: targetUser.is_following_by_me }
            : item
        )
      );
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetUser.id]: false }));
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'U';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return nameStr.substring(0, 2).toUpperCase();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {userName || 'Pengguna'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X color={colors.text} size={22} />
            </TouchableOpacity>
          </View>

          {/* Instagram-style Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'followers' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => handleTabChange('followers')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'followers' ? colors.primary : colors.textMuted },
                  activeTab === 'followers' && styles.activeTabText,
                ]}
              >
                Pengikut
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'following' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => handleTabChange('following')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'following' ? colors.primary : colors.textMuted },
                  activeTab === 'following' && styles.activeTabText,
                ]}
              >
                Mengikuti
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instagram Search Input */}
          <View style={[styles.searchWrapper, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
            <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Cari pengguna..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color={colors.textMuted} size={16} />
              </TouchableOpacity>
            )}
          </View>

          {/* Body Content */}
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : usersList.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {searchQuery
                  ? 'Pengguna tidak ditemukan'
                  : activeTab === 'followers'
                  ? 'Belum ada pengikut'
                  : 'Belum mengikuti siapapun'}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={usersList}
              keyExtractor={(item) => item.id}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() =>
                loadingMore ? (
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isMe = currentUser?.id === item.id;
                const isFollowing = !!item.is_following_by_me;
                const isActionLoading = !!followLoadingMap[item.id];

                return (
                  <TouchableOpacity
                    style={styles.userRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (!currentUser) {
                        onClose();
                        return;
                      }
                      onClose();
                      if (onSelectUser) {
                        onSelectUser(item.id);
                      }
                    }}
                  >
                    {/* User Avatar */}
                    <View style={[styles.avatarBox, { backgroundColor: colors.primaryDark }]}>
                      {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
                      )}
                    </View>

                    {/* User Name & Bio */}
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {!!item.bio && (
                        <Text style={[styles.userBio, { color: colors.textMuted }]} numberOfLines={1}>
                          {item.bio}
                        </Text>
                      )}
                    </View>

                    {/* Action Follow Button (Instagram Style) */}
                    {!isMe && (
                      <TouchableOpacity
                        style={[
                          styles.followBtn,
                          isFollowing
                            ? [styles.followingBtn, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]
                            : [styles.followActiveBtn, { backgroundColor: colors.primary }],
                        ]}
                        onPress={() => handleToggleFollow(item)}
                        disabled={isActionLoading}
                        activeOpacity={0.8}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color={isFollowing ? colors.text : '#FFFFFF'} />
                        ) : isFollowing ? (
                          <View style={styles.btnInner}>
                            <UserCheck color={colors.text} size={14} style={{ marginRight: 4 }} />
                            <Text style={[styles.followingBtnText, { color: colors.text }]}>Mengikuti</Text>
                          </View>
                        ) : (
                          <View style={styles.btnInner}>
                            <UserPlus color="#FFFFFF" size={14} style={{ marginRight: 4 }} />
                            <Text style={styles.followBtnText}>Ikuti</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userBio: {
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followActiveBtn: {
    elevation: 1,
  },
  followingBtn: {},
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
