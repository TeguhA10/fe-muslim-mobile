import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './notification.service';
import { useSettingsStore } from '../store/useSettingsStore';

export interface SimplePrayerTime {
  name: string;
  time: string;
}

const PRAYER_SCHEDULE_CACHE_KEY = 'prayer_bg_schedule_cache';

export class PrayerBackgroundService {
  private static timerId: NodeJS.Timeout | null = null;
  private static prayerTimes: SimplePrayerTime[] = [];
  private static currentCity: string = 'Jakarta';
  private static appState: AppStateStatus = AppState.currentState;
  private static isInitialized = false;

  /**
   * Initialize global Prayer Background Service
   */
  static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Restore cached prayer schedule if available
    await this.restoreCachedSchedule();

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
  static runCountdownCycle() {
    const isStickyEnabled = useSettingsStore.getState().stickyNotifEnabled;

    if (!isStickyEnabled) {
      NotificationService.dismissOngoingNotification();
      return;
    }


    if (!this.prayerTimes || this.prayerTimes.length === 0) return;

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
    }
  }
}

// Auto-initialize background service
PrayerBackgroundService.init();
