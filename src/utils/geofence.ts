import { Lahan } from '../types/api';

/**
 * Menghitung jarak garis lurus antara dua titik koordinat geografis (dalam satuan meter)
 * menggunakan Haversine Formula.
 *
 * @param lat1 Latitude titik pertama (derajat)
 * @param lon1 Longitude titik pertama (derajat)
 * @param lat2 Latitude titik kedua (derajat)
 * @param lon2 Longitude titik kedua (derajat)
 * @returns Jarak dalam satuan meter
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius rata-rata Bumi dalam meter
  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GeofenceMatch {
  lahan: Lahan;
  distanceMeters: number;
}

/**
 * Mencari lahan pertanian terdekat yang berada di bawah radius ambang batas geofence (default 200 meter).
 *
 * @param userLat Latitude lokasi pengguna saat ini
 * @param userLon Longitude lokasi pengguna saat ini
 * @param lahanList Daftar lahan aktif
 * @param radiusThresholdMeters Batas jarak geofence dalam meter (default 200m)
 * @returns Lahan yang cocok terdekat, atau null jika tidak ada yang masuk radius
 */
export function findNearbyLahan(
  userLat: number,
  userLon: number,
  lahanList: Lahan[],
  radiusThresholdMeters = 200
): GeofenceMatch | null {
  let closest: GeofenceMatch | null = null;

  for (const lahan of lahanList) {
    if (
      typeof lahan.latitude === 'number' &&
      !isNaN(lahan.latitude) &&
      typeof lahan.longitude === 'number' &&
      !isNaN(lahan.longitude)
    ) {
      const distance = calculateDistanceMeters(
        userLat,
        userLon,
        lahan.latitude,
        lahan.longitude
      );

      if (distance <= radiusThresholdMeters) {
        if (!closest || distance < closest.distanceMeters) {
          closest = {
            lahan,
            distanceMeters: Math.round(distance),
          };
        }
      }
    }
  }

  return closest;
}
