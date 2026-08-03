import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { BatteryCharging, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface BackgroundPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BackgroundPermissionModal: React.FC<BackgroundPermissionModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const handleOpenBatterySettings = async () => {
    try {
      if (Platform.OS === 'android') {
        // Open App Info / Settings directly
        await Linking.openSettings();
      } else {
        await Linking.openSettings();
      }
    } catch (e) {
      console.log('[BackgroundPermission] Error opening settings:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.iconCircle}>
            <BatteryCharging size={32} color="#166534" />
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
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  guideBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
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
