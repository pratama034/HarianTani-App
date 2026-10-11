import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';

type FilterType = 'Semua' | 'Hari Ini' | 'Selesai';

export default function JadwalScreen() {
  const { jadwalList, lahanList, addJadwal, toggleJadwalSelesai } = useAppContext();
  const [filter, setFilter] = useState<FilterType>('Semua');
  const [isAdding, setIsAdding] = useState(false);
  
  const [waktu, setWaktu] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [selectedLahanId, setSelectedLahanId] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (!waktu || !kegiatan || !selectedLahanId) return;
    addJadwal({
      idLahan: selectedLahanId,
      tanggal: todayStr, // simplified: always schedule for today
      waktu,
      kegiatan
    });
    setWaktu('');
    setKegiatan('');
    setSelectedLahanId('');
    setIsAdding(false);
  };

  const filteredJadwal = jadwalList.filter(j => {
    if (filter === 'Hari Ini') return j.tanggal === todayStr;
    if (filter === 'Selesai') return j.selesai;
    return true; // Semua
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Jadwal Perawatan</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(!isAdding)}>
          <MaterialCommunityIcons name={isAdding ? "close" : "plus"} size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Tambah Jadwal (Hari Ini)</Text>
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
          <TextInput style={styles.input} placeholder="Waktu (contoh: 07:00)" value={waktu} onChangeText={setWaktu} />
          <TextInput style={styles.input} placeholder="Kegiatan (contoh: Siram Air)" value={kegiatan} onChangeText={setKegiatan} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Simpan Jadwal</Text>
          </TouchableOpacity>
        </Card>
      )}

      <View style={styles.filterRow}>
        {(['Semua', 'Hari Ini', 'Selesai'] as FilterType[]).map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredJadwal.length === 0 ? (
        <Text style={styles.emptyText}>Tidak ada jadwal.</Text>
      ) : (
        filteredJadwal.map(jadwal => {
          const lahan = lahanList.find(l => l.id === jadwal.idLahan);
          return (
            <Card key={jadwal.id}>
              <View style={styles.row}>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{jadwal.kegiatan}</Text>
                  <Text style={styles.cardSub}>{jadwal.tanggal} • {jadwal.waktu} WIB</Text>
                  <Text style={styles.cardSub}>{lahan?.nama || 'Lahan Tidak Diketahui'}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.checkBtn, jadwal.selesai && styles.checkBtnActive]}
                  onPress={() => toggleJadwalSelesai(jadwal.id)}
                  accessibilityRole="button"
                  accessibilityLabel={jadwal.selesai ? "Tandai belum selesai" : "Tandai selesai"}
                >
                  <MaterialCommunityIcons name={jadwal.selesai ? "check" : "clock-outline"} size={24} color={jadwal.selesai ? Colors.surface : Colors.primary} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })
      )}
      <View style={{height: 20}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  addButton: { backgroundColor: Colors.primary, padding: 8, borderRadius: 20 },
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
  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterBtnActive: { borderBottomColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.primary },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  checkBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  checkBtnActive: { backgroundColor: Colors.success, borderColor: Colors.success },
});
