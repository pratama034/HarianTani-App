import * as Location from 'expo-location';

/**
 * Mengubah koordinat geografis (latitude, longitude) menjadi format alamat tekstual
 * menggunakan Location.reverseGeocodeAsync() (Reverse Geocoding).
 *
 * @param latitude Garis lintang (numeric)
 * @param longitude Garis bujur (numeric)
 * @returns String alamat yang mudah dibaca atau fallback koordinat jika reverse geocoding kosong
 */
export async function fetchAddressFromCoords(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (!results || results.length === 0) {
      return `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
    }

    const place = results[0];
    const street = place.street || place.name || '';
    const district = place.district || place.subregion || '';
    const city = place.city || '';
    const region = place.region || '';

    const addressParts = [street, district, city, region]
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }

    return `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
  } catch (err) {
    console.warn('[fetchAddressFromCoords] Gagal melakukan reverse geocode:', err);
    return `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
  }
}
