import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";
import { initNotificationHandler, requestNotificationPermission } from "../services/notifications";

// Inisialisasi notification handler di level root
initNotificationHandler();

// Abaikan peringatan umum UI pada lingkungan development
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested',
  'Animated: `useNativeDriver` was not specified',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

export default function RootLayout() {
  useEffect(() => {
    // Meminta izin notifikasi lokal saat aplikasi pertama kali dimuat
    void requestNotificationPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
