import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  apiGet,
  apiPost,
  apiPatch,
  getJurnalLapangan,
  getLaporanPanen,
  isSupabaseConfigured,
  ApiError,
  ApiErrorType,
} from '../services/api';
import {
  enqueueMutation,
  processMutationQueue,
  getPendingMutationCount,
  clearMutationQueue,
} from '../services/syncQueue';
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
  pendingMutationCount: number;
  syncOfflineMutations: () => Promise<{ successCount: number; failCount: number; remainingCount: number }>;
  refetchAll: () => Promise<void>;
  loadMoreJurnal: () => Promise<void>;
  hasMoreJurnal: boolean;
  isLoadingMoreJurnal: boolean;
  simulateApiCondition: (scenario: SimulationScenario) => Promise<void>;
  clearError: () => void;
  clearCache: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lahanList, setLahanList] = useState<Lahan[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [jurnalList, setJurnalList] = useState<Jurnal[]>([]);
  const [panenList, setPanenList] = useState<Panen[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ApiErrorType | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(false);
  const [jurnalPage, setJurnalPage] = useState<number>(1);
  const [hasMoreJurnal, setHasMoreJurnal] = useState<boolean>(true);
  const [isLoadingMoreJurnal, setIsLoadingMoreJurnal] = useState<boolean>(false);
  const [pendingMutationCount, setPendingMutationCount] = useState<number>(0);

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

  const syncOfflineMutations = useCallback(async () => {
    try {
      const res = await processMutationQueue();
      const remaining = await getPendingMutationCount();
      setPendingMutationCount(remaining);
      if (res.successCount > 0) {
        const [lahanRes, jadwalRes, jurnalRes, panenRes] = await Promise.all([
          apiGet<LahanDTO[]>('/rest/v1/lahan?select=*'),
          apiGet<JadwalDTO[]>('/rest/v1/jadwal_perawatan?select=*'),
          getJurnalLapangan<JurnalDTO>({ limit: 20 }),
          getLaporanPanen<PanenDTO>({ limit: 20 }),
        ]);
        setLahanList(Array.isArray(lahanRes) ? lahanRes.map(mapLahanDTOtoModel) : []);
        setJadwalList(Array.isArray(jadwalRes) ? jadwalRes.map(mapJadwalDTOtoModel) : []);
        setJurnalList(Array.isArray(jurnalRes) ? jurnalRes.map(mapJurnalDTOtoModel) : []);
        setPanenList(Array.isArray(panenRes) ? panenRes.map(mapPanenDTOtoModel) : []);
        setIsCloudConnected(true);
      }
      return res;
    } catch {
      const remaining = await getPendingMutationCount();
      setPendingMutationCount(remaining);
      return { successCount: 0, failCount: 0, remainingCount: remaining };
    }
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

    // Coba proses antrean mutasi yang tertunda jika ada koneksi
    if (isSupabaseConfigured()) {
      void syncOfflineMutations();
    }

    // Jika konfigurasi Supabase belum disetel di .env
    if (!isSupabaseConfigured()) {
      setLahanList([]);
      setJadwalList([]);
      setJurnalList([]);
      setPanenList([]);
      setIsCloudConnected(false);
      setApiStatus('error');
      setError('Konfigurasi kredensial Supabase belum disetel di file .env.');
      setStatusCode(null);
      setIsLoading(false);
      return;
    }

    try {
      const [lahanRes, jadwalRes, jurnalRes, panenRes] = await Promise.all([
        apiGet<LahanDTO[]>('/rest/v1/lahan?select=*'),
        apiGet<JadwalDTO[]>('/rest/v1/jadwal_perawatan?select=*'),
        getJurnalLapangan<JurnalDTO>({ limit: 20 }),
        getLaporanPanen<PanenDTO>({ limit: 20 }),
      ]);

      // Jika fetch ke Supabase berhasil namun mengembalikan array kosong, pastikan state lokal di-set menjadi [] (bukan diisi data SEED).
      setLahanList(Array.isArray(lahanRes) ? lahanRes.map(mapLahanDTOtoModel) : []);
      setJadwalList(Array.isArray(jadwalRes) ? jadwalRes.map(mapJadwalDTOtoModel) : []);
      setJurnalList(Array.isArray(jurnalRes) ? jurnalRes.map(mapJurnalDTOtoModel) : []);
      setPanenList(Array.isArray(panenRes) ? panenRes.map(mapPanenDTOtoModel) : []);

      setIsCloudConnected(true);
      setApiStatus('success');
      setStatusCode(200);
      setError(null);
      setErrorType(null);
      setHasMoreJurnal(true);
      setJurnalPage(1);
    } catch (err: any) {
      console.warn('[AppContext] API error saat refetchAll:', err?.message);
      // Jika API mengalami error (Timeout/Offline), biarkan state tetap menggunakan data terakhir yang ada di memori,
      // dan tampilkan pesan error network ke pengguna (jangan di-replace dengan data SEED).
      applyErrorState(err);
    } finally {
      setIsLoading(false);
    }
  }, [applyErrorState, syncOfflineMutations]);

  /**
   * Logika paginasi Supabase untuk memuat data jurnal berikutnya (onEndReached)
   */
  const loadMoreJurnal = useCallback(async () => {
    if (isLoadingMoreJurnal || !hasMoreJurnal || !isSupabaseConfigured()) return;
    setIsLoadingMoreJurnal(true);
    try {
      const nextPage = jurnalPage + 1;
      const res = await getJurnalLapangan<JurnalDTO>({ page: nextPage, limit: 20 });
      if (Array.isArray(res)) {
        if (res.length < 20) {
          setHasMoreJurnal(false);
        }
        if (res.length > 0) {
          setJurnalList((prev) => [...prev, ...res.map(mapJurnalDTOtoModel)]);
          setJurnalPage(nextPage);
        }
      }
    } catch {
      // Pertahankan data yang ada jika terjadi gangguan jaringan pada pagination
    } finally {
      setIsLoadingMoreJurnal(false);
    }
  }, [isLoadingMoreJurnal, hasMoreJurnal, jurnalPage]);

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
      // Inisialisasi hitungan antrean mutasi offline
      try {
        const pendingCount = await getPendingMutationCount();
        if (isMounted) {
          setPendingMutationCount(pendingCount);
        }
      } catch {
        // silent
      }

      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setLahanList([]);
          setJadwalList([]);
          setJurnalList([]);
          setPanenList([]);
          setIsCloudConnected(false);
          setApiStatus('error');
          setError('Konfigurasi kredensial Supabase belum disetel di file .env.');
          setStatusCode(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        setApiStatus('loading');
        // Sinkronisasikan mutasi offline yang sempat tertunda jika ada koneksi
        void syncOfflineMutations();

        const [lahanRes, jadwalRes, jurnalRes, panenRes] = await Promise.all([
          apiGet<LahanDTO[]>('/rest/v1/lahan?select=*'),
          apiGet<JadwalDTO[]>('/rest/v1/jadwal_perawatan?select=*'),
          getJurnalLapangan<JurnalDTO>({ limit: 20 }),
          getLaporanPanen<PanenDTO>({ limit: 20 }),
        ]);

        if (isMounted) {
          setLahanList(Array.isArray(lahanRes) ? lahanRes.map(mapLahanDTOtoModel) : []);
          setJadwalList(Array.isArray(jadwalRes) ? jadwalRes.map(mapJadwalDTOtoModel) : []);
          setJurnalList(Array.isArray(jurnalRes) ? jurnalRes.map(mapJurnalDTOtoModel) : []);
          setPanenList(Array.isArray(panenRes) ? panenRes.map(mapPanenDTOtoModel) : []);

          setIsCloudConnected(true);
          setApiStatus('success');
          setStatusCode(200);
          setError(null);
          setErrorType(null);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('[AppContext] Gagal memuat data awal dari cloud:', err?.message);
          applyErrorState(err);
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
  }, [applyErrorState, syncOfflineMutations]);

  /**
   * Membersihkan seluruh data cache lokal AsyncStorage dan mereset memori state AppContext
   */
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.clear();
      await clearMutationQueue();
      setPendingMutationCount(0);
    } catch (err) {
      console.warn('[AppContext] Gagal membersihkan AsyncStorage:', err);
    }
    setLahanList([]);
    setJadwalList([]);
    setJurnalList([]);
    setPanenList([]);
    setError(null);
    setErrorType(null);
    setStatusCode(null);
    setApiStatus('idle');
  }, []);

  /**
   * Menambahkan Lahan Baru (POST /rest/v1/lahan) dengan Penanganan Error dan Offline Mutation Queue
   */
  const addLahan = async (lahanData: Omit<Lahan, 'id'>) => {
    const dto = mapModelToLahanDTO(lahanData);

    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        let insertedDto: LahanDTO | null = null;
        try {
          const res = await apiPost<LahanDTO[] | LahanDTO>('/rest/v1/lahan', dto);
          insertedDto = Array.isArray(res) ? res[0] : res;
        } catch (postErr: any) {
          const errMsg = String(postErr?.message || postErr?.data?.message || '').toLowerCase();
          const isSchemaError =
            errMsg.includes('pgrst204') ||
            errMsg.includes('schema cache') ||
            errMsg.includes('column') ||
            postErr?.status === 400;

          // Jika Supabase menolak karena kolom LBS (latitude/longitude/address) belum ada di tabel Supabase,
          // lakukan retry otomatis menggunakan core fields agar data tetap tersimpan ke cloud secara permanen.
          if (isSchemaError && (dto.latitude !== undefined || dto.longitude !== undefined || dto.address !== undefined)) {
            const coreDto: LahanDTO = {
              nama: dto.nama,
              luas: dto.luas,
              tanaman: dto.tanaman,
              tanggal_tanam: dto.tanggal_tanam,
            };
            const retryRes = await apiPost<LahanDTO[] | LahanDTO>('/rest/v1/lahan', coreDto);
            insertedDto = Array.isArray(retryRes) ? retryRes[0] : retryRes;
          } else {
            throw postErr;
          }
        }

        if (insertedDto) {
          const newLahan: Lahan = {
            ...mapLahanDTOtoModel(insertedDto),
            latitude: lahanData.latitude ?? null,
            longitude: lahanData.longitude ?? null,
            address: lahanData.address ?? null,
          };
          setLahanList((prev) => [...prev, newLahan]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan ke cloud, enqueue ke antrean mutasi offline:', err.message);
        // Sanitasi payload antrean agar tidak menimbulkan error skema berulang saat sinkronisasi
        const queuePayload: LahanDTO = {
          nama: dto.nama,
          luas: dto.luas,
          tanaman: dto.tanaman,
          tanggal_tanam: dto.tanggal_tanam,
        };
        await enqueueMutation({
          endpoint: '/rest/v1/lahan',
          method: 'POST',
          payload: queuePayload,
        });
        const count = await getPendingMutationCount();
        setPendingMutationCount(count);
      }
    } else {
      const queuePayload: LahanDTO = {
        nama: dto.nama,
        luas: dto.luas,
        tanaman: dto.tanaman,
        tanggal_tanam: dto.tanggal_tanam,
      };
      await enqueueMutation({
        endpoint: '/rest/v1/lahan',
        method: 'POST',
        payload: queuePayload,
      });
      const count = await getPendingMutationCount();
      setPendingMutationCount(count);
    }

    // Update optimis ke state lokal
    const newLahan: Lahan = {
      ...lahanData,
      id: `offline_${Date.now()}`,
    };
    setLahanList((prev) => [...prev, newLahan]);
  };

  /**
   * Menambahkan Jadwal Perawatan Baru (POST /rest/v1/jadwal_perawatan) dengan Offline Queue
   */
  const addJadwal = async (jadwalData: Omit<Jadwal, 'id' | 'selesai'>) => {
    const dto = mapModelToJadwalDTO(jadwalData);

    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const res = await apiPost<JadwalDTO[] | JadwalDTO>('/rest/v1/jadwal_perawatan', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newJadwal = mapJadwalDTOtoModel(insertedDto);
          setJadwalList((prev) => [...prev, newJadwal]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan jadwal ke cloud, enqueue ke antrean mutasi offline:', err.message);
        await enqueueMutation({
          endpoint: '/rest/v1/jadwal_perawatan',
          method: 'POST',
          payload: dto,
        });
        const count = await getPendingMutationCount();
        setPendingMutationCount(count);
      }
    } else {
      await enqueueMutation({
        endpoint: '/rest/v1/jadwal_perawatan',
        method: 'POST',
        payload: dto,
      });
      const count = await getPendingMutationCount();
      setPendingMutationCount(count);
    }

    // Update optimis ke state lokal
    const newJadwal: Jadwal = {
      ...jadwalData,
      id: `offline_${Date.now()}`,
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

    // Kirim PATCH ke Supabase atau simpan ke offline mutation queue
    if (isSupabaseConfigured() && isCloudConnected && !id.startsWith('offline_')) {
      try {
        await apiPatch<JadwalDTO[]>(
          `/rest/v1/jadwal_perawatan?id=eq.${id}`,
          { selesai: nextStatus }
        );
      } catch (err: any) {
        console.warn('[AppContext] Gagal mengupdate status jadwal di server, enqueue ke offline queue:', err.message);
        await enqueueMutation({
          endpoint: `/rest/v1/jadwal_perawatan?id=eq.${id}`,
          method: 'PATCH',
          payload: { selesai: nextStatus },
        });
        const count = await getPendingMutationCount();
        setPendingMutationCount(count);
      }
    } else if (!id.startsWith('offline_')) {
      await enqueueMutation({
        endpoint: `/rest/v1/jadwal_perawatan?id=eq.${id}`,
        method: 'PATCH',
        payload: { selesai: nextStatus },
      });
      const count = await getPendingMutationCount();
      setPendingMutationCount(count);
    }
  };

  /**
   * Menambahkan Catatan Jurnal Lapangan Baru (POST /rest/v1/jurnal_lapangan)
   */
  const addJurnal = async (jurnalData: Omit<Jurnal, 'id'>) => {
    const dto = mapModelToJurnalDTO(jurnalData);

    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const res = await apiPost<JurnalDTO[] | JurnalDTO>('/rest/v1/jurnal_lapangan', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newJurnal = mapJurnalDTOtoModel(insertedDto);
          setJurnalList((prev) => [newJurnal, ...prev]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan jurnal ke cloud, enqueue ke offline mutation queue:', err.message);
        await enqueueMutation({
          endpoint: '/rest/v1/jurnal_lapangan',
          method: 'POST',
          payload: dto,
        });
        const count = await getPendingMutationCount();
        setPendingMutationCount(count);
      }
    } else {
      await enqueueMutation({
        endpoint: '/rest/v1/jurnal_lapangan',
        method: 'POST',
        payload: dto,
      });
      const count = await getPendingMutationCount();
      setPendingMutationCount(count);
    }

    // Update optimis ke state lokal
    const newJurnal: Jurnal = {
      ...jurnalData,
      id: `offline_${Date.now()}`,
    };
    setJurnalList((prev) => [newJurnal, ...prev]);
  };

  /**
   * Menambahkan Laporan Hasil Panen Baru (POST /rest/v1/laporan_panen)
   */
  const addPanen = async (panenData: Omit<Panen, 'id'>) => {
    const dto = mapModelToPanenDTO(panenData);

    if (isSupabaseConfigured() && isCloudConnected) {
      try {
        const res = await apiPost<PanenDTO[] | PanenDTO>('/rest/v1/laporan_panen', dto);
        const insertedDto = Array.isArray(res) ? res[0] : res;
        if (insertedDto) {
          const newPanen = mapPanenDTOtoModel(insertedDto);
          setPanenList((prev) => [newPanen, ...prev]);
          return;
        }
      } catch (err: any) {
        console.warn('[AppContext] Gagal simpan panen ke cloud, enqueue ke offline mutation queue:', err.message);
        await enqueueMutation({
          endpoint: '/rest/v1/laporan_panen',
          method: 'POST',
          payload: dto,
        });
        const count = await getPendingMutationCount();
        setPendingMutationCount(count);
      }
    } else {
      await enqueueMutation({
        endpoint: '/rest/v1/laporan_panen',
        method: 'POST',
        payload: dto,
      });
      const count = await getPendingMutationCount();
      setPendingMutationCount(count);
    }

    // Update optimis ke state lokal
    const newPanen: Panen = {
      ...panenData,
      id: `offline_${Date.now()}`,
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

    // Kirim PATCH ke Supabase atau simpan ke antrean offline jika jaringan terputus
    if (isSupabaseConfigured() && isCloudConnected && !id.startsWith('offline_')) {
      try {
        await apiPatch<PanenDTO[]>(
          `/rest/v1/laporan_panen?id=eq.${id}`,
          { selesai: nextStatus, is_completed: nextStatus }
        );
      } catch (err: any) {
        console.warn('[AppContext] Gagal update status panen di cloud, enqueue ke offline mutation queue:', err.message);
        await enqueueMutation({
          endpoint: `/rest/v1/laporan_panen?id=eq.${id}`,
          method: 'PATCH',
          payload: { selesai: nextStatus, is_completed: nextStatus },
        });
        const count = await getPendingMutationCount();
        setPendingMutationCount(count);
      }
    } else if (!id.startsWith('offline_')) {
      await enqueueMutation({
        endpoint: `/rest/v1/laporan_panen?id=eq.${id}`,
        method: 'PATCH',
        payload: { selesai: nextStatus, is_completed: nextStatus },
      });
      const count = await getPendingMutationCount();
      setPendingMutationCount(count);
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
        pendingMutationCount,
        syncOfflineMutations,
        refetchAll,
        loadMoreJurnal,
        hasMoreJurnal,
        isLoadingMoreJurnal,
        simulateApiCondition,
        clearError,
        clearCache,
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
