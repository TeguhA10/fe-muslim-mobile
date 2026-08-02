import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, SPACING } from '../../constants/theme';
import { useLocationStore, CityOption } from '../../store/useLocationStore';
import { LocationApiService } from '../../services/locationApi.service';
import { Navigation, MapPin, Search, X, Check, Compass } from 'lucide-react-native';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ visible, onClose }) => {
  const { isGps, city, setGpsLocation, setManualCity } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingGps, setLoadingGps] = useState<boolean>(false);
  const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

  const [citiesList, setCitiesList] = useState<CityOption[]>([]);
  const [searchResults, setSearchResults] = useState<CityOption[]>([]);

  // Fetch initial public API city list
  useEffect(() => {
    if (visible && citiesList.length === 0) {
      (async () => {
        setLoadingSearch(true);
        const data = await LocationApiService.fetchAllIndonesianCities();
        setCitiesList(data);
        setLoadingSearch(false);
      })();
    }
  }, [visible]);

  // Live search using OpenStreetMap Nominatim Public API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      const results = await LocationApiService.searchLocationPublicApi(searchQuery);
      setSearchResults(results);
      setLoadingSearch(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Fetch Real Device GPS Location
  const handleUseGps = async () => {
    try {
      setLoadingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin lokasi dibutuhkan untuk mendapatkan koordinat GPS secara otomatis.');
        setLoadingGps(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      let cityName = 'Lokasi GPS Anda';
      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (reverse.length > 0) {
          cityName = `${reverse[0].city || reverse[0].subregion}, ${reverse[0].region || reverse[0].country}`;
        }
      } catch (e) {}

      setGpsLocation(lat, lng, cityName);
      onClose();
    } catch (err) {
      Alert.alert('Gagal', 'Tidak dapat mengambil lokasi GPS saat ini.');
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSelectCity = async (c: CityOption) => {
    // If coordinates are 0, resolve via Nominatim API before setting
    if (c.lat === -6.200000 && c.lng === 106.816666 && c.name) {
      setLoadingSearch(true);
      const res = await LocationApiService.searchLocationPublicApi(c.name);
      setLoadingSearch(false);
      if (res.length > 0) {
        setManualCity(res[0]);
        onClose();
        return;
      }
    }
    setManualCity(c);
    onClose();
  };

  const displayList = searchQuery.trim() ? searchResults : citiesList;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Pilih Lokasi Public API</Text>
              <Text style={styles.modalSubtitle}>OpenStreetMap & Public Location API Indonesia</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color={COLORS.text} size={24} />
            </TouchableOpacity>
          </View>

          {/* Option 1: Automatic GPS Location Button */}
          <TouchableOpacity
            style={[styles.gpsOptionBtn, isGps && styles.gpsOptionActive]}
            onPress={handleUseGps}
            disabled={loadingGps}
            activeOpacity={0.85}
          >
            {loadingGps ? (
              <ActivityIndicator color={COLORS.surface} />
            ) : (
              <>
                <View style={styles.gpsIconContainer}>
                  <Navigation color={COLORS.surface} size={20} />
                </View>
                <View style={styles.gpsTextContainer}>
                  <Text style={styles.gpsTitle}>Gunakan Lokasi GPS Saat Ini (Otomatis)</Text>
                  <Text style={styles.gpsSubtitle}>Deteksi otomatis koordinat via GPS HP</Text>
                </View>
                {isGps && <Check color={COLORS.surface} size={20} />}
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>CARI LOKASI VIA PUBLIC API INDONESIA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Search Input */}
          <View style={styles.searchWrapper}>
            <Search color={COLORS.textMuted} size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari lokasi/kota (misal: Tebet, Bandung, Medan...)"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {loadingSearch && <ActivityIndicator color={COLORS.primary} size="small" />}
          </View>

          {/* Dynamic Public API City List */}
          {loadingSearch && displayList.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Mencari lokasi di API Public Indonesia...</Text>
            </View>
          ) : (
            <FlatList
              data={displayList}
              keyExtractor={(item, index) => `${item.name}_${index}`}
              style={styles.cityList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = !isGps && city.includes(item.name);
                return (
                  <TouchableOpacity
                    style={[styles.cityItem, isSelected && styles.cityItemActive]}
                    onPress={() => handleSelectCity(item)}
                  >
                    <View style={styles.cityLeft}>
                      <Compass color={isSelected ? COLORS.primary : COLORS.textMuted} size={18} />
                      <View style={styles.cityTextContainer}>
                        <Text style={[styles.cityName, isSelected && styles.cityNameActive]}>
                          {item.name}
                        </Text>
                        <Text style={styles.provinceName}>{item.province || 'Indonesia'}</Text>
                      </View>
                    </View>
                    {isSelected && <Check color={COLORS.primary} size={18} />}
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
  modalContent: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gpsOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    padding: SPACING.md,
    borderRadius: 16,
    marginBottom: SPACING.sm,
  },
  gpsOptionActive: {
    backgroundColor: COLORS.primary,
  },
  gpsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  gpsTextContainer: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  gpsSubtitle: {
    fontSize: 11,
    color: COLORS.accentLight,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginHorizontal: SPACING.xs,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.xs,
  },
  loadingBox: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  cityList: {
    maxHeight: 280,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cityItemActive: {
    backgroundColor: '#F0FDF4',
  },
  cityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityTextContainer: {
    marginLeft: SPACING.sm,
  },
  cityName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  cityNameActive: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  provinceName: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
