import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { SPACING } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react-native';

interface VerifyOtpScreenProps {
  email: string;
  otpExpiresAt?: string | null;
  onNavigateLogin: () => void;
}

export const VerifyOtpScreen: React.FC<VerifyOtpScreenProps> = ({ email, otpExpiresAt = null, onNavigateLogin }) => {
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

  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const { login } = useAuthStore();
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
    if (!otpExpiresAt) {
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
  }, [otpExpiresAt]);

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

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      showAlert('Perhatian', 'Masukkan 6 digit kode OTP verifikasi', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, {
        email,
        code: otpCode.trim(),
      });

      if (res.data?.data?.user && res.data?.data?.accessToken) {
        const { user, accessToken, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
      } else {
        showAlert('Verifikasi Berhasil', 'Akun Anda telah aktif. Silakan masuk.', 'success');
        onNavigateLogin();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Kode OTP 6 digit tidak valid atau telah kadaluwarsa.';
      showAlert('Gagal Verifikasi', errorMsg, 'error');
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
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <ShieldCheck color="#FFFFFF" size={40} />
          </View>
          <Text style={styles.appName}>Verifikasi Kode OTP</Text>
          <Text style={styles.appTagline}>Email: {email}</Text>
          <Text style={styles.otpMeta}>
            {otpExpiresAt
              ? remainingSeconds === 0
                ? `OTP sudah kedaluwarsa (berlaku sampai ${formatTime(otpExpiresAt)})`
                : `OTP berlaku sampai ${formatTime(otpExpiresAt)} (sisa ${formatCountdown(remainingSeconds ?? 0)})`
              : 'OTP berlaku 10 menit sejak dikirim'}
          </Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={[styles.instructionText, { color: colors.text }]}>
            Periksa pesan/konsol email Anda dan masukkan 6 digit kode OTP di bawah ini:
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

          <Button
            title="Verifikasi Akun & Masuk"
            onPress={handleVerifyOtp}
            loading={loading}
            style={styles.submitBtn}
          />
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
    width: 72,
    height: 72,
    borderRadius: 36,
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
  },
  otpMeta: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 24,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
