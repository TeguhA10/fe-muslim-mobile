import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { ImageViewerModal } from '../../../components/common/ImageViewerModal';
import { UserListModal } from '../../../components/common/UserListModal';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
import {
  useSettingsStore,
  CALCULATION_METHODS,
  REMINDER_OFFSETS,
  CalculationMethodId,
} from '../../../store/useSettingsStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { ChangePasswordScreen } from '../../auth/screens/ChangePasswordScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { MyPostsScreen } from './MyPostsScreen';
import { UserProfileScreen } from './UserProfileScreen';
import {
  User,
  Moon,
  Sun,
  Bell,
  Settings,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Lock,
  Edit3,
  Award,
  Sparkles,
  Check,
  X,
  UserPlus,
  Clock,
  Globe,
} from 'lucide-react-native';

// Constants imported from useSettingsStore

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    created_at: string;
  };
  settings: {
    calculation_method: string;
    reminder_offset_minutes: number;
    notif_adzan_enabled: boolean;
    language: string;
  };
  stats: {
    posts_count: number;
    completed_prayers_today: number;
    saved_masjids_count: number;
    followers_count?: number;
    following_count?: number;
  };
}

export const ProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { isDarkMode, colors, toggleTheme } = useThemeStore();
  const { logout, isGuest, user: currentUser } = useAuthStore();
  const { requestRegister } = useGuestGuard();
  const {
    calculationMethod,
    reminderOffsetMinutes,
    stickyNotifEnabled,
    setCalculationMethod,
    setReminderOffsetMinutes,
    setStickyNotifEnabled,
  } = useSettingsStore();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [viewAvatarModal, setViewAvatarModal] = useState<boolean>(false);

  // UserListModal state for followers / following
  const [userListModalConfig, setUserListModalConfig] = useState<{
    visible: boolean;
    tab: 'followers' | 'following';
  }>({
    visible: false,
    tab: 'followers',
  });

  const [notifAdzan, setNotifAdzan] = useState<boolean>(true);
  const [isOffsetModalOpen, setIsOffsetModalOpen] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('KEMENAG');

  // Modals & Navigation
  const [isMethodModalOpen, setIsMethodModalOpen] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showMyPosts, setShowMyPosts] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('tabPress', () => {
      setShowMyPosts(false);
      setShowEditProfile(false);
      setShowChangePassword(false);
      setShowPrivacyPolicy(false);
      setSelectedUserId(null);
    });
    return unsubscribe;
  }, [navigation]);

  // Custom Alert Modal for Logout
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  // Fetch real profile and database stats summary
  const fetchProfileData = useCallback(async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await apiClient.get(ENDPOINTS.AUTH.PROFILE);
      if (res.data?.data) {
        const data: ProfileData = res.data.data;
        setProfileData(data);
        if (data.settings) {
          setNotifAdzan(data.settings.notif_adzan_enabled);
          setSelectedMethod(data.settings.calculation_method || 'KEMENAG');
        }
      }
    } catch (error) {
      console.log('[Profile] Error fetching profile data from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Refresh profile data automatically when user navigates back to Profile tab
  useFocusEffect(
    useCallback(() => {
      fetchProfileData(true);
    }, [fetchProfileData])
  );

  // Update User Settings in Database
  const updateSettingsInDb = async (newSettings: any) => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, newSettings);
    } catch (e) { }
  };

  const handleToggleNotif = (val: boolean) => {
    setNotifAdzan(val);
    updateSettingsInDb({ notif_adzan_enabled: val });
  };

  const handleSelectMethod = (methodId: string) => {
    setCalculationMethod(methodId as CalculationMethodId);
    setIsMethodModalOpen(false);
  };

  const handleLogoutConfirm = () => {
    setAlertConfig({
      visible: true,
      type: 'warning',
      title: 'Konfirmasi Keluar',
      message: 'Apakah Anda yakin ingin keluar dari akun ini?',
    });
  };

  // Handle Pick & Upload Avatar directly to Cloudinary (~50KB compressed)
  const handlePickAndUploadAvatar = async () => {
    try {
      const permRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permRes.granted) {
        setAlertConfig({
          visible: true,
          type: 'warning',
          title: 'Izin Ditolak',
          message: 'Aplikasi memerlukan izin galeri untuk memilih foto profil.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      setUploadingAvatar(true);

      const formData = new FormData();
      const filename = selectedAsset.uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri: selectedAsset.uri,
        name: filename,
        type,
      } as any);

      const uploadRes = await apiClient.post(ENDPOINTS.AUTH.AVATAR, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadRes.data?.data?.avatar_url) {
        const newAvatarUrl = uploadRes.data.data.avatar_url;
        setProfileData((prev) =>
          prev
            ? {
              ...prev,
              user: {
                ...prev.user,
                avatar_url: newAvatarUrl,
              },
            }
            : null
        );
        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'Alhamdulillah!',
          message: 'Foto profil baru berhasil diunggah dan disimpan ke Cloudinary (auto-compressed ~50KB)!',
        });
      }
    } catch (error: any) {
      console.log('[AvatarUpload] Error:', error?.response?.data || error?.message);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Gagal Upload',
        message: 'Terjadi kesalahan saat mengunggah foto profil ke Cloudinary.',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const executeLogout = async () => {
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (e) { }
    logout();
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formattedJoinDate = () => {
    if (!profileData?.user?.created_at) return 'Agustus 2026';
    const date = new Date(profileData.user.created_at);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  if (isGuest) {
    return (
      <ScreenWrapper style={[guestStyles.container, { backgroundColor: colors.background }]}>
        <View style={guestStyles.content}>
          <View style={[guestStyles.iconBadge, { backgroundColor: colors.primary }]}>
            <UserPlus color="#FFFFFF" size={40} />
          </View>

          <Text style={[guestStyles.title, { color: colors.text }]}>Profil Belum Tersedia</Text>
          <Text style={[guestStyles.subtitle, { color: colors.textMuted }]}>
            Anda sedang menjelajah sebagai{'\n'}
            <Text style={{ fontWeight: 'bold', color: colors.accent }}>Tamu (Guest Mode)</Text>.{'\n\n'}
            Daftar akun gratis untuk menyimpan riwayat sholat, masjid favorit, dan postingan komunitas Anda.
          </Text>

          <TouchableOpacity
            style={[guestStyles.registerBtn, { backgroundColor: colors.primary }]}
            onPress={requestRegister}
            activeOpacity={0.85}
          >
            <UserPlus color="#FFFFFF" size={20} />
            <Text style={guestStyles.registerBtnText}>Daftar Akun Gratis</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  if (selectedUserId) {
    return <UserProfileScreen userId={selectedUserId} onBack={() => setSelectedUserId(null)} />;
  }

  if (showPrivacyPolicy) {
    return <PrivacyPolicyScreen onBack={() => setShowPrivacyPolicy(false)} />;
  }

  if (showChangePassword) {
    return <ChangePasswordScreen onBack={() => setShowChangePassword(false)} />;
  }

  if (showEditProfile) {
    return (
      <EditProfileScreen
        initialData={{
          name: profileData?.user?.name || '',
          email: profileData?.user?.email || '',
          gender: (profileData?.user as any)?.gender,
          birth_date: (profileData?.user as any)?.birth_date,
          bio: (profileData?.user as any)?.bio,
        }}
        onBack={() => setShowEditProfile(false)}
        onSaved={() => fetchProfileData(true)}
      />
    );
  }

  if (showMyPosts) {
    return (
      <MyPostsScreen
        userId={profileData?.user?.id || ''}
        userName={profileData?.user?.name || ''}
        avatarUrl={profileData?.user?.avatar_url || undefined}
        bio={(profileData?.user as any)?.bio}
        onBack={() => setShowMyPosts(false)}
        onPostDeleted={() => fetchProfileData(true)}
      />
    );
  }

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && !profileData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProfileData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Hero Profile Card */}
          <Card style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  if (profileData?.user?.avatar_url) {
                    setViewAvatarModal(true);
                  }
                }}
              >
                <View style={[styles.avatarRing, { borderColor: colors.accent }]}>
                  {profileData?.user?.avatar_url ? (
                    <Image source={{ uri: profileData.user.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarBox, { backgroundColor: colors.primaryDark }]}>
                      <Text style={styles.avatarText}>{getInitials(profileData?.user?.name || 'Ahmad Hidayat')}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editAvatarBtn, { backgroundColor: colors.accent }]}
                onPress={handlePickAndUploadAvatar}
                disabled={uploadingAvatar}
                activeOpacity={0.8}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Edit3 color="#FFFFFF" size={14} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]}>{profileData?.user?.name || 'Ahmad Hidayat'}</Text>
              <Award color={colors.accent} size={18} />
            </View>

            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{profileData?.user?.email || 'ahmad@example.com'}</Text>

            {!!(profileData?.user as any)?.bio && (
              <Text style={{ fontSize: 13, color: colors.text, fontStyle: 'italic', marginTop: 4, textAlign: 'center', paddingHorizontal: 16 }}>
                "{(profileData?.user as any).bio}"
              </Text>
            )}

            {!!((profileData?.user as any)?.gender || (profileData?.user as any)?.birth_date) && (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                {(profileData?.user as any)?.gender ? `👤 ${(profileData?.user as any).gender}` : ''}
                {(profileData?.user as any)?.gender && (profileData?.user as any)?.birth_date ? ' • ' : ''}
                {(profileData?.user as any)?.birth_date ? `🎂 ${(profileData?.user as any).birth_date}` : ''}
              </Text>
            )}

            <View style={[styles.badgeTag, { backgroundColor: isDarkMode ? '#065F46' : '#D1E7DD' }]}>
              <Sparkles color={colors.primary} size={13} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>Anggota Sejak {formattedJoinDate()}</Text>
            </View>

            {/* User Achievement Stats Row from Database */}
            <View style={[styles.statsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => setShowMyPosts(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {profileData?.stats?.posts_count ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Postingan</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.statItem}
                onPress={() => setUserListModalConfig({ visible: true, tab: 'followers' })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {profileData?.stats?.followers_count ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pengikut</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.statItem}
                onPress={() => setUserListModalConfig({ visible: true, tab: 'following' })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {profileData?.stats?.following_count ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mengikuti</Text>
              </TouchableOpacity>

              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.accent }]}>
                  {profileData?.stats?.completed_prayers_today ?? 0}/5
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Sholat</Text>
              </View>
            </View>
          </Card>

          {/* Tampilan & Tema Section */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Tampilan & Tema</Text>

          <Card style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Dark Mode Switch Toggle */}
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#312E81' : '#FEF3C7' }]}>
                  {isDarkMode ? <Moon color="#818CF8" size={20} /> : <Sun color="#D97706" size={20} />}
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {isDarkMode ? 'Tema Gelap (Dark Mode)' : 'Tema Terang (Light Mode)'}
                  </Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    {isDarkMode ? 'Tampilan gelap nyaman di mata' : 'Tampilan terang alami'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </Card>

          {/* Pengaturan Ibadah & Aplikasi Section */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Pengaturan Ibadah & Aplikasi</Text>

          <Card style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Notifikasi Adzan Toggle */}
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
                  <Bell color="#166534" size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Notifikasi Adzan Otomatis</Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    Pengingat waktu 5 sholat wajib
                  </Text>
                </View>
              </View>
              <Switch
                value={notifAdzan}
                onValueChange={handleToggleNotif}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Notifikasi Menerus / Sticky Persistent Notification */}
            <View style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#EDE9FE' }]}>
                  <Bell color="#6D28D9" size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Notifikasi Menerus</Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    Infobar sholat terpajang terus (tidak bisa dihapus)
                  </Text>
                </View>
              </View>
              <Switch
                value={stickyNotifEnabled}
                onValueChange={setStickyNotifEnabled}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Waktu Pengingat Sebelum Adzan (0, 5, 10, 15 Menit) */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setIsOffsetModalOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Clock color="#D97706" size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Waktu Pengingat Sebelum Adzan</Text>
                  <Text style={[styles.menuSub, { color: colors.accent }]}>
                    {REMINDER_OFFSETS.find((r) => r.minutes === reminderOffsetMinutes)?.label}
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Metode Penghitungan Jadwal Sholat */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setIsMethodModalOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                  <Settings color="#075985" size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Metode Penghitungan Jadwal</Text>
                  <Text style={[styles.menuSub, { color: colors.accent }]}>
                    {CALCULATION_METHODS.find((m) => m.id === calculationMethod)?.name}
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Bahasa Aplikasi */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                  <Globe color="#991B1B" size={20} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>Bahasa Aplikasi</Text>
                  <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                    Indonesia (id)
                  </Text>
                </View>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>
          </Card>

          {/* Akun & Keamanan Section */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Akun & Keamanan</Text>

          <Card style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setShowEditProfile(true)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                  <User color="#6B21A8" size={20} />
                </View>
                <Text style={[styles.menuTitleOnly, { color: colors.text }]}>Edit Profil & Biodata</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => setShowChangePassword(true)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <Lock color="#B45309" size={20} />
                </View>
                <Text style={[styles.menuTitleOnly, { color: colors.text }]}>Ubah Kata Sandi</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>

            <View style={[styles.rowDivider, { backgroundColor: colors.border }]} />

            {/* Kebijakan Privasi Button */}
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => setShowPrivacyPolicy(true)}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                  <ShieldCheck color="#047857" size={20} />
                </View>
                <Text style={[styles.menuTitleOnly, { color: colors.text }]}>Kebijakan Privasi</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={18} />
            </TouchableOpacity>
          </Card>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
            onPress={handleLogoutConfirm}
            activeOpacity={0.85}
          >
            <LogOut color="#DC2626" size={20} />
            <Text style={styles.logoutBtnText}>Keluar Akun</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Modal Selection for Reminder Offset Minutes */}
      <Modal visible={isOffsetModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pilih Waktu Pengingat Adzan</Text>
              <TouchableOpacity onPress={() => setIsOffsetModalOpen(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            {REMINDER_OFFSETS.map((item) => (
              <TouchableOpacity
                key={item.minutes}
                style={[
                  styles.selectOptionItem,
                  { backgroundColor: colors.background },
                  reminderOffsetMinutes === item.minutes && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => {
                  setReminderOffsetMinutes(item.minutes);
                  setIsOffsetModalOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.selectOptionText,
                      { color: colors.text },
                      reminderOffsetMinutes === item.minutes && { color: colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.sub}</Text>
                </View>
                {reminderOffsetMinutes === item.minutes && <Check color={colors.primary} size={20} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Modal Selection for Calculation Method */}
      <Modal visible={isMethodModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Metode Penghitungan Jadwal</Text>
              <TouchableOpacity onPress={() => setIsMethodModalOpen(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CALCULATION_METHODS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedMethod;
                return (
                  <TouchableOpacity
                    style={[styles.selectOptionItem, isSelected && { backgroundColor: isDarkMode ? '#065F46' : '#F0FDF4' }]}
                    onPress={() => handleSelectMethod(item.id)}
                  >
                    <Text style={[styles.selectOptionText, { color: colors.text }, isSelected && { fontWeight: 'bold', color: colors.primary }]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check color={colors.primary} size={18} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText="Ya, Keluar"
        cancelText="Batal"
        onConfirm={executeLogout}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* UserListModal for Followers / Following */}
      {!!currentUser && (
        <UserListModal
          visible={userListModalConfig.visible}
          initialTab={userListModalConfig.tab}
          userId={currentUser.id}
          userName={profileData?.user?.name || currentUser.name}
          onClose={() => setUserListModalConfig((prev) => ({ ...prev, visible: false }))}
          onSelectUser={(selectedId) => setSelectedUserId(selectedId)}
        />
      )}

      {/* Full-Screen Avatar Image Viewer */}
      <ImageViewerModal
        visible={viewAvatarModal}
        imageUrls={profileData?.user?.avatar_url ? [profileData.user.avatar_url] : []}
        onClose={() => setViewAvatarModal(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBox: {
    width: 78,
    height: 78,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 6,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: SPACING.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  menuCard: {
    borderRadius: 20,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  menuTextGroup: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuTitleOnly: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  menuSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginHorizontal: SPACING.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
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
    maxHeight: '70%',
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
  selectOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.xs,
  },
  selectOptionText: {
    fontSize: 14,
  },
});

const guestStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    elevation: 3,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
