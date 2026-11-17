# Analisis Progres Implementasi Aplikasi HarianTani (Week 2 – Week 8)

Dokumen ini berisi analisis menyeluruh mengenai sejauh mana aplikasi mobile **HarianTani** telah diimplementasikan terhadap seluruh materi perkuliahan (`week2.pptx` hingga modul praktikum `Week 8`).

---

## Ringkasan Utama

Berdasarkan pemeriksaan langsung terhadap struktur kode sumber aplikasi **HarianTani** dan perbandingannya dengan materi kuliah pada Pekan 2 sampai Pekan 8:

* **Posisi Progres Saat Ini:** Implementasi aplikasi telah selesai sepenuhnya **hingga materi Modul Week 8 (100% Selesai — Week 2 s.d. Week 8 Tuntas)**.

---

## Matriks Capaian per Pekan

| Pekan | Topik / Materi PPT | Status | Keterangan Singkat |
| :---: | :--- | :---: | :--- |
| **Week 2** | UI/UX, Layout, Navigasi Tab & Aksesibilitas | **100% Selesai** | 5 tab navigasi, sistem tema terpusat, komponen reusable, dan atribut aksesibilitas layar. |
| **Week 3** | Keamanan Penyimpanan Lokal & Autentikasi (Sprint 03) | **100% Selesai** | Penyimpanan terenkripsi berbasis hardware menggunakan `expo-secure-store`, halaman login & registrasi, serta proteksi rute sesi. |
| **Week 4** | Data Modeling, DTO Mapping & RESTful API (Task 01–03) | **100% Selesai** | Klien HTTP murni `fetch()`, integrasi Supabase PostgREST, DTO mapper (`snake_case` ↔ `camelCase`), state asinkron, loading spinner, dan pull-to-refresh. |
| **Week 5** | *From API to Secure API*: Token Auth & JWT (Sprint 04) | **100% Selesai** | Login/registrasi/logout via Supabase Auth API, penyimpanan JWT dengan key `"access_token"` di `SecureStore`, Bearer Token interceptor, dan auto-logout pada status `401 Unauthorized`. |
| **Week 6** | *From Fragile to Reliable API*: Error, Timeout & Offline (Sprint 05) | **100% Selesai** | Timeout `AbortController` (12 detik), klasifikasi status HTTP (2xx/4xx/5xx) & offline, komponen `ErrorState` dengan tombol *Coba Lagi*, prinsip tidak menampilkan data saat gagal, serta modal simulator demo di header. |
| **Week 7** | *From API to Device Sensor*: Accelerometer & Shake | **100% Selesai** | Integrasi `expo-sensors` (interval 100ms, cleanup anti-memory leak), tampilan real-time sumbu X/Y/Z (`.toFixed(2)`), kalkulasi magnitudo vektor $\sqrt{x^2+y^2+z^2}$, threshold 1.20g & 1.78g, `Vibration.vibrate(400)`, serta fitur *Shake-to-Refresh* (`refetchAll()`). |
| **Week 8** | *Multi-Threading, Asynchronous & Catatan Panen REST API* | **100% Selesai** | Pemisahan thread non-blocking, Tri-State (`data`, `loading`, `error`, `refreshing`), FlatList + `RefreshControl` (`#16A34A`), `AbortController` cleanup di `useEffect`, `useAddHarvest` (POST + `isSubmitting` + optimistic update), serta `useUpdateHarvest` (PATCH parsial `isCompleted` Draft $\leftrightarrow$ Selesai + immutable update). |

---

## Penjabaran Rinci Implementasi

