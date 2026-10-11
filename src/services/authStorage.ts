import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type AuthSession = {
  token: string;
  user: UserProfile;
  createdAt: string;
};

type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
};

const STORAGE_KEYS = {
  SESSION: 'ht_auth_session',
  USERS: 'ht_registered_users',
};

// Fallback in-memory storage untuk Web atau lingkungan saat SecureStore tidak tersedia.
// PERINGATAN KEAMANAN: Memori lokal ini murni untuk kompatibilitas demonstrasi non-native
// dan tidak memberikan proteksi setara hardware Keystore/Keychain.
const memoryFallbackStore: Record<string, string> = {};

/**
 * Memeriksa ketersediaan SecureStore pada perangkat/platform aktif.
 */
export async function isSecureStoreSupported(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function writeStorageItem(key: string, value: string): Promise<void> {
  const isAvailable = await isSecureStoreSupported();
  if (isAvailable) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } else {
    // In-memory fallback untuk web/lingkungan pengujian non-native
    memoryFallbackStore[key] = value;
  }
}

async function readStorageItem(key: string): Promise<string | null> {
  const isAvailable = await isSecureStoreSupported();
  if (isAvailable) {
    return await SecureStore.getItemAsync(key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } else {
    return memoryFallbackStore[key] ?? null;
  }
}

async function deleteStorageItem(key: string): Promise<void> {
  const isAvailable = await isSecureStoreSupported();
  if (isAvailable) {
    await SecureStore.deleteItemAsync(key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  } else {
    delete memoryFallbackStore[key];
  }
}

/**
 * Menghasilkan hash SHA-256 dengan salt unik menggunakan expo-crypto.
 * 
 * CATATAN KEAMANAN & BATASAN PROTOTIPE LOKAL:
 * Hash SHA-256 dengan salt digunakan secara eksklusif untuk prototipe demonstrasi perkuliahan
 * agar password mentah (plaintext) tidak pernah tersimpan di memori storage.
 * Pada aplikasi produksi sungguhan, verifikasi kredensial wajib dilakukan di server backend
 * terpercaya menggunakan algoritma hashing standar industri (Argon2 / bcrypt) melalui koneksi TLS.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const combined = `${salt}:${password}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
}

/**
 * Menyimpan sesi aktif ke Secure Storage.
 */
export async function saveSession(session: AuthSession): Promise<boolean> {
  try {
    const serialized = JSON.stringify(session);
    await writeStorageItem(STORAGE_KEYS.SESSION, serialized);
    return true;
  } catch {
    console.error('Gagal menyimpan sesi autentikasi ke storage.');
    return false;
  }
}

/**
 * Membaca sesi aktif dari Secure Storage.
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const raw = await readStorageItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed && parsed.token && parsed.user) {
      return parsed;
    }
    return null;
  } catch {
    console.error('Gagal membaca sesi autentikasi dari storage.');
    return null;
  }
}

/**
 * Menghapus sesi aktif dari Secure Storage (Logout).
 */
export async function clearSession(): Promise<boolean> {
  try {
    await deleteStorageItem(STORAGE_KEYS.SESSION);
    return true;
  } catch {
    console.error('Gagal menghapus sesi autentikasi dari storage.');
    return false;
  }
}

/**
 * Mengambil daftar pengguna tersimpan untuk validasi lokal.
 */
async function getStoredUsers(): Promise<StoredUser[]> {
  try {
    const raw = await readStorageItem(STORAGE_KEYS.USERS);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUser[];
  } catch {
    console.error('Gagal membaca daftar pengguna dari storage.');
    return [];
  }
}

/**
 * Mendaftarkan akun baru ke penyimpanan kredensial lokal terenkripsi.
 * Password mentah langsung di-hash dengan salt dan tidak pernah disimpan secara terbuka.
 */
export async function registerLocalUser(
  name: string,
  email: string,
  plainPassword: string
): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUsers = await getStoredUsers();

    const isDuplicate = existingUsers.some(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (isDuplicate) {
      return {
        success: false,
        error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.',
      };
    }

    const salt = Crypto.randomUUID();
    const passwordHash = await hashPassword(plainPassword, salt);
    const userId = Crypto.randomUUID();
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: now,
    };

    existingUsers.push(newUser);
    await writeStorageItem(STORAGE_KEYS.USERS, JSON.stringify(existingUsers));

    const profile: UserProfile = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    return { success: true, user: profile };
  } catch {
    console.error('Terjadi kesalahan saat menyimpan pendaftaran pengguna.');
    return {
      success: false,
      error: 'Gagal memproses pendaftaran akun. Silakan coba lagi.',
    };
  }
}

/**
 * Memverifikasi kredensial login pengguna.
 * Menghasilkan pesan kesalahan yang aman tanpa membocorkan eksistensi email tertentu.
 */
export async function verifyLocalCredentials(
  email: string,
  plainPassword: string
): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await getStoredUsers();

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!matchedUser) {
      return {
        success: false,
        error: 'Email atau kata sandi tidak valid.',
      };
    }

    const computedHash = await hashPassword(plainPassword, matchedUser.salt);
    if (computedHash !== matchedUser.passwordHash) {
      return {
        success: false,
        error: 'Email atau kata sandi tidak valid.',
      };
    }

    const token = Crypto.randomUUID();
    const session: AuthSession = {
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        createdAt: matchedUser.createdAt,
      },
      createdAt: new Date().toISOString(),
    };

    const saved = await saveSession(session);
    if (!saved) {
      return {
        success: false,
        error: 'Gagal menyimpan sesi ke penyimpanan aman perangkat.',
      };
    }

    return { success: true, session };
  } catch {
    console.error('Terjadi kesalahan saat memverifikasi kredensial login.');
    return {
      success: false,
      error: 'Gagal memproses login. Silakan coba beberapa saat lagi.',
    };
  }
}
