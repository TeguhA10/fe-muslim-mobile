import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { useNotificationStore } from '../store/useNotificationStore';

const ONGOING_NOTIF_ID = 'ongoing_prayer_time_notif';
const PRAYER_CHANNEL_ID = 'prayer-ongoing-channel';
const SOCIAL_CHANNEL_ID = 'social-interactions-channel';

// Configure foreground notification behavior (Show banner in phone status bar when app active)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static isChannelCreated = false;
  private static pushToken: string | null = null;
  private static listenersAttached = false;

  /**
   * Request notification permissions & set up Android notification channels
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
        // Ongoing prayer channel
        await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
          name: 'Jadwal Sholat Menerus (Ongoing)',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#166534',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          sound: undefined,
        });

        // Social & General notification channel
        await Notifications.setNotificationChannelAsync(SOCIAL_CHANNEL_ID, {
          name: 'Notifikasi Komunitas & Sosial',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4AF37',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        this.isChannelCreated = true;
      }

      this.setupNotificationListeners();
      return true;
    } catch (e) {
      console.log('[NotificationService] Init error:', e);
      return false;
    }
  }

  /**
   * Setup real-time push notification listeners
   */
  static setupNotificationListeners() {
    if (this.listenersAttached) return;

    // 1. Triggered when notification is received in foreground
    Notifications.addNotificationReceivedListener(() => {
      console.log('[NotificationService] Real-time push notification received');
      useNotificationStore.getState().fetchUnreadCount();
      useNotificationStore.getState().fetchNotifications(1, true);
    });

    // 2. Triggered when user taps on push notification in status bar tray
    Notifications.addNotificationResponseReceivedListener(() => {
      console.log('[NotificationService] Status bar notification tapped');
      useNotificationStore.getState().fetchUnreadCount();
      useNotificationStore.getState().fetchNotifications(1, true);
    });

    this.listenersAttached = true;
  }

  /**
   * Obtain Expo Push Token and send to backend API
   */
  static async registerPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.init();
      if (!hasPermission) return null;

      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (!tokenData?.data) return null;

      const token = tokenData.data;
      this.pushToken = token;

      // Send push token to backend
      await apiClient.post(ENDPOINTS.NOTIFICATIONS.PUSH_TOKEN, { token }).catch(() => {});
      console.log('[NotificationService] Registered push token:', token);
      return token;
    } catch (e) {
      console.log('[NotificationService] Error registering push token:', e);
      return null;
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
