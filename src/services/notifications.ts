import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Inisialisasi notification handler agar notifikasi lokal tampil (banner & audio)
 * bahkan saat aplikasi sedang dibuka di latar depan (foreground).
 */
export function initNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Meminta izin notifikasi kepada pengguna (termasuk Android 13+ POST_NOTIFICATIONS)
 * serta mengonfigurasi notification channel untuk perangkat Android.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Konfigurasi Channel khusus di Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('jadwal-perawatan', {
        name: 'Jadwal Perawatan Tanaman',
        importance: AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#006C49',
        sound: 'default',
      });
    }

    return true;
  } catch (err) {
    console.warn('[Notifications] Gagal meminta izin notifikasi:', err);
    return false;
  }
}

/**
 * Menjadwalkan notifikasi lokal untuk jadwal perawatan tanaman pada pukul 06:00 WIB di hari H.
 * Jika hari H adalah hari ini dan pukul 06:00 sudah terlewat, notifikasi dijadwalkan
 * dalam 5 detik agar pengguna langsung menerima pengingat hari ini.
 *
 * @param kegiatan Nama kegiatan perawatan (misal: "Pemupukan Susulan Urea")
 * @param tanggal Tanggal kegiatan format "YYYY-MM-DD"
 * @param waktu Waktu rencana (misal: "07:00")
 * @param namaLahan Nama lahan terkait (opsional)
 * @returns notificationId string jika berhasil, null jika gagal/ditolak
 */
export async function scheduleJadwalNotification(
  kegiatan: string,
  tanggal: string,
  waktu?: string,
  namaLahan?: string
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const [yearStr, monthStr, dayStr] = tanggal.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    // Waktu pengingat pukul 06:00 WIB pada hari H
    const targetDate = new Date(year, month, day, 6, 0, 0, 0);
    const now = Date.now();

    let trigger: Date | { type: Notifications.SchedulableTriggerInputTypes.DATE; date: Date | number };

    if (targetDate.getTime() > now) {
      // Jadwal di masa depan pada hari H pukul 06:00:00
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: targetDate,
      };
    } else {
      // Periksa apakah hari ini adalah hari H
      const today = new Date();
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day;

      if (isToday) {
        // Jika hari ini dan pukul 06:00 WIB sudah terlewat, trigger pengingat dalam 5 detik
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(now + 5000),
        };
      } else {
        // Tanggal sudah lampau, tidak dijadwalkan
        return null;
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌾 Pengingat Perawatan HarianTani',
        body: `Hari ini waktunya "${kegiatan}"${waktu ? ` pukul ${waktu} WIB` : ''}${
          namaLahan ? ` di ${namaLahan}` : ''
        }. Pastikan tanaman terawat tepat waktu!`,
        data: { tanggal, kegiatan, namaLahan },
        sound: true,
      },
      trigger,
    });

    return notificationId;
  } catch (err) {
    console.warn('[Notifications] Gagal menjadwalkan notifikasi jadwal:', err);
    return null;
  }
}
