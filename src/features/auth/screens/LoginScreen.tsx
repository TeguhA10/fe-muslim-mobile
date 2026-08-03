import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { GoogleLoginModal } from '../../../components/common/GoogleLoginModal';
import { SPACING } from '../../../constants/theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { Lock, Mail, Chrome, Sparkles } from 'lucide-react-native';

interface LoginScreenProps {
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateVerifyOtp: (email: string, otpExpiresAt?: string | null) => void;
  onContinueGuest: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onNavigateVerifyOtp,
  onContinueGuest,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailError = emailTouched && email.trim().length > 0 && !emailRegex.test(email.trim())
    ? 'Format email tidak valid (contoh: nama@email.com)'
    : '';

  const passwordError = '';
  const [loading, setLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

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

  // Real Backend API Login Execution
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Perhatian', 'Alamat email dan kata sandi wajib diisi', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data?.data?.user && res.data?.data?.accessToken) {
        const { user, accessToken, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Email atau kata sandi tidak valid.';
      if (errorMsg.includes('AKUN_BELUM_VERIFIKASI')) {
        const otpExpiresAt = error.response?.data?.error?.otp_expires_at || null;
        showAlert('Verifikasi Diperlukan', 'Akun Anda belum terverifikasi OTP. Membuka layar verifikasi...', 'info');
        setTimeout(() => {
          onNavigateVerifyOtp(email.trim(), otpExpiresAt);
        }, 1200);
      } else {
        showAlert('Gagal Masuk', errorMsg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login Account Selected
  const handleGoogleAccountSelected = (account: { name: string; email: string }) => {
    setIsGoogleModalOpen(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      login(
        { id: 'usr_google_verified', name: account.name, email: account.email },
        'jwt_google_verified_token_2026'
      );
    }, 800);
  };

  // Google Login Canceled / Closed
  const handleGoogleLoginCanceled = () => {
    setIsGoogleModalOpen(false);
    showAlert('Login Google Dibatalkan', 'Proses login Google dibatalkan karena pengguna menutup popup atau tidak memilih akun.', 'info');
  };

  return (
    <ScreenWrapper bg={isDarkMode ? '#0F172A' : '#0B3B24'} barStyle="light-content" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Logo & Header */}
        <View style={styles.logoHeader}>
          <View style={[styles.logoContainer, { backgroundColor: colors.accent }]}>
            <Sparkles color="#FFFFFF" size={40} />
          </View>
          <Text style={styles.appName}>Muslim App</Text>
          <Text style={styles.appTagline}>Pendamping Ibadah & Komunitas Harian</Text>
        </View>

        {/* Login Form Card */}
        <Card style={styles.formCard}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Masuk ke Akun</Text>

          <Input
            label="Alamat Email"
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

          <Input
            label="Kata Sandi"
            placeholder="••••••••"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setPasswordTouched(true);
            }}
            isPassword={true}
            error={passwordError}
            icon={<Lock color={colors.textMuted} size={20} />}
          />

          <TouchableOpacity onPress={onNavigateForgotPassword} style={styles.forgotPasswordRow}>
            <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>Lupa Kata Sandi?</Text>
          </TouchableOpacity>

          <Button
            title="Masuk (Login)"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          {/* <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>ATAU</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View> */}

          {/* Google Sign In Button */}
          {/* <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setIsGoogleModalOpen(true)}
            activeOpacity={0.85}
          >
            <Chrome color="#EA4335" size={20} />
            <Text style={[styles.googleBtnText, { color: colors.text }]}>Masuk dengan Google</Text>
          </TouchableOpacity> */}
        </Card>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Belum punya akun? </Text>
          <TouchableOpacity onPress={onNavigateRegister}>
            <Text style={[styles.registerLink, { color: colors.accent }]}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onContinueGuest} style={styles.guestButton}>
          <Text style={styles.guestText}>Lanjutkan sebagai Tamu (Guest)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Google Login Account Selection Modal */}
      <GoogleLoginModal
        visible={isGoogleModalOpen}
        onSelectAccount={handleGoogleAccountSelected}
        onCancel={handleGoogleLoginCanceled}
      />

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
  logoHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appTagline: {
    fontSize: 14,
    color: '#FDE047',
    marginTop: 4,
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.sm,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: SPACING.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    marginHorizontal: SPACING.sm,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: SPACING.md,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  registerLink: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  guestButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  guestText: {
    color: '#FDE047',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
