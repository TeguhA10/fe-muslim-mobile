import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ONGOING_NOTIF_ID = 'ongoing_prayer_time_notif';
const CHANNEL_ID = 'prayer-ongoing-channel';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static isChannelCreated = false;

  /**
   * Request notification permissions & set up Android notification channel
   */
  static async init() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Notification permission not granted');
        return false;
      }

      if (Platform.OS === 'android' && !this.isChannelCreated) {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Jadwal Sholat Menerus (Ongoing)',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#166534',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          sound: undefined,
        });
        this.isChannelCreated = true;
      }

      return true;
    } catch (e) {
      console.log('[NotificationService] Init error:', e);
      return false;
    }
  }

  /**
   * Present/Update real-time ongoing live notification with schedule & countdown directly in phone notification tray
   */
  static async updateOngoingNotification(
    prayerName: string,
    prayerTime: string,
    countdown: string,
    cityName: string
  ) {
    try {
      const title = `🕌 Menuju Sholat ${prayerName}`;
      const body = `Waktu: ${prayerTime} • Sisa Waktu: ${countdown}`;

      await Notifications.scheduleNotificationAsync({
        identifier: ONGOING_NOTIF_ID,
        content: {
          title,
          body,
          data: { type: 'ongoing_prayer' },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          sticky: true,
          autoDismiss: false,
        },
        trigger: null, // Present immediately!
      });
    } catch (e) {
      console.log('[NotificationService] Error updating ongoing notification:', e);
    }
  }

  /**
   * Dismiss ongoing live notification when disabled
   */
  static async dismissOngoingNotification() {
    try {
      await Notifications.dismissNotificationAsync(ONGOING_NOTIF_ID);
    } catch (e) {}
  }
}

// Auto-init on module import
NotificationService.init();
