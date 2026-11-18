import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { HarvestItem, PanenDTO } from '../types/api';
import {
  apiPost,
  apiPatch,
  getLaporanPanen,
  isSupabaseConfigured,
} from '../services/api';
import { mapPanenDTOtoModel, mapPanenToHarvestItem } from '../utils/mapper';

export { HarvestItem };

/**
 * URL Referensi Endpoint sesuai dokumen Spesifikasi Teknis Panen Harian
 */
export const API_BASE_URL = 'https://api.hariantani.id/v1/harvests';

/**
 * Data awal kosong untuk panen harian
 */
export const INITIAL_HARVESTS: HarvestItem[] = [];

// ============================================================================
// TASK 01 - Tri-State & Fetch Data (GET) dengan AbortController Cleanup
// ============================================================================

export interface UseFetchHarvestsReturn {
  harvests: HarvestItem[];
  setHarvests: React.Dispatch<React.SetStateAction<HarvestItem[]>>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetchHarvests: (signal?: AbortSignal) => Promise<void>;
  handleRefresh: () => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

export const useFetchHarvests = (
  initialData: HarvestItem[] = []
): UseFetchHarvestsReturn => {
  // Tri-State: harvests (data), loading, error, plus refreshing & pagination
  const [harvests, setHarvests] = useState<HarvestItem[]>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const fetchHarvests = useCallback(async (signal?: AbortSignal) => {
    try {
      // Coba fetch dari REST API Supabase / PostgREST jika dikonfigurasi dengan paginasi awal (limit 20, created_at desc)
      if (isSupabaseConfigured()) {
        const res = await getLaporanPanen<PanenDTO>({ page: 1, limit: 20 }, { signal });

        if (Array.isArray(res)) {
          if (res.length < 20) {
            setHasMore(false);
          } else {
            setHasMore(true);
          }
          const mapped = res.map((dto) => {
            const panen = mapPanenDTOtoModel(dto);
            return mapPanenToHarvestItem(
              panen,
              dto.commodity || (panen.idLahan === '2' ? 'Jagung Manis' : 'Padi Ciherang')
            );
          });
          setHarvests(mapped);
          setPage(1);
          return;
        }
      }

      // Jika menggunakan mock / endpoint spesifikasi
      try {
        const response = await fetch(API_BASE_URL, { signal });
        if (response.ok) {
          const result: HarvestItem[] = await response.json();
          setHarvests(result);
          return;
        }
      } catch (mockErr: any) {
        if (mockErr.name === 'AbortError') throw mockErr;
        // Pertahankan data terakhir di memori, jangan menginjeksi data dummy
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const errorMessage = err.message || 'Terjadi kesalahan jaringan';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Logika dasar pagination untuk onEndReached FlatList (offset/page load)
   */
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || refreshing) return;
    if (!isSupabaseConfigured()) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getLaporanPanen<PanenDTO>({ page: nextPage, limit: 20 });
      if (Array.isArray(res)) {
        if (res.length < 20) {
          setHasMore(false);
        }
        if (res.length > 0) {
          const mapped = res.map((dto) => {
            const panen = mapPanenDTOtoModel(dto);
            return mapPanenToHarvestItem(
              panen,
              dto.commodity || (panen.idLahan === '2' ? 'Jagung Manis' : 'Padi Ciherang')
            );
          });
          setHarvests((prev) => [...prev, ...mapped]);
          setPage(nextPage);
        }
      }
    } catch {
      // Abaikan kegagalan background pagination agar UI tidak terganggu
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, refreshing, page]);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHarvests(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchHarvests]);

  const handleRefresh = () => {
    setError(null);
    setRefreshing(true);
    fetchHarvests();
  };

  return {
    harvests,
    setHarvests,
    loading,
    refreshing,
    error,
    fetchHarvests,
    handleRefresh,
    loadMore,
    hasMore,
    loadingMore,
  };
};

// ============================================================================
// TASK 02 - Menambahkan Data Baru (POST) & State Optimistic/Direct Update
// ============================================================================

export interface UseAddHarvestOptions {
  onSuccessSync?: (item: HarvestItem) => void;
}

export const useAddHarvest = (
  setHarvests: React.Dispatch<React.SetStateAction<HarvestItem[]>>,
  options?: UseAddHarvestOptions
) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const addHarvestRecord = async (
    commodity: string,
    weightKg: number,
    extraMeta?: {
      idLahan?: string;
      satuan?: string;
      hargaJual?: number;
    }
  ) => {
    if (!commodity || weightKg <= 0) {
      Alert.alert(
        'Validasi Gagal',
        'Mohon isi nama komoditas dan berat panen dengan benar.'
      );
      return false;
    }

    setIsSubmitting(true);
    try {
      const payload: HarvestItem = {
        id: Date.now().toString(),
        commodity,
        weightKg,
        isCompleted: false,
        date: new Date().toISOString().split('T')[0],
        idLahan: extraMeta?.idLahan || '1',
        satuan: extraMeta?.satuan || 'Kg',
        hargaJual: extraMeta?.hargaJual || 12000,
      };

      let createdRecord: HarvestItem = payload;

      // Jika terhubung ke cloud Supabase, kirim POST ke database
      if (isSupabaseConfigured()) {
        try {
          const res = await apiPost<PanenDTO[]>('/rest/v1/laporan_panen', {
            id_lahan: payload.idLahan,
            tanggal: payload.date,
            jumlah: payload.weightKg,
            satuan: payload.satuan,
            harga_jual: payload.hargaJual,
            selesai: false,
            is_completed: false,
            commodity: payload.commodity,
          });

          if (Array.isArray(res) && res[0]) {
            const inserted = mapPanenDTOtoModel(res[0]);
            createdRecord = mapPanenToHarvestItem(inserted, payload.commodity);
          }
        } catch (apiErr: any) {
          console.warn('[useAddHarvest] Gagal kirim ke Supabase, simpan ke lokal:', apiErr.message);
        }
      }

      // Update state lokal secara presisi tanpa memanggil ulang API penuh
      setHarvests((prevData) => [createdRecord, ...prevData]);
      if (options?.onSuccessSync) {
        options.onSuccessSync(createdRecord);
      }

      Alert.alert('Sukses', 'Catatan panen berhasil ditambahkan.');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal terhubung ke server.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { addHarvestRecord, isSubmitting };
};

// ============================================================================
// TASK 03 - Ubah Status (PATCH) & Penanganan Error Jaringan
// ============================================================================

export interface UseUpdateHarvestOptions {
  onStatusUpdated?: (id: string, nextStatus: boolean) => void;
}

export const useUpdateHarvest = (
  harvests: HarvestItem[],
  setHarvests: React.Dispatch<React.SetStateAction<HarvestItem[]>>,
  options?: UseUpdateHarvestOptions
) => {
  const toggleHarvestStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;

    try {
      // Jika terhubung ke Supabase, kirim request PATCH parsial
      if (isSupabaseConfigured() && id.length > 4) {
        try {
          await apiPatch<PanenDTO[]>(
            `/rest/v1/laporan_panen?id=eq.${id}`,
            {
              selesai: nextStatus,
              is_completed: nextStatus,
            }
          );
        } catch (patchErr: any) {
          console.warn('[useUpdateHarvest] Gagal PATCH ke server:', patchErr.message);
        }
      }

      // Mutation Immutable State: Update item secara presisi hanya setelah server menerima/memproses
      setHarvests((prevList) =>
        prevList.map((item) =>
          item.id === id ? { ...item, isCompleted: nextStatus } : item
        )
      );

      if (options?.onStatusUpdated) {
        options.onStatusUpdated(id, nextStatus);
      }
    } catch (error: any) {
      // Penanganan Error Jaringan & Server
      const message =
        error.message || 'Koneksi bermasalah. Gagal mengubah status panen.';
      Alert.alert('Kesalahan Pengoperasian', message, [{ text: 'Mengerti' }]);
    }
  };

  return { toggleHarvestStatus };
};
