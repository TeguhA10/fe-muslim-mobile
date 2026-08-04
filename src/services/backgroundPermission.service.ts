import { Platform, Linking, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

export class BackgroundPermissionService {
  /**
   * Request Android OS to ignore battery optimization for Muslim App
   * (Pemberitahuan resmi Penghemat Baterai Tanpa Pembatasan)
   * Shows direct system prompt dialog with "IZINKAN" button!
   */
  static async requestIgnoreBatteryOptimizations() {
    if (Platform.OS !== 'android') return;

    try {
      // 1. Direct system prompt dialog for package com.muslimapp.mobile
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        {
          data: 'package:com.muslimapp.mobile',
        }
      );
    } catch (e) {
      // Fallback 1: Open Ignore Battery Optimization Settings list page directly
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
        );
      } catch (e2) {
        // Fallback 2: Open App Details Settings
        this.openAppSettings();
      }
    }
  }

  /**
   * Open App Notification settings page directly for com.muslimapp.mobile
   */
  static async openNotificationSettings() {
    if (Platform.OS !== 'android') {
      Linking.openSettings();
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        'android.settings.APP_NOTIFICATION_SETTINGS',
        {
          extra: {
            'android.provider.extra.APP_PACKAGE': 'com.muslimapp.mobile',
          },
        }
      );
    } catch (e) {
      this.openAppSettings();
    }
  }

  /**
   * Open "Display Over Other Apps" / "Appear on Top" settings page directly
   */
  static async openOverlaySettings() {
    if (Platform.OS !== 'android') {
      Linking.openSettings();
      return;
    }

    try {
      await IntentLauncher.startActivityAsync(
        'android.settings.action.MANAGE_OVERLAY_PERMISSION',
        {
          data: 'package:com.muslimapp.mobile',
        }
      );
    } catch (e) {
      this.openAppSettings();
    }
  }

  /**
   * Open App Details settings page in Android Settings
   */
  static openAppSettings() {
    if (Platform.OS === 'android') {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: 'package:com.muslimapp.mobile' }
      ).catch(() => {
        Linking.openSettings();
      });
    } else {
      Linking.openSettings();
    }
  }

  /**
   * Guide user on vendor-specific Auto-Start / Background permissions (Xiaomi, Samsung, Oppo, Vivo)
   */
  static showBackgroundOptimizationGuide() {
    Alert.alert(
      '⚡ Izin Latar Belakang & Widget',
      'Agar notifikasi adzan & widget HP tetap aktif saat aplikasi ditutup:\n\n' +
        '1. Pilih "Penghemat Baterai" -> Pilih "Tanpa Pembatasan" (Unrestricted).\n' +
        '2. Aktifkan "Mulai Otomatis" (Auto-Start) jika tersedia di HP Anda (Xiaomi/Oppo/Vivo/Realme).',
      [
        {
          text: 'Atur Baterai',
          onPress: () => this.requestIgnoreBatteryOptimizations(),
        },
        {
          text: 'Buka Pengaturan App',
          onPress: () => this.openAppSettings(),
        },
        {
          text: 'Tutup',
          style: 'cancel',
        },
      ]
    );
  }
}
