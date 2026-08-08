import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Modal, Platform, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenWrapper } from '../../../components/layout/ScreenWrapper';
import { Card } from '../../../components/common/Card';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { GuestGuardModal } from '../../../components/common/GuestGuardModal';
import { SPACING } from '../../../constants/theme';
import { useLocationStore } from '../../../store/useLocationStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { useSettingsStore, REMINDER_OFFSETS, ADZAN_SOUND_OPTIONS, PrayerSoundSettings } from '../../../store/useSettingsStore';
import { useGuestGuard } from '../../../hooks/useGuestGuard';
import { apiClient } from '../../../api/apiClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { NotificationService } from '../../../services/notification.service';
import { PrayerBackgroundService } from '../../../services/prayerBackground.service';
import { NativePrayerService } from '../../../services/nativePrayerService';
import { BackgroundPermissionModal } from '../../../components/common/BackgroundPermissionModal';
import { AdzanSoundPickerModal } from '../components/AdzanSoundPickerModal';
import { Clock, MapPin, Bell, CheckCircle2, Circle, ChevronRight, Calendar as CalendarIcon, X, Check, BatteryCharging, Volume2 } from 'lucide-react-native';

interface DayItem {
  dateStr: string;
  dayName: string;
  dayNum: string;
  isToday: boolean;
}

