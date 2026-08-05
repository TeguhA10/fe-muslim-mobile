import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';
import { CheckCircle2, AlertCircle, Info, XCircle, Sparkles } from 'lucide-react-native';

export interface CustomAlertProps {
  visible: boolean;
  type?: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = 'success',
  title,
  message,
  confirmText = 'Mengerti',
  cancelText = 'Batal',
  onConfirm,
  onClose,
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 color={COLORS.surface} size={30} />;
      case 'warning':
        return <AlertCircle color={COLORS.surface} size={30} />;
      case 'error':
        return <XCircle color={COLORS.surface} size={30} />;
      default:
        return <Info color={COLORS.surface} size={30} />;
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case 'success':
        return COLORS.primary;
      case 'warning':
        return '#D97706';
      case 'error':
        return COLORS.error;
      default:
        return '#2563EB';
    }
  };

  const maxModalWidth = Math.min(380, screenWidth * 0.9);
  const maxModalHeight = Math.min(600, screenHeight * 0.85);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.alertCard, { width: maxModalWidth, maxHeight: maxModalHeight }]}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingBottom: 4 }}
            style={{ width: '100%' }}
          >
            {/* Top Decorative Sparkle */}
            <View style={styles.sparkleDecoration}>
              <Sparkles color={COLORS.accent} size={16} />
            </View>

            {/* Type Icon Badge */}
            <View style={[styles.iconBadge, { backgroundColor: getBadgeColor() }]}>
              {getIcon()}
            </View>

            {/* Title & Message */}
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertMessage}>{message}</Text>

            {/* Action Buttons Row */}
            {onConfirm ? (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>{cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtnHalf, { backgroundColor: getBadgeColor() }]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.confirmBtnFull, { backgroundColor: getBadgeColor() }]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
    padding: SPACING.md,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sparkleDecoration: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  iconBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    elevation: 4,
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 0.46,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtnHalf: {
    flex: 0.5,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnFull: {
    width: '100%',
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

