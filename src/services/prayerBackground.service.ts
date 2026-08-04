import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { NotificationService } from './notification.service';
import { useSettingsStore } from '../store/useSettingsStore';
import { PrayerWidgetUi, getPrayerWidgetData } from '../widgets/PrayerWidgetTaskHandler';
import { NativePrayerService } from './nativePrayerService';

export interface SimplePrayerTime {
  name: string;
  time: string;
}

const PRAYER_SCHEDULE_CACHE_KEY = 'prayer_bg_schedule_cache';
const PRAYER_BG_TASK = 'BACKGROUND_PRAYER_TASK';

// Define Headless Background Task that persists after app termination
TaskManager.defineTask(PRAYER_BG_TASK, async () => {
  try {
    PrayerBackgroundService.runCountdownCycle();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register background task
BackgroundFetch.registerTaskAsync(PRAYER_BG_TASK, {
  minimumInterval: 60 * 15, // 15 minutes
  stopOnTerminate: false, // Continue after app close!
  startOnBoot: true, // Start on phone reboot!
}).catch(() => {});

export class PrayerBackgroundService {
  private static timerId: NodeJS.Timeout | null = null;
  private static prayerTimes: SimplePrayerTime[] = [];
  private static currentCity: string = 'Jakarta';
  private static appState: AppStateStatus = AppState.currentState;
  private static isInitialized = false;
  private static lastWidgetUpdate = 0;

  /**
   * Initialize global Prayer Background Service
   */
  static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Restore cached prayer schedule if available
    await this.restoreCachedSchedule();

    const isStickyEnabled = useSettingsStore.getState().stickyNotifEnabled;
    if (isStickyEnabled && this.prayerTimes && this.prayerTimes.length > 0) {
      NativePrayerService.startNativeService(this.prayerTimes, this.currentCity);
    } else if (!isStickyEnabled) {
      NativePrayerService.stopNativeService();
    }

    // Listen to App state changes (Foreground / Background / Inactive)
    AppState.addEventListener('change', (nextAppState) => {
      this.appState = nextAppState;
      if (nextAppState === 'active') {
        // Immediate sync when returning to app
        this.runCountdownCycle();
      }
    });

    // Start 1-second timer cycle
    this.startLoop();
  }

  /**
   * Directly enable or disable Native Foreground Service toggle
   */
  static async enableNativeService(enabled: boolean) {
    if (enabled) {
      if (!this.prayerTimes || this.prayerTimes.length === 0) {
        await this.restoreCachedSchedule();
      }

      if (!this.prayerTimes || this.prayerTimes.length === 0) {
        this.prayerTimes = [
          { name: 'Subuh', time: '04:42' },
          { name: 'Dzuhur', time: '12:02' },
          { name: 'Ashar', time: '15:24' },
          { name: 'Maghrib', time: '18:01' },
          { name: 'Isya', time: '19:12' },
        ];
      }

      NativePrayerService.startNativeService(this.prayerTimes, this.currentCity);
    } else {
      NativePrayerService.stopNativeService();
      NotificationService.dismissOngoingNotification();
    }
  }

  /**
   * Update active prayer schedule and persist locally
   */
  static async updateSchedule(prayers: SimplePrayerTime[], city: string) {
    if (!prayers || prayers.length === 0) return;
    this.prayerTimes = prayers;
    this.currentCity = city;

    try {
      await AsyncStorage.setItem(
        PRAYER_SCHEDULE_CACHE_KEY,
        JSON.stringify({ prayers, city, timestamp: Date.now() })
      );
    } catch (e) {}

    const { reminderOffsetMinutes, notifAdzanEnabled, stickyNotifEnabled } = useSettingsStore.getState();

    // Schedule exact adzan & pre-adzan offset alarm notifications
    NotificationService.scheduleAdzanReminders(prayers, reminderOffsetMinutes, notifAdzanEnabled);

    if (stickyNotifEnabled) {
      // Trigger Native Android Foreground Service for 24/7 background countdown
      NativePrayerService.startNativeService(prayers, city);
    } else {
      NativePrayerService.stopNativeService();
    }

    // Trigger immediate countdown update
    this.runCountdownCycle();
  }

  /**
   * Restore schedule from local storage
   */
  private static async restoreCachedSchedule() {
    try {
      const raw = await AsyncStorage.getItem(PRAYER_SCHEDULE_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.prayers && Array.isArray(parsed.prayers)) {
          this.prayerTimes = parsed.prayers;
          this.currentCity = parsed.city || 'Jakarta';
        }
      }
    } catch (e) {}
  }

  /**
   * Start 1-second interval loop
   */
  private static startLoop() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.runCountdownCycle();
    }, 1000);
  }

  /**
   * Stop loop
   */
  static stopLoop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Execute 1 cycle of countdown calculation & update sticky notification
   */
  static async runCountdownCycle() {
    const isStickyEnabled = useSettingsStore.getState().stickyNotifEnabled;

    if (!isStickyEnabled) {
      NotificationService.dismissOngoingNotification();
      NativePrayerService.stopNativeService();
      return;
    }

    if (!this.prayerTimes || this.prayerTimes.length === 0) {
      await this.restoreCachedSchedule();
    }

    if (!this.prayerTimes || this.prayerTimes.length === 0) {
      this.prayerTimes = [
        { name: 'Subuh', time: '04:42' },
        { name: 'Dzuhur', time: '12:02' },
        { name: 'Ashar', time: '15:24' },
        { name: 'Maghrib', time: '18:01' },
        { name: 'Isya', time: '19:12' },
      ];
    }

    const now = new Date();
    let upcoming: { name: string; time: string; targetDate: Date } | null = null;

    for (let i = 0; i < this.prayerTimes.length; i++) {
      const p = this.prayerTimes[i];
      if (!p.time) continue;
      const [h, m] = p.time.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, 0, 0);

      if (target.getTime() > now.getTime()) {
        upcoming = { name: p.name, time: p.time, targetDate: target };
        break;
      }
    }

    // If all prayers today passed, next is Subuh tomorrow
    if (!upcoming && this.prayerTimes.length > 0) {
      const subuh = this.prayerTimes[0];
      if (subuh && subuh.time) {
        const [h, m] = subuh.time.split(':').map(Number);
        const tomorrowSubuh = new Date();
        tomorrowSubuh.setDate(now.getDate() + 1);
        tomorrowSubuh.setHours(h, m, 0, 0);
        upcoming = { name: subuh.name, time: subuh.time, targetDate: tomorrowSubuh };
      }
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
      const tzSuffix = tzName.includes('Makassar') || tzName.includes('Jayapura') ? 'WITA/WIT' : 'WIB';
      const formattedTime = `${upcoming.time} ${tzSuffix}`;

      // Update sticky ongoing notification tray in status bar
      NotificationService.updateOngoingNotification(
        upcoming.name,
        formattedTime,
        countdownStr,
        this.currentCity
      );

      // Update Android launcher home screen widget once per minute
      if (secs === 0 || !this.lastWidgetUpdate || Date.now() - this.lastWidgetUpdate > 60000) {
        this.lastWidgetUpdate = Date.now();
        getPrayerWidgetData().then((widgetData) => {
          requestWidgetUpdate({
            widgetName: 'PrayerWidget',
            renderWidget: () => React.createElement(PrayerWidgetUi, widgetData as any),
            widgetNotFound: () => {},
          }).catch(() => {});
        }).catch(() => {});
      }
    }
  }
}

// Auto-initialize background service
PrayerBackgroundService.init();
