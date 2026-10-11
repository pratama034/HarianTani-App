import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuthSession,
  UserProfile,
  getSession,
  clearSession,
  registerLocalUser,
  verifyLocalCredentials,
  isSecureStoreSupported,
} from '../services/authStorage';

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

    async function initializeAuth() {
      try {
        const supported = await isSecureStoreSupported();
        if (isMounted) {
          setIsSecureHardwareAvailable(supported);
        }

        const storedSession = await getSession();
        if (isMounted) {
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

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await verifyLocalCredentials(email, password);
      if (!result.success || !result.session) {
        return { success: false, error: result.error || 'Autentikasi gagal.' };
      }

      setSession(result.session);
      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem saat proses login.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registerLocalUser(name, email, password);
      if (!result.success) {
        return { success: false, error: result.error || 'Pendaftaran gagal.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem saat pendaftaran.' };
    }
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleared = await clearSession();
      if (!cleared) {
        return { success: false, error: 'Gagal membersihkan sesi dari penyimpanan perangkat.' };
      }
      setSession(null);
      return { success: true };
    } catch {
      return { success: false, error: 'Terjadi kesalahan sistem saat keluar dari akun.' };
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
