import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Radius } from '../constants/theme';

export interface LahanMapViewProps {
  latitude?: number | null;
  longitude?: number | null;
  namaLahan?: string;
  address?: string | null;
  style?: ViewStyle;
  height?: number;
}

// Koordinat default persawahan Sukabumi Jawa Barat jika koordinat belum terekam
const DEFAULT_LATITUDE = -6.9277;
const DEFAULT_LONGITUDE = 106.9299;

/**
 * Komponen statis visualisasi peta lahan berbasis react-native-maps.
 * Menerapkan prinsip Visual Reduction: mematikan seluruh interaksi sentuh
 * (scrollEnabled, zoomEnabled, pitchEnabled, rotateEnabled) agar peta statis dan UI bersih.
 */
export function LahanMapView({
  latitude,
  longitude,
  namaLahan = 'Petak Lahan',
  address,
  style,
  height = 140,
}: LahanMapViewProps) {
  const effectiveLat =
    typeof latitude === 'number' && !isNaN(latitude)
      ? latitude
      : DEFAULT_LATITUDE;
  const effectiveLon =
    typeof longitude === 'number' && !isNaN(longitude)
      ? longitude
      : DEFAULT_LONGITUDE;

  const initialRegion = {
    latitude: effectiveLat,
    longitude: effectiveLon,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        region={initialRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={{
            latitude: effectiveLat,
            longitude: effectiveLon,
          }}
          title={namaLahan}
          description={address || 'Titik Koordinat Lahan Pertanian'}
          pinColor="#006C49"
        />
      </MapView>

      {/* Label Badge Koordinat Overlay */}
      <View style={styles.badgeOverlay}>
        <MaterialCommunityIcons name="map-marker" size={13} color="#006C49" />
        <Text style={styles.badgeText} numberOfLines={1}>
          {effectiveLat.toFixed(4)}, {effectiveLon.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  badgeOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00442F',
  },
});
