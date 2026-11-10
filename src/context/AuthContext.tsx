import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthSession,
  UserProfile,
  getSession,
  saveSession,
  clearSession,
  registerLocalUser,
  verifyLocalCredentials,
  isSecureStoreSupported,
} from '../services/authStorage';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  setAuthToken,
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
      setAuthToken(null);
      void clearSession();
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

        // Jika kredensial akun demo pak budi digunakan, izinkan fallback lokal untuk kemudahan presentasi offline
        const localCheck = await verifyLocalCredentials(trimmedEmail, password);
        if (localCheck.success && localCheck.session) {
          await saveSession(localCheck.session);
          setAuthToken(localCheck.session.token);
          setSession(localCheck.session);
          return { success: true };
        }

        return {
          success: false,
          error: err.message || 'Email atau kata sandi tidak valid pada server.',
        };
      }
    }

    // 2. Fallback Lokal (Pekan 3 compatibility & offline demo mode)
    try {
      const result = await verifyLocalCredentials(trimmedEmail, password);
      if (!result.success || !result.session) {
        return { success: false, error: result.error || 'Autentikasi gagal.' };
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
   * Menghapus token dari SecureStore, server, dan mereset authentication state.
   */
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentToken = session?.token;
      if (isSupabaseConfigured() && currentToken) {
        await apiLogout(currentToken);
      }
      setAuthToken(null);
      const cleared = await clearSession();
      if (!cleared) {
        return { success: false, error: 'Gagal membersihkan sesi dari penyimpanan perangkat.' };
      }
      setSession(null);
      return { success: true };
    } catch {
      setAuthToken(null);
      setSession(null);
      return { success: true };
    }
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
