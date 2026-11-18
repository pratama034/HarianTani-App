import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Vibration,
  Platform,
  AppState,
  type AppStateStatus,
  type EventSubscription as Subscription,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';

export interface SensorData {
  x: number;
  y: number;
  z: number;
}

export type MotionStatus =
  | 'Kondisi Stabil'
  | 'Pergerakan Terdeteksi'
  | 'Goncangan Terdeteksi!';

export interface UseAccelerometerOptions {
  /** Callback yang dijalankan saat goncangan ekstrem (> 1.78g) terdeteksi (mis. Shake-to-Refresh) */
  onShake?: () => void;
  /** Interval pembacaan sensor dalam milidetik (Default sesuai spesifikasi: 100ms) */
  updateIntervalMs?: number;
}

/** Konstanta Ambang Batas (Threshold) sesuai Spesifikasi Teknis Week 7 */
export const SENSOR_UPDATE_INTERVAL_MS = 100;
export const NORMAL_ACCELERATION_MAX = 1.2; // <= 1.20 g -> Kondisi Stabil
export const SHAKE_THRESHOLD = 1.78; // > 1.78 g -> Extreme Shake (Goncangan Terdeteksi!)
export const COOLDOWN_MS = 1000; // 1 detik jeda antar deteksi goncangan (throttling)
export const SHAKE_RESET_MS = 2500; // Auto-reset indikator goncangan setelah 2.5 detik

export const useAccelerometer = (options?: UseAccelerometerOptions) => {
  const [data, setData] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isHardwareAvailable, setIsHardwareAvailable] = useState<boolean>(true);
  const [shakeDetected, setShakeDetected] = useState<boolean>(false);
  const [shakeCount, setShakeCount] = useState<number>(0);
  const [lastShakeTimestamp, setLastShakeTimestamp] = useState<string | null>(null);

  const lastShakeTime = useRef<number>(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onShakeRef = useRef<(() => void) | undefined>(options?.onShake);
  const intervalRef = useRef<number>(
    options?.updateIntervalMs ?? SENSOR_UPDATE_INTERVAL_MS
  );

  useEffect(() => {
    onShakeRef.current = options?.onShake;
  }, [options?.onShake]);

  useEffect(() => {
    intervalRef.current =
      options?.updateIntervalMs ?? SENSOR_UPDATE_INTERVAL_MS;
  }, [options?.updateIntervalMs]);

  /**
   * Evaluasi magnitudo percepatan total dan deteksi goncangan (Task 03)
   * Catatan Penting: Perhitungan menggunakan angka mentah (raw number) tanpa .toFixed(2)
   */
  const evaluateAcceleration = useCallback((sensorReading: SensorData) => {
    const { x, y, z } = sensorReading;
    const totalForce = Math.sqrt(x * x + y * y + z * z);

    if (totalForce > SHAKE_THRESHOLD) {
      const now = Date.now();
      if (now - lastShakeTime.current > COOLDOWN_MS) {
        lastShakeTime.current = now;
        setShakeDetected(true);
        setShakeCount((prev) => prev + 1);
        setLastShakeTimestamp(
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );

        // Trigger umpan balik getaran perangkat keras (Hardware Haptic/Vibration)
        if (Platform.OS !== 'web') {
          Vibration.vibrate(400);
        }

        // Jalankan aksi Shake-to-Refresh (mis. refetchAll data cuaca & lahan)
        if (onShakeRef.current) {
          onShakeRef.current();
        }

        // Auto-reset status goncangan setelah 2500ms sesuai spesifikasi
        if (resetTimerRef.current) {
          clearTimeout(resetTimerRef.current);
        }
        resetTimerRef.current = setTimeout(() => {
          setShakeDetected(false);
        }, SHAKE_RESET_MS);
      }
    }
  }, []);

  const subRef = useRef<Subscription | null>(null);

  /**
   * Task 01: Membuka langganan (subscription) ke Accelerometer dengan interval 100ms
   */
  const startListening = useCallback(() => {
    if (subRef.current) return;
    try {
      Accelerometer.setUpdateInterval(intervalRef.current);
      const sub = Accelerometer.addListener((accelerometerData) => {
        setData(accelerometerData);
        evaluateAcceleration(accelerometerData);
      });
      subRef.current = sub;
      setSubscription(sub);
    } catch (err) {
      console.warn('[useAccelerometer] Gagal mengaktifkan sensor:', err);
    }
  }, [evaluateAcceleration]);

  /**
   * Task 01: Menghentikan langganan (unsubscribe) dan membersihkan listener
   */
  const stopListening = useCallback(() => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
      setSubscription(null);
    }
  }, []);

  const subscribe = useCallback(() => {
    startListening();
  }, [startListening]);

  const unsubscribe = useCallback(() => {
    stopListening();
  }, [stopListening]);

  /**
   * Simulasi Goncangan untuk keperluan pengujian pada Emulator / Web / Demo
   * Menyuntikkan vektor akselerasi { x: 1.18, y: 1.24, z: 0.86 } -> ~1.91g (> 1.78g)
   */
  const simulateShake = useCallback(() => {
    const simulatedReading: SensorData = { x: 1.18, y: 1.24, z: 0.86 };
    setData(simulatedReading);
    evaluateAcceleration(simulatedReading);

    setTimeout(() => {
      setData((current) =>
        current.x === 1.18 && current.y === 1.24
          ? { x: 0.02, y: 0.05, z: 0.98 }
          : current
      );
    }, SHAKE_RESET_MS);
  }, [evaluateAcceleration]);

  useEffect(() => {
    let isMounted = true;

    const initSensor = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (isMounted) {
          setIsHardwareAvailable(available);
        }
      } catch {
        if (isMounted) {
          setIsHardwareAvailable(true);
        }
      }

      // Aktifkan sensor jika aplikasi dalam status 'active'
      if (AppState.currentState === 'active' && isMounted) {
        startListening();
      }
    };

    void initSensor();

    // Dengarkan perubahan status AppState (Background / Inactive / Active)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startListening();
      } else {
        // Hentikan sensor ketika aplikasi berada di background untuk menghemat baterai
        stopListening();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    // Lifecycle cleanup: pastikan subscription.remove() selalu dipanggil saat unmount
    return () => {
      isMounted = false;
      stopListening();
      appStateSub.remove();
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [startListening, stopListening]);

  // Perhitungan magnitudo vektor total dari koordinat mentah (raw numbers)
  const totalAcceleration = Math.sqrt(
    data.x * data.x + data.y * data.y + data.z * data.z
  );

  // Klasifikasi Status Perangkat sesuai Tabel Ambang Batas (Task 03)
  let motionStatus: MotionStatus = 'Kondisi Stabil';
  if (shakeDetected || totalAcceleration > SHAKE_THRESHOLD) {
    motionStatus = 'Goncangan Terdeteksi!';
  } else if (totalAcceleration > NORMAL_ACCELERATION_MAX) {
    motionStatus = 'Pergerakan Terdeteksi';
  }

  return {
    data,
    totalAcceleration,
    motionStatus,
    shakeDetected,
    shakeCount,
    lastShakeTimestamp,
    isAvailable: !!subscription,
    isHardwareAvailable,
    subscribe,
    unsubscribe,
    simulateShake,
  };
};