export const AdzanScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { city, latitude, longitude } = useLocationStore();
  const { colors, isDarkMode } = useThemeStore();
  const {
    calculationMethod,
    reminderOffsetMinutes,
    notifAdzanEnabled,
    stickyNotifEnabled,
    prayerSounds,
    setReminderOffsetMinutes,
    setNotifAdzanEnabled,
    setStickyNotifEnabled,
    setPrayerSound,
  } = useSettingsStore();
  const { guardAction, requestRegister } = useGuestGuard();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isOffsetModalOpen, setIsOffsetModalOpen] = useState(false);
  const [isBgPermissionModalOpen, setIsBgPermissionModalOpen] = useState(false);
  const [activeSoundModalPrayer, setActiveSoundModalPrayer] = useState<keyof PrayerSoundSettings | null>(null);

  const handleToggleStickyNotif = async (value: boolean) => {
    await setStickyNotifEnabled(value);
    await PrayerBackgroundService.enableNativeService(value);
  };

  const scrollViewRef = React.useRef<ScrollView>(null);

  // Hardware Back Button Handler for Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isLocationModalOpen) {
          setIsLocationModalOpen(false);
          return true;
        }
        if (isGuestModalOpen) {
          setIsGuestModalOpen(false);
          return true;
        }
        if (isOffsetModalOpen) {
          setIsOffsetModalOpen(false);
          return true;
        }
        if (isBgPermissionModalOpen) {
          setIsBgPermissionModalOpen(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [isLocationModalOpen, isGuestModalOpen, isOffsetModalOpen, isBgPermissionModalOpen])
  );

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('tabPress', () => {
      const isFocused = navigation.isFocused();
      if (!isFocused) return;

      setIsLocationModalOpen(false);
      setIsGuestModalOpen(false);
      setIsOffsetModalOpen(false);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  const getTodayDateStr = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [historyDays, setHistoryDays] = useState<DayItem[]>([]);
  const [historyStats, setHistoryStats] = useState<{ [date: string]: number }>({});

  const [prayerTimes, setPrayerTimes] = useState([
    { name: 'Subuh', time: '04:42', active: false, completed: false },
    { name: 'Dzuhur', time: '12:02', active: true, completed: false },
    { name: 'Ashar', time: '15:24', active: false, completed: false },
    { name: 'Maghrib', time: '18:01', active: false, completed: false },
    { name: 'Isya', time: '19:12', active: false, completed: false },
  ]);

  const [nextPrayerInfo, setNextPrayerInfo] = useState<{
    name: string;
    time: string;
    countdown: string;
  } | null>(null);

  const prayerTimingsKey = prayerTimes.map((p) => `${p.name}:${p.time}`).join('|');

  // Sync active schedule with background prayer service
  useEffect(() => {
    if (prayerTimes && prayerTimes.length > 0) {
      PrayerBackgroundService.updateSchedule(
        prayerTimes.map((p) => ({ name: p.name, time: p.time, sound: prayerSounds[p.name as keyof PrayerSoundSettings] || 'adzan_makkah', })),
        city
      );
    }
  }, [prayerTimingsKey, city]);

  // Calculate Real-Time Next Prayer & Countdown based on Device Phone Clock & Timings
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const todayStr = getTodayDateStr(now);

      let upcomingPrayer: { name: string; time: string; targetDate: Date } | null = null;

      for (let i = 0; i < prayerTimes.length; i++) {
        const p = prayerTimes[i];
        const [h, m] = p.time.split(':').map(Number);
        const target = new Date();
        target.setHours(h, m, 0, 0);

        if (target.getTime() > now.getTime()) {
          upcomingPrayer = { name: p.name, time: p.time, targetDate: target };
          break;
        }
      }

      // If all prayers today passed, next prayer is tomorrow's Subuh
      if (!upcomingPrayer && prayerTimes.length > 0) {
        const subuh = prayerTimes[0];
        const [h, m] = subuh.time.split(':').map(Number);
        const tomorrowSubuh = new Date();
        tomorrowSubuh.setDate(now.getDate() + 1);
        tomorrowSubuh.setHours(h, m, 0, 0);
        upcomingPrayer = { name: subuh.name, time: subuh.time, targetDate: tomorrowSubuh };
      }

      if (upcomingPrayer) {
        const diffMs = upcomingPrayer.targetDate.getTime() - now.getTime();
        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        const pad = (n: number) => String(n).padStart(2, '0');
        const countdownStr = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

        const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzSuffix = tzName.includes('Makassar') || tzName.includes('Jayapura') ? 'WITA/WIT' : 'WIB';

        setNextPrayerInfo({
          name: upcomingPrayer.name,
          time: `${upcomingPrayer.time} ${tzSuffix}`,
          countdown: countdownStr,
        });

        if (stickyNotifEnabled) {
          NotificationService.updateOngoingNotification(
            upcomingPrayer.name,
            `${upcomingPrayer.time} ${tzSuffix}`,
            countdownStr,
            city
          );
        } else {
          NotificationService.dismissOngoingNotification();
        }
      }

      // Update active prayer status dynamically in prayerTimes list if selectedDate is today
      if (selectedDate === todayStr) {
        setPrayerTimes((prev) => {
          let foundNext = false;
          return prev.map((p) => {
            const [h, m] = p.time.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);

            let active = false;
            if (!foundNext && target.getTime() > now.getTime()) {
              active = true;
              foundNext = true;
            }
            return { ...p, active };
          });
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimingsKey, selectedDate, stickyNotifEnabled, city]);

  // Generate 7-day past history list
  useEffect(() => {
    const days: DayItem[] = [];
    const today = new Date();
    const todayStr = getTodayDateStr(today);

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = getTodayDateStr(d);

      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

      days.push({
        dateStr,
        dayName: dayNames[d.getDay()],
        dayNum: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        isToday: dateStr === todayStr,
      });
    }
    setHistoryDays(days);
  }, []);

  // Fetch 7-day history stats summary from database
  const fetchHistoryStats = async () => {
    try {
      const res = await apiClient.get(ENDPOINTS.PRAYER.HISTORY, { params: { days: 7 } });
      if (res.data?.data) {
        const statsMap: { [date: string]: number } = {};
        res.data.data.forEach((row: any) => {
          statsMap[row.date] = row.completed_count;
        });
        setHistoryStats(statsMap);
      }
    } catch (e) { }
  };

  // Fetch real prayer times & database prayer logs for selectedDate
  const fetchPrayerDataForDate = async (dateStr: string) => {
    try {
      // 1. Fetch Prayer Times using active calculationMethod (KEMENAG, MWL, ISNA, EGYPT, MAKKAH)
      const timesRes = await apiClient.get(ENDPOINTS.PRAYER.TIMES, {
        params: { lat: latitude, lng: longitude, method: calculationMethod, date: dateStr },
      });
      const timings = timesRes.data?.data?.timings;

      // 2. Fetch User Saved Logs from Database for selectedDate
      const logsRes = await apiClient.get(ENDPOINTS.PRAYER.LOGS, {
        params: { date: dateStr },
      });
      const savedLogs: any[] = logsRes.data?.data || [];
      const completedMap = new Set(
        savedLogs.filter((l) => l.completed).map((l) => l.prayer_name.toLowerCase())
      );

      const isTodaySelected = dateStr === getTodayDateStr();

      if (timings) {
        setPrayerTimes([
          { name: 'Subuh', time: timings.Fajr || '04:42', active: false, completed: completedMap.has('subuh') },
          { name: 'Dzuhur', time: timings.Dhuhr || '12:02', active: isTodaySelected, completed: completedMap.has('dzuhur') },
          { name: 'Ashar', time: timings.Asr || '15:24', active: false, completed: completedMap.has('ashar') },
          { name: 'Maghrib', time: timings.Maghrib || '18:01', active: false, completed: completedMap.has('maghrib') },
          { name: 'Isya', time: timings.Isha || '19:12', active: false, completed: completedMap.has('isya') },
        ]);
      }
    } catch (err) { }
  };

  useEffect(() => {
    fetchPrayerDataForDate(selectedDate);
    fetchHistoryStats();
  }, [latitude, longitude, selectedDate, calculationMethod]);

  // Handle Toggle Prayer Completion & Save to PostgreSQL Database
  const togglePrayerCompleted = async (index: number) => {
    const targetPrayer = prayerTimes[index];
    const newStatus = !targetPrayer.completed;

    // Optimistic UI Update
    const updated = [...prayerTimes];
    updated[index].completed = newStatus;
    setPrayerTimes(updated);

    // Save to Database `prayer_log` table
    try {
      await apiClient.post(ENDPOINTS.PRAYER.LOG, {
        prayer_name: targetPrayer.name,
        date: selectedDate,
        completed: newStatus,
      });
      fetchHistoryStats();
    } catch (error) {
      console.log('[PrayerLog] Failed to persist prayer log to database');
    }
  };

  const completedCount = prayerTimes.filter((p) => p.completed).length;

  return (
    <ScreenWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Banner Next Prayer */}
        <Card style={[styles.nextPrayerBanner, { backgroundColor: colors.primaryDark }]}>
          {/* Location & Reminder Settings Responsive Chips Row */}
          <View style={styles.headerChipsRow}>
            <TouchableOpacity
              style={styles.chipButton}
              onPress={() => setIsLocationModalOpen(true)}
              activeOpacity={0.8}
            >
              <MapPin color="#FDE047" size={14} />
              <Text style={styles.chipText} numberOfLines={1} ellipsizeMode="tail">
                {city}
              </Text>
              <ChevronRight color="#FDE047" size={14} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chipButton, styles.offsetChipButton]}
              onPress={() => setIsOffsetModalOpen(true)}
              activeOpacity={0.8}
            >
              <Bell color="#FDE047" size={13} />
              <Text style={styles.chipTextOffset}>
                {reminderOffsetMinutes === 0 ? 'Tepat Adzan' : `${reminderOffsetMinutes}m Sebelum`}
              </Text>
              <ChevronRight color="#FDE047" size={14} />
            </TouchableOpacity>
          </View>

          <Text style={styles.nextPrayerLabel}>Menuju Sholat {nextPrayerInfo?.name || 'Dzuhur'}</Text>
          <Text style={styles.countdownText}>{nextPrayerInfo?.countdown || '00:00:00'}</Text>
          <Text style={styles.nextPrayerTime}>Waktu: {nextPrayerInfo?.time || '12:02 WIB'}</Text>
        </Card>

        {/* Riwayat Sholat 7 Hari Selector */}
        <View style={styles.historyHeaderRow}>
          <CalendarIcon color={colors.primary} size={18} />
          <Text style={[styles.historyHeaderTitle, { color: colors.text }]}>Riwayat Sholat 7 Hari Terakhir</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorScroll}>
          {historyDays.map((item) => {
            const isSelected = item.dateStr === selectedDate;
            const completedCountForDay = historyStats[item.dateStr] || 0;

            return (
              <TouchableOpacity
                key={item.dateStr}
                style={[
                  styles.dayCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedDate(item.dateStr)}
                activeOpacity={0.85}
              >
                <Text style={[styles.dayCardName, { color: colors.textMuted }, isSelected && { color: '#FFFFFF' }]}>
                  {item.dayName}
                </Text>
                <Text style={[styles.dayCardNum, { color: colors.text }, isSelected && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                  {item.dayNum}
                </Text>

                <View style={styles.dayBadgeRow}>
                  <View
                    style={[
                      styles.dayDot,
                      { backgroundColor: completedCountForDay > 0 ? colors.success : colors.textMuted },
                      isSelected && { backgroundColor: '#FDE047' },
                    ]}
                  />
                  <Text style={[styles.dayBadgeText, { color: colors.textMuted }, isSelected && { color: '#FFFFFF' }]}>
                    {completedCountForDay}/5
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tracker Progress Bar */}
        <Card style={styles.trackerProgressCard}>
          <View style={styles.trackerHeader}>
            <Text style={[styles.trackerTitle, { color: colors.text }]}>
              Tracker ({selectedDate === getTodayDateStr() ? 'Hari Ini' : selectedDate})
            </Text>
            <Text style={[styles.trackerBadge, { color: colors.primary }]}>{completedCount} dari 5 Selesai</Text>
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
            <View style={[styles.progressBarFill, { width: `${(completedCount / 5) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </Card>

        {/* Schedule List & Tracker Toggle */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Jadwal Sholat ({selectedDate === getTodayDateStr() ? 'Hari Ini' : selectedDate})
        </Text>

        {prayerTimes.map((item, index) => (
          <Card
            key={index}
            style={[
              styles.prayerCard,
              item.active && { borderColor: colors.primary, borderWidth: 2, backgroundColor: isDarkMode ? '#065F46' : '#F0FDF4' },
            ]}
          >
            <TouchableOpacity
              style={styles.prayerInfo}
              onPress={guardAction(
                () => togglePrayerCompleted(index),
                () => setIsGuestModalOpen(true)
              )}
              activeOpacity={0.7}
            >
              {item.completed ? (
                <CheckCircle2 color={colors.success} size={22} />
              ) : (
                <Circle color={colors.textMuted} size={22} />
              )}
              <View style={styles.prayerNameContainer}>
                <Text style={[styles.prayerName, { color: colors.text }, item.active && { color: colors.primary, fontWeight: 'bold' }, item.completed && styles.completedText]}>
                  {item.name}
                </Text>
                {item.completed && <Text style={[styles.completedSubtext, { color: colors.success }]}>Telah dikerjakan</Text>}
              </View>
            </TouchableOpacity>

            <View style={styles.prayerRight}>
              <Text style={[styles.prayerTime, { color: colors.text }, item.active && { color: colors.primary }]}>
                {item.time}
              </Text>
              <TouchableOpacity
                style={{ padding: 4, marginLeft: 6, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => setActiveSoundModalPrayer(item.name as keyof PrayerSoundSettings)}
                activeOpacity={0.7}
              >
                <Volume2 color={item.active ? colors.accent : colors.primary} size={18} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Notif Settings Card */}
        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Notifikasi Adzan Otomatis</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Pengingat waktu 5 sholat wajib</Text>
            </View>
            <Switch
              value={notifAdzanEnabled}
              onValueChange={setNotifAdzanEnabled}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Notifikasi Menerus (Ongoing / Sticky)</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Pengingat terpajang terus di status bar HP (tidak bisa di-swipe hapus)
              </Text>
              {stickyNotifEnabled && Platform.OS === 'android' && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}
                  onPress={() => setIsBgPermissionModalOpen(true)}
                >
                </TouchableOpacity>
              )}
            </View>
            <Switch
              value={stickyNotifEnabled}
              onValueChange={handleToggleStickyNotif}
              trackColor={{ false: '#CBD5E1', true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>
      </ScrollView>

      {/* Adzan Sound Picker Modal */}
      <AdzanSoundPickerModal
        visible={!!activeSoundModalPrayer}
        prayerName={activeSoundModalPrayer}
        currentSoundId={activeSoundModalPrayer ? (prayerSounds[activeSoundModalPrayer] || 'adzan_makkah') : 'adzan_makkah'}
        onClose={() => setActiveSoundModalPrayer(null)}
        onSelectSound={async (pName, soundId) => {
          await setPrayerSound(pName, soundId);
          // Re-schedule adzan reminders with updated sounds
          NotificationService.scheduleAdzanReminders(prayerTimes, reminderOffsetMinutes, notifAdzanEnabled);
        }}
      />

      {/* Background Permission Modal for Battery Optimization Exemption */}
      <BackgroundPermissionModal
        visible={isBgPermissionModalOpen}
        onClose={() => setIsBgPermissionModalOpen(false)}
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />


      {/* Guest Guard Modal */}
      <GuestGuardModal
        visible={isGuestModalOpen}
        featureName="tracker sholat"
        onClose={() => setIsGuestModalOpen(false)}
        onNavigateRegister={() => { setIsGuestModalOpen(false); requestRegister(); }}
      />

      {/* Reminder Offset Modal Selector */}
      <Modal visible={isOffsetModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Waktu Pengingat Sebelum Adzan</Text>
              <TouchableOpacity onPress={() => setIsOffsetModalOpen(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            {REMINDER_OFFSETS.map((item) => (
              <TouchableOpacity
                key={item.minutes}
                style={[
                  styles.selectOptionRow,
                  { backgroundColor: colors.background },
                  reminderOffsetMinutes === item.minutes && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => {
                  setReminderOffsetMinutes(item.minutes);
                  setIsOffsetModalOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.selectOptionText,
                      { color: colors.text },
                      reminderOffsetMinutes === item.minutes && { color: colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.sub}</Text>
                </View>
                {reminderOffsetMinutes === item.minutes && <Check color={colors.primary} size={20} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  nextPrayerBanner: {
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 4,
  },
  headerChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    width: '100%',
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 3,
    marginVertical: 3,
    maxWidth: '65%',
  },
  offsetChipButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    maxWidth: '45%',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 4,
    flexShrink: 1,
  },
  chipTextOffset: {
    color: '#FDE047',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  nextPrayerLabel: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
    letterSpacing: 2,
  },
  nextPrayerTime: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  historyHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  daySelectorScroll: {
    marginBottom: SPACING.md,
    flexDirection: 'row',
  },
  dayCard: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: SPACING.xs,
    alignItems: 'center',
    minWidth: 74,
  },
  dayCardName: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayCardNum: {
    fontSize: 13,
    marginVertical: 2,
  },
  dayBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  trackerProgressCard: {
    marginBottom: SPACING.md,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  trackerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  trackerBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  prayerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xs,
  },
  prayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerNameContainer: {
    marginLeft: SPACING.sm,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedSubtext: {
    fontSize: 10,
    fontWeight: '500',
  },
  prayerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: SPACING.sm,
  },
  settingCard: {
    marginTop: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.xs,
  },
  selectOptionText: {
    fontSize: 14,
  },
});
