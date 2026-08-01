import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';
import { Chrome, X, User as UserIcon } from 'lucide-react-native';

interface GoogleAccount {
  name: string;
  email: string;
}

interface GoogleLoginModalProps {
  visible: boolean;
  onSelectAccount: (account: GoogleAccount) => void;
  onCancel: () => void;
}

const MOCK_GOOGLE_ACCOUNTS: GoogleAccount[] = [
  { name: 'Ahmad Hidayat', email: 'ahmad.hidayat@gmail.com' },
  { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@gmail.com' },
];

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  visible,
  onSelectAccount,
  onCancel,
}) => {
  const { colors } = useThemeStore();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Chrome color="#EA4335" size={24} />
              <Text style={[styles.title, { color: colors.text }]}>Pilih Akun Google</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.8}>
              <X color={colors.textMuted} size={22} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Pilih akun Google Anda untuk meanjutkan ke Muslim App
          </Text>

          {/* Account List */}
          <FlatList
            data={MOCK_GOOGLE_ACCOUNTS}
            keyExtractor={(item) => item.email}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.accountItem, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => onSelectAccount(item)}
                activeOpacity={0.85}
              >
                <View style={styles.avatarBox}>
                  <UserIcon color="#FFFFFF" size={18} />
                </View>
                <View style={styles.accountTextGroup}>
                  <Text style={[styles.accountName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.accountEmail, { color: colors.textMuted }]}>{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Cancel Button */}
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel} activeOpacity={0.8}>
            <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Batal / Tutup Popup</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  accountTextGroup: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  accountEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: SPACING.md,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
