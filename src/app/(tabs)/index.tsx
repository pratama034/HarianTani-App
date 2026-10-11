import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';

export default function BerandaScreen() {
  const { lahanList, jadwalList, jurnalList } = useAppContext();
  const { user } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const jadwalHariIni = jadwalList.filter(j => j.tanggal === todayStr);
  const tugasBelumSelesai = jadwalHariIni.filter(j => !j.selesai).length;

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const todayFormatted = new Date().toLocaleDateString('id-ID', dateOptions);

  return (
    <ScrollView style={styles.container} accessible={true}>
      <View style={styles.header}>
        <Text style={styles.greeting} accessibilityLabel="Teks sapaan">
          Halo, {user?.name || 'Petani Cerdas'}!
        </Text>
        <Text style={styles.subtitle}>{todayFormatted}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryNumber}>{lahanList.length}</Text>
          <Text style={styles.summaryLabel}>Lahan Aktif</Text>
        </View>
        <View style={[styles.summaryBox, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.summaryNumber, { color: '#F57C00' }]}>{tugasBelumSelesai}</Text>
          <Text style={styles.summaryLabel}>Tugas Hari Ini</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Link href="/jurnal" asChild>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="notebook-plus" size={24} color={Colors.surface} />
            <Text style={styles.actionBtnText}>Catat Jurnal</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/panen" asChild>
          <TouchableOpacity style={StyleSheet.flatten([styles.actionBtn, { backgroundColor: '#0288D1' }])}>
            <MaterialCommunityIcons name="basket-plus" size={24} color={Colors.surface} />
            <Text style={styles.actionBtnText}>Catat Panen</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">Jadwal Hari Ini</Text>
      {jadwalHariIni.length === 0 ? (
        <Text style={styles.emptyText}>Tidak ada jadwal untuk hari ini.</Text>
      ) : (
        jadwalHariIni.map(jadwal => {
          const lahan = lahanList.find(l => l.id === jadwal.idLahan);
          return (
            <Card key={jadwal.id}>
              <View style={styles.row}>
                <MaterialCommunityIcons 
                  name={jadwal.selesai ? "check-circle" : "clock-outline"} 
                  size={32} 
                  color={jadwal.selesai ? Colors.success : "#F57C00"} 
                />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{jadwal.kegiatan}</Text>
                  <Text style={styles.cardSub}>{jadwal.waktu} WIB • {lahan?.nama || 'Lahan Tidak Diketahui'}</Text>
                </View>
              </View>
            </Card>
          )
        })
      )}

      <Text style={styles.sectionTitle} accessibilityRole="header">Aktivitas Terbaru</Text>
      {jurnalList.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada catatan jurnal.</Text>
      ) : (
        jurnalList.slice(0, 2).map(jurnal => {
          const lahan = lahanList.find(l => l.id === jurnal.idLahan);
          return (
            <Card key={jurnal.id}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="file-document-outline" size={28} color={Colors.primary} />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{lahan?.nama || 'Lahan'}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{jurnal.catatan}</Text>
                </View>
              </View>
            </Card>
          )
        })
      )}
      
      <View style={{height: 20}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  header: { marginBottom: 20, marginTop: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryBox: { flex: 1, backgroundColor: '#E8F5E9', padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 4 },
  summaryNumber: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, marginBottom: 4 },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionBtn: { flex: 1, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, marginHorizontal: 4 },
  actionBtnText: { color: Colors.surface, fontWeight: 'bold', marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginTop: 10, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardText: { marginLeft: 16, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
  cardSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  emptyText: { color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 10 }
});
