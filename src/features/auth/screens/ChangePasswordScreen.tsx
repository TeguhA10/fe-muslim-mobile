import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  ArrowLeft,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Mail,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';

import { validatePasswordStrength } from '../../../utils/passwordValidator';

interface ChangePasswordScreenProps {
  onBack: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ onBack }) => {
  const { colors, isDarkMode } = useThemeStore();

  const [verifyMode, setVerifyMode] = useState<'old_password' | 'otp'>('old_password');
  const [oldPassword, setOldPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const passValidation = newPasswordTouched && newPassword.length > 0 ? validatePasswordStrength(newPassword) : { valid: true, message: '' };
  const newPasswordError = !passValidation.valid ? passValidation.message : '';

  const confirmPasswordError = confirmPasswordTouched && confirmPassword.length > 0 && confirmPassword !== newPassword
    ? 'Konfirmasi kata sandi baru tidak cocok'
    : '';

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  // Custom Alert
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'success'
  ) => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleRequestOtp = async () => {
    try {
      setSendingOtp(true);
      const res = await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD_REQUEST_OTP);
      const msg = res.data?.message || 'Kode OTP telah dikirim ke email Anda.';
      setOtpSentMessage(msg);
      showAlert('OTP Terkirim ✉️', msg, 'success');
    } catch (error: any) {
      const errMs = error.response?.data?.message || 'Gagal mengirim kode OTP.';
      showAlert('Gagal Kirim OTP', errMs, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmitChangePassword = async () => {
    if (verifyMode === 'old_password' && !oldPassword.trim()) {
      showAlert('Perhatian', 'Silakan masukkan kata sandi lama Anda.', 'warning');
      return;
    }

    if (verifyMode === 'otp' && (!otpCode.trim() || otpCode.trim().length !== 6)) {
      showAlert('Perhatian', 'Silakan masukkan 6 digit kode OTP yang dikirim ke email.', 'warning');
      return;
    }

    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.valid) {
      showAlert('Kata Sandi Lemah', passCheck.message, 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Perhatian', 'Konfirmasi kata sandi baru tidak cocok.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        old_password: verifyMode === 'old_password' ? oldPassword.trim() : undefined,
        otp_code: verifyMode === 'otp' ? otpCode.trim() : undefined,
        new_password: newPassword.trim(),
      };

      const res = await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
      const successMsg = res.data?.message || 'Kata sandi Anda telah berhasil diperbarui!';

      showAlert('Alhamdulillah! 🔒', successMsg, 'success');

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error: any) {
      const errMs = error.response?.data?.message || 'Gagal memperbarui kata sandi.';
      showAlert('Gagal Ubah Sandi', errMs, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Navigation */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ubah Kata Sandi</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Kelola & amankan kata sandi akun Anda
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Verification Method Segment Selector */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pilih Metode Verifikasi:</Text>
        <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              verifyMode === 'old_password' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setVerifyMode('old_password')}
            activeOpacity={0.8}
          >
            <KeyRound color={verifyMode === 'old_password' ? '#FFFFFF' : colors.textMuted} size={16} />
            <Text
              style={[
                styles.segmentText,
                { color: verifyMode === 'old_password' ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              Sandi Saat Ini
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, verifyMode === 'otp' && { backgroundColor: colors.primary }]}
            onPress={() => setVerifyMode('otp')}
            activeOpacity={0.8}
          >
            <Mail color={verifyMode === 'otp' ? '#FFFFFF' : colors.textMuted} size={16} />
            <Text
              style={[
                styles.segmentText,
                { color: verifyMode === 'otp' ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              Kode OTP Email
            </Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.formCard}>
          {verifyMode === 'old_password' ? (
            /* Mode 1: Input Old Password */
            <View style={styles.fieldWrapper}>
              <Text style={[styles.label, { color: colors.text }]}>Kata Sandi Lama</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Lock color={colors.textMuted} size={18} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Masukkan kata sandi lama Anda"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                  {showOldPassword ? (
                    <EyeOff color={colors.textMuted} size={18} />
                  ) : (
                    <Eye color={colors.textMuted} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Mode 2: Request & Input OTP */
            <View style={styles.fieldWrapper}>
              <View style={styles.otpHeaderRow}>
                <Text style={[styles.label, { color: colors.text }]}>Kode OTP (6 Digit)</Text>
                <TouchableOpacity
                  onPress={handleRequestOtp}
                  disabled={sendingOtp}
                  style={[styles.requestOtpBtn, { backgroundColor: colors.primary }]}
                >
                  {sendingOtp ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.requestOtpBtnText}>Kirim OTP ke Email</Text>
                  )}
                </TouchableOpacity>
              </View>

              {otpSentMessage && (
                <Text style={[styles.otpSentSubtext, { color: colors.primary }]}>
                  ✓ {otpSentMessage}
                </Text>
              )}

              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.background, borderColor: colors.border, marginTop: 6 },
                ]}
              >
                <Mail color={colors.textMuted} size={18} />
                <TextInput
                  style={[styles.input, { color: colors.text, letterSpacing: 4, fontWeight: 'bold' }]}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>
            </View>
          )}

          {/* New Password Input */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Kata Sandi Baru</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <KeyRound color={colors.primary} size={18} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Masukkan kata sandi baru (min 6 karakter)"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  setNewPasswordTouched(true);
                }}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                {showNewPassword ? (
                  <EyeOff color={colors.textMuted} size={18} />
                ) : (
                  <Eye color={colors.textMuted} size={18} />
                )}
              </TouchableOpacity>
            </View>
            {!!newPasswordError && (
              <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                {newPasswordError}
              </Text>
            )}
          </View>

          {/* Confirm New Password Input */}
          <View style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Kata Sandi Baru</Text>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.background, borderColor: confirmPasswordError ? colors.error : colors.border },
              ]}
            >
              <CheckCircle2
                color={
                  confirmPassword && confirmPassword === newPassword
                    ? colors.success
                    : colors.textMuted
                }
                size={18}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ulangi kata sandi baru"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  setConfirmPasswordTouched(true);
                }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff color={colors.textMuted} size={18} />
                ) : (
                  <Eye color={colors.textMuted} size={18} />
                )}
              </TouchableOpacity>
            </View>
            {!!confirmPasswordError && (
              <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                {confirmPasswordError}
              </Text>
            )}
          </View>

          {/* Guidelines Box */}
          <View
            style={[
              styles.guidelineBox,
              { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
            ]}
          >
            <ShieldCheck color={colors.primary} size={18} />
            <Text style={[styles.guidelineText, { color: colors.textMuted }]}>
              Tips Keamanan: Minimal 8 karakter dengan kombinasi huruf besar (A-Z), huruf kecil (a-z), angka (0-9), dan simbol (!@#$%^&*).
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            title="Simpan Kata Sandi Baru"
            onPress={handleSubmitChangePassword}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>
      </ScrollView>

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTitleWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 20,
    marginBottom: SPACING.xl,
  },
  fieldWrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    marginLeft: SPACING.sm,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestOtpBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  otpSentSubtext: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  guidelineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  guidelineText: {
    fontSize: 12,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: SPACING.xs,
  },
});
