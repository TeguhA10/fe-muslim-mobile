# Muslim Application - Mobile Frontend (`fe-muslim-mobile`)

Aplikasi Mobile Muslim berbasis React Native + Expo (TypeScript) dengan arsitektur *Domain-Driven Feature-Based*.

## Tech Stack
- **Framework**: React Native (Expo SDK 52)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs & Stack)
- **State Management**: TanStack React Query + Zustand
- **Map Library**: Leaflet + OpenStreetMap via WebView (Gratis & Tanpa API Key Google Maps)
- **Icons & Theme**: Lucide React Native, Custom Emerald & Gold Theme System
- **Services**: Expo Location, Expo Sensors (Kompas Qibla), Expo Notifications (Adzan Reminder)

---

## Folder Architecture
```
fe-muslim-mobile/
├── assets/                     # Splash, Icon, Sound assets
├── src/
│   ├── api/                    # Axios API Client & Endpoints mapping
│   ├── components/             # Reusable UI Components (Button, Card, Input, ScreenWrapper)
│   ├── constants/              # Theme palette, Font constants, Storage keys
│   ├── features/               # Feature Modules (Domain-Driven)
│   │   ├── auth/               # Login & Registration
│   │   ├── home/               # Social Feed, Posts, Likes, Comments
│   │   ├── adzan/              # Jadwal Sholat, Notifikasi Adzan, Countdown
│   │   ├── ibadah/             # Kompas Qiblat, Kalender Hijriah, Countdown Hari Besar
│   │   ├── maps/               # Peta Masjid (Leaflet WebView), Detail & Rating
│   │   └── profile/            # Profil User, Pengaturan Metode Adzan & Bahasa
│   ├── hooks/                  # Custom Hooks (useAuth, useLocation, useQibla, usePrayerTimes)
│   ├── navigation/             # MainTabNavigator & RootNavigator
│   ├── services/               # Device Services (Location, FCM, Audio)
│   ├── store/                  # Global State (Zustand: Auth store, Settings store)
│   ├── types/                  # TypeScript Types & Interfaces
│   └── utils/                  # Qibla Bearing Math, Date Formatters
├── app.json                    # Expo Configuration
├── package.json
└── tsconfig.json
```

---

## Setup & Cara Menjalankan

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Salin `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Jalankan Aplikasi dengan Expo**:
   ```bash
   npm start
   ```
   Atau untuk Android / iOS emulator:
   ```bash
   npm run android
   # atau
   npm run ios
   ```
