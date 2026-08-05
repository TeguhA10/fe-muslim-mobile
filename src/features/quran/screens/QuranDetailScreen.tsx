import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Share,
  BackHandler,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useQuranStore } from '../../../store/useQuranStore';
import { QuranApiService, SurahDetail, AyahItem } from '../../../services/quranApi.service';
import { Audio } from 'expo-av';
import {
  ArrowLeft,
  Play,
  Pause,
  Bookmark,
  CheckCircle,
  Share2,
  Settings,
  X,
  Volume2,
  BookOpen,
} from 'lucide-react-native';

interface QuranDetailScreenProps {
  surahNumber: number;
  initialAyah?: number;
  onBack: () => void;
}

export const QuranDetailScreen: React.FC<QuranDetailScreenProps> = ({
  surahNumber,
  initialAyah,
  onBack,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const {
    lastRead,
    setLastRead,
    toggleBookmark,
    isBookmarked,
    fontSizeArabic,
    setFontSizeArabic,
    showTranslation,
    setShowTranslation,
    showLatin,
    setShowLatin,
  } = useQuranStore();

  const [surahDetail, setSurahDetail] = useState<SurahDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Player state
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [isPlayingFullSurah, setIsPlayingFullSurah] = useState<boolean>(false);
  const [playingAyahNum, setPlayingAyahNum] = useState<number | null>(null);

  // Display Settings Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadDetail();
    return () => {
      if (soundObject) {
        soundObject.unloadAsync().catch(() => {});
      }
    };
  }, [surahNumber]);

  const loadDetail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await QuranApiService.getSurahDetail(surahNumber);
      setSurahDetail(data);
      setIsLoading(false);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Gagal memuat detail Surah');
      setIsLoading(false);
    }
  };

  // Android hardware back button handler
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isSettingsModalOpen) {
          setIsSettingsModalOpen(false);
          return true;
        }
        if (soundObject) {
          soundObject.stopAsync().catch(() => {});
        }
        onBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [isSettingsModalOpen, soundObject, onBack])
  );

  // Play Full Surah Audio
  const togglePlayFullSurah = async () => {
    if (!surahDetail?.audioFull) return;
    const url = QuranApiService.getAudioUrl(surahDetail.audioFull, '05');
    if (!url) return;

    try {
      if (isPlayingFullSurah && soundObject) {
        try {
          await soundObject.pauseAsync();
        } catch {}
        setIsPlayingFullSurah(false);
        return;
      }

      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
      }

      if (!Audio || typeof Audio.Sound?.createAsync !== 'function') {
        console.log('[QuranDetailScreen] Modul audio native expo-av belum terpasang.');
        return;
      }

      setPlayingAyahNum(null);
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }).catch((err) => {
        console.log('[QuranDetailScreen] Error audio full surah:', err?.message || err);
        return { sound: null };
      });

      if (!sound) {
        setIsPlayingFullSurah(false);
        return;
      }

      setSoundObject(sound);
      setIsPlayingFullSurah(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingFullSurah(false);
        }
      });
    } catch (e: any) {
      console.log('[QuranDetailScreen] Audio play error:', e?.message || e);
      setIsPlayingFullSurah(false);
    }
  };

  // Play Single Ayah Audio
  const playAyahAudio = async (ayah: AyahItem) => {
    const url = QuranApiService.getAudioUrl(ayah.audio, '05');
    if (!url) return;

    try {
      if (playingAyahNum === ayah.nomorAyat && soundObject) {
        try {
          await soundObject.stopAsync();
        } catch {}
        setPlayingAyahNum(null);
        return;
      }

      if (soundObject) {
        try {
          await soundObject.stopAsync();
          await soundObject.unloadAsync();
        } catch {}
      }

      if (!Audio || typeof Audio.Sound?.createAsync !== 'function') {
        console.log('[QuranDetailScreen] Modul audio native expo-av belum terpasang.');
        return;
      }

      setIsPlayingFullSurah(false);
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true }).catch((err) => {
        console.log('[QuranDetailScreen] Error audio ayah:', err?.message || err);
        return { sound: null };
      });

      if (!sound) {
        setPlayingAyahNum(null);
        return;
      }

      setSoundObject(sound);
      setPlayingAyahNum(ayah.nomorAyat);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAyahNum(null);
        }
      });
    } catch (e: any) {
      console.log('[QuranDetailScreen] Ayah audio play error:', e?.message || e);
      setPlayingAyahNum(null);
    }
  };

  // Handle Mark Last Read
  const handleMarkLastRead = (ayahNumber: number) => {
    if (surahDetail) {
      setLastRead(surahDetail.nomor, surahDetail.namaLatin, ayahNumber);
    }
  };

  // Handle Share Verse
  const handleShareAyah = (ayah: AyahItem) => {
    if (!surahDetail) return;
    const msg = `Surah ${surahDetail.namaLatin} Ayat ${ayah.nomorAyat}:\n\n${ayah.teksArab}\n\n"${ayah.teksIndonesia}"\n\n(Dibagikan melalui Muslim App)`;
    Share.share({ message: msg });
  };

  if (isLoading) {
    return (
      <ScreenWrapper style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Memuat Surah & Ayat...
        </Text>
      </ScreenWrapper>
    );
  }

  if (errorMsg || !surahDetail) {
    return (
      <ScreenWrapper style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{errorMsg || 'Data tidak ditemukan'}</Text>
        <TouchableOpacity style={[styles.backActionBtn, { backgroundColor: colors.primary }]} onPress={onBack}>
          <Text style={styles.backActionText}>Kembali ke Daftar Surah</Text>
        </TouchableOpacity>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>

        <View style={styles.titleCenter}>
          <Text style={[styles.titleText, { color: colors.text }]}>{surahDetail.namaLatin}</Text>
          <Text style={[styles.subtitleText, { color: colors.textMuted }]}>
            {surahDetail.arti} • {surahDetail.jumlahAyat} Ayat
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSettingsModalOpen(true)}>
          <Settings color={colors.text} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Surah Banner & Full Audio Control */}
        <Card style={[styles.surahHeaderBanner, { backgroundColor: colors.primary }]}>
          <Text style={styles.bannerArabName}>{surahDetail.nama}</Text>
          <Text style={styles.bannerLatinName}>{surahDetail.namaLatin}</Text>
          <Text style={styles.bannerInfoText}>
            {surahDetail.tempatTurun} • {surahDetail.jumlahAyat} Ayat
          </Text>

          {/* Bismillah Header (Except Surah 9 At-Taubah) */}
          {surahDetail.nomor !== 9 && (
            <View style={styles.bismillahBox}>
              <Text style={styles.bismillahText}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            </View>
          )}

          {/* Full Audio Play Button */}
          {surahDetail.audioFull && (
            <TouchableOpacity
              style={styles.fullAudioBtn}
              activeOpacity={0.85}
              onPress={togglePlayFullSurah}
            >
              {isPlayingFullSurah ? (
                <>
                  <Pause color={colors.primary} size={18} />
                  <Text style={[styles.fullAudioBtnText, { color: colors.primary }]}>Jeda Audio Surah</Text>
                </>
              ) : (
                <>
                  <Play color={colors.primary} size={18} />
                  <Text style={[styles.fullAudioBtnText, { color: colors.primary }]}>Putar Full Surah</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Card>

        {/* Verses (Ayat) List */}
        {surahDetail.ayat.map((ayah: AyahItem) => {
          const isBm = isBookmarked(surahDetail.nomor, ayah.nomorAyat);
          const isLast =
            lastRead?.surahNumber === surahDetail.nomor && lastRead?.ayahNumber === ayah.nomorAyat;
          const isPlayingThisAyah = playingAyahNum === ayah.nomorAyat;

          return (
            <Card
              key={ayah.nomorAyat}
              style={[
                styles.ayahCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isLast && { borderColor: colors.accent, borderWidth: 1.5 },
              ]}
            >
              {/* Ayah Control Toolbar */}
              <View style={[styles.ayahToolbar, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                <View style={[styles.ayahNumBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.ayahNumText}>{ayah.nomorAyat}</Text>
                </View>

                <View style={styles.ayahActionBtns}>
                  {/* Play Ayah Audio */}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => playAyahAudio(ayah)}>
                    {isPlayingThisAyah ? (
                      <Pause color="#EF4444" size={18} />
                    ) : (
                      <Volume2 color={colors.primary} size={18} />
                    )}
                  </TouchableOpacity>

                  {/* Bookmark Button */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      toggleBookmark(
                        surahDetail.nomor,
                        surahDetail.namaLatin,
                        ayah.nomorAyat,
                        ayah.teksArab
                      )
                    }
                  >
                    <Bookmark
                      color={isBm ? colors.accent : colors.textMuted}
                      fill={isBm ? colors.accent : 'transparent'}
                      size={18}
                    />
                  </TouchableOpacity>

                  {/* Mark as Last Read */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleMarkLastRead(ayah.nomorAyat)}
                  >
                    <BookOpen
                      color={isLast ? colors.success : colors.textMuted}
                      size={18}
                    />
                  </TouchableOpacity>

                  {/* Share Ayah */}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleShareAyah(ayah)}>
                    <Share2 color={colors.textMuted} size={18} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Arabic Text */}
              <Text
                style={[
                  styles.teksArabText,
                  {
                    color: colors.text,
                    fontSize: fontSizeArabic,
                    lineHeight: fontSizeArabic * 1.8,
                  },
                ]}
              >
                {ayah.teksArab}
              </Text>

              {/* Latin Transliteration */}
              {showLatin && (
                <Text style={[styles.teksLatinText, { color: colors.primary }]}>
                  {ayah.teksLatin}
                </Text>
              )}

              {/* Indonesian Translation */}
              {showTranslation && (
                <Text style={[styles.teksIndonesiaText, { color: colors.textMuted }]}>
                  {ayah.teksIndonesia}
                </Text>
              )}
            </Card>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Font & Display Settings Modal */}
      <Modal visible={isSettingsModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Pengaturan Tampilan Al-Qur'an</Text>
              <TouchableOpacity onPress={() => setIsSettingsModalOpen(false)}>
                <X color={colors.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            {/* Font Size Selector */}
            <Text style={[styles.settingLabel, { color: colors.text }]}>Ukuran Teks Arab: {fontSizeArabic}px</Text>
            <View style={styles.fontSizeRow}>
              {[20, 24, 28, 32, 36].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOptionBtn,
                    {
                      backgroundColor: fontSizeArabic === size ? colors.primary : isDarkMode ? '#1E293B' : '#F1F5F9',
                    },
                  ]}
                  onPress={() => setFontSizeArabic(size)}
                >
                  <Text style={[styles.sizeOptionText, { color: fontSizeArabic === size ? '#FFFFFF' : colors.text }]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Toggle Latin & Translation */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setShowLatin(!showLatin)}
            >
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Tampilkan Teks Latin</Text>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: showLatin ? colors.primary : colors.textMuted, backgroundColor: showLatin ? colors.primary : 'transparent' },
                ]}
              >
                {showLatin && <CheckCircle color="#FFFFFF" size={14} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setShowTranslation(!showTranslation)}
            >
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Tampilkan Terjemahan Bahasa Indonesia</Text>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: showTranslation ? colors.primary : colors.textMuted, backgroundColor: showTranslation ? colors.primary : 'transparent' },
                ]}
              >
                {showTranslation && <CheckCircle color="#FFFFFF" size={14} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeModalBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsSettingsModalOpen(false)}
            >
              <Text style={styles.closeModalBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
  },
  backActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  titleCenter: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 12,
  },
  surahHeaderBanner: {
    padding: 22,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 12,
  },
  bannerArabName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
  bannerLatinName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FDE047',
    marginTop: 4,
  },
  bannerInfoText: {
    fontSize: 13,
    color: '#E2E8F0',
    marginTop: 4,
  },
  bismillahBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: 'serif',
  },
  fullAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 16,
    gap: 8,
  },
  fullAudioBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  ayahCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  ayahToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
  },
  ayahNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  ayahActionBtns: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  teksArabText: {
    textAlign: 'right',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  teksLatinText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 6,
    lineHeight: 20,
  },
  teksIndonesiaText: {
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  sizeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  sizeOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  toggleLabel: {
    fontSize: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
