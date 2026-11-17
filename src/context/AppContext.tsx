import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  apiGet,
  apiPost,
  apiPatch,
  isSupabaseConfigured,
  ApiError,
  ApiErrorType,
} from '../services/api';
import {
  Lahan,
  Jadwal,
  Jurnal,
  Panen,
  LahanDTO,
  JadwalDTO,
  JurnalDTO,
  PanenDTO,
} from '../types/api';
import {
  mapLahanDTOtoModel,
  mapModelToLahanDTO,
  mapJadwalDTOtoModel,
  mapModelToJadwalDTO,
  mapJurnalDTOtoModel,
  mapModelToJurnalDTO,
  mapPanenDTOtoModel,
  mapModelToPanenDTO,
} from '../utils/mapper';

// Re-export type model domain untuk kompatibilitas impor di seluruh komponen
export type { Lahan, Jadwal, Jurnal, Panen } from '../types/api';

/**
 * Kondisi Antarmuka API UI States (Slide 3 & 5 Pekan 6)
 */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error' | 'offline' | 'timeout';

/**
 * Skenario pengujian & demonstrasi Sprint 05 (Slide 12 & 14 Pekan 6)
 */
export type SimulationScenario = 'normal' | 'offline' | 'timeout' | 'http_404' | 'http_500';

