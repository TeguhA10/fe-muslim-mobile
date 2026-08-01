import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { SPACING } from '../../../constants/theme';
import { useThemeStore } from '../../../store/useThemeStore';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Moon,
} from 'lucide-react-native';

interface HijriMonthData {
  id: number;
  nameHijri: string;
  nameArabic: string;
  yearHijri: number;
  gregorianSpan: string;
  daysCount: number;
  startDayOfWeek: number; // 0 = Sun, 1 = Mon ...
  events: { day: number; title: string; type: 'phbi' | 'sunnah' | 'major' }[];
}

const HIJRI_MONTHS_1448: HijriMonthData[] = [
  {
    id: 1,
    nameHijri: 'Muharram',
    nameArabic: 'مُحَرَّم',
    yearHijri: 1448,
    gregorianSpan: 'Juni - Juli 2026',
    daysCount: 30,
    startDayOfWeek: 2, // Tuesday
    events: [
      { day: 1, title: 'Tahun Baru Islam 1448 H', type: 'major' },
      { day: 9, title: 'Puasa Tasu\'a (9 Muharram)', type: 'sunnah' },
      { day: 10, title: 'Puasa Asyura (10 Muharram)', type: 'phbi' },
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 2,
    nameHijri: 'Safar',
    nameArabic: 'صَفَر',
    yearHijri: 1448,
    gregorianSpan: 'Juli - Agustus 2026',
    daysCount: 29,
    startDayOfWeek: 4, // Thursday
    events: [
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 3,
    nameHijri: 'Rabi\'ul Awal',
    nameArabic: 'رَبِيع الأَوَّل',
    yearHijri: 1448,
    gregorianSpan: 'Agustus - September 2026',
    daysCount: 30,
    startDayOfWeek: 5, // Friday
    events: [
      { day: 12, title: 'Maulid Nabi Muhammad SAW', type: 'major' },
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 4,
    nameHijri: 'Rabi\'ul Akhir',
    nameArabic: 'رَبِيع الآخِر',
    yearHijri: 1448,
    gregorianSpan: 'September - Oktober 2026',
    daysCount: 29,
    startDayOfWeek: 0, // Sunday
    events: [
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 5,
    nameHijri: 'Jumadil Ula',
    nameArabic: 'جُمَادَى الأُولَى',
    yearHijri: 1448,
    gregorianSpan: 'Oktober - November 2026',
    daysCount: 30,
    startDayOfWeek: 1, // Monday
    events: [
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 6,
    nameHijri: 'Jumadil Akhir',
    nameArabic: 'جُمَادَى الآخِرَة',
    yearHijri: 1448,
    gregorianSpan: 'November - Desember 2026',
    daysCount: 29,
    startDayOfWeek: 3, // Wednesday
    events: [
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 7,
    nameHijri: 'Rajab',
    nameArabic: 'رَجَب',
    yearHijri: 1448,
    gregorianSpan: 'Desember 2026 - Januari 2027',
    daysCount: 30,
    startDayOfWeek: 4, // Thursday
    events: [
      { day: 1, title: 'Awal Bulan Haram Rajab', type: 'phbi' },
      { day: 27, title: 'Isra Mikraj Nabi Muhammad SAW', type: 'major' },
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 8,
    nameHijri: 'Sya\'ban',
    nameArabic: 'شَعْبَان',
    yearHijri: 1448,
    gregorianSpan: 'Januari - Februari 2027',
    daysCount: 29,
    startDayOfWeek: 6, // Saturday
    events: [
      { day: 15, title: 'Nisfu Sya\'ban', type: 'phbi' },
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 9,
    nameHijri: 'Ramadhan',
    nameArabic: 'رَمَضَان',
    yearHijri: 1448,
    gregorianSpan: 'Februari - Maret 2027',
    daysCount: 30,
    startDayOfWeek: 0, // Sunday
    events: [
      { day: 1, title: 'Awal Puasa Ramadhan 1448 H', type: 'major' },
      { day: 17, title: 'Nuzulul Qur\'an', type: 'major' },
      { day: 21, title: 'Malam Lailatul Qadar (Mulai 10 Malam Terakhir)', type: 'major' },
    ],
  },
  {
    id: 10,
    nameHijri: 'Syawal',
    nameArabic: 'شَوَّال',
    yearHijri: 1448,
    gregorianSpan: 'Maret - April 2027',
    daysCount: 29,
    startDayOfWeek: 2, // Tuesday
    events: [
      { day: 1, title: 'Hari Raya Idul Fitri 1448 H', type: 'major' },
      { day: 2, title: 'Hari Raya Idul Fitri (Hari Ke-2)', type: 'phbi' },
      { day: 3, title: 'Awal Sunnah Puasa Syawal 6 Hari', type: 'sunnah' },
    ],
  },
  {
    id: 11,
    nameHijri: 'Dzulqa\'dah',
    nameArabic: 'ذُو القَعْدَة',
    yearHijri: 1448,
    gregorianSpan: 'April - Mei 2027',
    daysCount: 30,
    startDayOfWeek: 3, // Wednesday
    events: [
      { day: 1, title: 'Awal Bulan Haram Dzulqa\'dah', type: 'phbi' },
      { day: 13, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 14, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
      { day: 15, title: 'Puasa Ayyamul Bidh', type: 'sunnah' },
    ],
  },
  {
    id: 12,
    nameHijri: 'Dzulhijjah',
    nameArabic: 'ذُو الحِجَّة',
    yearHijri: 1448,
    gregorianSpan: 'Mei - Juni 2027',
    daysCount: 29,
    startDayOfWeek: 5, // Friday
    events: [
      { day: 8, title: 'Puasa Tarwiyah', type: 'sunnah' },
      { day: 9, title: 'Puasa Arafah (Wukuf Haji)', type: 'major' },
      { day: 10, title: 'Hari Raya Idul Adha 1448 H', type: 'major' },
      { day: 11, title: 'Hari Tasyrik Ke-1', type: 'phbi' },
      { day: 12, title: 'Hari Tasyrik Ke-2', type: 'phbi' },
      { day: 13, title: 'Hari Tasyrik Ke-3', type: 'phbi' },
    ],
  },
];

interface Props {
  onBack: () => void;
}

export const HijriCalendarYearScreen: React.FC<Props> = ({ onBack }) => {
  const { colors, isDarkMode } = useThemeStore();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar');

  const currentMonth = HIJRI_MONTHS_1448[selectedMonthIndex];
  const dayLabels = ['Aha', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const allYearEvents = HIJRI_MONTHS_1448.flatMap((m) =>
    m.events.map((e) => ({ ...e, monthName: m.nameHijri, monthId: m.id }))
  );

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft color={colors.text} size={22} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Kalender Hijriah 1 Tahun</Text>
          <Text style={[styles.screenSubtitle, { color: colors.primary }]}>Tahun 1448 Hijriah (2026 - 2027 M)</Text>
        </View>
      </View>

      {/* Main Mode Segment Controls */}
      <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'calendar' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('calendar')}
        >
          <CalendarIcon color={activeTab === 'calendar' ? '#FFFFFF' : colors.textMuted} size={16} />
          <Text style={[styles.segmentText, { color: activeTab === 'calendar' ? '#FFFFFF' : colors.textMuted }]}>
            Tampilan Kalender 12 Bulan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'events' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('events')}
        >
          <Sparkles color={activeTab === 'events' ? '#FFFFFF' : colors.textMuted} size={16} />
          <Text style={[styles.segmentText, { color: activeTab === 'events' ? '#FFFFFF' : colors.textMuted }]}>
            Daftar PHBI 1 Tahun
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'calendar' ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Month Selector Bar */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              disabled={selectedMonthIndex === 0}
              onPress={() => setSelectedMonthIndex((prev) => Math.max(0, prev - 1))}
              style={[styles.monthNavBtn, selectedMonthIndex === 0 && { opacity: 0.3 }]}
            >
              <ChevronLeft color={colors.text} size={20} />
            </TouchableOpacity>

            <View style={styles.monthTitleWrapper}>
              <Text style={[styles.monthHijriName, { color: colors.text }]}>
                {currentMonth.nameHijri} <Text style={{ color: colors.primary }}>{currentMonth.yearHijri} H</Text>
              </Text>
              <Text style={[styles.monthArabicName, { color: colors.accent }]}>{currentMonth.nameArabic}</Text>
              <Text style={[styles.monthGregorianSpan, { color: colors.textMuted }]}>{currentMonth.gregorianSpan}</Text>
            </View>

            <TouchableOpacity
              disabled={selectedMonthIndex === HIJRI_MONTHS_1448.length - 1}
              onPress={() => setSelectedMonthIndex((prev) => Math.min(HIJRI_MONTHS_1448.length - 1, prev + 1))}
              style={[styles.monthNavBtn, selectedMonthIndex === HIJRI_MONTHS_1448.length - 1 && { opacity: 0.3 }]}
            >
              <ChevronRight color={colors.text} size={20} />
            </TouchableOpacity>
          </View>

          {/* Quick Horizontal 12-Month Pill Slider */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
            {HIJRI_MONTHS_1448.map((m, idx) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setSelectedMonthIndex(idx)}
                style={[
                  styles.pillItem,
                  { borderColor: colors.border },
                  idx === selectedMonthIndex && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.pillText, { color: colors.textMuted }, idx === selectedMonthIndex && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                  {idx + 1}. {m.nameHijri}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Calendar Grid View Card */}
          <Card style={styles.calendarCard}>
            {/* Days Header (Sun - Sat) */}
            <View style={styles.gridHeaderRow}>
              {dayLabels.map((d, i) => (
                <Text key={i} style={[styles.dayHeaderCell, { color: i === 5 ? colors.primary : i === 0 ? colors.error : colors.textMuted }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid Days Cells */}
            <View style={styles.gridDaysBody}>
              {/* Empty padding cells before start of month */}
              {Array.from({ length: currentMonth.startDayOfWeek }).map((_, i) => (
                <View key={`empty_${i}`} style={styles.dayCell} />
              ))}

              {/* Month Days */}
              {Array.from({ length: currentMonth.daysCount }).map((_, i) => {
                const dayNum = i + 1;
                const hasEvent = currentMonth.events.find((e) => e.day === dayNum);
                const isMajor = hasEvent?.type === 'major';
                const isSunnah = hasEvent?.type === 'sunnah';

                return (
                  <View
                    key={`day_${dayNum}`}
                    style={[
                      styles.dayCell,
                      hasEvent && {
                        backgroundColor: isMajor
                          ? isDarkMode
                            ? '#065F46'
                            : '#DCFCE7'
                          : isSunnah
                          ? isDarkMode
                            ? '#78350F'
                            : '#FEF3C7'
                          : isDarkMode
                          ? '#1E293B'
                          : '#E2E8F0',
                        borderRadius: 12,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumberText,
                        { color: colors.text },
                        hasEvent && { fontWeight: 'bold', color: isMajor ? colors.primary : isSunnah ? '#B45309' : colors.text },
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasEvent && (
                      <View
                        style={[
                          styles.eventDot,
                          { backgroundColor: isMajor ? colors.primary : isSunnah ? '#D97706' : colors.accent },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Agenda & PHBI for Current Month */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Agenda & Hari Penting ({currentMonth.nameHijri})
          </Text>

          {currentMonth.events.length === 0 ? (
            <Card style={styles.emptyEventCard}>
              <Text style={{ color: colors.textMuted }}>Tidak ada agendakan khusus bulan ini.</Text>
            </Card>
          ) : (
            currentMonth.events.map((ev, idx) => (
              <Card key={idx} style={styles.eventRowCard}>
                <View style={[styles.dayBadgeBox, { backgroundColor: ev.type === 'major' ? colors.primary : colors.accent }]}>
                  <Text style={styles.dayBadgeText}>{ev.day}</Text>
                  <Text style={styles.dayBadgeSub}>{currentMonth.nameHijri.slice(0, 3)}</Text>
                </View>
                <View style={styles.eventInfoWrapper}>
                  <Text style={[styles.eventTitleText, { color: colors.text }]}>{ev.title}</Text>
                  <Text style={[styles.eventCategoryText, { color: ev.type === 'major' ? colors.primary : colors.textMuted }]}>
                    {ev.type === 'major' ? '⭐ Hari Besar Islam Utama' : ev.type === 'sunnah' ? '🌙 Sunnah Amalan' : '📌 Peringatan'}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
      ) : (
        /* Full 1-Year PHBI List Tab */
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
            Daftar Lengkap PHBI 1 Tahun (1448 H / 2026-2027 M)
          </Text>

          {allYearEvents.map((ev, idx) => (
            <Card key={idx} style={styles.eventRowCard}>
              <View style={[styles.dayBadgeBox, { backgroundColor: ev.type === 'major' ? colors.primary : colors.accent }]}>
                <Text style={styles.dayBadgeText}>{ev.day}</Text>
                <Text style={styles.dayBadgeSub}>{ev.monthName.slice(0, 4)}</Text>
              </View>

              <View style={styles.eventInfoWrapper}>
                <Text style={[styles.eventTitleText, { color: colors.text }]}>{ev.title}</Text>
                <Text style={[styles.eventCategoryText, { color: colors.primary }]}>
                  {ev.day} {ev.monthName} 1448 H
                </Text>
              </View>

              <View style={[styles.badgeTag, { backgroundColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                <Text style={[styles.badgeTagText, { color: colors.textMuted }]}>{ev.monthName}</Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: SPACING.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  monthNavBtn: {
    padding: SPACING.sm,
  },
  monthTitleWrapper: {
    alignItems: 'center',
  },
  monthHijriName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  monthArabicName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  monthGregorianSpan: {
    fontSize: 12,
    marginTop: 2,
  },
  pillsScroll: {
    marginBottom: SPACING.md,
  },
  pillItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: SPACING.xs,
  },
  pillText: {
    fontSize: 13,
  },
  calendarCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  dayHeaderCell: {
    fontSize: 13,
    fontWeight: 'bold',
    width: '14%',
    textAlign: 'center',
  },
  gridDaysBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayNumberText: {
    fontSize: 15,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  emptyEventCard: {
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  eventRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    padding: SPACING.md,
  },
  dayBadgeBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dayBadgeSub: {
    color: '#FFFFFF',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  eventInfoWrapper: {
    flex: 1,
  },
  eventTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventCategoryText: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTagText: {
    fontSize: 11,
  },
});
