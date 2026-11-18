import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthSession,
  UserProfile,
  getSession,
  saveSession,
  clearSession,
  clearCache as clearStorageCache,
  registerLocalUser,
  verifyLocalCredentials,
  isSecureStoreSupported,
} from '../services/authStorage';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  setAuthToken,
  clearApiCache,
  setOnUnauthorized,
  isSupabaseConfigured,
} from '../services/api';

type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: AuthSession | null;
  user: UserProfile | null;
  isSecureHardwareAvailable: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  clearCache: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSecureHardwareAvailable, setIsSecureHardwareAvailable] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Sesuai Slide 12 & 14: Handler otomatis saat server merespons 401 Unauthorized
    setOnUnauthorized(() => {
      console.warn('[AuthContext] 401 Unauthorized diterima. Mengakhiri sesi secara aman...');
      clearApiCache();
      void clearSession();
      void clearStorageCache();
      if (isMounted) {
        setSession(null);
      }
    });

    async function initializeAuth() {
      try {
        const supported = await isSecureStoreSupported();
        if (isMounted) {
          setIsSecureHardwareAvailable(supported);
        }

        const storedSession = await getSession();
        if (isMounted) {
          if (storedSession?.token) {
            // Sesuai Slide 8 & 11: Set token aktif ke network interceptor
            setAuthToken(storedSession.token);
          }
          setSession(storedSession);
        }
      } catch {
        console.error('Gagal menginisialisasi sesi autentikasi.');
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
      setOnUnauthorized(null);
    };
  }, []);

  /**
   * Login melalui API (Task 01 - Slide 9 & 10)
   * Mengirim kredensial ke server, menerima JWT Access Token, menyimpannya di SecureStore,
   * dan menyematkan token ke network request interceptor.
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Jalur Utama: REST API Token-based Authentication (Cloud Supabase Auth)
    if (isSupabaseConfigured()) {
      try {
        const authData = await apiLogin(trimmedEmail, password);
        if (authData && authData.access_token) {
          const newSession: AuthSession = {
            token: authData.access_token,
            user: {
              id: authData.user.id,
              name: authData.user.user_metadata?.name || authData.user.email.split('@')[0],
              email: authData.user.email,
              createdAt: authData.user.created_at || new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          };

          // Simpan sesi dan access_token ke SecureStore (Task 01 & Slide 9)
          await saveSession(newSession);
          // Set access token ke HTTP header authorization interceptor (Task 02 & Slide 11)
          setAuthToken(newSession.token);
          setSession(newSession);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('[AuthContext] Cloud login gagal:', err.message);

        // Coba verifikasi fallback ke akun lokal terdaftar sebelum memutuskan login gagal
        try {
          const localFallback = await verifyLocalCredentials(trimmedEmail, password);
          if (localFallback.success && localFallback.session) {
            await saveSession(localFallback.session);
            setAuthToken(localFallback.session.token);
            setSession(localFallback.session);
            return { success: true };
          }
        } catch {
          // fallback silent
        }

        // Format pesan error yang ramah pengguna jika akun tidak ditemukan atau kredensial salah
        const is404OrNotFound =
          err?.status === 404 ||
          err?.status === 400 ||
          (err?.message && (err.message.includes('404') || err.message.includes('not found') || err.message.includes('invalid_credentials')));

        const errorMsg = is404OrNotFound
          ? 'Email atau kata sandi tidak cocok. Silakan periksa kembali atau daftar akun baru jika belum terdaftar.'
          : err?.message || 'Gagal masuk. Silakan periksa koneksi dan coba lagi.';

        return {
          success: false,
          error: errorMsg,
        };
      }
    }

    // 2. Fallback Lokal (Pekan 3 compatibility & offline demo mode)
    try {
      const result = await verifyLocalCredentials(trimmedEmail, password);
      if (!result.success || !result.session) {
        return { success: false, error: result.error || 'Email atau kata sandi tidak valid.' };
      }

      await saveSession(result.session);
      setAuthToken(result.session.token);
      setSession(result.session);
      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem saat proses login.' };
    }
  };

  /**
   * Registrasi akun baru (Task 01 - Slide 10)
   */
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Coba registrasi ke Cloud Auth API jika terkonfigurasi
    if (isSupabaseConfigured()) {
      try {
        await apiRegister(trimmedName, trimmedEmail, password);
        // Simpan juga salinan lokal terenkripsi untuk kompatibilitas offline
        await registerLocalUser(trimmedName, trimmedEmail, password);
        return { success: true };
      } catch (err: any) {
        console.warn('[AuthContext] Cloud register gagal, mencoba fallback lokal:', err.message);
        const localRes = await registerLocalUser(trimmedName, trimmedEmail, password);
        return localRes;
      }
    }

    // 2. Fallback Lokal
    try {
      const result = await registerLocalUser(trimmedName, trimmedEmail, password);
      if (!result.success) {
        return { success: false, error: result.error || 'Pendaftaran gagal.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem saat pendaftaran.' };
    }
  };

  /**
   * Logout dan pembersihan session (Task 03 - Slide 12)
   * Menghapus token dari SecureStore, server, memori API, dan membersihkan AsyncStorage secara menyeluruh.
   */
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentToken = session?.token;
      if (isSupabaseConfigured() && currentToken) {
        await apiLogout(currentToken);
      }
      clearApiCache();
      const cleared = await clearSession();
      await clearStorageCache();
      if (!cleared) {
        return { success: false, error: 'Gagal membersihkan sesi dari penyimpanan perangkat.' };
      }
      setSession(null);
      return { success: true };
    } catch {
      clearApiCache();
      await clearStorageCache();
      setSession(null);
      return { success: true };
    }
  };

  /**
   * Membersihkan seluruh data cache lokal dan token memori
   */
  const clearCache = async (): Promise<void> => {
    clearApiCache();
    await clearStorageCache();
  };

  const value: AuthContextType = {
    isLoading,
    isAuthenticated: !!session,
    session,
    user: session ? session.user : null,
    isSecureHardwareAvailable,
    login,
    register,
    logout,
    clearCache,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