### 1. Week 2: Antarmuka Pengguna (UI/UX), Navigasi, dan Aksesibilitas (100% Selesai)
Pada tahap ini, aplikasi membangun kerangka antarmuka menggunakan **React Native** dan **Expo Router**:
* **Navigasi 5 Tab Utama:** Dikonfigurasi pada [src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx) yang menaungi tab Beranda ([index.tsx](src/app/(tabs)/index.tsx)), Lahan ([lahan.tsx](src/app/(tabs)/lahan.tsx)), Jadwal ([jadwal.tsx](src/app/(tabs)/jadwal.tsx)), Jurnal ([jurnal.tsx](src/app/(tabs)/jurnal.tsx)), dan Panen ([panen.tsx](src/app/(tabs)/panen.tsx)).
* **Sistem Desain Terpusat:** Token warna, radius, jarak, dan bayangan didefinisikan di [src/constants/theme.ts](src/constants/theme.ts) dan [src/constants/Colors.ts](src/constants/Colors.ts), serta diterapkan melalui komponen modular seperti [AppCard.tsx](src/components/AppCard.tsx), [DarkSummaryCard.tsx](src/components/DarkSummaryCard.tsx), [SectionHeader.tsx](src/components/SectionHeader.tsx), dan [StatusChip.tsx](src/components/StatusChip.tsx).
* **Aksesibilitas (WCAG AA):** Elemen interaktif dan formulir dilengkapi properti semantik (`accessible`, `accessibilityLabel`, dan `accessibilityRole`).

---

### 2. Week 3: Keamanan Penyimpanan Lokal & Autentikasi (100% Selesai)
Aplikasi menerapkan penyimpanan data autentikasi yang aman di tingkat perangkat keras (*Android Keystore / iOS Keychain*):
* **Hardware Secure Store:** Modul [src/services/authStorage.ts](src/services/authStorage.ts) menggunakan `expo-secure-store` untuk menyimpan sesi dan kredensial secara terenkripsi (bukan plaintext seperti `AsyncStorage`).
* **Manajemen Sesi & Proteksi Rute:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx) mengelola status autentikasi pengguna, sementara layar [src/app/(auth)/login.tsx](src/app/(auth)/login.tsx) dan [src/app/(auth)/register.tsx](src/app/(auth)/register.tsx) menangani validasi input dan alur masuk pengguna.

---

### 3. Week 4: Data Modeling, DTO Mapping, & RESTful API (100% Selesai)
Aplikasi terhubung dengan layanan backend **Supabase PostgREST API** secara langsung menggunakan JavaScript `fetch()`:
* **REST Client Terpusat:** Modul [src/services/api.ts](src/services/api.ts) menyediakan fungsi HTTP murni `apiGet`, `apiPost`, `apiPatch`, dan `apiDelete` beserta header standar Supabase (`apikey`, `Authorization`, `Content-Type`, `Prefer: return=representation`).
* **Data Modeling & DTO Mapping Layer:**
  * Pemisahan tipe format database server (`snake_case`, misalnya `tanggal_tanam`, `id_lahan`, `harga_jual`) dan model aplikasi mobile (`camelCase`, misalnya `tanggalTanam`, `idLahan`, `hargaJual`) di [src/types/api.ts](src/types/api.ts).
  * Fungsi pemetaan dua arah murni (`mapLahanDTOtoModel`, `mapModelToLahanDTO`, `mapJadwalDTOtoModel`, `mapModelToJadwalDTO`, `mapJurnalDTOtoModel`, `mapModelToJurnalDTO`, `mapPanenDTOtoModel`, `mapModelToPanenDTO`) di [src/utils/mapper.ts](src/utils/mapper.ts).
* **State Asinkron & UI Dinamis:** [src/context/AppContext.tsx](src/context/AppContext.tsx) menjalankan pemuatan data awal secara paralel menggunakan `Promise.all` (`lahan`, `jadwal_perawatan`, `jurnal_lapangan`, `laporan_panen`), serta menyediakan indikator `ActivityIndicator` dan fitur *Pull-to-Refresh* (`RefreshControl`) pada kelima layar tab.

---

### 4. Week 5: Otentikasi Berbasis Token JWT & Keamanan Endpoint (100% Selesai)
Implementasi keamanan API (*From API to Secure API* — Sprint 04) telah terintegrasi penuh:
* **Endpoint Supabase Auth API:** [src/services/api.ts](src/services/api.ts) mengimplementasikan `apiLogin` (`POST /auth/v1/token?grant_type=password`), `apiRegister` (`POST /auth/v1/signup`), dan `apiLogout` (`POST /auth/v1/logout`).
* **Penyimpanan Token Kunci `"access_token"`:** Token JWT hasil autentikasi disimpan di `SecureStore` menggunakan kunci `"access_token"` melalui fungsi `saveAccessToken`, `getAccessToken`, dan `deleteAccessToken` di [src/services/authStorage.ts](src/services/authStorage.ts).
* **Authorization Interceptor:** Fungsi `getStandardHeaders()` di [src/services/api.ts](src/services/api.ts) menyisipkan header `Authorization: Bearer <access_token>` secara otomatis ke seluruh permintaan endpoint terproteksi.
* **Penanganan `401 Unauthorized` Terpusat:** Melalui `setOnUnauthorized()` yang didaftarkan di [src/context/AuthContext.tsx](src/context/AuthContext.tsx), setiap respons `401` memicu pembersihan token dari memori maupun `SecureStore` dan mengembalikan pengguna ke layar Login.
* **Skema Basis Data & RLS:** Disediakan pada [supabase_schema.sql](supabase_schema.sql).

