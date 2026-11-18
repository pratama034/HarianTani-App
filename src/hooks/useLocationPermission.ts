import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UseLocationPermissionResult {
  status: Location.PermissionStatus | null;
  isGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<boolean>;
}

/**
 * Custom hook untuk mengelola izin akses lokasi di latar depan (Foreground Location Permission)
 * Menggunakan Location.requestForegroundPermissionsAsync() sesuai spesifikasi Expo SDK 58.
 */
export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<Location.PermissionStatus | null>(null);
  const [isGranted, setIsGranted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await Location.requestForegroundPermissionsAsync();
      setStatus(response.status);
      const granted = response.status === Location.PermissionStatus.GRANTED;
      setIsGranted(granted);
      return granted;
    } catch (err) {
      console.warn('[useLocationPermission] Gagal meminta izin lokasi:', err);
      setIsGranted(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const response = await Location.getForegroundPermissionsAsync();
      setStatus(response.status);
      const granted = response.status === Location.PermissionStatus.GRANTED;
      setIsGranted(granted);
      return granted;
    } catch {
      setIsGranted(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    Location.getForegroundPermissionsAsync()
      .then((res) => {
        if (isMounted) {
          setStatus(res.status);
          setIsGranted(res.status === Location.PermissionStatus.GRANTED);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsGranted(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    status,
    isGranted,
    isLoading,
    requestPermission,
    checkPermission,
  };
}
