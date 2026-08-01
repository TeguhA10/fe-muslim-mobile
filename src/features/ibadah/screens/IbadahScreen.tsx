import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import { QiblaScreen } from './QiblaScreen';
import { HijriCalendarYearScreen } from './HijriCalendarYearScreen';
import { Compass, Calendar, Sparkles, ChevronRight } from 'lucide-react-native';

export const IbadahScreen: React.FC = () => {
  const { colors, isDarkMode } = useThemeStore();
  const [showQiblaCompass, setShowQiblaCompass] = useState<boolean>(false);
  const [showHijriYearCalendar, setShowHijriYearCalendar] = useState<boolean>(false);

  const islamicEvents = [
    { name: 'Maulid Nabi Muhammad SAW', date: '12 Rabiul Awal 1448 H', gregorian: '25 Agustus 2026', daysLeft: 24 },
    { name: 'Isra Mikraj', date: '27 Rajab 1448 H', gregorian: '05 Januari 2027', daysLeft: 157 },
    { name: 'Awal Ramadan 1448 H', date: '01 Ramadan 1448 H', gregorian: '08 Februari 2027', daysLeft: 191 },
  ];

  if (showQiblaCompass) {
    return <QiblaScreen onBack={() => setShowQiblaCompass(false)} />;
  }

  if (showHijriYearCalendar) {
    return <HijriCalendarYearScreen onBack={() => setShowHijriYearCalendar(false)} />;
  }

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Modul Ibadah</Text>

        {/* Hijri Calendar Banner */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => setShowHijriYearCalendar(true)}>
          <Card style={[styles.calendarBanner, { backgroundColor: colors.primary }]}>
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
        <TouchableOpacity activeOpacity={0.85} onPress={() => setShowQiblaCompass(true)}>
          <Card style={[styles.qiblaCard, { backgroundColor: colors.primaryDark }]}>
            <View style={styles.qiblaContent}>
              <View style={[styles.qiblaIconContainer, { backgroundColor: colors.accent }]}>
                <Compass color="#FFFFFF" size={32} />
              </View>
              <View style={styles.qiblaTextContainer}>
                <Text style={styles.qiblaTitle}>Kompas Arah Kiblat Interaktif</Text>
                <Text style={styles.qiblaSubtitle}>Tekan untuk buka kompas animasi sensor real-time</Text>
              </View>
              <ChevronRight color="#FDE047" size={24} />
            </View>
          </Card>
        </TouchableOpacity>

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
  qiblaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qiblaIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  qiblaTextContainer: {
    flex: 1,
  },
  qiblaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  qiblaSubtitle: {
    fontSize: 12,
    color: '#FDE047',
    marginTop: 2,
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
