import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';

export default function JurnalScreen() {
  const { jurnalList, lahanList, addJurnal } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  
  const [catatan, setCatatan] = useState('');
  const [biaya, setBiaya] = useState('');
  const [selectedLahanId, setSelectedLahanId] = useState('');

  const handleAdd = () => {
    if (!catatan || !selectedLahanId) return;
    addJurnal({
      idLahan: selectedLahanId,
      tanggal: new Date().toISOString().split('T')[0],
      catatan,
      biaya: parseFloat(biaya) || 0
    });
    setCatatan('');
    setBiaya('');
    setSelectedLahanId('');
    setIsAdding(false);
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Jurnal Aktivitas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(!isAdding)}>
          <MaterialCommunityIcons name={isAdding ? "close" : "plus"} size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Tambah Catatan Jurnal</Text>
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
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Catatan aktivitas..." 
            value={catatan} 
            onChangeText={setCatatan} 
            multiline 
            numberOfLines={3} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Biaya (Opsional, contoh: 50000)" 
            value={biaya} 
            onChangeText={setBiaya} 
            keyboardType="numeric" 
          />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Simpan Catatan</Text>
          </TouchableOpacity>
        </Card>
      )}

      {jurnalList.length === 0 && !isAdding && (
        <Text style={styles.emptyText}>Belum ada catatan jurnal.</Text>
      )}

      {jurnalList.map(jurnal => {
        const lahan = lahanList.find(l => l.id === jurnal.idLahan);
        return (
          <Card key={jurnal.id}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="calendar-text" size={24} color={Colors.primary} />
              <View style={styles.cardText}>
                <Text style={styles.cardDate}>{jurnal.tanggal}</Text>
                <Text style={styles.cardLahan}>{lahan?.nama || 'Lahan Tidak Diketahui'}</Text>
              </View>
            </View>
            <Text style={styles.cardCatatan}>{jurnal.catatan}</Text>
            {jurnal.biaya > 0 && (
              <View style={styles.biayaBadge}>
                <MaterialCommunityIcons name="cash" size={16} color="#D32F2F" />
                <Text style={styles.biayaText}>{formatRupiah(jurnal.biaya)}</Text>
              </View>
            )}
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
  formCard: { marginBottom: 16, backgroundColor: '#E8F5E9' },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: Colors.primary },
  lahanSelector: { marginBottom: 12 },
  lahanChip: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  lahanChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  lahanChipText: { color: Colors.text },
  lahanChipTextActive: { color: Colors.surface, fontWeight: 'bold' },
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 10 },
  textArea: { height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: Colors.surface, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardText: { marginLeft: 8 },
  cardDate: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
  cardLahan: { fontSize: 12, color: Colors.textSecondary },
  cardCatatan: { fontSize: 16, color: Colors.text, marginTop: 4, lineHeight: 22 },
  biayaBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#FFEBEE', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  biayaText: { fontSize: 12, color: '#D32F2F', fontWeight: 'bold', marginLeft: 4 }
});
