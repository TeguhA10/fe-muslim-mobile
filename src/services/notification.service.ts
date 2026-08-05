import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';

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
   * Immediately present a heads-up local status bar notification banner on phone status bar
   */
  static async presentLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: data || {},
        },
        trigger: null,
      });
    } catch (e) {
      console.log('[NotificationService] Error presenting local status bar notification:', e);
    }
  }

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
    Notifications.addNotificationReceivedListener((notification) => {
      const notifData = notification?.request?.content?.data;
      const notifId = notification?.request?.identifier;
      if (notifId === ONGOING_NOTIF_ID || notifData?.type === 'ongoing_prayer') {
        return;
      }

      if (!useAuthStore.getState().isAuthenticated) return;

      console.log('[NotificationService] Real-time push notification received');
      useNotificationStore.getState().fetchUnreadCount();
      useNotificationStore.getState().fetchNotifications(1, true);
    });

    // 2. Triggered when user taps on push notification in status bar tray
    Notifications.addNotificationResponseReceivedListener((response) => {
      const notifData = response?.notification?.request?.content?.data;
      const notifId = response?.notification?.request?.identifier;
      if (notifId === ONGOING_NOTIF_ID || notifData?.type === 'ongoing_prayer') {
        return;
      }

      if (!useAuthStore.getState().isAuthenticated) return;

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
      if (!useAuthStore.getState().isAuthenticated) return null;

      const hasPermission = await this.init();
      if (!hasPermission) return null;

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        'c7cd9c62-3999-4ff0-943f-80acd6e5578f';

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      ).catch((err) => {
        console.log('[NotificationService] Failed to get Expo push token:', err?.message || err);
        return null;
      });
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
      // Dismiss legacy duplicate Expo JS notification if present
      await Notifications.dismissNotificationAsync(ONGOING_NOTIF_ID).catch(() => {});
    } catch (e) {
      console.log('[NotificationService] Error updating ongoing notification:', e);
    }
  }

  /**
   * Schedule pre-adzan and adzan alarm notifications based on user's reminder offset
   */
  /**
   * Schedule pre-adzan and adzan alarm notifications based on user's reminder offset & selected prayer sounds
   */
  static async scheduleAdzanReminders(
    prayers: { name: string; time: string }[],
    offsetMinutes: number = 10,
    adzanNotifEnabled: boolean = true
  ) {
    if (!adzanNotifEnabled || !prayers || prayers.length === 0) return;

    try {
      const { prayerSounds } = useSettingsStore.getState();

      // Clear previously scheduled adzan alarm notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.data?.type === 'adzan_alarm' || notif.content.data?.type === 'pre_adzan_alarm') {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier).catch(() => {});
        }
      }

      const now = new Date();

      for (const p of prayers) {
        if (!p.time) continue;
        const [h, m] = p.time.split(':').map(Number);
        const pSoundKey = p.name as keyof typeof prayerSounds;
        const soundChoice = (prayerSounds && prayerSounds[pSoundKey]) || 'adzan_makkah';

        // 1. Exact Adzan Time Notification
        const adzanTime = new Date();
        adzanTime.setHours(h, m, 0, 0);

        if (adzanTime.getTime() > now.getTime()) {
          const isSilent = soundChoice === 'silent';
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🕌 Waktu Sholat ${p.name} Telah Tiba!`,
              body: `Saatnya menunaikan ibadah sholat ${p.name} (${p.time}).`,
              sound: isSilent ? undefined : 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              data: { type: 'adzan_alarm', prayerName: p.name, soundChoice },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: adzanTime,
            },
          }).catch(() => {});
        }

        // 2. Pre-Adzan Reminder Notification (e.g. 5, 10, 15 minutes before)
        if (offsetMinutes > 0) {
          const preAdzanTime = new Date(adzanTime.getTime() - offsetMinutes * 60 * 1000);
          if (preAdzanTime.getTime() > now.getTime()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `⏰ ${offsetMinutes} Menit Menuju Sholat ${p.name}`,
                body: `Persiapkan diri Anda untuk menunaikan sholat ${p.name} pada pukul ${p.time}.`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: { type: 'pre_adzan_alarm', prayerName: p.name },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: preAdzanTime,
              },
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.log('[NotificationService] Error scheduling adzan reminders:', e);
    }
  }

  /**
   * Dismiss ongoing live notification when disabled
   */
  static async dismissOngoingNotification() {
    try {
      await Notifications.dismissNotificationAsync(ONGOING_NOTIF_ID).catch(() => {});
    } catch (e) {}
  }
}

// Auto-init on module import
NotificationService.init();
