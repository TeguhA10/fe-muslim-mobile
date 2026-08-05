import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Lock, Mail, ArrowLeft, KeyRound } from 'lucide-react-native';

import { validatePasswordStrength } from '../../../utils/passwordValidator';

interface ForgotPasswordScreenProps {
  onNavigateLogin: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigateLogin }) => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        onNavigateLogin();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [onNavigateLogin])
  );

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError = emailTouched && email.trim().length > 0 && !emailRegex.test(email.trim())
    ? 'Format email tidak valid (contoh: nama@email.com)'
    : '';

  const passValidation = newPasswordTouched && newPassword.length > 0 ? validatePasswordStrength(newPassword) : { valid: true, message: '' };
  const newPasswordError = !passValidation.valid ? passValidation.message : '';
  const [loading, setLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const { colors, isDarkMode } = useThemeStore();

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'info' | 'error' = 'warning') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  useEffect(() => {
    if (!otpExpiresAt || step !== 2) {
      setRemainingSeconds(null);
      return;
    }

    const targetMs = new Date(otpExpiresAt).getTime();
    if (Number.isNaN(targetMs)) {
      setRemainingSeconds(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [otpExpiresAt, step]);

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const formatTime = (iso: string) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Step 1: Send Forgot Password OTP
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      showAlert('Perhatian', 'Masukkan alamat email Anda', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: email.trim() });
      showAlert('OTP Terkirim', res.data?.message || 'Kode OTP reset kata sandi telah dikirim ke email Anda.', 'success');
      setOtpExpiresAt(res.data?.data?.otp_expires_at || null);
      setStep(2);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Email tidak ditemukan di sistem.';
      showAlert('Gagal Kirim OTP', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password using OTP
  const handleResetPassword = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      showAlert('Perhatian', 'Masukkan 6 digit kode OTP verifikasi', 'warning');
      return;
    }

    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.valid) {
      showAlert('Kata Sandi Lemah', passCheck.message, 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: email.trim(),
        code: otpCode.trim(),
        new_password: newPassword.trim(),
      });

      showAlert('Sukses', res.data?.message || 'Kata sandi berhasil diperbarui. Silakan masuk.', 'success');
      setTimeout(() => {
        onNavigateLogin();
      }, 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Kode OTP tidak valid atau kadaluwarsa.';
      showAlert('Gagal Reset Kata Sandi', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={isDarkMode ? '#0F172A' : '#0B3B24'} barStyle="light-content" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={onNavigateLogin} activeOpacity={0.8}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>

        <View style={styles.logoHeader}>
          <View style={[styles.logoContainer, { backgroundColor: colors.accent }]}>
            <KeyRound color="#FFFFFF" size={36} />
          </View>
          <Text style={styles.appName}>Lupa Kata Sandi</Text>
          <Text style={styles.appTagline}>
            {step === 1 ? 'Masukkan email terdaftar untuk menerima OTP' : `Masukkan OTP & kata sandi baru untuk: ${email}`}
          </Text>
        </View>

        <Card style={styles.formCard}>
          {step === 1 ? (
            <>
              <Input
                label="Alamat Email Terdaftar"
                placeholder="nama@email.com"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  setEmailTouched(true);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
                icon={<Mail color={colors.textMuted} size={20} />}
              />

              <Button
                title="Kirim Kode OTP Reset"
                onPress={handleRequestOtp}
                loading={loading}
                style={styles.submitBtn}
              />
            </>
          ) : (
            <>
              <Text style={[styles.otpMeta, { color: colors.textMuted }]}>
                {otpExpiresAt
                  ? remainingSeconds === 0
                    ? `OTP sudah kedaluwarsa (berlaku sampai ${formatTime(otpExpiresAt)})`
                    : `OTP berlaku sampai ${formatTime(otpExpiresAt)} (sisa ${formatCountdown(remainingSeconds ?? 0)})`
                  : 'OTP berlaku 10 menit sejak dikirim'}
              </Text>

              <Input
                label="Kode OTP (6 Digit)"
                placeholder="123456"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={6}
                icon={<Mail color={colors.textMuted} size={20} />}
              />

              <Input
                label="Kata Sandi Baru"
                placeholder="••••••••"
                value={newPassword}
                onChangeText={(val) => {
                  setNewPassword(val);
                  setNewPasswordTouched(true);
                }}
                isPassword={true}
                error={newPasswordError}
                icon={<Lock color={colors.textMuted} size={20} />}
              />

              <Button
                title="Simpan Kata Sandi Baru"
                onPress={handleResetPassword}
                loading={loading}
                style={styles.submitBtn}
              />
            </>
          )}
        </Card>
      </ScrollView>

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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appTagline: {
    fontSize: 13,
    color: '#FDE047',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 24,
  },
  otpMeta: {
    fontSize: 12,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