---

### 5. Week 6: Keandalan API — Error Handling, Timeout, Offline, & Retry (100% Selesai)
Implementasi ketahanan jaringan (*From Fragile API to Reliable API* — Sprint 05) telah dituntaskan pada seluruh layer jaringan hingga UI:
* **Timeout Handling (`AbortController`):** Seluruh permintaan `fetch()` di [src/services/api.ts](src/services/api.ts) dibungkus `fetchWithTimeout()` dengan batas waktu default 12 detik (`DEFAULT_REQUEST_TIMEOUT_MS = 12000`) untuk mencegah aplikasi terlihat *hang* saat server lambat.
* **Klasifikasi Error & Status HTTP:** Kelas `ApiError` dan fungsi `handleResponse()` mengelompokkan hasil request ke tipe `HTTP_ERROR` (2xx sukses, 4xx client error seperti 400/401/403/404, 5xx server error seperti 500/502/503/504), `TIMEOUT` (408), `OFFLINE` (network error), dan `UNKNOWN`.
* **Siklus State Antarmuka Lengkap:** [src/context/AppContext.tsx](src/context/AppContext.tsx) mengelola status `apiStatus` (`idle`, `loading`, `success`, `error`, `offline`, `timeout`) beserta `statusCode` dan `errorType`.
* **Tampilan Error, Offline, Empty, & Retry di 5 Tab:**
  * Jika permintaan gagal (error HTTP, timeout, atau offline), kelima tab tidak menampilkan data yang rusak melainkan menampilkan komponen [src/components/ErrorState.tsx](src/components/ErrorState.tsx) lengkap dengan ikon kontekstual, badge kode HTTP, pesan yang jelas, dan tombol **"Coba Lagi"** (*Retry*).
  * Jika permintaan `200 OK` berhasil namun data belum tersedia, ditampilkan komponen [src/components/EmptyState.tsx](src/components/EmptyState.tsx).
* **Panel Diagnostik & Simulator Demo:** Di [src/app/(tabs)/_layout.tsx](src/app/(tabs)/_layout.tsx), ikon cloud pada header berubah secara dinamis sesuai status jaringan dan menyediakan modal penguji (`simulateApiCondition`) untuk mendemonstrasikan kondisi **Live API (200 OK)**, **Offline**, **Timeout (408)**, **404 Client Error**, dan **500 Server Error**.

---

### 6. Week 7: Integrasi Sensor Perangkat / *Device Sensor* (100% Selesai)
Implementasi pembacaan sensor perangkat keras (*From API to Device Sensor*) telah selesai diintegrasikan sesuai spesifikasi teknis:
* **Task 01 — Setup & Koneksi Sensor (`expo-sensors`):**
  * Pustaka `expo-sensors` telah terpasang pada [package.json](package.json).
  * Custom hook [src/hooks/useAccelerometer.ts](src/hooks/useAccelerometer.ts) mengatur interval konstan **100ms** (`Accelerometer.setUpdateInterval(100)`), mengelola state koordinat `SensorData { x, y, z }`, menyediakan fungsi `subscribe()` dan `unsubscribe()`, serta membersihkan *listener* (`subscription.remove()`) di dalam `useEffect` *cleanup* untuk mencegah *memory leak*.
* **Task 02 — Display Sensor Data (Real-Time Telemetry UI):**
  * Komponen [src/components/SensorDisplayCard.tsx](src/components/SensorDisplayCard.tsx) menampilkan modul **"Monitoring Stabilitas Perangkat (Field-Sensor)"** dengan *grid* 3 kolom untuk **Sumbu X**, **Sumbu Y**, dan **Sumbu Z**.
  * Setiap koordinat diformat menggunakan **2 angka desimal** (`data.x.toFixed(2)`, `data.y.toFixed(2)`, `data.z.toFixed(2)`) khusus pada lapisan UI tanpa mengubah presisi kalkulasi matematika.
