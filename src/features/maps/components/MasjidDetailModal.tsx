import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  X,
  Star,
  Bookmark,
  Navigation,
  MapPin,
  Edit3,
  Trash2,
  Camera,
  Plus,
  CheckCircle2,
} from 'lucide-react-native';
import { GuestGuardModal } from '../../../components/common/GuestGuardModal';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Masjid, MasjidReview, MasjidReviewSummary } from '../../../types';
import { ImageViewerModal } from '../../../components/common/ImageViewerModal';

interface MasjidDetailModalProps {
  visible: boolean;
  masjid: Masjid | null;
  userLat?: number;
  userLng?: number;
  onClose: () => void;
  onBookmarkToggled?: (masjidId: string, isBookmarked: boolean, realMasjidId?: string, lat?: number, lng?: number) => void;
  onReviewUpdated?: (masjidId: string, averageRating: number, totalReviews: number, lat?: number, lng?: number) => void;
}

export const MasjidDetailModal: React.FC<MasjidDetailModalProps> = ({
  visible,
  masjid,
  userLat,
  userLng,
  onClose,
  onBookmarkToggled,
  onReviewUpdated,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const { isGuest } = useAuthStore();
  const { guardAction, requestRegister } = useGuestGuard();

  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [summary, setSummary] = useState<MasjidReviewSummary>({
    average_rating: 4.8,
    total_reviews: 0,
    star_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    my_review: null,
  });
  const [reviews, setReviews] = useState<MasjidReview[]>([]);

  // Form State for Writing / Editing Review
  const [showReviewForm, setShowReviewForm] = useState<boolean>(false);
  const [formRating, setFormRating] = useState<number>(5);
  const [formComment, setFormComment] = useState<string>('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ImageViewer state
  const [imageViewerConfig, setImageViewerConfig] = useState<{
    visible: boolean;
    images: string[];
    initialIndex: number;
  }>({
    visible: false,
    images: [],
    initialIndex: 0,
  });

  const [activeFilter, setActiveFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'photo'>('all');
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);

  const fetchFilteredReviews = useCallback(async (filterKey: string) => {
    if (!masjid) return;
    try {
      setReviewsLoading(true);
      const params: any = {};
      if (filterKey === 'photo') {
        params.has_photo = 'true';
      } else if (filterKey !== 'all') {
        params.rating = filterKey;
      }
      const res = await apiClient.get(ENDPOINTS.MASJID.REVIEWS(masjid.id), { params });
      if (res.data?.data) {
        setReviews(res.data.data);
      }
    } catch (e) {
      console.log('[MasjidDetailModal] Error filtering reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [masjid]);

  const handleSelectFilter = (filterKey: 'all' | '5' | '4' | '3' | '2' | '1' | 'photo') => {
    setActiveFilter(filterKey);
    fetchFilteredReviews(filterKey);
  };

  const onReviewUpdatedRef = useRef(onReviewUpdated);
  useEffect(() => {
    onReviewUpdatedRef.current = onReviewUpdated;
  }, [onReviewUpdated]);

  const fetchMasjidDetailsAndReviews = useCallback(async () => {
    if (!masjid) return;
    try {
      setLoading(true);
      setIsBookmarked(!!masjid.is_bookmarked_by_me);

      const [sumRes, revRes] = await Promise.all([
        apiClient.get(ENDPOINTS.MASJID.REVIEW_SUMMARY(masjid.id)).catch(() => null),
        apiClient.get(ENDPOINTS.MASJID.REVIEWS(masjid.id)).catch(() => null),
      ]);

      if (sumRes?.data?.data) {
        const sumData = sumRes.data.data;
        setSummary(sumData);
        onReviewUpdatedRef.current?.(masjid.id, sumData.average_rating, sumData.total_reviews, masjid.latitude, masjid.longitude);
        if (sumData.my_review) {
          const myRev = sumData.my_review;
          setFormRating(myRev.rating);
          setFormComment(myRev.comment || '');
          setFormPhotos(myRev.photos || []);
        }
      }

      if (revRes?.data?.data) {
        setReviews(revRes.data.data);
      }
    } catch (e) {
      console.log('[MasjidDetailModal] Error loading reviews');
    } finally {
      setLoading(false);
    }
  }, [masjid?.id]);

  const masjidId = masjid?.id;
  useEffect(() => {
    if (visible && masjidId) {
      setActiveFilter('all');
      fetchMasjidDetailsAndReviews();
    }
  }, [visible, masjidId, fetchMasjidDetailsAndReviews]);

  const handleToggleBookmark = async () => {
    if (!masjid) return;
    try {
      const nextState = !isBookmarked;
      setIsBookmarked(nextState);
      onBookmarkToggled?.(masjid.id, nextState, masjid.id, masjid.latitude, masjid.longitude);
      const res = await apiClient.post(ENDPOINTS.MASJID.BOOKMARK(masjid.id), {
        name: masjid.name,
        latitude: masjid.latitude,
        longitude: masjid.longitude,
        address: masjid.address,
      });

      const bookmarked = res.data?.data?.bookmarked;
      const realId = res.data?.data?.masjid_id;
      if (bookmarked !== undefined) {
        setIsBookmarked(bookmarked);
        onBookmarkToggled?.(masjid.id, bookmarked, realId, masjid.latitude, masjid.longitude);
      }
    } catch (e) {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleOpenNavigation = () => {
    if (!masjid) return;
    const url = Platform.select({
      ios: `maps://app?daddr=${masjid.latitude},${masjid.longitude}`,
      android: `google.navigation:q=${masjid.latitude},${masjid.longitude}`,
    }) || `https://www.google.com/maps/dir/?api=1&destination=${masjid.latitude},${masjid.longitude}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${masjid.latitude},${masjid.longitude}`);
    });
  };

  const handlePickPhoto = async () => {
    if (formPhotos.length >= 3) {
      Alert.alert('Batas Maksimal', 'Anda hanya dapat melampirkan maksimal 3 foto ulasan.');
      return;
    }
    const permRes = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permRes.granted) {
      Alert.alert('Izin Galeri', 'Aplikasi memerlukan izin galeri untuk memilih foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setFormPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!masjid) return;
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('masjid_id', masjid.id);
      formData.append('rating', formRating.toString());
      formData.append('comment', formComment);
      formData.append('name', masjid.name);
      formData.append('latitude', masjid.latitude.toString());
      formData.append('longitude', masjid.longitude.toString());
      formData.append('address', masjid.address || '');

      formPhotos.forEach((photoUri, idx) => {
        if (photoUri.startsWith('file:') || photoUri.startsWith('content:')) {
          const filename = photoUri.split('/').pop() || `photo_${idx}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          formData.append('photos', {
            uri: photoUri,
            name: filename,
            type,
          } as any);
        }
      });

      await apiClient.post(ENDPOINTS.MASJID.REVIEWS(masjid.id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowReviewForm(false);
      fetchMasjidDetailsAndReviews();
    } catch (error) {
      Alert.alert('Gagal', 'Gagal menyimpan ulasan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMyReview = async () => {
    if (!summary.my_review?.id) return;
    Alert.alert('Hapus Ulasan', 'Apakah Anda yakin ingin menghapus ulasan Anda?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(ENDPOINTS.MASJID.DELETE_REVIEW(summary.my_review!.id));
            setFormComment('');
            setFormRating(5);
            setFormPhotos([]);
            fetchMasjidDetailsAndReviews();
          } catch (e) {
            Alert.alert('Gagal', 'Gagal menghapus ulasan.');
          }
        },
      },
    ]);
  };

  if (!masjid) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          {/* Top Bar Header */}
          <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X color={colors.text} size={22} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              Detail & Ulasan Masjid
            </Text>
            <TouchableOpacity
              style={styles.bookmarkHeaderBtn}
              onPress={guardAction(handleToggleBookmark, () => setIsGuestModalOpen(true))}
            >
              <Bookmark
                color={isBookmarked ? '#EAB308' : colors.textMuted}
                fill={isBookmarked ? '#EAB308' : 'none'}
                size={22}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Mosque Hero Info Card */}
            <View style={[styles.masjidHeroCard, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.border }]}>
              <Text style={[styles.masjidName, { color: colors.text }]}>{masjid.name}</Text>
              <View style={styles.locationRow}>
                <MapPin color={colors.primary} size={16} />
                <Text style={[styles.masjidAddress, { color: colors.textMuted }]}>
                  {masjid.address || 'Alamat lokasi masjid'}
                </Text>
              </View>

              {masjid.distance_km !== undefined && (
                <Text style={[styles.distanceText, { color: colors.primary }]}>
                  📍 Jarak: {masjid.distance_km} km dari lokasi Anda
                </Text>
              )}

              <TouchableOpacity
                style={[styles.navigationBtn, { backgroundColor: colors.primary }]}
                onPress={handleOpenNavigation}
                activeOpacity={0.85}
              >
                <Navigation color="#FFFFFF" size={18} />
                <Text style={styles.navigationBtnText}>Petunjuk Arah (Maps)</Text>
              </TouchableOpacity>
            </View>

            {/* Rating Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
              <View style={styles.scoreColumn}>
                <Text style={[styles.scoreBig, { color: colors.text }]}>
                  {Number(summary.average_rating || masjid.average_rating || 4.8).toFixed(1)}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color="#F59E0B"
                      fill={Number(summary.average_rating || masjid.average_rating || 4.8) >= star ? '#F59E0B' : 'none'}
                    />
                  ))}
                </View>
                <Text style={[styles.totalReviewsText, { color: colors.textMuted }]}>
                  {summary.total_reviews} ulasan pengguna
                </Text>
              </View>

              {/* Star Distribution Progress Bars */}
              <View style={styles.distributionColumn}>
                {[5, 4, 3, 2, 1].map((starKey) => {
                  const count = summary.star_distribution[starKey as keyof typeof summary.star_distribution] || 0;
                  const percent = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0;
                  return (
                    <View key={starKey} style={styles.distRow}>
                      <Text style={[styles.distLabel, { color: colors.textMuted }]}>{starKey}★</Text>
                      <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: '#F59E0B' }]} />
                      </View>
                      <Text style={[styles.distCount, { color: colors.textMuted }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* User Review Action Button */}
            <View style={styles.reviewActionContainer}>
              <TouchableOpacity
                style={[styles.writeReviewBtn, { backgroundColor: isDarkMode ? '#065F46' : '#ECFDF5', borderColor: colors.primary }]}
                onPress={guardAction(() => setShowReviewForm(!showReviewForm), () => setIsGuestModalOpen(true))}
                activeOpacity={0.8}
              >
                <Edit3 color={colors.primary} size={18} />
                <Text style={[styles.writeReviewBtnText, { color: colors.primary }]}>
                  {summary.my_review ? 'Edit Ulasan Saya' : 'Tulis Ulasan & Rating'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Review Input Form Component */}
            {showReviewForm && (
              <View style={[styles.formContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: colors.border }]}>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  {summary.my_review ? 'Edit Ulasan Anda' : 'Beri Rating & Ulasan'}
                </Text>

                {/* Star Selector */}
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Pilih Rating Bintang:</Text>
                <View style={styles.interactiveStarsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setFormRating(star)}>
                      <Star
                        size={32}
                        color="#F59E0B"
                        fill={formRating >= star ? '#F59E0B' : 'none'}
                        style={styles.interactiveStar}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Comment Text Area */}
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Ulasan Pengalaman (Opsional):</Text>
                <TextInput
                  style={[styles.commentInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Tulis pendapat Anda tentang fasilitas, kebersihan, atau pengalaman di masjid ini..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={formComment}
                  onChangeText={setFormComment}
                />

                {/* Photo Picker */}
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Lampirkan Foto (Maks. 3 Foto):</Text>
                <View style={styles.photosPickerRow}>
                  {formPhotos.map((photoUri, idx) => (
                    <View key={idx} style={styles.photoPreviewWrapper}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                      <TouchableOpacity style={styles.removePhotoBadge} onPress={() => handleRemovePhoto(idx)}>
                        <X color="#FFFFFF" size={12} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {formPhotos.length < 3 && (
                    <TouchableOpacity
                      style={[styles.addPhotoBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                      onPress={handlePickPhoto}
                    >
                      <Camera color={colors.textMuted} size={22} />
                      <Text style={[styles.addPhotoText, { color: colors.textMuted }]}>Tambah</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Form Buttons */}
                <View style={styles.formButtonsRow}>
                  {summary.my_review && (
                    <TouchableOpacity
                      style={[styles.deleteReviewBtn, { borderColor: '#EF4444' }]}
                      onPress={handleDeleteMyReview}
                    >
                      <Trash2 color="#EF4444" size={16} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSubmitReview}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <CheckCircle2 color="#FFFFFF" size={18} />
                        <Text style={styles.submitBtnText}>Simpan Ulasan</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* List of Reviews & Filter Chips */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ulasan Pengguna ({reviews.length})</Text>

            {/* Horizontal Filter Chips Bar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsContainer}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { backgroundColor: activeFilter === 'all' ? colors.primary : colors.background, borderColor: activeFilter === 'all' ? colors.primary : colors.border },
                ]}
                onPress={() => handleSelectFilter('all')}
              >
                <Text style={[styles.filterChipText, { color: activeFilter === 'all' ? '#FFFFFF' : colors.text }]}>
                  Semua ({summary.total_reviews})
                </Text>
              </TouchableOpacity>

              {[5, 4, 3, 2, 1].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: activeFilter === s.toString() ? colors.primary : colors.background,
                      borderColor: activeFilter === s.toString() ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectFilter(s.toString() as any)}
                >
                  <Star size={12} color={activeFilter === s.toString() ? '#FFFFFF' : '#F59E0B'} fill={activeFilter === s.toString() ? '#FFFFFF' : '#F59E0B'} />
                  <Text style={[styles.filterChipText, { color: activeFilter === s.toString() ? '#FFFFFF' : colors.text, marginLeft: 4 }]}>
                    {s} ({summary.star_distribution[s as keyof typeof summary.star_distribution] || 0})
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { backgroundColor: activeFilter === 'photo' ? colors.primary : colors.background, borderColor: activeFilter === 'photo' ? colors.primary : colors.border },
                ]}
                onPress={() => handleSelectFilter('photo')}
              >
                <Camera size={13} color={activeFilter === 'photo' ? '#FFFFFF' : colors.textMuted} />
                <Text style={[styles.filterChipText, { color: activeFilter === 'photo' ? '#FFFFFF' : colors.text, marginLeft: 4 }]}>
                  Dengan Foto
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {loading || reviewsLoading ? (
              <ActivityIndicator style={{ marginVertical: SPACING.xl }} color={colors.primary} size="large" />
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsBox}>
                <Star color={colors.textMuted} size={36} />
                <Text style={[styles.emptyReviewsText, { color: colors.textMuted }]}>
                  Tidak ada ulasan yang sesuai dengan filter ini.
                </Text>
              </View>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.reviewHeader}>
                    {rev.user_avatar ? (
                      <Image source={{ uri: rev.user_avatar }} style={styles.userAvatar} />
                    ) : (
                      <View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                        <Text style={styles.userAvatarText}>{(rev.user_name || 'U')[0].toUpperCase()}</Text>
                      </View>
                    )}

                    <View style={styles.userInfoCol}>
                      <Text style={[styles.userNameText, { color: colors.text }]}>
                        {rev.user_name} {rev.is_mine && <Text style={{ color: colors.primary, fontWeight: 'normal' }}>(Saya)</Text>}
                      </Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            color="#F59E0B"
                            fill={rev.rating >= s ? '#F59E0B' : 'none'}
                          />
                        ))}
                        <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                          • {new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {rev.comment && <Text style={[styles.reviewComment, { color: colors.text }]}>{rev.comment}</Text>}

                  {/* Review Photos Gallery */}
                  {rev.photos && rev.photos.length > 0 && (
                    <View style={styles.reviewPhotosRow}>
                      {rev.photos.map((photoUrl, pIdx) => (
                        <TouchableOpacity
                          key={pIdx}
                          onPress={() =>
                            setImageViewerConfig({
                              visible: true,
                              images: rev.photos || [],
                              initialIndex: pIdx,
                            })
                          }
                        >
                          <Image source={{ uri: photoUrl }} style={styles.reviewPhotoItem} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Full screen image viewer */}
        <ImageViewerModal
          visible={imageViewerConfig.visible}
          imageUrls={imageViewerConfig.images}
          initialIndex={imageViewerConfig.initialIndex}
          onClose={() => setImageViewerConfig((prev) => ({ ...prev, visible: false }))}
        />

        {/* Guest Guard Modal */}
        <GuestGuardModal
          visible={isGuestModalOpen}
          featureName="memberikan ulasan masjid"
          onClose={() => setIsGuestModalOpen(false)}
          onNavigateRegister={() => {
            setIsGuestModalOpen(false);
            requestRegister();
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  bookmarkHeaderBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: SPACING.md,
    marginBottom: 55
  },
  masjidHeroCard: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  masjidName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  masjidAddress: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  navigationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  navigationBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  scoreColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    minWidth: 100,
  },
  scoreBig: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  totalReviewsText: {
    fontSize: 11,
    marginTop: 2,
  },
  distributionColumn: {
    flex: 1,
    paddingLeft: SPACING.md,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  distLabel: {
    fontSize: 12,
    width: 24,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  distCount: {
    fontSize: 11,
    width: 20,
    textAlign: 'right',
  },
  reviewActionContainer: {
    marginBottom: SPACING.md,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  writeReviewBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  formContainer: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  interactiveStarsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  interactiveStar: {
    marginRight: 8,
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 90,
  },
  photosPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  photoPreviewWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  photoPreview: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoBtn: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    marginTop: 2,
  },
  formButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.sm,
  },
  deleteReviewBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  emptyReviewsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyReviewsText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: SPACING.lg,
  },
  reviewCard: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfoCol: {
    marginLeft: 10,
    flex: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewDate: {
    fontSize: 11,
    marginLeft: 6,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  reviewPhotosRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  reviewPhotoItem: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 8,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
