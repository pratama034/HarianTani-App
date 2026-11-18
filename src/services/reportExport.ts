import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Jurnal, Lahan } from '../types/api';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(isNaN(angka) ? 0 : angka);
};

export interface ExportJurnalOptions {
  jurnalList: Jurnal[];
  lahanList: Lahan[];
  totalBiaya: number;
  userName?: string;
  filterLabel?: string;
}

export interface ExportPanenOptions {
  harvests: {
    id: string;
    commodity: string;
    weightKg: number;
    satuan?: string;
    date: string;
    idLahan?: string;
    isCompleted?: boolean;
    hargaJual?: number;
  }[];
  lahanList: Lahan[];
  totalPendapatan: number;
  totalBiaya: number;
  estimasiKeuntungan: number;
  marginPercent: number;
  userName?: string;
  filterLabel?: string;
}

/**
 * Meng-generate laporan Buku Kas Operasional & Catatan Jurnal ke format PDF
 * lalu memunculkan native sharing dialog kepada pengguna.
 */
export async function exportJurnalToPdf(options: ExportJurnalOptions): Promise<void> {
  const { jurnalList, lahanList, totalBiaya, userName, filterLabel } = options;

  if (jurnalList.length === 0) {
    Alert.alert('Data Kosong', 'Tidak ada catatan jurnal untuk diekspor pada rentang filter ini.');
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Perangkat Tidak Mendukung', 'Fitur berbagi file tidak didukung pada perangkat ini.');
    return;
  }

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const saprotanTotal = Math.round(totalBiaya * 0.59);
  const upahTotal = totalBiaya - saprotanTotal;

  const tableRowsHtml = jurnalList
    .map((item, index) => {
      const lahan = lahanList.find((l) => l.id === item.idLahan);
      const namaLahan = lahan ? lahan.nama : 'Lahan Umum';
      const formattedBiaya = item.biaya > 0 ? formatRupiah(item.biaya) : 'Rp 0 (Observasi)';
      const isExpense = item.biaya > 0;

      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px; font-size: 13px; color: #475569; text-align: center;">${index + 1}</td>
          <td style="padding: 10px; font-size: 13px; color: #1E293B; font-weight: 500;">${item.tanggal}</td>
          <td style="padding: 10px; font-size: 13px; color: #00442F; font-weight: 600;">${namaLahan}</td>
          <td style="padding: 10px; font-size: 13px; color: #334155;">${item.catatan}</td>
          <td style="padding: 10px; font-size: 13px; font-weight: 600; text-align: right; color: ${
            isExpense ? '#B91C1C' : '#059669'
          };">${formattedBiaya}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Laporan Buku Kas Operasional Tani</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 24px;
            background-color: #FFFFFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #00442F;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #00442F;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #64748B;
            margin-top: 4px;
          }
          .report-info {
            text-align: right;
            font-size: 12px;
            color: #475569;
          }
          .summary-card {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
          }
          .summary-item {
            flex: 1;
          }
          .summary-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748B;
            letter-spacing: 0.5px;
          }
          .summary-value {
            font-size: 20px;
            font-weight: 800;
            color: #00442F;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #00442F;
            color: #FFFFFF;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          .footer {
            margin-top: 36px;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">🌾 HARIAN TANI AGRITECH</div>
            <div class="brand-subtitle">Buku Kas & Jurnal Pengeluaran Lapangan • Sistem Terverifikasi</div>
          </div>
          <div class="report-info">
            <div><strong>Pencetak:</strong> ${userName || 'Petani Pengelola'}</div>
            <div><strong>Tanggal:</strong> ${tanggalCetak}</div>
            <div><strong>Filter:</strong> ${filterLabel || 'Semua Periode'}</div>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-item">
            <div class="summary-label">Total Beban Operasional</div>
            <div class="summary-value">${formatRupiah(totalBiaya)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Estimasi Saprotan (Pupuk/Benih)</div>
            <div class="summary-value" style="font-size: 16px; color: #334155;">${formatRupiah(saprotanTotal)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Estimasi Upah & Tenaga Kerja</div>
            <div class="summary-value" style="font-size: 16px; color: #334155;">${formatRupiah(upahTotal)}</div>
          </div>
          <div class="summary-item" style="text-align: right;">
            <div class="summary-label">Total Catatan</div>
            <div class="summary-value" style="font-size: 16px; color: #334155;">${jurnalList.length} Baris</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th style="width: 100px;">Tanggal</th>
              <th style="width: 140px;">Petak Lahan</th>
              <th>Catatan Lapangan</th>
              <th style="width: 140px; text-align: right;">Biaya</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Dokumen ini diterbitkan secara otomatis oleh Aplikasi HarianTani Mobile (Expo & Supabase).</div>
          <div>Halaman 1 dari 1</div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Bagikan Rekap Buku Kas (PDF)',
    });
  } catch (err) {
    Alert.alert('Gagal Ekspor', 'Terjadi kesalahan saat membuat file PDF.');
    console.warn('[reportExport] exportJurnalToPdf error:', err);
  }
}

/**
 * Meng-generate laporan Keuangan & Hasil Panen (Profit and Loss) ke format PDF
 * lalu memunculkan native sharing dialog kepada pengguna.
 */
