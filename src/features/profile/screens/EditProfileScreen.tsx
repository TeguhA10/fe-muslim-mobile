import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { CustomAlert } from '../../../components/common/CustomAlert';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { User, Calendar, FileText, ArrowLeft, Check, ChevronDown } from 'lucide-react-native';

interface EditProfileScreenProps {
  initialData: {
    name: string;
    email: string;
    gender?: string;
    birth_date?: string;
    bio?: string;
  };
  onBack: () => void;
  onSaved: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  initialData,
  onBack,
  onSaved,
}) => {
  const { colors, isDarkMode } = useThemeStore();

  const [name, setName] = useState<string>(initialData.name || '');
  const [gender, setGender] = useState<string>(initialData.gender || 'Laki-laki');
  const [birthDate, setBirthDate] = useState<string>(initialData.birth_date || '');
  const [bio, setBio] = useState<string>(initialData.bio || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialData.birth_date ? new Date(initialData.birth_date) : new Date(1998, 4, 20)
  );

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setBirthDate(`${year}-${month}-${day}`);
    }
  };

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

  const handleSave = async () => {
    if (!name.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Perhatian',
        message: 'Nama lengkap tidak boleh kosong.',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.put(ENDPOINTS.AUTH.PROFILE, {
        name: name.trim(),
        gender,
        birth_date: birthDate.trim() || null,
        bio: bio.trim() || null,
      });

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Alhamdulillah!',
        message: 'Profil dan biodata Anda berhasil diperbarui di database.',
      });
    } catch (error: any) {
      console.log('[EditProfile] Error:', error?.response?.data || error?.message);
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat memperbarui biodata profil.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profil & Biodata</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Input Form Card */}
        <Card style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Nama Lengkap */}
          <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Lengkap *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <User color={colors.primary} size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Masukkan nama lengkap Anda"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Email (Readonly) */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: SPACING.md }]}>Email (Terverifikasi)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
            <TextInput
              style={[styles.textInput, { color: colors.textMuted }]}
              value={initialData.email}
              editable={false}
            />
          </View>

          {/* Jenis Kelamin (Gender) */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: SPACING.md }]}>Jenis Kelamin</Text>
          <View style={styles.genderRow}>
            {['Laki-laki', 'Perempuan'].map((g) => {
              const isSelected = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.genderBtnText, { color: colors.text }, isSelected && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {g}
                  </Text>
                  {isSelected && <Check color="#FFFFFF" size={16} style={{ marginLeft: 6 }} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tanggal Lahir (Birth Date) */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: SPACING.md }]}>Tanggal Lahir</Text>
          <TouchableOpacity
            style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar color={colors.primary} size={18} style={styles.inputIcon} />
            <Text style={[styles.dateText, { color: birthDate ? colors.text : colors.textMuted }]}>
              {birthDate ? birthDate : 'Pilih Tanggal Lahir...'}
            </Text>
            <ChevronDown color={colors.textMuted} size={18} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              minimumDate={new Date(1920, 0, 1)}
              onChange={handleDateChange}
            />
          )}

          {/* Bio / Bio Singkat */}
          <Text style={[styles.inputLabel, { color: colors.text, marginTop: SPACING.md }]}>Bio & Kata Mutiara</Text>
          <View style={[styles.inputWrapper, styles.bioWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <FileText color={colors.primary} size={18} style={[styles.inputIcon, { marginTop: 10 }]} />
            <TextInput
              style={[styles.textInput, styles.bioInput, { color: colors.text }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tuliskan bio atau quote Islami favorit Anda..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
          <Button
            title={loading ? 'Menyimpan...' : 'Simpan Perubahan Biodata'}
            onPress={handleSave}
            loading={loading}
            style={{ marginTop: SPACING.lg }}
          />
        </Card>
      </ScrollView>

      {/* Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.type === 'success') {
            onSaved();
            onBack();
          }
        }}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: 20,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  bioWrapper: {
    height: 90,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  dateText: {
    fontSize: 14,
  },
  bioInput: {
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  genderBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