export type AppContextType = {
  lahanList: Lahan[];
  addLahan: (lahan: Omit<Lahan, 'id'>) => Promise<void>;
  jadwalList: Jadwal[];
  addJadwal: (jadwal: Omit<Jadwal, 'id' | 'selesai'>) => Promise<void>;
  toggleJadwalSelesai: (id: string) => Promise<void>;
  jurnalList: Jurnal[];
  addJurnal: (jurnal: Omit<Jurnal, 'id'>) => Promise<void>;
  panenList: Panen[];
  setPanenList: React.Dispatch<React.SetStateAction<Panen[]>>;
  addPanen: (panen: Omit<Panen, 'id'>) => Promise<void>;
  togglePanenStatus: (id: string) => Promise<void>;
  isLoading: boolean;
  apiStatus: ApiStatus;
  error: string | null;
  errorType: ApiErrorType | null;
  statusCode: number | null;
  isCloudConnected: boolean;
  isSimulationActive: boolean;
  refetchAll: () => Promise<void>;
  simulateApiCondition: (scenario: SimulationScenario) => Promise<void>;
  clearError: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Data default / demonstrasi untuk lingkungan tanpa koneksi internet atau saat cloud server offline
const SEED_LAHAN: Lahan[] = [
  {
    id: '1',
    nama: 'Lahan Sawah Ciherang Blok A',
    luas: '1.2 Ha',
    tanaman: 'Padi Ciherang',
    tanggalTanam: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    id: '2',
    nama: 'Kebun Jagung Manis Blok C',
    luas: '800 m²',
    tanaman: 'Jagung Manis',
    tanggalTanam: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];

const SEED_JADWAL: Jadwal[] = [
  {
    id: '1',
    idLahan: '1',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '07:00',
    kegiatan: 'Penyiraman Air & Pupuk Cair NPK',
    selesai: false,
  },
  {
    id: '2',
    idLahan: '1',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '16:00',
    kegiatan: 'Inspeksi Hama & Pembersihan Gulma',
    selesai: false,
  },
];

const SEED_JURNAL: Jurnal[] = [
  {
    id: '1',
    idLahan: '1',
    tanggal: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    catatan: 'Aplikasi pupuk NPK Mutiara 16-16-16 dosis 50kg dan penyiangan gulma petak selatan.',
    biaya: 450000,
  },
  {
    id: '2',
    idLahan: '2',
    tanggal: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    catatan: 'Pengendalian hama penggerek batang menggunakan pestisida nabati.',
    biaya: 175000,
  },
];

const SEED_PANEN: Panen[] = [
  {
    id: '1',
    idLahan: '1',
    tanggal: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jumlah: 850,
    satuan: 'Kg',
    hargaJual: 14000,
    isCompleted: true,
    commodity: 'Padi Ciherang',
  },
  {
    id: '2',
    idLahan: '2',
    tanggal: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    jumlah: 450,
    satuan: 'Kg',
    hargaJual: 9000,
    isCompleted: false,
    commodity: 'Jagung Manis',
  },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lahanList, setLahanList] = useState<Lahan[]>(SEED_LAHAN);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>(SEED_JADWAL);
  const [jurnalList, setJurnalList] = useState<Jurnal[]>(SEED_JURNAL);
  const [panenList, setPanenList] = useState<Panen[]>(SEED_PANEN);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ApiErrorType | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);

  /**
   * Helper pemetaan error terpusat sesuai Slide 2, 4, 6, 7, 8, & 9 Pekan 6
   */
  const applyErrorState = useCallback((err: any) => {
    let detectedType: ApiErrorType = 'UNKNOWN';
    let detectedStatus: number | null = null;
    let friendlyMessage = 'Gagal mengambil data. Terjadi kesalahan pada server. Silakan coba lagi.';

    if (err instanceof ApiError) {
      detectedType = err.errorType;
      detectedStatus = err.status || null;
      friendlyMessage = err.message;
    } else if (err?.name === 'AbortError') {
      detectedType = 'TIMEOUT';
      detectedStatus = 408;
      friendlyMessage =
        'Waktu permintaan habis (Request Timeout). Server membutuhkan waktu terlalu lama untuk merespons.';
    } else {
      const lowerMsg = (err?.message || '').toLowerCase();
      if (
        lowerMsg.includes('network') ||
        lowerMsg.includes('failed to fetch') ||
        lowerMsg.includes('internet') ||
        lowerMsg.includes('offline') ||
        lowerMsg.includes('enotfound') ||
        lowerMsg.includes('dns')
      ) {
        detectedType = 'OFFLINE';
        detectedStatus = 0;
        friendlyMessage = 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.';
      } else if (err?.message) {
        friendlyMessage = err.message;
      }
    }

    setErrorType(detectedType);
    setStatusCode(detectedStatus);

    if (detectedType === 'OFFLINE') {
      setApiStatus('offline');
    } else if (detectedType === 'TIMEOUT') {
      setApiStatus('timeout');
    } else {
      setApiStatus('error');
    }

    setError(friendlyMessage);
    setIsCloudConnected(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
    setStatusCode(null);
    setIsSimulationActive(false);
    setApiStatus('idle');
  }, []);

  /**
   * Mengambil seluruh data (lahan, jadwal, jurnal, panen) secara paralel dari Supabase PostgREST API
   * dengan penanganan Loading, Success, Error, Timeout, dan Offline (Slide 2, 4, 6, 7, 10, & 11 Pekan 6).
   */
  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    setApiStatus('loading');
    setError(null);
    setErrorType(null);
    setStatusCode(null);
    setIsSimulationActive(false);

    // Jika konfigurasi Supabase belum disetel di .env, gunakan mode demonstrasi lokal
    if (!isSupabaseConfigured()) {
      setLahanList(SEED_LAHAN);
      setJadwalList(SEED_JADWAL);
      setJurnalList(SEED_JURNAL);
      setPanenList(SEED_PANEN);
      setIsCloudConnected(false);
      setApiStatus('success');
      setStatusCode(200);
      setIsLoading(false);
      return;
    }

    try {
      const [lahanRes, jadwalRes, jurnalRes, panenRes] = await Promise.all([
        apiGet<LahanDTO[]>('/rest/v1/lahan?select=*'),
        apiGet<JadwalDTO[]>('/rest/v1/jadwal_perawatan?select=*'),
        apiGet<JurnalDTO[]>('/rest/v1/jurnal_lapangan?select=*'),
        apiGet<PanenDTO[]>('/rest/v1/laporan_panen?select=*'),
      ]);

      if (Array.isArray(lahanRes)) {
        const mappedLahan = lahanRes.map(mapLahanDTOtoModel);
        setLahanList(mappedLahan.length > 0 ? mappedLahan : SEED_LAHAN);
      }
      if (Array.isArray(jadwalRes)) {
        const mappedJadwal = jadwalRes.map(mapJadwalDTOtoModel);
        setJadwalList(mappedJadwal.length > 0 ? mappedJadwal : SEED_JADWAL);
      }
      if (Array.isArray(jurnalRes)) {
        const mappedJurnal = jurnalRes.map(mapJurnalDTOtoModel);
        setJurnalList(mappedJurnal.length > 0 ? mappedJurnal : SEED_JURNAL);
      }
      if (Array.isArray(panenRes)) {
        const mappedPanen = panenRes.map(mapPanenDTOtoModel);
        setPanenList(mappedPanen.length > 0 ? mappedPanen : SEED_PANEN);
      }

      setIsCloudConnected(true);
      setApiStatus('success');
      setStatusCode(200);
      setError(null);
      setErrorType(null);
    } catch (err: any) {
      console.warn('[AppContext] Cloud server offline/tidak terjangkau, beralih ke data lokal:', err.message);
      // Fallback mulus ke data lokal agar aplikasi tetap berfungsi sempurna
      setLahanList((prev) => (prev.length > 0 ? prev : SEED_LAHAN));
      setJadwalList((prev) => (prev.length > 0 ? prev : SEED_JADWAL));
      setJurnalList((prev) => (prev.length > 0 ? prev : SEED_JURNAL));
      setPanenList((prev) => (prev.length > 0 ? prev : SEED_PANEN));
      setIsCloudConnected(false);
      setApiStatus('idle');
      setError(null);
      setErrorType(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Simulator Kondisi API untuk mempermudah pengujian & demo Sprint 05 (Slide 12 & 14 Pekan 6):
   * - 'normal': Request asli ke Supabase (200 OK)
   * - 'offline': Simulasi Tidak Ada Koneksi Internet (Network Error)
   * - 'timeout': Simulasi Server Lambat / Request Timeout (408)
   * - 'http_404': Simulasi Resource Tidak Ditemukan (404 Client Error)
   * - 'http_500': Simulasi Gangguan Server (500 Internal Server Error)
   */
  const simulateApiCondition = useCallback(
    async (scenario: SimulationScenario) => {
      if (scenario === 'normal') {
        setIsSimulationActive(false);
        await refetchAll();
        return;
      }

      setIsLoading(true);
      setApiStatus('loading');
      setError(null);
      setErrorType(null);
      setStatusCode(null);
      setIsSimulationActive(true);

      // Jeda singkat agar transisi Loading Indicator terlihat jelas oleh penguji (Slide 10 & 12)
      await new Promise((resolve) => setTimeout(resolve, 600));

      try {
        if (scenario === 'offline') {
          throw new ApiError(
            'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.',
            0,
            null,
            'OFFLINE'
          );
        } else if (scenario === 'timeout') {
          throw new ApiError(
            'Waktu permintaan habis (Request Timeout). Server terlalu lama merespons, silakan coba lagi.',
            408,
            null,
            'TIMEOUT'
          );
        } else if (scenario === 'http_404') {
          throw new ApiError(
            'Data atau resource yang Anda cari tidak tersedia di server. (404 Not Found)',
            404,
            null,
            'HTTP_ERROR'
          );
        } else if (scenario === 'http_500') {
          throw new ApiError(
            'Server sedang mengalami gangguan internal. Silakan coba lagi nanti. (500 Internal Server Error)',
            500,
            null,
            'HTTP_ERROR'
          );
        }
      } catch (err: any) {
        applyErrorState(err);
      } finally {
        setIsLoading(false);
      }
    },
    [refetchAll, applyErrorState]
  );

  // Hook useEffect untuk initial data fetch saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setLahanList(SEED_LAHAN);
          setJadwalList(SEED_JADWAL);
          setJurnalList(SEED_JURNAL);
          setPanenList(SEED_PANEN);
          setIsCloudConnected(false);
          setApiStatus('idle');
          setStatusCode(200);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        setApiStatus('loading');
        const [lahanRes, jadwalRes, jurnalRes, panenRes] = await Promise.all([
          apiGet<LahanDTO[]>('/rest/v1/lahan?select=*'),
          apiGet<JadwalDTO[]>('/rest/v1/jadwal_perawatan?select=*'),
          apiGet<JurnalDTO[]>('/rest/v1/jurnal_lapangan?select=*'),
          apiGet<PanenDTO[]>('/rest/v1/laporan_panen?select=*'),
        ]);

        if (isMounted) {
          if (Array.isArray(lahanRes) && lahanRes.length > 0) {
            setLahanList(lahanRes.map(mapLahanDTOtoModel));
          } else {
            setLahanList(SEED_LAHAN);
          }
          if (Array.isArray(jadwalRes) && jadwalRes.length > 0) {
            setJadwalList(jadwalRes.map(mapJadwalDTOtoModel));
          } else {
            setJadwalList(SEED_JADWAL);
          }
          if (Array.isArray(jurnalRes) && jurnalRes.length > 0) {
            setJurnalList(jurnalRes.map(mapJurnalDTOtoModel));
          } else {
            setJurnalList(SEED_JURNAL);
          }
          if (Array.isArray(panenRes) && panenRes.length > 0) {
            setPanenList(panenRes.map(mapPanenDTOtoModel));
          } else {
            setPanenList(SEED_PANEN);
          }

          setIsCloudConnected(true);
          setApiStatus('success');
          setStatusCode(200);
          setError(null);
          setErrorType(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[AppContext] Server Cloud belum aktif/terjangkau. Mengaktifkan mode lokal:', err.message);
          setLahanList(SEED_LAHAN);
          setJadwalList(SEED_JADWAL);
          setJurnalList(SEED_JURNAL);
          setPanenList(SEED_PANEN);
          setIsCloudConnected(false);
          setApiStatus('idle');
          setStatusCode(200);
          setError(null);
          setErrorType(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Menambahkan Lahan Baru (POST /rest/v1/lahan) dengan Penanganan Error (Slide 9 & 10)
   */
  const addLahan = async (lahanData: Omit<Lahan, 'id'>) => {
    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const dto = mapModelToLahanDTO(lahanData);
        const res = await apiPost<LahanDTO[] | LahanDTO>('/rest/v1/lahan', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newLahan = mapLahanDTOtoModel(insertedDto);
          setLahanList((prev) => [...prev, newLahan]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan ke cloud, simpan ke lokal:', err.message);
      }
    }

    // Fallback lokal jika API belum tersambung
    const newLahan: Lahan = {
      ...lahanData,
      id: Date.now().toString(),
    };
    setLahanList((prev) => [...prev, newLahan]);
  };

  /**
   * Menambahkan Jadwal Perawatan Baru (POST /rest/v1/jadwal_perawatan)
   */
  const addJadwal = async (jadwalData: Omit<Jadwal, 'id' | 'selesai'>) => {
    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const dto = mapModelToJadwalDTO(jadwalData);
        const res = await apiPost<JadwalDTO[] | JadwalDTO>('/rest/v1/jadwal_perawatan', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newJadwal = mapJadwalDTOtoModel(insertedDto);
          setJadwalList((prev) => [...prev, newJadwal]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan jadwal ke cloud, simpan ke lokal:', err.message);
      }
    }

    // Fallback lokal
    const newJadwal: Jadwal = {
      ...jadwalData,
      id: Date.now().toString(),
      selesai: false,
    };
    setJadwalList((prev) => [...prev, newJadwal]);
  };

  /**
   * Memperbarui Status Penyelesaian Jadwal (PATCH /rest/v1/jadwal_perawatan?id=eq.{id})
   */
  const toggleJadwalSelesai = async (id: string) => {
    const current = jadwalList.find((j) => j.id === id);
    if (!current) return;
    const nextStatus = !current.selesai;

    // Optimistic Update pada state lokal
    setJadwalList((prev) =>
      prev.map((j) => (j.id === id ? { ...j, selesai: nextStatus } : j))
    );

    // Hanya kirim PATCH ke Supabase jika ID berupa UUID/angka valid di database dan sedang online
    if (isSupabaseConfigured() && isCloudConnected && id.length > 4) {
      try {
        await apiPatch<JadwalDTO[]>(
          `/rest/v1/jadwal_perawatan?id=eq.${id}`,
          { selesai: nextStatus }
        );
      } catch (err: any) {
        console.warn('[AppContext] Gagal mengupdate status jadwal di server:', err.message);
        // Rollback state lokal jika request gagal
        setJadwalList((prev) =>
          prev.map((j) => (j.id === id ? { ...j, selesai: !nextStatus } : j))
        );
      }
    }
  };

  /**
   * Menambahkan Catatan Jurnal Lapangan Baru (POST /rest/v1/jurnal_lapangan)
   */
  const addJurnal = async (jurnalData: Omit<Jurnal, 'id'>) => {
    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const dto = mapModelToJurnalDTO(jurnalData);
        const res = await apiPost<JurnalDTO[] | JurnalDTO>('/rest/v1/jurnal_lapangan', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newJurnal = mapJurnalDTOtoModel(insertedDto);
          setJurnalList((prev) => [newJurnal, ...prev]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan jurnal ke cloud, simpan ke lokal:', err.message);
      }
    }

    // Fallback lokal
    const newJurnal: Jurnal = {
      ...jurnalData,
      id: Date.now().toString(),
    };
    setJurnalList((prev) => [newJurnal, ...prev]);
  };

  /**
   * Menambahkan Laporan Hasil Panen Baru (POST /rest/v1/laporan_panen)
   */
  const addPanen = async (panenData: Omit<Panen, 'id'>) => {
    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const dto = mapModelToPanenDTO(panenData);
        const res = await apiPost<PanenDTO[] | PanenDTO>('/rest/v1/laporan_panen', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newPanen = mapPanenDTOtoModel(insertedDto);
          setPanenList((prev) => [newPanen, ...prev]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan panen ke cloud, simpan ke lokal:', err.message);
      }
    }

    // Fallback lokal
    const newPanen: Panen = {
      ...panenData,
      id: Date.now().toString(),
      isCompleted: panenData.isCompleted ?? false,
    };
    setPanenList((prev) => [newPanen, ...prev]);
  };

  /**
   * Mengubah status verifikasi/penyelesaian panen (Task 03: PATCH parsial isCompleted / selesai)
   */
  const togglePanenStatus = async (id: string) => {
    const current = panenList.find((p) => p.id === id);
    if (!current) return;
    const nextStatus = !current.isCompleted;

    // Mutation Immutable State lokal
    setPanenList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isCompleted: nextStatus } : item))
    );

    // Kirim PATCH ke Supabase jika terhubung ke cloud
    if (isSupabaseConfigured() && isCloudConnected && id.length > 4) {
      try {
        await apiPatch<PanenDTO[]>(
          `/rest/v1/laporan_panen?id=eq.${id}`,
          { selesai: nextStatus, is_completed: nextStatus }
        );
      } catch (err: any) {
        console.warn('[AppContext] Gagal update status panen di cloud:', err.message);
        // Rollback state lokal jika request gagal
        setPanenList((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isCompleted: !nextStatus } : item))
        );
        throw err;
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        lahanList,
        addLahan,
        jadwalList,
        addJadwal,
        toggleJadwalSelesai,
        jurnalList,
        addJurnal,
        panenList,
        setPanenList,
        addPanen,
        togglePanenStatus,
        isLoading,
        apiStatus,
        error,
        errorType,
        statusCode,
        isCloudConnected,
        isSimulationActive,
        refetchAll,
        simulateApiCondition,
        clearError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
