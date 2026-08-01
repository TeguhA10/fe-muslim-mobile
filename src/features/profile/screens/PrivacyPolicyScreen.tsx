import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { ShieldCheck, ArrowLeft, Lock, MapPin, Eye, FileText, Mail, CheckCircle2 } from 'lucide-react-native';

interface PrivacyPolicyScreenProps {
  onBack?: () => void;
}

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  const { colors, isDarkMode } = useThemeStore();

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Kebijakan Privasi</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Perlindungan & Keamanan Data Pengguna</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Hero */}
        <Card style={[styles.heroCard, { backgroundColor: colors.primaryDark }]}>
          <View style={styles.heroContent}>
            <View style={[styles.iconRing, { backgroundColor: colors.accent }]}>
              <ShieldCheck color="#FFFFFF" size={32} />
            </View>
            <Text style={styles.heroTitle}>Privasi Anda Adalah Prioritas Kami</Text>
            <Text style={styles.heroDesc}>
              Aplikasi Muslim App berkomitmen penuh menjaga kerahasiaan, integritas, dan keamanan seluruh data pribadi serta catatan ibadah Anda.
            </Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>Terakhir diperbarui: 01 Agustus 2026</Text>
            </View>
          </View>
        </Card>

        {/* Section 1: Pengumpulan Informasi */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#DCFCE7' }]}>
              <FileText color="#166534" size={20} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Informasi yang Kami Kumpulkan</Text>
          </View>

          <Text style={[styles.paragraphText, { color: colors.text }]}>
            Untuk memberikan layanan ibadah yang akurat, aplikasi mengumpulkan beberapa informasi berikut:
          </Text>

          <View style={styles.bulletItem}>
            <CheckCircle2 color={colors.primary} size={16} style={styles.bulletIcon} />
            <Text style={[styles.bulletText, { color: colors.text }]}>
              <Text style={styles.boldText}>Data Akun:</Text> Nama lengkap, alamat email, dan kata sandi yang terenkripsi aman.
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <CheckCircle2 color={colors.primary} size={16} style={styles.bulletIcon} />
            <Text style={[styles.bulletText, { color: colors.text }]}>
              <Text style={styles.boldText}>Data Lokasi (GPS):</Text> Digunakan khusus untuk menentukan koordinat kompas Arah Kiblat dan masjid terdekat.
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <CheckCircle2 color={colors.primary} size={16} style={styles.bulletIcon} />
            <Text style={[styles.bulletText, { color: colors.text }]}>
              <Text style={styles.boldText}>Catatan Tracker Ibadah:</Text> Riwayat centang pengerjaan sholat 5 waktu yang tersimpan di server database kami.
            </Text>
          </View>
        </Card>

        {/* Section 2: Keamanan & Enkripsi Data */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Lock color="#B45309" size={20} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Keamanan & Enkripsi Data</Text>
          </View>

          <Text style={[styles.paragraphText, { color: colors.text }]}>
            Seluruh komunikasi data antara aplikasi seluler dan server backend diproteksi menggunakan protokol terenkripsi SSL/HTTPS. Kata sandi pengguna dienkripsi menggunakan algoritma <Text style={styles.boldText}>Bcrypt salted hash</Text> dan otentikasi menggunakan <Text style={styles.boldText}>JWT Token</Text>.
          </Text>
        </Card>

        {/* Section 3: Penggunaan Izin Lokasi */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <MapPin color="#075985" size={20} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Penggunaan Izin Akses Lokasi</Text>
          </View>

          <Text style={[styles.paragraphText, { color: colors.text }]}>
            Izin akses lokasi hanya aktif saat Anda membuka fitur <Text style={styles.boldText}>Kompas Kiblat</Text> atau <Text style={styles.boldText}>Peta Masjid Terdekat</Text>. Kami tidak melacak atau menjual data riwayat pergerakan lokasi Anda kepada pihak ketiga mana pun.
          </Text>
        </Card>

        {/* Section 4: Hak & Pengendalian Pengguna */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Eye color="#6B21A8" size={20} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Hak & Pengendalian Pengguna</Text>
          </View>

          <Text style={[styles.paragraphText, { color: colors.text }]}>
            Anda memiliki hak penuh untuk memperbarui profil, mengubah pengaturan notifikasi adzan, menghapus postingan komunitas yang dibuat, atau mengajukan penghapusan akun kapan saja.
          </Text>
        </Card>

        {/* Section 5: Kontak Tim Support */}
        <Card style={[styles.contactCard, { backgroundColor: isDarkMode ? '#065F46' : '#F0FDF4', borderColor: colors.primaryLight }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: colors.primary }]}>
              <Mail color="#FFFFFF" size={20} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>5. Pertanyaan Privasi</Text>
          </View>

          <Text style={[styles.paragraphText, { color: colors.text }]}>
            Jika Anda memiliki pertanyaan seputar kebijakan privasi ini, silakan hubungi tim perlindungan data kami di:
          </Text>

          <TouchableOpacity style={styles.emailBadge}>
            <Text style={styles.emailBadgeText}>privasi@muslimapp.id</Text>
          </TouchableOpacity>
        </Card>

        {/* Action Understand Button */}
        {onBack && (
          <TouchableOpacity
            style={[styles.understandBtn, { backgroundColor: colors.primary }]}
            onPress={onBack}
            activeOpacity={0.85}
          >
            <CheckCircle2 color="#FFFFFF" size={20} />
            <Text style={styles.understandBtnText}>Saya Memahami Kebijakan Ini</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  heroCard: {
    padding: SPACING.lg,
    borderRadius: 24,
    marginBottom: SPACING.md,
  },
  heroContent: {
    alignItems: 'center',
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  heroDesc: {
    fontSize: 13,
    color: '#FDE047',
    textAlign: 'center',
    lineHeight: 20,
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  dateBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  paragraphText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  bulletIcon: {
    marginTop: 3,
    marginRight: 6,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  contactCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: 18,
    borderWidth: 1,
  },
  emailBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0F5132',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  emailBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  understandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 16,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxl,
  },
  understandBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
});
