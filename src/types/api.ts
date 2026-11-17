/**
 * Data Modeling Layer: DTO vs Mobile Model
 * Sesuai Slide 6, 8, & 9 - Task 01 (Pekan 4: Data Modeling + RESTful API)
 *
 * Membedakan secara tegas antara:
 * 1. Format Server Database (PostgreSQL / PostgREST) yang menggunakan konvensi snake_case
 * 2. Format Domain Aplikasi Mobile (React Native / TypeScript) yang menggunakan konvensi camelCase
 */

// ============================================================================
// 1. DTO (Data Transfer Objects) - SERVER POSTGREST / POSTGRESQL (snake_case)
// ============================================================================

/**
 * Representasi baris data tabel 'lahan' dari database PostgreSQL Supabase.
 */
export interface LahanDTO {
  id?: string | number;
  nama: string;
  luas: string;
  tanaman: string;
  tanggal_tanam: string; // Format: YYYY-MM-DD
  created_at?: string;
}

/**
 * Representasi baris data tabel 'jadwal_perawatan' dari database PostgreSQL Supabase.
 */
export interface JadwalDTO {
  id?: string | number;
  id_lahan: string | number;
  tanggal: string; // Format: YYYY-MM-DD
  waktu: string; // Format: HH:mm
  kegiatan: string;
  selesai: boolean;
  created_at?: string;
}

/**
 * Representasi baris data tabel 'jurnal_lapangan' dari database PostgreSQL Supabase.
 */
export interface JurnalDTO {
  id?: string | number;
  id_lahan: string | number;
  tanggal: string; // Format: YYYY-MM-DD
  catatan: string;
  biaya: number; // Numerik biaya pengeluaran
  created_at?: string;
}

/**
 * Representasi baris data tabel 'laporan_panen' dari database PostgreSQL Supabase.
 */
export interface PanenDTO {
  id?: string | number;
  id_lahan?: string | number;
  tanggal: string; // Format: YYYY-MM-DD
  jumlah: number;
  satuan: string;
  harga_jual: number; // Nilai harga satuan penjualan
  selesai?: boolean;
  is_completed?: boolean;
  commodity?: string;
  created_at?: string;
}

// ============================================================================
// 2. Mobile Domain Models - REACT NATIVE APPLICATION (camelCase)
// ============================================================================

/**
 * Spesifikasi Entitas Panen Harian (Spesifikasi Teknis Week 8: Task 01 - 03)
 */
export interface HarvestItem {
  id: string;
  commodity: string;
  weightKg: number;
  isCompleted: boolean;
  date: string;
  idLahan?: string;
  satuan?: string;
  hargaJual?: number;
}

/**
 * Model Petak Lahan untuk State dan Komponen UI Aplikasi Mobile.
 */
export interface Lahan {
  id: string;
  nama: string;
  luas: string;
  tanaman: string;
  tanggalTanam: string; // Format: YYYY-MM-DD
  createdAt?: string;
}

/**
 * Model Jadwal Perawatan untuk State dan Komponen UI Aplikasi Mobile.
 */
export interface Jadwal {
  id: string;
  idLahan: string;
  tanggal: string; // Format: YYYY-MM-DD
  waktu: string; // Format: HH:mm
  kegiatan: string;
  selesai: boolean;
  createdAt?: string;
}

/**
 * Model Jurnal Lapangan untuk State dan Komponen UI Aplikasi Mobile.
 */
export interface Jurnal {
  id: string;
  idLahan: string;
  tanggal: string; // Format: YYYY-MM-DD
  catatan: string;
  biaya: number;
  createdAt?: string;
}

/**
 * Model Laporan Panen untuk State dan Komponen UI Aplikasi Mobile.
 */
export interface Panen {
  id: string;
  idLahan: string;
  tanggal: string; // Format: YYYY-MM-DD
  jumlah: number;
  satuan: string;
  hargaJual: number;
  isCompleted: boolean;
  commodity?: string;
  createdAt?: string;
}