export async function exportPanenToPdf(options: ExportPanenOptions): Promise<void> {
  const {
    harvests,
    lahanList,
    totalPendapatan,
    totalBiaya,
    estimasiKeuntungan,
    marginPercent,
    userName,
    filterLabel,
  } = options;

  if (harvests.length === 0) {
    Alert.alert('Data Kosong', 'Tidak ada data transaksi panen untuk diekspor pada rentang filter ini.');
    return;
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    Alert.alert('Perangkat Tidak Mendukung', 'Fitur berbagi file tidak didukung pada perangkat ini.');
    return;
  }

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isProfit = estimasiKeuntungan >= 0;

  const tableRowsHtml = harvests
    .map((item, index) => {
      const lahan = lahanList.find((l) => l.id === item.idLahan);
      const namaLahan = lahan ? lahan.nama : 'Petak Lahan';
      const hargaJual = item.hargaJual || 12000;
      const subtotal = item.weightKg * hargaJual;
      const satuan = item.satuan || 'Kg';
      const statusLabel = item.isCompleted ? 'Lunas / Selesai' : 'Draft';
      const statusColor = item.isCompleted ? '#065F46' : '#B45309';

      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px; font-size: 13px; color: #475569; text-align: center;">${index + 1}</td>
          <td style="padding: 10px; font-size: 13px; color: #1E293B; font-weight: 500;">${item.date}</td>
          <td style="padding: 10px; font-size: 13px; color: #00442F; font-weight: 600;">${namaLahan}</td>
          <td style="padding: 10px; font-size: 13px; color: #334155; font-weight: 500;">${item.commodity}</td>
          <td style="padding: 10px; font-size: 13px; color: #475569; text-align: right;">${item.weightKg.toLocaleString(
            'id-ID'
          )} ${satuan}</td>
          <td style="padding: 10px; font-size: 13px; color: #475569; text-align: right;">${formatRupiah(hargaJual)}</td>
          <td style="padding: 10px; font-size: 13px; font-weight: 700; color: #00442F; text-align: right;">${formatRupiah(
            subtotal
          )}</td>
          <td style="padding: 10px; font-size: 12px; font-weight: 600; text-align: center; color: ${statusColor};">${statusLabel}</td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Laporan Keuangan & Hasil Panen</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #0F172A;
            margin: 0;
            padding: 24px;
            background-color: #FFFFFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #00442F;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #00442F;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #64748B;
            margin-top: 4px;
          }
          .report-info {
            text-align: right;
            font-size: 12px;
            color: #475569;
          }
          .pnl-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .pnl-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 14px;
          }
          .pnl-box.highlight {
            background-color: #00442F;
            color: #FFFFFF;
            border-color: #00442F;
          }
          .pnl-box.highlight .pnl-label {
            color: #A7F3D0;
          }
          .pnl-box.highlight .pnl-value {
            color: #FFFFFF;
          }
          .pnl-label {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748B;
            letter-spacing: 0.5px;
          }
          .pnl-value {
            font-size: 18px;
            font-weight: 800;
            color: #0F172A;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #00442F;
            color: #FFFFFF;
            padding: 10px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          .footer {
            margin-top: 36px;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94A3B8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand-title">🌾 HARIAN TANI AGRITECH</div>
            <div class="brand-subtitle">Laporan Laba Rugi & Rekapitulasi Hasil Panen</div>
          </div>
          <div class="report-info">
            <div><strong>Pencetak:</strong> ${userName || 'Petani Pengelola'}</div>
            <div><strong>Tanggal:</strong> ${tanggalCetak}</div>
            <div><strong>Filter:</strong> ${filterLabel || 'Semua Periode'}</div>
          </div>
        </div>

        <div class="pnl-grid">
          <div class="pnl-box">
            <div class="pnl-label">Total Penjualan</div>
            <div class="pnl-value" style="color: #00442F;">${formatRupiah(totalPendapatan)}</div>
          </div>
          <div class="pnl-box">
            <div class="pnl-label">Beban Operasional</div>
            <div class="pnl-value" style="color: #B91C1C;">- ${formatRupiah(totalBiaya)}</div>
          </div>
          <div class="pnl-box highlight">
            <div class="pnl-label">Estimasi Keuntungan Bersih</div>
            <div class="pnl-value">${isProfit ? '+ ' : ''}${formatRupiah(estimasiKeuntungan)}</div>
          </div>
          <div class="pnl-box">
            <div class="pnl-label">Margin Keuntungan</div>
            <div class="pnl-value" style="color: ${isProfit ? '#059669' : '#B91C1C'};">${marginPercent}%</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">No</th>
              <th style="width: 85px;">Tanggal</th>
              <th style="width: 120px;">Petak Lahan</th>
              <th>Komoditas</th>
              <th style="width: 85px; text-align: right;">Volume</th>
              <th style="width: 100px; text-align: right;">Harga Satuan</th>
              <th style="width: 115px; text-align: right;">Subtotal</th>
              <th style="width: 90px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Dokumen ini diterbitkan secara otomatis oleh Aplikasi HarianTani Mobile (Expo SDK 58 & Supabase).</div>
          <div>Halaman 1 dari 1</div>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Bagikan Laporan Keuangan Panen (PDF)',
    });
  } catch (err) {
    Alert.alert('Gagal Ekspor', 'Terjadi kesalahan saat membuat file PDF.');
    console.warn('[reportExport] exportPanenToPdf error:', err);
  }
}
