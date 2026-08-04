import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Clock, MapPin, ChevronRight, Sparkles } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useLocationStore } from '../../store/useLocationStore';
import { SPACING } from '../../constants/theme';

interface PrayerTimeItem {
  name: string;
  time: string;
  isNext: boolean;
}

interface PrayerCountdownWidgetProps {
  onPressWidget?: () => void;
  onPressLocation?: () => void;
}

export const PrayerCountdownWidget: React.FC<PrayerCountdownWidgetProps> = ({
  onPressWidget,
  onPressLocation,
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const { city } = useLocationStore();

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeItem[]>([
    { name: 'Subuh', time: '04:42', isNext: false },
    { name: 'Dzuhur', time: '12:02', isNext: false },
    { name: 'Ashar', time: '15:24', isNext: false },
    { name: 'Maghrib', time: '18:01', isNext: true },
    { name: 'Isya', time: '19:12', isNext: false },
  ]);

  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    countdown: string;
  }>({
    name: 'Maghrib',
    time: '18:01 WIB',
    countdown: '00:00:00',
  });

  const getTodayDateStr = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Real-time 1-second countdown calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let upcoming: { name: string; time: string; targetDate: Date } | null = null;
      let upcomingIndex = -1;

      for (let i = 0; i < prayerTimes.length; i++) {
        const p = prayerTimes[i];
        const [h, m] = p.time.split(':').map(Number);
        const target = new Date();
        target.setHours(h, m, 0, 0);

        if (target.getTime() > now.getTime()) {
          upcoming = { name: p.name, time: p.time, targetDate: target };
          upcomingIndex = i;
          break;
        }
      }

      // If all passed today, next is tomorrow's Subuh
      if (!upcoming && prayerTimes.length > 0) {
        const subuh = prayerTimes[0];
        const [h, m] = subuh.time.split(':').map(Number);
        const tomorrowSubuh = new Date();
        tomorrowSubuh.setDate(now.getDate() + 1);
        tomorrowSubuh.setHours(h, m, 0, 0);
        upcoming = { name: subuh.name, time: subuh.time, targetDate: tomorrowSubuh };
        upcomingIndex = 0;
      }

      if (upcoming) {
        const diffMs = upcoming.targetDate.getTime() - now.getTime();
        const totalSec = Math.max(0, Math.floor(diffMs / 1000));
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        const pad = (n: number) => String(n).padStart(2, '0');
        const countdownStr = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

        const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const tzSuffix = tzName.includes('Makassar') || tzName.includes('Jayapura') ? 'WITA' : 'WIB';

        setNextPrayer({
          name: upcoming.name,
          time: `${upcoming.time} ${tzSuffix}`,
          countdown: countdownStr,
        });

        // Update active highlight indicator
        setPrayerTimes((prev) =>
          prev.map((item, idx) => ({
            ...item,
            isNext: idx === upcomingIndex,
          }))
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes.map((p) => p.time).join('|')]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressWidget}
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#1E293B' : '#059669',
          borderColor: isDarkMode ? '#334155' : '#047857',
        },
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationContainer}
          onPress={onPressLocation}
          activeOpacity={0.8}
        >
          <MapPin size={14} color="#FDE047" />
          <Text style={styles.locationText} numberOfLines={1}>
            {city || 'Jakarta'}
          </Text>
          <ChevronRight size={14} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>

        <View style={styles.dateBadge}>
          <Sparkles size={12} color="#F59E0B" />
          <Text style={styles.dateText}>Kalender Hijriah</Text>
        </View>
      </View>

      {/* Center Countdown Display */}
      <View style={styles.centerBox}>
        <View style={styles.prayerInfoLeft}>
          <Text style={styles.nextPrayerLabel}>Menuju Adzan {nextPrayer.name}</Text>
          <Text style={styles.nextPrayerTime}>{nextPrayer.time}</Text>
        </View>

        <View style={styles.countdownBadge}>
          <Clock size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.countdownText}>{nextPrayer.countdown}</Text>
        </View>
      </View>

      {/* Bottom 5 Prayer Grid */}
      <View style={styles.prayerGrid}>
        {prayerTimes.map((item) => (
          <View
            key={item.name}
            style={[
              styles.prayerItem,
              item.isNext && {
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                borderColor: '#FDE047',
              },
            ]}
          >
            <Text style={[styles.prayerName, item.isNext && { color: '#FDE047', fontWeight: '700' }]}>
              {item.name}
            </Text>
            <Text style={[styles.prayerTime, item.isNext && { color: '#FFFFFF', fontWeight: '700' }]}>
              {item.time}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 4,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 11,
    color: '#F3F4F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  centerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: SPACING.xs,
    paddingVertical: 4,
  },
  prayerInfoLeft: {
    flex: 1,
  },
  nextPrayerLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  nextPrayerTime: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  prayerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  prayerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 8,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  prayerName: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  prayerTime: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    marginTop: 2,
  },
});
