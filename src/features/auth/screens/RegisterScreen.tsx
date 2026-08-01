import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { Lock, Mail, User as UserIcon, Sparkles, ArrowLeft } from 'lucide-react-native';

interface RegisterScreenProps {
  onNavigateLogin: () => void;
  onNavigateVerifyOtp: (email: string, otpExpiresAt?: string | null) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateLogin, onNavigateVerifyOtp }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      showAlert('Perhatian', 'Semua kolom pendaftaran wajib diisi', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Perhatian', 'Konfirmasi kata sandi tidak cocok', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data?.data?.requires_otp) {
        const otpExpiresAt = res.data?.data?.otp_expires_at || null;
        showAlert('OTP Terkirim', 'Registrasi berhasil! Membuka layar verifikasi kode OTP 6 digit...', 'success');
        setTimeout(() => {
          onNavigateVerifyOtp(email.trim(), otpExpiresAt);
        }, 1200);
      } else if (res.data?.data?.user && res.data?.data?.accessToken) {
        const { user, accessToken, refreshToken } = res.data.data;
        login(user, accessToken, refreshToken);
      } else {
        onNavigateVerifyOtp(email.trim(), null);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Gagal mendaftar. Email mungkin sudah terdaftar.';
      showAlert('Gagal Pendaftaran', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={isDarkMode ? '#0F172A' : '#0B3B24'} barStyle="light-content" style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Back Navigation */}
        <TouchableOpacity style={styles.backBtn} onPress={onNavigateLogin} activeOpacity={0.8}>
          <ArrowLeft color="#FFFFFF" size={24} />
        </TouchableOpacity>

        {/* App Logo & Header */}
        <View style={styles.logoHeader}>
          <View style={[styles.logoContainer, { backgroundColor: colors.accent }]}>
            <Sparkles color="#FFFFFF" size={40} />
          </View>
          <Text style={styles.appName}>Buat Akun Baru</Text>
          <Text style={styles.appTagline}>Bergabung bersama Komunitas Muslim App</Text>
        </View>

        {/* Register Form Card */}
        <Card style={styles.formCard}>
          <Input
            label="Nama Lengkap"
            placeholder="Ahmad Hidayat"
            value={name}
            onChangeText={setName}
            icon={<UserIcon color={colors.textMuted} size={20} />}
          />

          <Input
            label="Alamat Email"
            placeholder="nama@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon={<Mail color={colors.textMuted} size={20} />}
          />

          <Input
            label="Kata Sandi"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock color={colors.textMuted} size={20} />}
          />

          <Input
            label="Konfirmasi Kata Sandi"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            icon={<Lock color={colors.textMuted} size={20} />}
          />

          <Button
            title="Daftar Akun (Register)"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
          />
        </Card>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          <TouchableOpacity onPress={onNavigateLogin}>
            <Text style={[styles.loginLink, { color: colors.accent }]}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 2,
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 24,
  },
  submitBtn: {
    marginTop: SPACING.md,
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
  loginLink: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});
