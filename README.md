# 📱 Muslim Application - Mobile Frontend (`fe-muslim-mobile`)

[![React Native](https://img.shields.io/badge/React_Native-v0.79-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_53-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3-blue.svg)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-v5-brown.svg)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](#license)

Aplikasi Mobile Muslim modern berbasis **React Native** & **Expo SDK 53** (TypeScript) dengan arsitektur *Domain-Driven Feature-Based*. Aplikasi ini menyediakan fitur lengkap meliputi Jadwal Sholat presisi, Native Android Foreground Service 24/7, Android Home Screen Widget (Geometris Islami), Kompas Kiblat 3D/Sensors, Peta Masjid Terdekat (OpenStreetMap + Leaflet), Social Feed Komunitas Muslim, Kalender Hijriah & Notifikasi Push Adzan Real-Time.

Didesain dengan keandalan sesi tinggi (*Offline Session Resilience*) dan optimasi performa tinggi untuk kelancaran scrolling 60 FPS di seluruh perangkat HP Android dan iOS.

---

## ✨ Fitur-Fitur Utama & Keunggulan UI/UX

- 🕌 **Native Android 24/7 Foreground Service & Ongoing Countdown**:
  - Dibuat dengan modul **Native Kotlin** (`PrayerForegroundService.kt`) di tingkat OS Android (`startForeground`).
  - Menampilkan *countdown real-time* (hitung mundur jam:menit:detik) yang **tetap berjalan 24/7 di status bar HP meskipun aplikasi ditutup / di-clear dari recent apps**.
  - Kompatibel penuh dengan keamanan **Android 14 (API 34)** (`FOREGROUND_SERVICE_SPECIAL_USE`).
  - Dilengkapi `BootReceiver` yang otomatis menyalakan kembali countdown saat HP di-restart.

- 📲 **Widget Layar Utama HP (Android Home Screen AppWidget)**:
  - Menggunakan `react-native-android-widget` dengan pola geometris Bintang 8 & Heksagon Islami (`IslamicTexture`).
  - Menampilkan estimasi waktu sholat berikutnya, lokasi kota (`📍 Jakarta`), dan hitung mundur menit yang halus tanpa berkedip.
  - Diselaraskan secara otomatis oleh Native Service Kotlin setiap 60 detik.

- ⚡ **Direct Intent Permission Launchers**:
  - Peluncuran dialog izin sistem resmi **1-Tap "Abaikan Penghemat Baterai"** (`ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`).
  - Navigasi langsung ke **Halaman Setelan Notifikasi App** (`APP_NOTIFICATION_SETTINGS`) dan **Izin Tampilkan di Atas App Lain** (`MANAGE_OVERLAY_PERMISSION`).

- 🔒 **Sesi & Keamanan Kredensial Terenkripsi (RFC 6585)**:
  - Penyimpanan token autentikasi memanfaatkan **Android KeyStore & iOS Keychain** (`expo-secure-store`).
  - *Interceptor Axios* dengan proteksi RFC 6585: HANYA melakukan `logout()` otomatis jika refresh token mengembalikan HTTP `401 Unauthorized`. Kesalahan jaringan atau HTTP `429 Rate Limit` tidak akan pernah merusak sesi login pengguna.

- 🕋 **Kompas Arah Kiblat (Qibla Finder)**:
  - Penentuan arah Kiblat presisi menggunakan kalkulasi *Great-Circle Distance / Spherical Trigonometry*.
  - Menggunakan sensor Magnetometer & Accelerometer perangkat HP dengan **Petunjuk Visual Kalibrasi Angka 8**.

- 🗺️ **Peta Masjid Terdekat (Mosque Finder)**:
  - Peta Interaktif **Leaflet + OpenStreetMap** dalam WebView (tanpa memerlukan Google Maps API Key).
  - Integrasi pencarian geospasial **PostGIS** sub-milidetik dari server backend.

- 📱 **Social Feed & Komunitas Muslim**:
  - Garis waktu (Timeline Feed) postingan komunitas Muslim dengan **Optimistic UI Updates**.
  - Dukungan **Direct Presigned Image Upload** langsung dari HP ke Cloudinary CDN.
  - Komentar Bertingkat (*Nested Reply*) dan modal zoom viewer gambar (*ImageViewerModal*).

- 🔔 **Notifikasi Push & Alarm Adzan**:
  - Notifikasi pengingat & alarm adzan via **Native Android Foreground Service** & **Socket.IO Realtime**.

---

## 🛠️ Tech Stack & Teknologi

| Kategori | Teknologi / Library |
| :--- | :--- |
| **Framework & Engine** | React Native (Expo SDK 53), Native Android Kotlin Modules |
| **Bahasa Pemrograman** | TypeScript, Kotlin (Android Native) |
| **Widget HP** | `react-native-android-widget` (AppWidget RemoteViews) |
| **Navigasi** | React Navigation v7 (Bottom Tabs & Native Stack) |
| **State Management** | Zustand (Global App State), TanStack React Query v5 |
| **Secure Storage** | `expo-secure-store` (Android KeyStore / iOS Keychain) |
| **Peta & Lokasi** | Leaflet JS via `react-native-webview`, OpenStreetMap, `expo-location` |
| **Sensors & Device Services**| `expo-sensors` (Magnetometer), `expo-notifications`, `expo-intent-launcher` |
| **Icons & Design System** | Lucide React Native, Custom Emerald & Gold Design Token |
| **HTTP & Realtime Client** | Axios dengan Interceptor Token RFC 6585 & Socket.IO Client |

---

## 🌐 Integrasi API Pihak Ketiga (Third-Party APIs)

| Layanan API | Integration Point | Fungsi & Penggunaan |
| :--- | :--- | :--- |
| **Aladhan Prayer Times API** | Server Backend Proxy (`/prayer/times`) | Sumber data kalkulasi waktu sholat 5 waktu & penanggalan Hijriah presisi berdasarkan koordinat lokasi GPS. |
| **OpenStreetMap & Leaflet Tile API** | `react-native-webview` (Leaflet) | Peta peta geospasial lokasi masjid terdekat tanpa biaya API Key Google Maps. |
| **Cloudinary Media API** | `GET /posts/upload-signature` | *Direct Presigned Image Upload* dari kamera HP langsung ke CDN Cloudinary. |
| **Google OAuth Sign-In API** | `@react-native-google-signin/google-signin` | Autentikasi pendaftaran & login cepat menggunakan akun Google di HP. |
| **Socket.IO Realtime API** | `SocketService.ts` | Koneksi WebSocket real-time untuk pembaruan unread counter notifikasi secara instan. |

---

## 🏗️ Arsitektur Proyek (Domain-Driven Feature-Based)

```
fe-muslim-mobile/
├── android/                    # Android Native Source (Kotlin ForegroundService, Widget, Manifest)
│   └── app/src/main/java/com/muslimapp/mobile/
│       └── service/            # PrayerForegroundService.kt, PrayerForegroundModule.kt, BootReceiver.kt
├── assets/                     # Asset Gambar, Logo, Sound Adzan, & Splash Screen
├── src/
│   ├── api/                    # Configuration Axios Client & API Endpoints
│   ├── components/             # Reusable Global UI (Button, Card, Input, MandatoryPermissionGateModal)
│   ├── constants/              # Design Tokens (Emerald & Gold Palette, Typography, Storage Keys)
│   ├── features/               # Feature Modules (Domain-Driven)
│   │   ├── adzan/              # Jadwal Sholat, Countdown, Checkbox Riwayat 7 Hari
│   │   ├── auth/               # Screen Login, Register, OTP, & Forgot Password
│   │   ├── home/               # Social Feed, Post Card, Post Detail, Komentar & Zoom Viewer
│   │   ├── ibadah/             # Screen Kompas Kiblat & Calibration Hint
│   │   ├── maps/               # Screen Peta Masjid (Leaflet WebView), Detail & Modal Review
│   │   ├── notifications/      # Screen Top Bar Notifikasi Redesign & History List
│   │   └── profile/            # Screen Profil User, Edit Profile, Settings & Trash Posts
│   ├── hooks/                  # Custom Hooks (useAuth, useLocation, useQibla, useGuestGuard)
│   ├── navigation/             # MainTabNavigator (Bottom Tabs) & RootNavigator (Stack Navigation)
│   ├── services/               # Device Services (Location, Native Prayer Service, Background Permission)
│   ├── store/                  # Global State Zustand (Auth Store, Settings Store, Theme Store)
│   ├── widgets/                # AppWidget RemoteViews UI (PrayerWidgetTaskHandler.tsx)
│   └── utils/                  # Secure Storage Wrapper, Trigonometri Kiblat, Date Formatters
├── .env.local                  # Environment Config Mode Local
├── .env.staging                # Environment Config Mode Staging
├── .env.production             # Environment Config Mode Production
├── app.json                    # Expo Application Configuration
├── eas.json                    # EAS Build Profiles (development, preview, production)
└── package.json
```

---

## ⚙️ Variabel Lingkungan (`.env`)

Aplikasi mendukung multi-mode environment (`.env.local`, `.env.staging`, `.env.production`):

```env
# Mode Lingkungan Active (development | staging | production)
EXPO_PUBLIC_ENV=development

# URL Endpoint API Backend
# - Android Emulator : http://10.0.2.2:5000/api/v1
# - iOS / Web        : http://localhost:5000/api/v1
# - HP Fisik (WiFi)  : http://192.168.x.x:5000/api/v1
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 💻 Cara Menjalankan Aplikasi

### Prasyarat:
- **Node.js** (v18 atau v20+)
- **Expo Go App** (di HP) atau Android Emulator / iOS Simulator.

### Langkah Menjalankan:

1. **Clone Repository & Masuk ke Direktori**:
   ```bash
   git clone https://github.com/TeguhA10/fe-muslim-mobile.git
   cd fe-muslim-mobile
   ```

2. **Install Dependency**:
   ```bash
   npm install
   ```

3. **Jalankan App versi Native (Android)**:
   ```bash
   npm run android
   ```

4. **Buka di Perangkat**:
   - **HP Fisik**: Scan QR Code di terminal menggunakan aplikasi **Expo Go**.
   - **Android Emulator**: Tekan `a` di terminal.
   - **iOS Simulator**: Tekan `i` di terminal.
   - **Web Browser**: Tekan `w` di terminal.

---

## 📦 Build Standalone APK / Bundle (EAS Build)

Bangun file APK Android untuk pengujian staging atau rilis produksi:

```bash
# Build APK Android Staging Preview
eas build --platform android --profile preview

# Build AAB Android Production Play Store
eas build --platform android --profile production
```

---

## 📜 Skrip NPM yang Tersedia

| Skrip | Deskripsi |
| :--- | :--- |
| `npm start` | Menjalankan Metro Bundler Expo |
| `npm run android` | Kompilasi & Jalankan di Emulator/HP Android Native |
| `npm run ios` | Menjalankan di Simulator iOS |
| `npm run web` | Menjalankan versi Web Expo |
| `npm run lint` | Menjalankan pengecekan ESLint & TypeScript |

---

## 📄 Lisensi

Distributed under the **ISC License**. Lihat `LICENSE` untuk informasi lebih lanjut.
