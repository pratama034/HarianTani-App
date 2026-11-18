/**
 * DTO Mapping Layer (Pure Mapper Functions)
 * Sesuai Slide 6, 8, & 9 - Task 01 (Pekan 4: Data Modeling + RESTful API)
 *
 * Fungsi murni (pure functions) untuk konversi timbal balik:
 * Server PostgreSQL DTO (snake_case) <---> Mobile Client Model (camelCase)
 */

import {
  LahanDTO,
  Lahan,
  JadwalDTO,
  Jadwal,
  JurnalDTO,
  Jurnal,
  PanenDTO,
  Panen,
  HarvestItem,
} from '../types/api';

// ============================================================================
// 1. Lahan Mapper Functions
// ============================================================================

/**
 * Mengonversi LahanDTO (PostgreSQL snake_case) menjadi Lahan Model (camelCase).
 */
export function mapLahanDTOtoModel(dto: LahanDTO): Lahan {
  return {
    id: dto.id !== undefined && dto.id !== null ? String(dto.id) : '',
    nama: dto.nama || '',
    luas: dto.luas || '',
    tanaman: dto.tanaman || '',
    tanggalTanam: dto.tanggal_tanam || new Date().toISOString().split('T')[0],
    latitude: dto.latitude !== undefined ? dto.latitude : null,
    longitude: dto.longitude !== undefined ? dto.longitude : null,
    address: dto.address || null,
    createdAt: dto.created_at,
  };
}

/**
 * Mengonversi Lahan Model (camelCase) menjadi LahanDTO (PostgreSQL snake_case) untuk POST/PATCH.
 */
export function mapModelToLahanDTO(model: Omit<Lahan, 'id'> & { id?: string }): LahanDTO {
  const dto: LahanDTO = {
    nama: model.nama.trim(),
    luas: model.luas.trim(),
    tanaman: model.tanaman.trim(),
    tanggal_tanam: model.tanggalTanam,
  };

  if (typeof model.latitude === 'number' && !isNaN(model.latitude)) {
    dto.latitude = model.latitude;
  }
  if (typeof model.longitude === 'number' && !isNaN(model.longitude)) {
    dto.longitude = model.longitude;
  }
  if (model.address && model.address.trim().length > 0) {
    dto.address = model.address.trim();
  }

  if (model.id) {
    dto.id = model.id;
  }
  if (model.createdAt) {
    dto.created_at = model.createdAt;
  }

  return dto;
}

// ============================================================================
// 2. Jadwal Perawatan Mapper Functions
// ============================================================================

/**
 * Mengonversi JadwalDTO (PostgreSQL snake_case) menjadi Jadwal Model (camelCase).
 */
export function mapJadwalDTOtoModel(dto: JadwalDTO): Jadwal {
  return {
    id: dto.id !== undefined && dto.id !== null ? String(dto.id) : '',
    idLahan: dto.id_lahan !== undefined && dto.id_lahan !== null ? String(dto.id_lahan) : '',
    tanggal: dto.tanggal || new Date().toISOString().split('T')[0],
    waktu: dto.waktu || '08:00',
    kegiatan: dto.kegiatan || '',
    selesai: Boolean(dto.selesai),
    createdAt: dto.created_at,
  };
}

/**
 * Mengonversi Jadwal Model (camelCase) menjadi JadwalDTO (PostgreSQL snake_case) untuk POST/PATCH.
 */
export function mapModelToJadwalDTO(
  model: Omit<Jadwal, 'id' | 'selesai'> & { id?: string; selesai?: boolean }
): JadwalDTO {
  const dto: JadwalDTO = {
    id_lahan: model.idLahan,
    tanggal: model.tanggal,
    waktu: model.waktu,
    kegiatan: model.kegiatan.trim(),
    selesai: model.selesai ?? false,
  };

  if (model.id) {
    dto.id = model.id;
  }
  if (model.createdAt) {
    dto.created_at = model.createdAt;
  }

  return dto;
}

// ============================================================================
// 3. Jurnal Lapangan Mapper Functions
// ============================================================================

/**
 * Mengonversi JurnalDTO (PostgreSQL snake_case) menjadi Jurnal Model (camelCase).
 */
