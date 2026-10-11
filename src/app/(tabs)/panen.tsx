import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';

export default function PanenScreen() {
  const { panenList, jurnalList, lahanList, addPanen } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  
  const [jumlah, setJumlah] = useState('');
  const [satuan, setSatuan] = useState('');
  const [hargaJual, setHargaJual] = useState('');
  const [selectedLahanId, setSelectedLahanId] = useState('');

  const handleAdd = () => {
    if (!jumlah || !satuan || !hargaJual || !selectedLahanId) return;
    addPanen({
      idLahan: selectedLahanId,
      tanggal: new Date().toISOString().split('T')[0],
      jumlah: parseFloat(jumlah),
      satuan,
      hargaJual: parseFloat(hargaJual)
    });
    setJumlah('');
    setSatuan('');
    setHargaJual('');
    setSelectedLahanId('');
    setIsAdding(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  const totalPendapatan = panenList.reduce((acc, curr) => acc + (curr.jumlah * curr.hargaJual), 0);
  const totalBiaya = jurnalList.reduce((acc, curr) => acc + curr.biaya, 0);
  const estimasiKeuntungan = totalPendapatan - totalBiaya;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Laporan Panen</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(!isAdding)}>
          <MaterialCommunityIcons name={isAdding ? "close" : "plus"} size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.financeCard}>
        <Text style={styles.financeTitle}>Estimasi Keuntungan</Text>
        <Text style={[styles.financeAmount, { color: estimasiKeuntungan >= 0 ? Colors.success : Colors.error }]}>
          {formatRupiah(estimasiKeuntungan)}
        </Text>
        <View style={styles.financeRow}>
          <View>
            <Text style={styles.financeSubLabel}>Pendapatan</Text>
            <Text style={styles.financeSubValue}>{formatRupiah(totalPendapatan)}</Text>
          </View>
          <View>
            <Text style={[styles.financeSubLabel, { textAlign: 'right' }]}>Biaya (Jurnal)</Text>
            <Text style={[styles.financeSubValue, { color: Colors.error, textAlign: 'right' }]}>{formatRupiah(totalBiaya)}</Text>
          </View>
        </View>
      </View>

      {isAdding && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Catat Hasil Panen</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lahanSelector}>
            {lahanList.map(lahan => (
              <TouchableOpacity 
                key={lahan.id} 
                style={[styles.lahanChip, selectedLahanId === lahan.id && styles.lahanChipActive]}
                onPress={() => setSelectedLahanId(lahan.id)}
              >
                <Text style={[styles.lahanChipText, selectedLahanId === lahan.id && styles.lahanChipTextActive]}>{lahan.nama}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput style={styles.input} placeholder="Jumlah (contoh: 500)" value={jumlah} onChangeText={setJumlah} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Satuan (contoh: Kg)" value={satuan} onChangeText={setSatuan} />
          <TextInput style={styles.input} placeholder="Harga Jual per Satuan" value={hargaJual} onChangeText={setHargaJual} keyboardType="numeric" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Simpan Panen</Text>
          </TouchableOpacity>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Riwayat Panen</Text>

      {panenList.length === 0 && !isAdding && (
        <Text style={styles.emptyText}>Belum ada riwayat panen.</Text>
      )}

      {panenList.map(panen => {
        const lahan = lahanList.find(l => l.id === panen.idLahan);
        const pendapatan = panen.jumlah * panen.hargaJual;
        return (
          <Card key={panen.id}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="basket" size={32} color="#0288D1" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{lahan?.nama || 'Lahan Tidak Diketahui'}</Text>
                <Text style={styles.cardSub}>{panen.tanggal}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTotal}>{formatRupiah(pendapatan)}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>{panen.jumlah} {panen.satuan}</Text>
              <Text style={styles.detailText}>@ {formatRupiah(panen.hargaJual)}</Text>
            </View>
          </Card>
        );
      })}
      <View style={{height: 20}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  addButton: { backgroundColor: Colors.primary, padding: 8, borderRadius: 20 },
  financeCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  financeTitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  financeAmount: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
  financeSubLabel: { fontSize: 12, color: Colors.textSecondary },
  financeSubValue: { fontSize: 16, fontWeight: 'bold', color: Colors.success, marginTop: 4 },
  formCard: { marginBottom: 16, backgroundColor: '#E8F5E9' },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: Colors.primary },
  lahanSelector: { marginBottom: 12 },
  lahanChip: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  lahanChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  lahanChipText: { color: Colors.text },
  lahanChipTextActive: { color: Colors.surface, fontWeight: 'bold' },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 10 },
  submitBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: Colors.surface, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginTop: 10, marginBottom: 12 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardText: { marginLeft: 12, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardTotal: { fontSize: 16, fontWeight: 'bold', color: Colors.success },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  detailText: { fontSize: 14, color: Colors.textSecondary }
});
