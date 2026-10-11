import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Lahan = {
  id: string;
  nama: string;
  luas: string;
  tanaman: string;
  tanggalTanam: string; // YYYY-MM-DD
};

export type Jadwal = {
  id: string;
  idLahan: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm
  kegiatan: string;
  selesai: boolean;
};

export type Jurnal = {
  id: string;
  idLahan: string;
  tanggal: string; // YYYY-MM-DD
  catatan: string;
  biaya: number; // optional, can be 0
};

export type Panen = {
  id: string;
  idLahan: string;
  tanggal: string; // YYYY-MM-DD
  jumlah: number;
  satuan: string;
  hargaJual: number;
};

type AppContextType = {
  lahanList: Lahan[];
  addLahan: (lahan: Omit<Lahan, 'id'>) => void;
  jadwalList: Jadwal[];
  addJadwal: (jadwal: Omit<Jadwal, 'id' | 'selesai'>) => void;
  toggleJadwalSelesai: (id: string) => void;
  jurnalList: Jurnal[];
  addJurnal: (jurnal: Omit<Jurnal, 'id'>) => void;
  panenList: Panen[];
  addPanen: (panen: Omit<Panen, 'id'>) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lahanList, setLahanList] = useState<Lahan[]>([
    { id: '1', nama: 'Lahan A', luas: '1 Ha', tanaman: 'Padi', tanggalTanam: new Date().toISOString().split('T')[0] },
  ]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([
    { id: '1', idLahan: '1', tanggal: new Date().toISOString().split('T')[0], waktu: '07:00', kegiatan: 'Penyiraman', selesai: false },
    { id: '2', idLahan: '1', tanggal: new Date().toISOString().split('T')[0], waktu: '16:00', kegiatan: 'Pemberian Pupuk Urea', selesai: false }
  ]);
  const [jurnalList, setJurnalList] = useState<Jurnal[]>([]);
  const [panenList, setPanenList] = useState<Panen[]>([]);

  const addLahan = (lahan: Omit<Lahan, 'id'>) => {
    setLahanList([...lahanList, { ...lahan, id: Date.now().toString() }]);
  };

  const addJadwal = (jadwal: Omit<Jadwal, 'id' | 'selesai'>) => {
    setJadwalList([...jadwalList, { ...jadwal, id: Date.now().toString(), selesai: false }]);
  };

  const toggleJadwalSelesai = (id: string) => {
    setJadwalList(jadwalList.map(j => j.id === id ? { ...j, selesai: !j.selesai } : j));
  };

  const addJurnal = (jurnal: Omit<Jurnal, 'id'>) => {
    setJurnalList([{ ...jurnal, id: Date.now().toString() }, ...jurnalList]);
  };

  const addPanen = (panen: Omit<Panen, 'id'>) => {
    setPanenList([{ ...panen, id: Date.now().toString() }, ...panenList]);
  };

  return (
    <AppContext.Provider value={{
      lahanList, addLahan,
      jadwalList, addJadwal, toggleJadwalSelesai,
      jurnalList, addJurnal,
      panenList, addPanen
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
