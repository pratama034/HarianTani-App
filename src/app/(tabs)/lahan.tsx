import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../../context/AppContext';

export default function LahanScreen() {
  const { lahanList, addLahan } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [nama, setNama] = useState('');
  const [luas, setLuas] = useState('');
  const [tanaman, setTanaman] = useState('');

  const handleAdd = () => {
    if (!nama || !luas || !tanaman) return;
    addLahan({
      nama, luas, tanaman,
      tanggalTanam: new Date().toISOString().split('T')[0]
    });
    setNama('');
    setLuas('');
    setTanaman('');
    setIsAdding(false);
  };

  const getUmur = (tanggalTanam: string) => {
    const start = new Date(tanggalTanam);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Daftar Lahan</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(!isAdding)} accessibilityRole="button" accessibilityLabel="Tambah Lahan">
          <MaterialCommunityIcons name={isAdding ? "close" : "plus"} size={24} color={Colors.surface} />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Tambah Lahan Baru</Text>
          <TextInput style={styles.input} placeholder="Nama Lahan" value={nama} onChangeText={setNama} />
          <TextInput style={styles.input} placeholder="Luas Lahan (contoh: 1 Ha)" value={luas} onChangeText={setLuas} />
          <TextInput style={styles.input} placeholder="Jenis Tanaman" value={tanaman} onChangeText={setTanaman} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitBtnText}>Simpan Lahan</Text>
          </TouchableOpacity>
        </Card>
      )}

      {lahanList.length === 0 && !isAdding && (
        <Text style={styles.emptyText}>Belum ada lahan yang ditambahkan.</Text>
      )}

      {lahanList.map((lahan) => (
        <Card key={lahan.id} accessible={true} accessibilityLabel={`Lahan ${lahan.nama}, Tanaman ${lahan.tanaman}`}>
          <View style={styles.cardHeader}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="sprout" size={28} color={Colors.primary} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{lahan.nama}</Text>
                <Text style={styles.cardSub}>{lahan.tanaman}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Luas</Text>
              <Text style={styles.infoValue}>{lahan.luas}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Tanggal Tanam</Text>
              <Text style={styles.infoValue}>{lahan.tanggalTanam}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Umur</Text>
              <Text style={styles.infoValue}>{getUmur(lahan.tanggalTanam)} Hari</Text>
            </View>
          </View>
        </Card>
      ))}
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
  input: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 10 },
  submitBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: Colors.surface, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardText: { marginLeft: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 14, color: Colors.textSecondary },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoCol: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: Colors.text }
});
