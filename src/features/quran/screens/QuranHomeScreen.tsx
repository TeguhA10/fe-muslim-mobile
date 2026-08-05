import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useQuranStore, BookmarkItem } from '../../../store/useQuranStore';
import { SurahItem } from '../../../services/quranApi.service';
import { Search, BookOpen, Bookmark, Sparkles, ChevronRight, ArrowLeft, X } from 'lucide-react-native';

interface QuranHomeScreenProps {
  onSelectSurah: (surahNumber: number, initialAyah?: number) => void;
  onBack?: () => void;
}

export const QuranHomeScreen: React.FC<QuranHomeScreenProps> = ({ onSelectSurah, onBack }) => {
  const { colors, isDarkMode } = useThemeStore();
  const { surahs, isLoadingSurahs, surahError, fetchSurahs, lastRead, bookmarks } = useQuranStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'makkiyah' | 'madaniyah' | 'bookmarks'>('all');

  useEffect(() => {
    fetchSurahs();
  }, []);

  // Handle hardware back press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (searchQuery) {
          setSearchQuery('');
          return true;
        }
        if (onBack) {
          onBack();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [searchQuery, onBack])
  );

  // Filter surahs
  const filteredSurahs = surahs.filter((item) => {
    // Search query filter
    const matchesSearch =
      item.namaLatin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arti.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.nomor).includes(searchQuery);

    if (!matchesSearch) return false;

    // Type filter
    if (activeFilter === 'makkiyah') return item.tempatTurun.toLowerCase() === 'mekah';
    if (activeFilter === 'madaniyah') return item.tempatTurun.toLowerCase() === 'madinah';
    return true;
  });

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.headerBar}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Al-Qur'an Digital</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            114 Surah • Teks Arab Uthmani & Terjemahan
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Terakhir Dibaca */}
        {lastRead ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSelectSurah(lastRead.surahNumber, lastRead.ayahNumber)}
          >
            <Card style={[styles.lastReadCard, { backgroundColor: colors.primary }]}>
              <View style={styles.lastReadHeader}>
                <View style={styles.lastReadTag}>
                  <BookOpen color="#FDE047" size={16} />
                  <Text style={styles.lastReadTagText}>Terakhir Dibaca</Text>
                </View>
                <ChevronRight color="#FDE047" size={18} />
              </View>
              <Text style={styles.lastReadSurah}>{lastRead.surahName}</Text>
              <Text style={styles.lastReadAyah}>
                Ayat Ke-{lastRead.ayahNumber} • Tekan untuk melanjutkan
              </Text>
            </Card>
          </TouchableOpacity>
        ) : (
          <Card style={[styles.lastReadCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.lastReadHeader}>
              <View style={styles.lastReadTag}>
                <Sparkles color="#FDE047" size={16} />
                <Text style={styles.lastReadTagText}>Mari Membaca Al-Qur'an</Text>
              </View>
            </View>
            <Text style={styles.lastReadSurah}>Bacalah Al-Qur'an</Text>
            <Text style={styles.lastReadAyah}>
              "Sesungguhnya Al-Qur'an memberi petunjuk ke jalan yang paling lurus." (QS. Al-Isra: 9)
            </Text>
          </Card>
        )}

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Search color={colors.textMuted} size={18} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Cari Surah (contoh: Al-Fatihah, Ya-Sin, 36)..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X color={colors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { id: 'all', label: 'Semua Surah (114)' },
            { id: 'makkiyah', label: 'Makkiyah' },
            { id: 'madaniyah', label: 'Madaniyah' },
            { id: 'bookmarks', label: `Tersimpan (${bookmarks.length})` },
          ].map((f) => {
            const active = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : isDarkMode
                      ? '#1E293B'
                      : '#F1F5F9',
                  },
                ]}
                onPress={() => setActiveFilter(f.id as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? '#FFFFFF' : colors.textMuted, fontWeight: active ? '700' : '500' },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading Indicator */}
        {isLoadingSurahs && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Memuat daftar 114 Surah Al-Qur'an...
            </Text>
          </View>
        )}

        {/* Error View */}
        {surahError && !isLoadingSurahs && (
          <Card style={styles.errorCard}>
            <Text style={[styles.errorText, { color: colors.error }]}>{surahError}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => fetchSurahs()}
            >
              <Text style={styles.retryBtnText}>Coba Lagi</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Bookmarks Tab Content */}
        {activeFilter === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bookmark color={colors.textMuted} size={40} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Belum ada ayat yang Anda tandai.
              </Text>
            </View>
          ) : (
            bookmarks.map((bm: BookmarkItem) => (
              <TouchableOpacity
                key={bm.id}
                activeOpacity={0.8}
                onPress={() => onSelectSurah(bm.surahNumber, bm.ayahNumber)}
              >
                <Card style={[styles.surahCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.bmLeftCol}>
                    <Bookmark color={colors.primary} size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.surahNameLatin, { color: colors.text }]}>
                        {bm.surahName} • Ayat {bm.ayahNumber}
                      </Text>
                      <Text
                        style={[styles.bmArabText, { color: colors.primary }]}
                        numberOfLines={1}
                      >
                        {bm.textArab}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color={colors.textMuted} size={18} />
                </Card>
              </TouchableOpacity>
            ))
          )
        ) : (
          /* Surah List Content */
          filteredSurahs.map((item: SurahItem) => (
            <TouchableOpacity
              key={item.nomor}
              activeOpacity={0.7}
              onPress={() => onSelectSurah(item.nomor)}
            >
              <Card
                style={[
                  styles.surahCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.surahLeft}>
                  {/* Surah Number Badge */}
                  <View style={[styles.numberBadge, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.15)' : '#DCFCE7' }]}>
                    <Text style={[styles.numberText, { color: colors.primary }]}>{item.nomor}</Text>
                  </View>

                  <View style={styles.surahMetaCol}>
                    <Text style={[styles.surahNameLatin, { color: colors.text }]}>
                      {item.namaLatin}
                    </Text>
                    <Text style={[styles.surahSubtext, { color: colors.textMuted }]}>
                      {item.tempatTurun} • {item.jumlahAyat} Ayat ({item.arti})
                    </Text>
                  </View>
                </View>

                <Text style={[styles.surahNameArabic, { color: colors.primary }]}>
                  {item.nama}
                </Text>
              </Card>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  lastReadCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  lastReadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lastReadTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastReadTagText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: '700',
  },
  lastReadSurah: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  lastReadAyah: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  errorCard: {
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  surahLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 14,
    fontWeight: '800',
  },
  surahMetaCol: {
    flex: 1,
  },
  surahNameLatin: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  surahSubtext: {
    fontSize: 12,
  },
  surahNameArabic: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'serif',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  bmLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bmArabText: {
    fontSize: 16,
    fontFamily: 'serif',
    marginTop: 2,
  },
});
