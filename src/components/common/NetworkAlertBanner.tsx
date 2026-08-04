import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStore } from '../../store/useNetworkStore';

export const NetworkAlertBanner: React.FC = () => {
  const { isOffline } = useNetworkStore();

  if (!isOffline) return null;

  return (
    <View style={styles.bannerContainer}>
      <WifiOff size={14} color="#78350F" style={styles.icon} />
      <Text style={styles.bannerText}>
        Mode Offline — Tidak ada koneksi internet. Aplikasi & Widget menggunakan data lokal.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 999,
  },
  icon: {
    marginRight: 6,
  },
  bannerText: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '600',
    textAlign: 'center',
  },
});