export function mapJurnalDTOtoModel(dto: JurnalDTO): Jurnal {
  return {
    id: dto.id !== undefined && dto.id !== null ? String(dto.id) : '',
    idLahan: dto.id_lahan !== undefined && dto.id_lahan !== null ? String(dto.id_lahan) : '',
    tanggal: dto.tanggal || new Date().toISOString().split('T')[0],
    catatan: dto.catatan || '',
    biaya: typeof dto.biaya === 'number' ? dto.biaya : parseFloat(String(dto.biaya)) || 0,
    createdAt: dto.created_at,
  };
}

/**
 * Mengonversi Jurnal Model (camelCase) menjadi JurnalDTO (PostgreSQL snake_case) untuk POST/PATCH.
 */
export function mapModelToJurnalDTO(
  model: Omit<Jurnal, 'id'> & { id?: string }
): JurnalDTO {
  const dto: JurnalDTO = {
    id_lahan: model.idLahan,
    tanggal: model.tanggal,
    catatan: model.catatan.trim(),
    biaya: Number(model.biaya) || 0,
  };

  if (model.id) {
    dto.id = model.id;
  }
  if (model.createdAt) {
    dto.created_at = model.createdAt;
  }

  return dto;
}

// ============================================================================
// 4. Laporan Panen Mapper Functions
// ============================================================================

/**
 * Mengonversi PanenDTO (PostgreSQL snake_case) menjadi Panen Model (camelCase).
 */
export function mapPanenDTOtoModel(dto: PanenDTO): Panen {
  return {
    id: dto.id !== undefined && dto.id !== null ? String(dto.id) : '',
    idLahan: dto.id_lahan !== undefined && dto.id_lahan !== null ? String(dto.id_lahan) : '',
    tanggal: dto.tanggal || new Date().toISOString().split('T')[0],
    jumlah: typeof dto.jumlah === 'number' ? dto.jumlah : parseFloat(String(dto.jumlah)) || 0,
    satuan: dto.satuan || 'Kg',
    hargaJual: typeof dto.harga_jual === 'number' ? dto.harga_jual : parseFloat(String(dto.harga_jual)) || 0,
    isCompleted: Boolean(dto.selesai ?? dto.is_completed),
    commodity: dto.commodity,
    createdAt: dto.created_at,
  };
}

/**
 * Mengonversi Panen Model (camelCase) menjadi PanenDTO (PostgreSQL snake_case) untuk POST/PATCH.
 */
export function mapModelToPanenDTO(
  model: Omit<Panen, 'id'> & { id?: string }
): PanenDTO {
  const dto: PanenDTO = {
    id_lahan: model.idLahan,
    tanggal: model.tanggal,
    jumlah: Number(model.jumlah) || 0,
    satuan: model.satuan.trim() || 'Kg',
    harga_jual: Number(model.hargaJual) || 0,
    selesai: model.isCompleted ?? false,
    is_completed: model.isCompleted ?? false,
    commodity: model.commodity,
  };

  if (model.id) {
    dto.id = model.id;
  }
  if (model.createdAt) {
    dto.created_at = model.createdAt;
  }

  return dto;
}

/**
 * Mengonversi Panen Model ke HarvestItem (Sesuai Spesifikasi Teknis Week 8: Task 01 - 03)
 */
export function mapPanenToHarvestItem(panen: Panen, defaultCommodity = 'Hasil Panen'): HarvestItem {
  return {
    id: panen.id,
    commodity: panen.commodity || defaultCommodity,
    weightKg: panen.jumlah,
    isCompleted: Boolean(panen.isCompleted),
    date: panen.tanggal,
    idLahan: panen.idLahan,
    satuan: panen.satuan,
    hargaJual: panen.hargaJual,
  };
}

/**
 * Mengonversi HarvestItem ke Panen Model
 */
export function mapHarvestItemToPanen(item: HarvestItem): Panen {
  return {
    id: item.id,
    idLahan: item.idLahan || '1',
    tanggal: item.date,
    jumlah: item.weightKg,
    satuan: item.satuan || 'Kg',
    hargaJual: item.hargaJual || 12000,
    isCompleted: Boolean(item.isCompleted),
    commodity: item.commodity,
  };
}

