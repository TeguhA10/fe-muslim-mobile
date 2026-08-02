# 📱 Mobile Frontend Production Readiness Roadmap & GitHub Issues (`fe-muslim-mobile`)

Dokumen ini berisi daftar kendala (Issues) dan rekomendasi solusi teknis untuk aplikasi mobile **Muslim App** agar siap dirilis ke toko aplikasi (Google Play Store & Apple App Store) dan digunakan oleh ribuan pengguna secara stabil.

---

## 📌 List Issue & Solusi Teknis

### 1. 📲 Production Standalone Build (EAS Build) & FCM Push Notification
- **Kategori**: Release & Push Notifications
- **Deskripsi Masalah**:
  Fitur push notification `expo-notifications` terbatas di Expo Go SDK 53+. Pengujian notifikasi adzan real-time membutuhkan *native development build* / standalone APK.
- **Saran Solusi**:
  1. Buat project di Expo Application Services (EAS).
  2. Konfigurasi `google-services.json` (Android) & `GoogleService-Info.plist` (iOS) dari Firebase Console.
  3. Jalankan `eas build --platform android --profile release` untuk menghasilkan file `.aab` / `.apk` produksi.

---

### 2. 🐛 Fix Runtime Warning `ReferenceError: Property 'Globe' doesn't exist`
- **Kategori**: Bug Fix & UI Stability
- **Deskripsi Masalah**:
  Terdapat log error Metro bundler saat aplikasi berjalan: `ReferenceError: Property 'Globe' doesn't exist` yang berasal dari impor icon Lucide yang tidak ditemukan.
- **Saran Solusi**:
  1. Periksa impor icon di seluruh komponen screen (`MasjidMapScreen`, `LocationPickerModal`, `QiblaScreen`).
  2. Ganti impor icon `Globe` dengan icon alternatif yang tersedia dari `lucide-react-native` (misal `MapPin`, `Compass`, `Navigation`, `Earth`).

---

### 3. 🌐 Offline Handling & Network Resilience
- **Kategori**: UX & Resilience
- **Deskripsi Masalah**:
  Saat koneksi internet terputus atau server backend tidak terjangkau, beberapa screen (Profil, Feed) menampilkan error log mentah atau layar kosong.
- **Saran Solusi**:
  1. Konfigurasi TanStack React Query dengan `staleTime` & `gcTime` yang tepat serta *offline persistence*.
  2. Tambahkan komponen penanda status offline (*Offline Banner / Toast Notification*) agar user mendapat informasi yang jelas saat tidak ada koneksi.

---

### 4. 🚀 Image Optimization & Lazy Loading
- **Kategori**: Performance & Memory
- **Deskripsi Masalah**:
  Postingan komunitas dengan banyak gambar resolusi tinggi dapat mengonsumsi memori (RAM) perangkat HP tingkat bawah.
- **Saran Solusi**:
  1. Kompres gambar di sisi aplikasi sebelum diunggah menggunakan `expo-image-manipulator`.
  2. Gunakan `expo-image` sebagai pengganti `Image` bawaan React Native untuk caching gambar sisi native yang lebih cepat dan efisien.

---

### 5. 🎨 Magnetometer / Qibla Compass Calibration Feedback
- **Kategori**: Feature Improvement
- **Deskripsi Masalah**:
  Sensor kompas perangkat kadang membutuhkan kalibrasi (gerakan angka 8) untuk mendapatkan akurasi arah Kiblat yang tinggi.
- **Saran Solusi**:
  1. Tambahkan petunjuk visual kalibrasi sensor jika keakuratan magnetometer rendah (*accuracy <= 1*).
  2. Sediakan opsi *manual location override* agar user tetap bisa melihat azimuth Kiblat walau sensor magnetometer HP tidak presisi.
