import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { useLocationStore } from '../../../store/useLocationStore';
import { QiblaScreen } from './QiblaScreen';
import { HijriCalendarYearScreen } from './HijriCalendarYearScreen';
import { QuranHomeScreen } from '../../quran/screens/QuranHomeScreen';
import { QuranDetailScreen } from '../../quran/screens/QuranDetailScreen';
import { Compass, Calendar, Sparkles, ChevronRight, MapPin, BookOpen } from 'lucide-react-native';

export const IbadahScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, isDarkMode } = useThemeStore();
  const { city } = useLocationStore();
  const [showQiblaCompass, setShowQiblaCompass] = useState<boolean>(false);
  const [showHijriYearCalendar, setShowHijriYearCalendar] = useState<boolean>(false);
  const [showQuranList, setShowQuranList] = useState<boolean>(false);
  const [selectedSurahInfo, setSelectedSurahInfo] = useState<{ surahNumber: number; ayahNumber?: number } | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Hardware Back Button Handler for Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isLocationModalOpen) {
          setIsLocationModalOpen(false);
          return true;
        }
        if (selectedSurahInfo) {
          setSelectedSurahInfo(null);
          return true;
        }
        if (showQuranList) {
          setShowQuranList(false);
          return true;
        }
        if (showQiblaCompass) {
          setShowQiblaCompass(false);
          return true;
        }
        if (showHijriYearCalendar) {
          setShowHijriYearCalendar(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isLocationModalOpen, selectedSurahInfo, showQuranList, showQiblaCompass, showHijriYearCalendar])
  );

  React.useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('tabPress', () => {
      const isFocused = navigation.isFocused();
      if (!isFocused) return;

      setSelectedSurahInfo(null);
      setShowQuranList(false);
      setShowQiblaCompass(false);
      setShowHijriYearCalendar(false);
      setIsLocationModalOpen(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  const islamicEvents = [
    { name: 'Maulid Nabi Muhammad SAW', date: '12 Rabiul Awal 1448 H', gregorian: '25 Agustus 2026', daysLeft: 24 },
    { name: 'Isra Mikraj', date: '27 Rajab 1448 H', gregorian: '05 Januari 2027', daysLeft: 157 },
    { name: 'Awal Ramadan 1448 H', date: '01 Ramadan 1448 H', gregorian: '08 Februari 2027', daysLeft: 191 },
  ];

  if (selectedSurahInfo) {
    return (
      <QuranDetailScreen
        surahNumber={selectedSurahInfo.surahNumber}
        initialAyah={selectedSurahInfo.ayahNumber}
        onBack={() => setSelectedSurahInfo(null)}
      />
    );
  }

  if (showQuranList) {
    return (
      <QuranHomeScreen
        onSelectSurah={(surahNumber, ayahNumber) =>
          setSelectedSurahInfo({ surahNumber, ayahNumber })
        }
        onBack={() => setShowQuranList(false)}
      />
    );
  }

  if (showQiblaCompass) {
    return <QiblaScreen onBack={() => setShowQiblaCompass(false)} />;
  }

  if (showHijriYearCalendar) {
    return <HijriCalendarYearScreen onBack={() => setShowHijriYearCalendar(false)} />;
  }

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Modul Ibadah & Al-Qur'an</Text>

        {/* Al-Qur'an Digital Featured Banner */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => setShowQuranList(true)}>
          <Card style={[styles.quranCardBanner, { backgroundColor: colors.primary }]}>
            <View style={styles.quranHeaderRow}>
              <View style={styles.quranHeaderLeft}>
                <BookOpen color="#FDE047" size={26} />
                <View>
                  <Text style={styles.quranTitle}>Al-Qur'an Digital 30 Juz</Text>
                  <Text style={styles.quranSub}>114 Surah • Arab Uthmani & Audio Qori</Text>
                </View>
              </View>
              <View style={styles.openQuranBtn}>
                <Text style={styles.openQuranBtnText}>Buka Al-Qur'an</Text>
                <ChevronRight color="#FDE047" size={16} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Hijri Calendar Banner */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setShowHijriYearCalendar(true)}>
          <Card style={[styles.calendarBanner, { backgroundColor: isDarkMode ? '#1E293B' : '#047857' }]}>
            <View style={styles.calendarHeaderRow}>
              <View style={styles.calendarHeaderLeft}>
                <Calendar color="#F59E0B" size={24} />
                <Text style={styles.calendarTitle}>Kalender Hijriah 1448 H</Text>
              </View>
              <View style={styles.openYearBtn}>
                <Text style={styles.openYearBtnText}>Lihat 1 Tahun</Text>
                <ChevronRight color="#FDE047" size={16} />
              </View>
            </View>
            <Text style={styles.hijriDateText}>17 Safar 1448 H</Text>
            <Text style={styles.gregorianDateText}>Sabtu, 01 Agustus 2026 M • Tekan untuk Kalender Lengkap</Text>
          </Card>
        </TouchableOpacity>

        {/* Interactive Qibla Compass Card */}
        <Card style={[styles.qiblaCard, { backgroundColor: colors.primaryDark }]}>
          {/* Card Header Row */}
          <View style={styles.qiblaHeaderRow}>
            <View style={styles.qiblaHeaderLeft}>
              <View style={[styles.qiblaIconContainer, { backgroundColor: colors.accent }]}>
                <Compass color="#FFFFFF" size={28} />
              </View>
              <View style={styles.qiblaTextContainer}>
                <Text style={styles.qiblaTitle}>Kompas Arah Kiblat</Text>
                <Text style={styles.qiblaSubtitle}>Sensor real-time • GPS Fusion</Text>
              </View>
            </View>
            {/* Location selector button — same pattern as MasjidMapScreen */}
            <TouchableOpacity
              style={styles.locationSelectorBtn}
              onPress={() => setIsLocationModalOpen(true)}
              activeOpacity={0.8}
            >
              <MapPin color="#FDE047" size={12} />
              <Text style={styles.locationSelectorText} numberOfLines={1}>
                {city.split(',')[0]}
              </Text>
              <ChevronRight color="rgba(255,255,255,0.5)" size={12} />
            </TouchableOpacity>
          </View>

          {/* Open Compass Button */}
          <TouchableOpacity
            style={[styles.openCompassBtn, { borderColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowQiblaCompass(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.openCompassBtnText}>Buka Kompas Kiblat</Text>
            <ChevronRight color="#FDE047" size={16} />
          </TouchableOpacity>
        </Card>

        {/* Countdown Hari Besar Islam */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Countdown Hari Besar Islam</Text>
        {islamicEvents.map((event, idx) => (
          <Card key={idx} style={styles.eventCard}>
            <View style={styles.eventLeft}>
              <Sparkles color={colors.accent} size={20} />
              <View style={styles.eventDetails}>
                <Text style={[styles.eventName, { color: colors.text }]}>{event.name}</Text>
                <Text style={[styles.eventHijri, { color: colors.primary }]}>{event.date}</Text>
                <Text style={[styles.eventGregorian, { color: colors.textMuted }]}>{event.gregorian}</Text>
              </View>
            </View>

            <View style={[styles.daysBadge, { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7' }]}>
              <Text style={[styles.daysNumber, { color: isDarkMode ? '#FDE047' : '#B45309' }]}>{event.daysLeft}</Text>
              <Text style={[styles.daysLabel, { color: isDarkMode ? '#FDE047' : '#B45309' }]}>hari lagi</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Location Picker Modal — shared with Kiblat card */}
      <LocationPickerModal
        visible={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  quranCardBanner: {
    padding: SPACING.md,
    borderRadius: 20,
    marginBottom: SPACING.md,
  },
  quranHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quranHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quranTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quranSub: {
    fontSize: 11,
    color: '#FDE047',
    marginTop: 2,
  },
  openQuranBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  openQuranBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarBanner: {
    padding: SPACING.lg,
    borderRadius: 20,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  calendarHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openYearBtnText: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 2,
  },
  calendarTitle: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  hijriDateText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: SPACING.xs,
  },
  gregorianDateText: {
    fontSize: 14,
    color: '#FDE047',
  },
  qiblaCard: {
    marginVertical: SPACING.md,
    borderRadius: 20,
  },
  qiblaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  qiblaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qiblaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  qiblaTextContainer: {
    flex: 1,
  },
  qiblaTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  qiblaSubtitle: {
    fontSize: 11,
    color: '#FDE047',
    marginTop: 2,
  },
  locationSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 3,
    maxWidth: 110,
  },
  locationSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FDE047',
    flexShrink: 1,
  },
  openCompassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  openCompassBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: SPACING.sm,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventDetails: {
    marginLeft: SPACING.sm,
  },
  eventName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  eventHijri: {
    fontSize: 13,
    marginTop: 2,
  },
  eventGregorian: {
    fontSize: 12,
  },
  daysBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  daysLabel: {
    fontSize: 10,
  },
});
