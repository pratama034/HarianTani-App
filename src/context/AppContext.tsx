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
 * 5 Kondisi Antarmuka API UI States (Slide 3 & 5 Pekan 6)
 */
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error' | 'offline' | 'timeout';

export type AppContextType = {
  lahanList: Lahan[];
  addLahan: (lahan: Omit<Lahan, 'id'>) => Promise<void>;
  jadwalList: Jadwal[];
  addJadwal: (jadwal: Omit<Jadwal, 'id' | 'selesai'>) => Promise<void>;
  toggleJadwalSelesai: (id: string) => Promise<void>;
  jurnalList: Jurnal[];
  addJurnal: (jurnal: Omit<Jurnal, 'id'>) => Promise<void>;
  panenList: Panen[];
  addPanen: (panen: Omit<Panen, 'id'>) => Promise<void>;
  isLoading: boolean;
  apiStatus: ApiStatus;
  error: string | null;
  errorType: ApiErrorType | null;
  isCloudConnected: boolean;
  refetchAll: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Data default / demonstrasi untuk lingkungan tanpa koneksi internet atau sebelum tabel supabase dibuat
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

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lahanList, setLahanList] = useState<Lahan[]>(SEED_LAHAN);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>(SEED_JADWAL);
  const [jurnalList, setJurnalList] = useState<Jurnal[]>([]);
  const [panenList, setPanenList] = useState<Panen[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ApiErrorType | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  /**
   * Mengambil seluruh data (lahan, jadwal, jurnal, panen) secara paralel dari Supabase PostgREST API
   * dengan penanganan Loading, Success, Error, Timeout, dan Offline (Slide 2, 4, 6, 7, 10, & 11 Pekan 6).
   */
  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    setApiStatus('loading');
    setError(null);
    setErrorType(null);

    // Jika konfigurasi Supabase belum disetel di .env, gunakan mode demonstrasi lokal
    if (!isSupabaseConfigured()) {
      setIsCloudConnected(false);
      setApiStatus('idle');
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
        setLahanList(lahanRes.map(mapLahanDTOtoModel));
      }
      if (Array.isArray(jadwalRes)) {
        setJadwalList(jadwalRes.map(mapJadwalDTOtoModel));
      }
      if (Array.isArray(jurnalRes)) {
        setJurnalList(jurnalRes.map(mapJurnalDTOtoModel));
      }
      if (Array.isArray(panenRes)) {
        setPanenList(panenRes.map(mapPanenDTOtoModel));
      }

      setIsCloudConnected(true);
      setApiStatus('success');
      setError(null);
      setErrorType(null);
    } catch (err: any) {
      console.warn('[AppContext] Gagal memuat data dari REST API:', err.message);

      let detectedType: ApiErrorType = 'UNKNOWN';
      let friendlyMessage = 'Koneksi ke REST API gagal. Menggunakan mode lokal.';

      if (err instanceof ApiError) {
        detectedType = err.errorType;
        friendlyMessage = err.message;
      } else if (err.name === 'AbortError') {
        detectedType = 'TIMEOUT';
        friendlyMessage = 'Waktu permintaan habis (Request Timeout). Server lambat merespons.';
      } else {
        const lowerMsg = (err.message || '').toLowerCase();
        if (lowerMsg.includes('network') || lowerMsg.includes('failed to fetch')) {
          detectedType = 'OFFLINE';
          friendlyMessage = 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.';
        }
      }

      setErrorType(detectedType);
      if (detectedType === 'OFFLINE') {
        setApiStatus('offline');
      } else if (detectedType === 'TIMEOUT') {
        setApiStatus('timeout');
      } else {
        setApiStatus('error');
      }

      setError(friendlyMessage);
      setIsCloudConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Hook useEffect untuk initial data fetch saat aplikasi dimuat
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setIsCloudConnected(false);
          setApiStatus('idle');
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
          if (Array.isArray(lahanRes)) {
            setLahanList(lahanRes.map(mapLahanDTOtoModel));
          }
          if (Array.isArray(jadwalRes)) {
            setJadwalList(jadwalRes.map(mapJadwalDTOtoModel));
          }
          if (Array.isArray(jurnalRes)) {
            setJurnalList(jurnalRes.map(mapJurnalDTOtoModel));
          }
          if (Array.isArray(panenRes)) {
            setPanenList(panenRes.map(mapPanenDTOtoModel));
          }

          setIsCloudConnected(true);
          setApiStatus('success');
          setError(null);
          setErrorType(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[AppContext] Initial fetch error:', err.message);

          let detectedType: ApiErrorType = 'UNKNOWN';
          let friendlyMessage = 'Koneksi ke REST API gagal. Menggunakan mode lokal.';

          if (err instanceof ApiError) {
            detectedType = err.errorType;
            friendlyMessage = err.message;
          } else if (err.name === 'AbortError') {
            detectedType = 'TIMEOUT';
            friendlyMessage = 'Waktu permintaan habis (Request Timeout).';
          } else {
            const lowerMsg = (err.message || '').toLowerCase();
            if (lowerMsg.includes('network') || lowerMsg.includes('failed to fetch')) {
              detectedType = 'OFFLINE';
              friendlyMessage = 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi.';
            }
          }

          setErrorType(detectedType);
          if (detectedType === 'OFFLINE') {
            setApiStatus('offline');
          } else if (detectedType === 'TIMEOUT') {
            setApiStatus('timeout');
          } else {
            setApiStatus('error');
          }

          setError(friendlyMessage);
          setIsCloudConnected(false);
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
    if (isSupabaseConfigured()) {
      const dto = mapModelToLahanDTO(lahanData);
      const res = await apiPost<LahanDTO[] | LahanDTO>('/rest/v1/lahan', dto);
      const insertedDto = Array.isArray(res) ? res[0] : res;
      if (insertedDto) {
        const newLahan = mapLahanDTOtoModel(insertedDto);
        setLahanList((prev) => [...prev, newLahan]);
        return;
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
    if (isSupabaseConfigured()) {
      const dto = mapModelToJadwalDTO(jadwalData);
      const res = await apiPost<JadwalDTO[] | JadwalDTO>('/rest/v1/jadwal_perawatan', dto);
      const insertedDto = Array.isArray(res) ? res[0] : res;
      if (insertedDto) {
        const newJadwal = mapJadwalDTOtoModel(insertedDto);
        setJadwalList((prev) => [...prev, newJadwal]);
        return;
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

    if (isSupabaseConfigured()) {
      try {
        await apiPatch<JadwalDTO[]>(
          `/rest/v1/jadwal_perawatan?id=eq.${id}`,
          { selesai: nextStatus }
        );
      } catch (err: any) {
        console.error('[AppContext] Gagal mengupdate status jadwal di server:', err);
        // Rollback state lokal jika request gagal
        setJadwalList((prev) =>
          prev.map((j) => (j.id === id ? { ...j, selesai: !nextStatus } : j))
        );
        throw err;
      }
    }
  };

  /**
   * Menambahkan Catatan Jurnal Lapangan Baru (POST /rest/v1/jurnal_lapangan)
   */
  const addJurnal = async (jurnalData: Omit<Jurnal, 'id'>) => {
    if (isSupabaseConfigured()) {
      const dto = mapModelToJurnalDTO(jurnalData);
      const res = await apiPost<JurnalDTO[] | JurnalDTO>('/rest/v1/jurnal_lapangan', dto);
      const insertedDto = Array.isArray(res) ? res[0] : res;
      if (insertedDto) {
        const newJurnal = mapJurnalDTOtoModel(insertedDto);
        setJurnalList((prev) => [newJurnal, ...prev]);
        return;
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
    if (isSupabaseConfigured()) {
      const dto = mapModelToPanenDTO(panenData);
      const res = await apiPost<PanenDTO[] | PanenDTO>('/rest/v1/laporan_panen', dto);
      const insertedDto = Array.isArray(res) ? res[0] : res;
      if (insertedDto) {
        const newPanen = mapPanenDTOtoModel(insertedDto);
        setPanenList((prev) => [newPanen, ...prev]);
        return;
      }
    }

    // Fallback lokal
    const newPanen: Panen = {
      ...panenData,
      id: Date.now().toString(),
    };
    setPanenList((prev) => [newPanen, ...prev]);
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
        addPanen,
        isLoading,
        apiStatus,
        error,
        errorType,
        isCloudConnected,
        refetchAll,
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
