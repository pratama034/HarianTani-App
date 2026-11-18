import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiPatch, apiDelete, isSupabaseConfigured } from './api';

const QUEUE_STORAGE_KEY = '@hariantani_offline_mutation_queue_v1';

export interface MutationQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  createdAt: string;
  retryCount: number;
  error?: string;
}

/**
 * Membaca seluruh daftar antrean mutasi offline dari AsyncStorage
 */
export async function getMutationQueue(): Promise<MutationQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan seluruh antrean ke AsyncStorage
 */
async function saveMutationQueue(queue: MutationQueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('[SyncQueue] Gagal menyimpan antrean mutasi:', err);
  }
}

/**
 * Menambahkan mutasi baru ke antrean lokal saat offline / network error
 */
export async function enqueueMutation(
  item: Omit<MutationQueueItem, 'id' | 'status' | 'createdAt' | 'retryCount'>
): Promise<MutationQueueItem> {
  const newItem: MutationQueueItem = {
    ...item,
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  const queue = await getMutationQueue();
  queue.push(newItem);
  await saveMutationQueue(queue);
  return newItem;
}

/**
 * Menghapus mutasi dari antrean berdasarkan ID setelah berhasil disinkronkan
 */
export async function removeMutation(id: string): Promise<void> {
  const queue = await getMutationQueue();
  const filtered = queue.filter((q) => q.id !== id);
  await saveMutationQueue(filtered);
}

/**
 * Membersihkan seluruh antrean mutasi offline
 */
export async function clearMutationQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (err) {
    console.warn('[SyncQueue] Gagal menghapus antrean mutasi:', err);
  }
}

/**
 * Menghitung jumlah mutasi dengan status PENDING
 */
export async function getPendingMutationCount(): Promise<number> {
  const queue = await getMutationQueue();
  return queue.filter((q) => q.status === 'PENDING').length;
}

/**
 * Memproses dan menyinkronkan seluruh antrean mutasi PENDING ke Supabase PostgREST
 * Dijalankan ketika koneksi internet kembali aktif atau saat user memicu sinkronisasi manual.
 */
export async function processMutationQueue(): Promise<{
  successCount: number;
  failCount: number;
  remainingCount: number;
}> {
  if (!isSupabaseConfigured()) {
    return { successCount: 0, failCount: 0, remainingCount: 0 };
  }

  const queue = await getMutationQueue();
  if (queue.length === 0) {
    return { successCount: 0, failCount: 0, remainingCount: 0 };
  }

  let successCount = 0;
  let failCount = 0;
  const remainingQueue: MutationQueueItem[] = [];

  for (const item of queue) {
    try {
      if (item.method === 'POST') {
        try {
          await apiPost(item.endpoint, item.payload);
        } catch (postErr: any) {
          const errMsg = String(postErr?.message || '').toLowerCase();
          if (
            item.endpoint.includes('/lahan') &&
            (errMsg.includes('pgrst204') || errMsg.includes('schema cache') || errMsg.includes('column'))
          ) {
            const sanitizedPayload = {
              nama: item.payload?.nama,
              luas: item.payload?.luas,
              tanaman: item.payload?.tanaman,
              tanggal_tanam: item.payload?.tanggal_tanam,
            };
            await apiPost(item.endpoint, sanitizedPayload);
          } else {
            throw postErr;
          }
        }
      } else if (item.method === 'PATCH') {
        await apiPatch(item.endpoint, item.payload);
      } else if (item.method === 'DELETE') {
        await apiDelete(item.endpoint);
      }
      successCount++;
    } catch (err: any) {
      failCount++;
      const isNetworkErr =
        err?.errorType === 'OFFLINE' ||
        err?.errorType === 'TIMEOUT' ||
        err?.status === 0;

      if (isNetworkErr && item.retryCount < 5) {
        // Simpan kembali untuk percobaan sinkronisasi berikutnya
        remainingQueue.push({
          ...item,
          status: 'PENDING',
          retryCount: item.retryCount + 1,
          error: err?.message,
        });
      } else {
        // Jika error non-network (4xx Bad Request) atau melebihi kuota retry
        console.warn(`[SyncQueue] Mutasi ${item.id} gagal disinkronkan:`, err?.message);
      }
    }
  }

  await saveMutationQueue(remainingQueue);
  return {
    successCount,
    failCount,
    remainingCount: remainingQueue.length,
  };
}
