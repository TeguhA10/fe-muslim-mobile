import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { BatteryCharging, CheckCircle2, ExternalLink } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { BackgroundPermissionService } from '../../services/backgroundPermission.service';

interface BackgroundPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BackgroundPermissionModal: React.FC<BackgroundPermissionModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const handleOpenBatterySettings = async () => {
    try {
      await BackgroundPermissionService.requestIgnoreBatteryOptimizations();
    } catch (e) {
      BackgroundPermissionService.openAppSettings();
    }
  };

  const maxModalWidth = Math.min(420, screenWidth * 0.92);
  const maxModalHeight = Math.min(650, screenHeight * 0.88);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface, width: maxModalWidth, maxHeight: maxModalHeight }]}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 8 }}
            style={{ width: '100%' }}
          >
            <View style={styles.iconCircle}>
              <BatteryCharging size={30} color="#166534" />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Izinkan Berjalan di Latar Belakang
            </Text>

            <Text style={[styles.description, { color: colors.textMuted }]}>
              Sistem HP Android (seperti Samsung, Xiaomi, Oppo, Vivo) sering kali mematikan notifikasi secara otomatis demi menghemat baterai.
            </Text>

            <View style={[styles.guideBox, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.1)' : '#DCFCE7' }]}>
              <Text style={[styles.guideTitle, { color: colors.text }]}>
                💡 Agar Countdown Tidak Freeze:
              </Text>
              <View style={styles.guideStep}>
                <CheckCircle2 size={16} color="#166534" style={{ marginTop: 2 }} />
                <Text style={[styles.guideText, { color: colors.text }]}>
                  Buka Pengaturan HP -&gt; Penghemat Baterai.
                </Text>
              </View>
              <View style={styles.guideStep}>
                <CheckCircle2 size={16} color="#166534" style={{ marginTop: 2 }} />
                <Text style={[styles.guideText, { color: colors.text }]}>
                  Pilih <Text style={{ fontWeight: 'bold' }}>Muslim App</Text> -&gt; Ubah ke <Text style={{ fontWeight: 'bold' }}>"Tidak Ada Pembatasan / Tanpa Hemat Baterai"</Text>.
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: colors.primary }]}
                onPress={handleOpenBatterySettings}
                activeOpacity={0.8}
              >
                <ExternalLink size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.settingsButtonText}>Buka Pengaturan Baterai HP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.closeButton, { borderColor: colors.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeButtonText, { color: colors.text }]}>Mengerti & Lanjutkan</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 10,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  guideBox: {
    width: '100%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  guideText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  settingsButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    width: '100%',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

