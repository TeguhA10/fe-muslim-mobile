import { NativeModules, Platform } from 'react-native';

const { PrayerForegroundNativeService } = NativeModules;

export class NativePrayerService {
  /**
   * Start native 24/7 Foreground Service for Ongoing Prayer Notification
   */
  static startNativeService(prayers: { name: string; time: string }[], city: string) {
    if (Platform.OS !== 'android' || !PrayerForegroundNativeService) return;

    try {
      const prayersJson = JSON.stringify(prayers);
      PrayerForegroundNativeService.startService(prayersJson, city);
    } catch (e) {
      console.log('[NativePrayerService] Error starting native service:', e);
    }
  }

  static async scheduleAdzan(prayers: { name: string; time: string, sound: string }[]) {
    if (Platform.OS !== 'android' || !PrayerForegroundNativeService) return;

    try {
      const prayersJson = JSON.stringify(prayers);

      await PrayerForegroundNativeService.scheduleAdzan(prayersJson);
    } catch (e) {
      console.log('[NativePrayerService] Error scheduling adzan:', e);
    }
  }

  /**
   * Stop native Foreground Service
   */
  static stopPlayingAdzan() {
    if (Platform.OS !== 'android' || !PrayerForegroundNativeService) return;

    try {
      PrayerForegroundNativeService.stopPlayingAdzan();
    } catch (e) {
      console.log('[NativePrayerService] Error stopping native service:', e);
    }
  }

  /**
   * Stop native Foreground Service
   */
  static stopNativeService() {
    if (Platform.OS !== 'android' || !PrayerForegroundNativeService) return;

    try {
      PrayerForegroundNativeService.stopService();
    } catch (e) {
      console.log('[NativePrayerService] Error stopping native service:', e);
    }
  }
}
