import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  AppState,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Bell, MapPin, BatteryCharging, ShieldAlert, CheckCircle2, XCircle, ExternalLink } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { BackgroundPermissionService } from '../../services/backgroundPermission.service';

interface MandatoryPermissionGateModalProps {
  onPermissionGranted?: () => void;
}

export const MandatoryPermissionGateModal: React.FC<MandatoryPermissionGateModalProps> = ({
  onPermissionGranted,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const [permissionsStatus, setPermissionsStatus] = useState<{
    notification: boolean;
    location: boolean;
  }>({
    notification: false,
    location: false,
  });

  const checkPermissions = async () => {
    try {
      const { status: notifStatus } = await Notifications.getPermissionsAsync();
      const { status: locStatus } = await Location.getForegroundPermissionsAsync();

      const notifGranted = notifStatus === 'granted';
      const locGranted = locStatus === 'granted';

      setPermissionsStatus({
        notification: notifGranted,
        location: locGranted,
      });

      if (!notifGranted || !locGranted) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        if (onPermissionGranted) onPermissionGranted();
      }
    } catch (e) {
      console.log('[MandatoryPermissionGate] Error checking permissions:', e);
    }
  };

  useEffect(() => {
    // 1. Immediately request native Android system dialog popups on launch
    const triggerNativePrompts = async () => {
      try {
        await Notifications.requestPermissionsAsync();
        await Location.requestForegroundPermissionsAsync();
        if (Platform.OS === 'android') {
          await BackgroundPermissionService.requestIgnoreBatteryOptimizations();
        }
      } catch (e) {}

      await checkPermissions();
    };

    triggerNativePrompts();

    // 2. Re-check permissions automatically when returning from Android System Settings
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isVisible) return null;

  const maxModalWidth = Math.min(420, screenWidth * 0.92);
  const maxModalHeight = Math.min(680, screenHeight * 0.88);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Non-dismissable! Re-check permissions when back button is pressed
        checkPermissions();
      }}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, width: maxModalWidth, maxHeight: maxModalHeight }]}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}
            style={{ width: '100%' }}
          >
            <View style={styles.headerIconBox}>
              <ShieldAlert size={34} color="#DC2626" />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Izin Wajib Diperlukan
            </Text>

            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Untuk menggunakan Muslim App, Anda wajib memberikan akses berikut agar jadwal sholat, adzan, dan widget HP aktif sempurna.
            </Text>

            {/* Permissions Checklist Status Box */}
            <View style={[styles.statusBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
              {/* 1. Notification Permission */}
              <TouchableOpacity style={styles.statusRow} onPress={() => BackgroundPermissionService.openNotificationSettings()} activeOpacity={0.7}>
                <Bell size={18} color={permissionsStatus.notification ? '#166534' : '#DC2626'} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>Notifikasi Adzan & Sholat</Text>
                  <Text style={styles.statusDesc}>Tap untuk langsung ke Setting Notifikasi</Text>
                </View>
                {permissionsStatus.notification ? (
                  <CheckCircle2 size={20} color="#166534" />
                ) : (
                  <ExternalLink size={18} color="#DC2626" />
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 2. Location Permission */}
              <TouchableOpacity style={styles.statusRow} onPress={() => BackgroundPermissionService.openAppSettings()} activeOpacity={0.7}>
                <MapPin size={18} color={permissionsStatus.location ? '#166534' : '#DC2626'} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>Lokasi Presisi Kota</Text>
                  <Text style={styles.statusDesc}>Tap untuk langsung ke Izin Lokasi</Text>
                </View>
                {permissionsStatus.location ? (
                  <CheckCircle2 size={20} color="#166534" />
                ) : (
                  <ExternalLink size={18} color="#DC2626" />
                )}
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* 3. Battery Optimization (Direct System Dialog Prompt) */}
              <TouchableOpacity style={styles.statusRow} onPress={() => BackgroundPermissionService.requestIgnoreBatteryOptimizations()} activeOpacity={0.7}>
                <BatteryCharging size={18} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.statusTitle, { color: colors.text }]}>Bebas Hemat Baterai (Unrestricted)</Text>
                  <Text style={styles.statusDesc}>Tap untuk munculkan dialog prompt "IZINKAN"</Text>
                </View>
                <ExternalLink size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => BackgroundPermissionService.requestIgnoreBatteryOptimizations()}
              activeOpacity={0.85}
            >
              <ExternalLink size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryButtonText}>Matikan Hemat Baterai (Unrestricted)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => BackgroundPermissionService.openNotificationSettings()}
              activeOpacity={0.7}
            >
              <Text style={[styles.retryText, { color: colors.primary }]}>Buka Setting Notifikasi & App Info</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  container: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 12,
  },
  headerIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  statusBox: {
    width: '100%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  statusDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  primaryButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 6,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

