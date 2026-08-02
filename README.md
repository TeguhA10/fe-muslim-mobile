# 📱 Muslim Application - Mobile Frontend (`fe-muslim-mobile`)

[![React Native](https://img.shields.io/badge/React_Native-v0.76-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_52-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.3-blue.svg)](https://www.typescriptlang.org/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-ff4154.svg)](https://tanstack.com/query)
[![Zustand](https://img.shields.io/badge/Zustand-v5-brown.svg)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](#license)

Aplikasi Mobile Muslim modern berbasis **React Native** & **Expo SDK 52** (TypeScript) dengan arsitektur *Domain-Driven Feature-Based*. Aplikasi ini menyediakan fitur lengkap meliputi Jadwal Sholat presisi, Kompas Kiblat 3D/Sensors, Peta Masjid Terdekat (OpenStreetMap + Leaflet), Social Feed Komunitas Muslim, Kalender Hijriah & Notifikasi Adzan.

---

## ✨ Fitur-Fitur Utama

- 🕌 **Jadwal Sholat Real-time & Countdown**:
  - Perhitungan waktu sholat berdasarkan koordinat lokasi GPS secara otomatis.
  - Dukungan kustomisasi metode kalkulasi (Kemenag RI, MWL, ISNA, Umm Al-Qura, dll).
  - Tampilan *countdown* (hitung mundur) menuju waktu sholat berikutnya secara akurat.
  - Pengingat Suara Adzan dan Notifikasi Lokal.

- 🕋 **Kompas Arah Kiblat (Qibla Finder)**:
  - Penentuan arah Kiblat dari posisi manapun di dunia menggunakan kalkulasi matematika *Great-Circle Distance / Spherical Trigonometry*.
  - Menggunakan gabungan sensor Magnetometer & Accelerometer perangkat HP pengguna.
  - Indikator Visual interaktif yang memudahkan penyesuaian posisi sholat.

- 🗺️ **Peta Masjid Terdekat (Mosque Finder)**:
  - Tampilan Peta Interaktif menggunakan **Leaflet + OpenStreetMap** dalam WebView (bebas biaya & tanpa memerlukan Google Maps API Key).
  - Deteksi masjid di sekitar posisi lokasi pengguna dalam radius kustom.
  - Fitur Detail Masjid, Petunjuk Arah, Ulasan & Rating Komunitas, serta Simpan Bookmark Masjid.

- 📱 **Social Feed & Komunitas Muslim**:
  - Garis waktu (Timeline Feed) postingan komunitas Muslim.
  - Dukungan posting teks & **Multiple Image Upload** dengan modal pratinjau zoom (*ImageViewerModal*).
  - Fitur Like, Simpan Bookmark Postingan, serta Komentar Bertingkat (*Nested / Threaded Reply*).

- 📅 **Kalender Hijriah & Hari Besar Islam**:
  - Konversi penanggalan Masehi ke Hijriah secara otomatis.
  - Informasi Hari Besar Islam (Idul Fitri, Idul Adha, Tahun Baru Hijriah, Isra Miraj, dll).

- 👤 **Manajemen Profil & Kustomisasi**:
  - Fitur Login & Registrasi Akun.
  - Pengaturan Metode Kalkulasi Sholat & Mazhab.
  - Mode Tampilan Komunitas & Manajemen Postingan Saya.

---

## 🛠️ Tech Stack & Library

| Kategori | Teknologi / Library |
| :--- | :--- |
| **Framework & Engine** | React Native (Expo SDK 52) |
| **Bahasa Pemrograman** | TypeScript |
| **Navigasi** | React Navigation v7 (Bottom Tabs & Native Stack) |
| **State Management** | Zustand (Global App State), TanStack React Query v5 (Server Data Caching) |
| **Peta & Lokasi** | Leaflet JS via `react-native-webview`, OpenStreetMap, `expo-location` |
| **Sensors & Device Services**| `expo-sensors` (Magnetometer), `expo-notifications`, `expo-audio` |
| **UI Components & Styling** | Lucide React Native (Icons), Custom Emerald-Gold Design System, `react-native-safe-area-context` |
| **HTTP Client** | Axios dengan Interceptor JWT Token |

---

## 🏗️ Arsitektur Proyek (Domain-Driven Feature-Based)

Struktur direktori didesain modular berbasis fitur (*feature-based*):

```
fe-muslim-mobile/
├── assets/                     # Gambar, Logo, Asset Suara Adzan & Splash
├── src/
│   ├── api/                    # Configuration Axios Client & Endpoint Registry
│   ├── components/             # Reusable Global UI (Button, Card, Input, ScreenWrapper, ImageViewerModal)
│   ├── constants/              # Tema Palette (Emerald & Gold), Ukuran Font, Storage Keys
│   ├── features/               # Feature Modules (Domain-Driven)
│   │   ├── adzan/              # Jadwal Sholat, Notifikasi Local, Card Countdown
│   │   ├── auth/               # Screen Login, Register & Form Auth
│   │   ├── home/               # Social Feed, Post Card, Post Detail, Komentar & Zoom Viewer
│   │   ├── ibadah/             # Screen Kompas Kiblat & Sensor Compass
│   │   ├── maps/               # Screen Peta Masjid (Leaflet WebView), Detail & Modal Review
│   │   └── profile/            # Screen Profil User, Edit Profile, Settings & Postingan Saya
│   ├── hooks/                  # Custom Hooks (useAuth, useLocation, useQibla, usePrayerTimes)
│   ├── navigation/             # MainTabNavigator (Bottom Tabs) & RootNavigator (Stack Navigation)
│   ├── services/               # Device Services (Location, FCM, Audio Player)
│   ├── store/                  # Global State Zustand (Auth Store, Settings Store)
│   ├── types/                  # TypeScript Types & Data Transfer Models
│   └── utils/                  # Kalkulasi Trigonometri Kiblat, Formatter Tanggal & Waktu
├── app.json                    # Expo Configuration (Android/iOS App Config)
├── eas.json                    # Expo Application Services Build Configuration
├── package.json
└── tsconfig.json               # Konfigurasi TypeScript React Native
```

---

## ⚙️ Variabel Lingkungan (`.env`)

Buat file `.env` di root direktori proyek `fe-muslim-mobile` dengan menyalin `.env.example`:

```env
# URL Endpoint API Backend (Sesuaikan dengan IP Komputer/Server Anda jika menggunakan HP Fisik)
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

> 💡 **Tips Pengujian HP Fisik (Expo Go)**: Ganti `localhost` dengan IP local komputer Anda (contoh: `http://192.168.1.50:5000/api/v1`).

---

## 💻 Cara Menjalankan Aplikasi

### Prasyarat:
- **Node.js** (v18 atau v20+)
- **Expo Go App** (diunduh dari Google Play Store / Apple App Store di HP Anda) atau Emulator Android/iOS.

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
   - **HP Fisik**: Scan QR Code yang muncul di terminal menggunakan aplikasi **Expo Go**.
   - **Android Emulator**: Tekan tombol `a` di terminal.
   - **iOS Simulator**: Tekan tombol `i` di terminal.

---

## 📦 Build Standalone APK / Bundle (EAS Build)

Proyek ini telah dikonfigurasi dengan `eas.json` untuk membangun file APK Android:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login ke akun Expo
eas login

# Jalankan build APK Android Preview
eas build --platform android --profile preview
```

---

## 📜 Skrip NPM yang Tersedia

| Skrip | Deskripsi |
| :--- | :--- |
| `npm start` | Menjalankan Metro Bundler Expo |
| `npm run android` | Menjalankan di Emulator Android |
| `npm run ios` | Menjalankan di Simulator iOS |
| `npm run web` | Menjalankan versi Web Expo |
| `npm run lint` | Menjalankan linter kode |

---

## 📄 Lisensi

Distributed under the **ISC License**. Lihat `LICENSE` untuk informasi lebih lanjut.
