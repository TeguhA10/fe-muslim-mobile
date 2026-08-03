# 📱 Muslim Application - Mobile Frontend (`fe-muslim-mobile`)

[![React Native](https://img.shields.io/badge/React_Native-v0.79-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_53-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3-blue.svg)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-v5-brown.svg)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](#license)

Aplikasi Mobile Muslim modern berbasis **React Native** & **Expo SDK 53** (TypeScript) dengan arsitektur *Domain-Driven Feature-Based*. Aplikasi ini menyediakan fitur lengkap meliputi Jadwal Sholat presisi, Kompas Kiblat 3D/Sensors, Peta Masjid Terdekat (OpenStreetMap + Leaflet), Social Feed Komunitas Muslim, Kalender Hijriah & Notifikasi Push Adzan Real-Time.

Didesain dengan keandalan sesi tinggi (*Offline Session Persistence*) dan optimasi performa tinggi untuk kelancaran scrolling 60 FPS di seluruh perangkat HP Android dan iOS.

---

## ✨ Fitur-Fitur Utama & Keunggulan UI/UX

- 🕌 **Jadwal Sholat Real-time & Countdowns**:
  - Perhitungan waktu sholat berdasarkan koordinat lokasi GPS secara otomatis dengan penanganan zona waktu lokal presisi.
  - Tampilan *countdown* (hitung mundur) menuju waktu sholat berikutnya secara real-time.
  - Kalibrasi tanggal lokal otomatis yang mencegah pergeseran zona waktu saat pergantian hari.

- 🔒 **Sesi & Keamanan Kredensial Terenkripsi**:
  - Penyimpanan token autentikasi memanfaatkan **Android KeyStore & iOS Keychain** (`expo-secure-store`).
  - Pemulihan sesi tangguh (*Session Resilience*) yang mencegah logout tidak disengaja saat aplikasi di-refresh atau koneksi terputus.

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

- 🔔 **Notifikasi Push & Top Bar Redesign**:
  - Desain Top Bar Notifikasi modern dan proporsional dengan indikator badge belum dibaca.
  - Notifikasi push real-time via **Firebase Cloud Messaging (FCM)** & **Socket.IO**.

---

## 🛠️ Tech Stack & Library

| Kategori | Teknologi / Library |
| :--- | :--- |
| **Framework & Engine** | React Native (Expo SDK 53) |
| **Bahasa Pemrograman** | TypeScript |
| **Navigasi** | React Navigation v7 (Bottom Tabs & Native Stack) |
| **State Management** | Zustand (Global App State), TanStack React Query v5 |
| **Secure Storage** | `expo-secure-store` (Android KeyStore / iOS Keychain) |
| **Peta & Lokasi** | Leaflet JS via `react-native-webview`, OpenStreetMap, `expo-location` |
| **Sensors & Device Services**| `expo-sensors` (Magnetometer), `expo-notifications`, `expo-av` |
| **Icons & Design System** | Lucide React Native, Custom Emerald & Gold Design Token |
| **HTTP & Realtime Client** | Axios dengan Interceptor Token & Socket.IO Client |

---

## 🏗️ Arsitektur Proyek (Domain-Driven Feature-Based)

```
fe-muslim-mobile/
├── assets/                     # Asset Gambar, Logo, Sound Adzan, & Splash Screen
├── src/
│   ├── api/                    # Configuration Axios Client & API Endpoints
│   ├── components/             # Reusable Global UI (Button, Card, Input, ScreenWrapper, ImageViewerModal)
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
│   ├── services/               # Device Services (Location, FCM Push, Socket.IO Client)
│   ├── store/                  # Global State Zustand (Auth Store, Settings Store, Theme Store)
│   ├── types/                  # TypeScript Data Models
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

3. **Jalankan Server Development Expo**:
   ```bash
   npm start
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
| `npm run android` | Menjalankan di Emulator Android |
| `npm run ios` | Menjalankan di Simulator iOS |
| `npm run web` | Menjalankan versi Web Expo |
| `npm run lint` | Menjalankan pengecekan ESLint & TypeScript |

---

## 📄 Lisensi

Distributed under the **ISC License**. Lihat `LICENSE` untuk informasi lebih lanjut.
