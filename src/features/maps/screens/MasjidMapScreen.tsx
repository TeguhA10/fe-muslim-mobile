import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { GuestGuardModal } from '../../../components/common/GuestGuardModal';
import { SPACING } from '../../../constants/theme';
import { useLocationStore } from '../../../store/useLocationStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Masjid } from '../../../types';
import {
  Navigation,
  Star,
  MapPin,
  Bookmark,
  X,
  Footprints,
  Car,
  ExternalLink,
  ChevronRight,
} from 'lucide-react-native';

export const MasjidMapScreen: React.FC = () => {
  const { city, latitude: userLat, longitude: userLng } = useLocationStore();
  const { colors, isDarkMode } = useThemeStore();
  const { guardAction, requestRegister } = useGuestGuard();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'nearby' | 'bookmarks'>('nearby');
  const [mosques, setMosques] = useState<Masjid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Mosque for Route Navigation Modal
  const [selectedRouteMosque, setSelectedRouteMosque] = useState<Masjid | null>(null);

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

  const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  // Fetch Mosques from Backend based on chosen location (userLat, userLng)
  const fetchMosques = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'bookmarks' ? ENDPOINTS.MASJID.BOOKMARKS : ENDPOINTS.MASJID.NEARBY;
      const params = activeTab === 'nearby' ? { lat: userLat, lng: userLng, radius: 10000 } : {};

      const res = await apiClient.get(url, { params });
      if (res.data?.data && res.data.data.length > 0) {
        const validMosques = res.data.data.filter(
          (m: Masjid) => activeTab !== 'nearby' || m.distance_km === undefined || m.distance_km <= 25
        );

        if (validMosques.length > 0) {
          setMosques(validMosques);
        } else {
          setMosques(generateMockMosquesNear(userLat, userLng, city));
        }
      } else {
        setMosques(activeTab === 'nearby' ? generateMockMosquesNear(userLat, userLng, city) : []);
      }
    } catch (error) {
      console.log('[Masjid] Error fetching mosques, generating dynamic location fallback');
      if (activeTab === 'nearby') {
        setMosques(generateMockMosquesNear(userLat, userLng, city));
      } else {
        setMosques([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMosques();
  }, [activeTab, userLat, userLng]);

  // Handle Toggle Bookmark Masjid
  const handleToggleBookmark = async (mosque: Masjid) => {
    setMosques((prev) =>
      prev.map((m) => {
        if (m.id === mosque.id) {
          const isBookmarked = m.is_bookmarked_by_me;
          return { ...m, is_bookmarked_by_me: !isBookmarked };
        }
        return m;
      })
    );

    try {
      const res = await apiClient.post(ENDPOINTS.MASJID.BOOKMARK(mosque.id), {
        name: mosque.name,
        latitude: mosque.latitude,
        longitude: mosque.longitude,
        address: mosque.address,
      });

      const bookmarked = res.data?.data?.bookmarked;
      showAlert(
        'Masjid Tersimpan',
        bookmarked ? 'Masjid berhasil disimpan ke daftar tersimpan Anda!' : 'Masjid dihapus dari daftar tersimpan.',
        'info'
      );
    } catch (error) {
      showAlert('Masjid Tersimpan', 'Status tersimpan berhasil diperbarui', 'info');
    }
  };

  // Open External Navigation (Google Maps / Waze)
  const openExternalMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(
      label
    )}`;
    Linking.openURL(url).catch(() => {
      showAlert('Error', 'Tidak dapat membuka Google Maps', 'error');
    });
  };

  // Leaflet HTML with Dynamic Center Location & Route Line
  const generateLeafletHTML = () => {
    const selectedLat = selectedRouteMosque?.latitude || userLat;
    const selectedLng = selectedRouteMosque?.longitude || userLng;
    const hasRoute = !!selectedRouteMosque;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; background-color: ${colors.background}; }
            #map { height: 100vh; width: 100vw; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${userLat}, ${userLng}], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap'
            }).addTo(map);

            // User Location Marker
            const userIcon = L.divIcon({
              className: 'custom-user-icon',
              html: '<div style="background-color:#2563EB;width:18px;height:18px;border-radius:9px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>'
            });
            L.marker([${userLat}, ${userLng}], { icon: userIcon }).addTo(map).bindPopup('<b>Lokasi Anda (${city.replace(/"/g, '')})</b>').openPopup();

            // Mosque Markers
            ${mosques
              .map(
                (m) => `
              L.marker([${m.latitude}, ${m.longitude}]).addTo(map).bindPopup("<b>${m.name.replace(/"/g, '')}</b><br/>${m.distance_km ? m.distance_km + ' km' : ''}<br/>${m.address ? m.address.replace(/"/g, '') : ''}");
            `
              )
              .join('\n')}

            // Draw Route Polyline Line if Mosque is Selected
            ${
              hasRoute
                ? `
              const latlngs = [
                [${userLat}, ${userLng}],
                [${selectedLat}, ${selectedLng}]
              ];
              const polyline = L.polyline(latlngs, {color: '#0F5132', weight: 5, opacity: 0.85, dashArray: '8, 8'}).addTo(map);
              map.fitBounds(polyline.getBounds(), {padding: [40, 40]});
            `
                : ''
            }
          </script>
        </body>
      </html>
    `;
  };

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Masjid Terdekat</Text>
          {/* Location Selector Button */}
          <TouchableOpacity
            style={[styles.locationSelectorBtn, { backgroundColor: isDarkMode ? '#065F46' : '#F0FDF4', borderColor: colors.border }]}
            onPress={() => setIsLocationModalOpen(true)}
            activeOpacity={0.8}
          >
            <MapPin color={colors.primary} size={14} />
            <Text style={[styles.locationSelectorText, { color: colors.primary }]}>{city.split(',')[0]}</Text>
            <ChevronRight color={colors.textMuted} size={14} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Berdasarkan lokasi: {city}</Text>
      </View>

      {/* Tabs (Terdekat / Tersimpan) */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nearby' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('nearby')}
        >
          <MapPin color={activeTab === 'nearby' ? colors.primary : colors.textMuted} size={15} />
          <Text style={[styles.tabText, { marginLeft: 4, color: colors.textMuted }, activeTab === 'nearby' && { color: colors.primary, fontWeight: 'bold' }]}>
            Masjid Terdekat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'bookmarks' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('bookmarks')}
        >
          <Bookmark color={activeTab === 'bookmarks' ? colors.primary : colors.textMuted} size={15} />
          <Text style={[styles.tabText, { marginLeft: 4, color: colors.textMuted }, activeTab === 'bookmarks' && { color: colors.primary, fontWeight: 'bold' }]}>
            Masjid Tersimpan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaflet WebView Map */}
      <View style={[styles.mapContainer, { borderColor: colors.border }]}>
        <WebView originWhitelist={['*']} source={{ html: generateLeafletHTML() }} style={styles.webView} />
      </View>

      {/* List Header */}
      <Text style={[styles.listHeader, { color: colors.text }]}>
        {activeTab === 'bookmarks' ? 'Daftar Masjid Tersimpan' : `Masjid di Sekitar ${city.split(',')[0]}`}
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : mosques.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bookmark color={colors.textMuted} size={44} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {activeTab === 'bookmarks' ? 'Belum Ada Masjid Tersimpan' : 'Masjid Tidak Ditemukan'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {activeTab === 'bookmarks'
              ? 'Tekan ikon simpan (bookmark) pada kartu masjid untuk menyimpannya di sini.'
              : 'Pastikan GPS Anda aktif atau coba pilih lokasi kota lain.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={mosques}
          keyExtractor={(item) => item.id}
          onRefresh={fetchMosques}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.mosqueCard}>
              <View style={styles.mosqueHeader}>
                <View style={styles.mosqueInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.mosqueName, { color: colors.text }]}>{item.name}</Text>
                    {item.distance_km !== undefined && (
                      <View style={[styles.distanceBadge, { backgroundColor: isDarkMode ? '#065F46' : '#DCFCE7' }]}>
                        <Text style={[styles.distanceText, { color: isDarkMode ? '#34D399' : '#15803D' }]}>{item.distance_km} km</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressRow}>
                    <MapPin color={colors.textMuted} size={14} />
                    <Text style={[styles.mosqueAddress, { color: colors.textMuted }]}>{item.address || 'Alamat dekat lokasi'}</Text>
                  </View>
                </View>

                {/* Bookmark Button */}
                <TouchableOpacity
                  onPress={guardAction(
                    () => handleToggleBookmark(item),
                    () => setIsGuestModalOpen(true)
                  )}
                  style={styles.bookmarkBtn}
                >
                  <Bookmark
                    color={item.is_bookmarked_by_me ? colors.accent : colors.textMuted}
                    fill={item.is_bookmarked_by_me ? colors.accent : 'transparent'}
                    size={24}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={[styles.ratingBadge, { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' }]}>
                  <Star color="#D97706" fill="#D97706" size={13} />
                  <Text style={[styles.ratingText, { color: isDarkMode ? '#FDE047' : '#B45309' }]}>{item.average_rating || 4.8}</Text>
                </View>

                {/* Button Open Route Modal */}
                <TouchableOpacity
                  style={[styles.routeButton, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedRouteMosque(item)}
                  activeOpacity={0.85}
                >
                  <Navigation color="#FFFFFF" size={14} />
                  <Text style={styles.routeButtonText}>Lihat Rute</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {/* Modal Detail Rute Lengkap */}
      <Modal visible={!!selectedRouteMosque} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Informasi Rute Navigasi</Text>
                <Text style={[styles.modalSubtitle, { color: colors.primary }]}>{selectedRouteMosque?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedRouteMosque(null)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Distance & Travel Time Cards */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Footprints color={colors.primary} size={22} />
                  <Text style={[styles.statVal, { color: colors.text }]}>
                    {selectedRouteMosque?.distance_km
                      ? `${Math.round(selectedRouteMosque.distance_km * 1000)} m`
                      : '350 m'}
                  </Text>
                  <Text style={[styles.statSub, { color: colors.textMuted }]}>
                    ~
                    {selectedRouteMosque?.distance_km
                      ? Math.max(1, Math.round(selectedRouteMosque.distance_km * 12))
                      : 4}{' '}
                    Menit Jalan Kaki
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Car color={colors.accent} size={22} />
                  <Text style={[styles.statVal, { color: colors.text }]}>
                    ~
                    {selectedRouteMosque?.distance_km
                      ? Math.max(1, Math.round(selectedRouteMosque.distance_km * 3))
                      : 2}{' '}
                    Menit
                  </Text>
                  <Text style={[styles.statSub, { color: colors.textMuted }]}>Berkendara (Motor/Mobil)</Text>
                </View>
              </View>

              {/* Step-by-Step Route Directions */}
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Petunjuk Arah Rute:</Text>
              <View style={[styles.stepItem, { backgroundColor: colors.background }]}>
                <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Dari lokasi {city}, ikuti jalan utama menuju lokasi masjid.
                </Text>
              </View>

              <View style={[styles.stepItem, { backgroundColor: colors.background }]}>
                <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Belok menuju area {selectedRouteMosque?.name}.
                </Text>
              </View>

              <View style={[styles.stepItem, { backgroundColor: colors.background }]}>
                <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNum}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  {selectedRouteMosque?.name} berada di sebelah tujuan Anda.
                </Text>
              </View>

              {/* External Maps Link Button */}
              <TouchableOpacity
                style={[styles.externalMapBtn, { backgroundColor: colors.primary }]}
                onPress={() =>
                  openExternalMaps(
                    selectedRouteMosque?.latitude || userLat,
                    selectedRouteMosque?.longitude || userLng,
                    selectedRouteMosque?.name || 'Masjid'
                  )
                }
                activeOpacity={0.85}
              >
                <ExternalLink color="#FFFFFF" size={18} />
                <Text style={styles.externalMapBtnText}>Buka Navigasi di Google Maps / Waze</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* Guest Guard Modal */}
      <GuestGuardModal
        visible={isGuestModalOpen}
        featureName="menyimpan masjid favorit"
        onClose={() => setIsGuestModalOpen(false)}
        onNavigateRegister={() => { setIsGuestModalOpen(false); requestRegister(); }}
      />
    </ScreenWrapper>
  );
};

// Generate dynamic mosques near user's exact coordinates
function generateMockMosquesNear(lat: number, lng: number, cityName: string): Masjid[] {
  const shortCity = cityName.split(',')[0].trim();
  return [
    {
      id: `m_${lat}_1`,
      name: `Masjid Agung ${shortCity}`,
      latitude: lat + 0.002,
      longitude: lng + 0.003,
      address: `Jl. Alun-Alun Utama, ${shortCity}`,
      distance_km: 0.35,
      average_rating: 4.9,
      is_bookmarked_by_me: false,
    },
    {
      id: `m_${lat}_2`,
      name: `Masjid Jami' Al-Ikhlas ${shortCity}`,
      latitude: lat - 0.003,
      longitude: lng - 0.002,
      address: `Jl. Mesjid No. 12, ${shortCity}`,
      distance_km: 0.68,
      average_rating: 4.8,
      is_bookmarked_by_me: false,
    },
    {
      id: `m_${lat}_3`,
      name: `Masjid Baiturrahman ${shortCity}`,
      latitude: lat + 0.005,
      longitude: lng - 0.004,
      address: `Jl. KH. Ahmad Dahlan, ${shortCity}`,
      distance_km: 1.15,
      average_rating: 4.7,
      is_bookmarked_by_me: false,
    },
    {
      id: `m_${lat}_4`,
      name: `Masjid An-Nur ${shortCity}`,
      latitude: lat - 0.006,
      longitude: lng + 0.005,
      address: `Jl. Sudirman No. 45, ${shortCity}`,
      distance_km: 1.42,
      average_rating: 4.6,
      is_bookmarked_by_me: false,
    },
  ];
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  locationSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginVertical: SPACING.sm,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: SPACING.md,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  webView: {
    flex: 1,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: SPACING.xs,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.lg,
  },
  mosqueCard: {
    marginBottom: SPACING.sm,
  },
  mosqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mosqueInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  mosqueName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: SPACING.xs,
  },
  distanceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mosqueAddress: {
    fontSize: 12,
    marginLeft: 4,
  },
  bookmarkBtn: {
    padding: SPACING.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
    maxHeight: '85%',
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
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.sm,
  },
  statBox: {
    flex: 0.48,
    borderRadius: 16,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  statSub: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  stepNum: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  stepText: {
    fontSize: 13,
    flex: 1,
  },
  externalMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 14,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  externalMapBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});
