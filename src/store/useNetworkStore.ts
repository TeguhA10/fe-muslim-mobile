import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { PrayerBackgroundService } from '../services/prayerBackground.service';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  initNetworkListener: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,

  initNetworkListener: () => {
    // Initial fetch
    NetInfo.fetch().then((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      set({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        isOffline,
      });
    });

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      const wasOffline = get().isOffline;

      set({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        isOffline,
      });

      // If connection was restored, trigger immediate widget & prayer schedule update
      if (wasOffline && !isOffline) {
        console.log('[useNetworkStore] Internet connection restored. Refreshing app & widget...');
        PrayerBackgroundService.runCountdownCycle();
      }
    });

    return unsubscribe;
  },
}));
