import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_STORAGE_KEY = 'user_saved_location_v1';

export interface CityOption {
  id?: string;
  name: string;
  province: string;
  lat: number;
  lng: number;
}

interface LocationStoreState {
  isGps: boolean;
  city: string;
  latitude: number;
  longitude: number;
  setGpsLocation: (lat: number, lng: number, cityName: string) => void;
  setManualCity: (city: CityOption) => void;
  loadSavedLocation: () => Promise<void>;
}

const DEFAULT_LOCATION = {
  isGps: true,
  city: 'Jakarta Selatan, DKI Jakarta',
  latitude: -6.200000,
  longitude: 106.816666,
};

export const useLocationStore = create<LocationStoreState>((set) => ({
  ...DEFAULT_LOCATION,

  setGpsLocation: (lat, lng, cityName) => {
    const newState = {
      isGps: true,
      latitude: lat,
      longitude: lng,
      city: cityName,
    };
    set(newState);
    AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
  },

  setManualCity: (cityOption) => {
    const newState = {
      isGps: false,
      latitude: cityOption.lat,
      longitude: cityOption.lng,
      city: `${cityOption.name}, ${cityOption.province}`,
    };
    set(newState);
    AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newState)).catch(() => {});
  },

  loadSavedLocation: async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.city && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
          set({
            isGps: parsed.isGps ?? false,
            city: parsed.city,
            latitude: parsed.latitude,
            longitude: parsed.longitude,
          });
        }
      }
    } catch {}
  },
}));

// Auto-load location on initial script import
useLocationStore.getState().loadSavedLocation();