* **Task 03 — Sensor Interaction (Shake Detection, Vibration & Shake-to-Refresh):**
  * Menghitung magnitudo percepatan total $\text{Acceleration} = \sqrt{x^2 + y^2 + z^2}$ dan mengklasifikasikan ke dalam 3 tingkat: **Kondisi Stabil** ($\le 1.20\text{ g}$), **Pergerakan Terdeteksi** ($1.21\text{ g} - 1.77\text{ g}$), dan **Goncangan Terdeteksi!** ($> 1.78\text{ g}$).
  * Menerapkan *throttling/cooldown* `COOLDOWN_MS = 1000` dengan `useRef`, getaran perangkat keras `Vibration.vibrate(400)`, *auto-reset* status goncangan setelah `2500ms`, serta integrasi *Shake-to-Refresh* pada [src/app/(tabs)/index.tsx](src/app/(tabs)/index.tsx) yang memicu `refetchAll()` untuk menyegarkan data cuaca dan lahan secara otomatis.

---

### 7. Week 8: Multi-Threading, Asynchronous Architecture & Catatan Panen REST API (100% Selesai)
Implementasi komputasi asinkron dan operasi REST API pada modul Catatan Panen Harian ([src/app/(tabs)/panen.tsx](src/app/(tabs)/panen.tsx)) telah selesai diintegrasikan sesuai seluruh spesifikasi teknis:
* **Pemisahan Thread & Non-Blocking Execution:**
  * Operasi jaringan I/O dipindahkan ke Web APIs / Native Modules tanpa memblokir *UI Thread*, memanfaatkan Event Loop dan Microtask Queue agar antarmuka tetap 60 FPS bebas *freezing*.
* **Task 01 — Tri-State Pattern & Fetch Data (`GET`) dengan `AbortController`:**
  * Hook `useFetchHarvests` di [src/hooks/useHarvests.ts](src/hooks/useHarvests.ts) mengelola Tri-State (`harvests: HarvestItem[]`, `loading: boolean`, `error: string | null`, dan `refreshing: boolean`).
  * `useEffect` menginisialisasi `new AbortController()`, membatalkan request saat unmount (`return () => controller.abort()`), dan menangkap `err.name === 'AbortError'` secara aman untuk mencegah *memory leak*.
  * UI menampilkan `ActivityIndicator` (warna hijau `#16A34A`) saat loading, error banner saat gagal, dan me-render daftar menggunakan **`FlatList`** dengan `RefreshControl` (`colors={['#16A34A']}`).
* **Task 02 — Menambahkan Data Baru (`POST`) via `useAddHarvest`:**
  * Fungsi `addHarvestRecord(commodity, weightKg)` melakukan validasi input (`Alert.alert`), mengelola state `isSubmitting` (disable tombol submit), dan mengirim request `POST` dengan `'Content-Type': 'application/json'` serta `JSON.stringify()`.
  * Menerapkan pembaruan state lokal langsung (`setHarvests((prevData) => [createdRecord, ...prevData])`) tanpa *re-fetching* penuh serta menampilkan `Alert.alert('Sukses', 'Catatan panen berhasil ditambahkan.')`.
* **Task 03 — Ubah Status (`PATCH`) & Error Handling via `useUpdateHarvest`:**
  * Fungsi `toggleHarvestStatus(id, currentStatus)` mengirim request `PATCH` parsial hanya untuk atribut `isCompleted` (`selesai`).
  * Menerapkan pembaruan state lokal secara *immutable* menggunakan `.map()` (`Draft` $\leftrightarrow$ `Selesai Dipanen`) dan menampilkan `Alert.alert('Kesalahan Pengoperasian', ...)` jika koneksi bermasalah.
  * Kartu pada [src/app/(tabs)/panen.tsx](src/app/(tabs)/panen.tsx) dilengkapi tombol badge status interaktif untuk mengubah status seketika.

---

## Status Verifikasi Kode

* **TypeScript Typecheck (`npx tsc --noEmit`):** 0 Error
* **ESLint (`npx eslint src`):** 0 Error / 0 Warning
