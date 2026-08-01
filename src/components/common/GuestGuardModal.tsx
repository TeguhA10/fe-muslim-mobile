import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { LogIn, UserPlus, Sparkles } from 'lucide-react-native';

interface GuestGuardModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateRegister: () => void;
  featureName?: string;
}

export const GuestGuardModal: React.FC<GuestGuardModalProps> = ({
  visible,
  onClose,
  onNavigateRegister,
  featureName = 'fitur ini',
}) => {
  const { colors, isDarkMode } = useThemeStore();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Icon */}
          <View style={[styles.iconBadge, { backgroundColor: colors.primary }]}>
            <Sparkles color="#FFFFFF" size={32} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Login Diperlukan</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Untuk menggunakan {featureName}, kamu perlu memiliki akun Muslim App terlebih dahulu.
          </Text>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              onClose();
              onNavigateRegister();
            }}
            activeOpacity={0.85}
          >
            <UserPlus color="#FFFFFF" size={18} />
            <Text style={styles.primaryBtnText}>Daftar Akun Gratis</Text>
          </TouchableOpacity>

          {/* Cancel / Stay Guest */}
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Kembali (Mode Tamu)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.sm,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
