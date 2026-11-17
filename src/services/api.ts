/**
 * Network Layer: REST Client Standar Menggunakan JavaScript fetch()
 * Sesuai Slide 4 & 7 (Pekan 4), Slide 8, 10, & 11 (Pekan 5: Token Auth),
 * dan Slide 2, 4, 6, 7, 8, 9, 10, 11 (Pekan 6: Error Handling, Timeout, Offline & Retry)
 *
 * Fitur Utama Pekan 6:
 * - Request Timeout dengan AbortController (Default 12 detik - Slide 6)
 * - Error Classification: OFFLINE, TIMEOUT, HTTP_ERROR, UNKNOWN (Slide 2 & 4)
 * - Status Code Mapping (2xx, 4xx, 5xx - Slide 4)
 * - Safe Fetch Wrapper dengan penanganan try-catch-finally terstruktur (Slide 8)
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Batas waktu tunggu request dalam milidetik (Slide 6)
export const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

// Token JWT user aktif yang disematkan secara dinamis ke seluruh protected request (Interceptor)
let activeUserToken: string | null = null;

// Handler callback saat server merespons 401 Unauthorized (Auto Logout & Cleanup)
type UnauthorizedCallback = () => void;
let onUnauthorizedCallback: UnauthorizedCallback | null = null;

/**
 * Menyimpan / memperbarui access token aktif di memori untuk disematkan pada setiap request.
 */
export function setAuthToken(token: string | null): void {
  activeUserToken = token;
}

/**
 * Mengambil access token aktif saat ini.
 */
export function getAuthToken(): string | null {
  return activeUserToken;
}

/**
 * Memeriksa apakah terdapat token autentikasi user aktif.
 */
export function hasAuthToken(): boolean {
  return !!activeUserToken;
}

/**
 * Mendaftarkan callback untuk menangani respons HTTP 401 Unauthorized.
 */
export function setOnUnauthorized(callback: UnauthorizedCallback | null): void {
  onUnauthorizedCallback = callback;
}

/**
 * Tipe klasifikasi kegagalan request API sesuai Slide 2 Pekan 6
 */
export type ApiErrorType = 'HTTP_ERROR' | 'OFFLINE' | 'TIMEOUT' | 'UNKNOWN';

/**
 * Custom Error Class untuk merepresentasikan kegagalan HTTP & Jaringan secara terstruktur.
 * Sesuai Slide 2, 4, & 8 (Pekan 6)
 */
export class ApiError extends Error {
  status: number;
  data: unknown;
  errorType: ApiErrorType;

  constructor(
    message: string,
    status: number,
    data?: unknown,
    errorType: ApiErrorType = 'HTTP_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errorType = errorType;
  }
}

/**
 * Memeriksa apakah kredensial Supabase di berkas .env telah diisi secara valid
 * dan bukan sekadar placeholder bawaan template.
 */
export function isSupabaseConfigured(): boolean {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (SUPABASE_URL.includes('[YOUR_PROJECT_ID]')) return false;
  if (SUPABASE_ANON_KEY.includes('[YOUR_ANON_KEY]')) return false;
  return true;
}

/**
 * Membersihkan base URL dari trailing slash atau path '/rest/v1'.
 */
function getCleanBaseUrl(): string {
  let base = SUPABASE_URL.replace(/\/+$/, '');
  if (base.endsWith('/rest/v1')) {
    base = base.replace(/\/rest\/v1$/, '');
  }
  return base;
}

/**
 * Membentuk URL lengkap menuju PostgREST Supabase endpoint (/rest/v1/...).
 */
export function resolveApiUrl(endpoint: string): string {
  const base = getCleanBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullPath = cleanEndpoint.startsWith('/rest/v1')
    ? cleanEndpoint
    : `/rest/v1${cleanEndpoint}`;
  return `${base}${fullPath}`;
}

/**
 * Membentuk URL lengkap menuju Auth Supabase endpoint (/auth/v1/...).
 */
export function resolveAuthUrl(endpoint: string): string {
  const base = getCleanBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

/**
 * Menghasilkan Header standar yang diwajibkan oleh Supabase PostgREST & Auth API.
 * Sesuai Slide 8 & 11 (Pekan 5): Otomatis menyematkan user access token (Bearer Token) jika tersedia.
 */
export function getStandardHeaders(customHeaders?: HeadersInit): HeadersInit {
  const bearerToken = activeUserToken || SUPABASE_ANON_KEY;

  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...customHeaders,
  };
}

/**
 * Helper pembungkus fetch dengan batas waktu (Timeout AbortController)
 * dan deteksi otomatis kondisi offline jaringan.
 * Sesuai Slide 6 & 7 (Pekan 6)
 */
export async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let externalAborted = false;
  if (options?.signal) {
    if (options.signal.aborted) {
      externalAborted = true;
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => {
        externalAborted = true;
        controller.abort();
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    // Jika dibatalkan oleh signal eksternal (misal: component unmount / abort cleanup)
    if (externalAborted || options?.signal?.aborted) {
      const abortErr = new Error('Fetch request dibatalkan: Component unmounted');
      abortErr.name = 'AbortError';
      throw abortErr;
    }

    // 1. Tangani Timeout Error (Slide 6)
    if (err.name === 'AbortError' || err.message?.toLowerCase().includes('aborted')) {
      throw new ApiError(
        'Waktu permintaan habis (Request Timeout). Server atau jaringan membutuhkan waktu terlalu lama untuk merespons.',
        408,
        null,
        'TIMEOUT'
      );
    }

    // 2. Tangani Offline / Network Error (Slide 7)
    const errMessage = (err.message || '').toLowerCase();
    if (
      errMessage.includes('network request failed') ||
      errMessage.includes('failed to fetch') ||
      errMessage.includes('fetch failed') ||
      errMessage.includes('networkerror') ||
      errMessage.includes('internet') ||
      errMessage.includes('connection refused') ||
      errMessage.includes('enotfound') ||
      errMessage.includes('getaddrinfo') ||
      errMessage.includes('dns')
    ) {
      throw new ApiError(
        'Tidak ada koneksi internet atau server tidak dapat dijangkau. Periksa koneksi data atau Wi-Fi Anda.',
        0,
        null,
        'OFFLINE'
      );
    }

    // 3. Error lainnya
    throw new ApiError(
      err.message || 'Terjadi gangguan jaringan saat menghubungi server.',
      0,
      null,
      'UNKNOWN'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Menangani respon HTTP standar, parsing JSON, dan deteksi status error HTTP (2xx, 4xx, 5xx).
 * Sesuai Slide 4 & 8 (Pekan 6)
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // HTTP 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') || '';
  let payload: any = null;

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    try {
      payload = await response.text();
    } catch {
      payload = null;
    }
  }

  // Tangani 401 Unauthorized (Token kadaluwarsa atau tidak valid)
  if (response.status === 401) {
    if (onUnauthorizedCallback) {
      try {
        onUnauthorizedCallback();
      } catch (err) {
        console.error('[API Interceptor] Gagal memproses onUnauthorized callback:', err);
      }
    }

    const message =
      (payload && typeof payload === 'object' && (payload.msg || payload.message || payload.error_description)) ||
      'Sesi autentikasi telah berakhir atau token tidak valid (401 Unauthorized). Silakan masuk kembali.';
    throw new ApiError(message, 401, payload, 'HTTP_ERROR');
  }

  // Tangani kegagalan HTTP Non-2xx lainnya (Slide 4: 4xx Client Error & 5xx Server Error)
  if (!response.ok) {
    let friendlyMessage = `HTTP Error ${response.status}: ${response.statusText}`;

    // Pemetaan pesan kesalahan ramah pengguna berdasarkan rentang status code HTTP (Slide 4)
    if (response.status === 400) {
      friendlyMessage = 'Permintaan data tidak valid (400 Bad Request). Harap periksa input Anda.';
    } else if (response.status === 403) {
      friendlyMessage = 'Akses ditolak (403 Forbidden). Anda tidak memiliki izin untuk resource ini.';
    } else if (response.status === 404) {
      friendlyMessage = 'Data atau resource tidak ditemukan pada server (404 Not Found).';
    } else if (response.status === 408) {
      friendlyMessage = 'Waktu permintaan habis (408 Request Timeout). Silakan coba lagi.';
    } else if (response.status === 500) {
      friendlyMessage = 'Terjadi kesalahan pada server (500 Internal Server Error). Mohon tunggu beberapa saat.';
    } else if (response.status === 502 || response.status === 503 || response.status === 504) {
      friendlyMessage = 'Layanan server sedang mengalami pemeliharaan atau tidak dapat dijangkau (503 Service Unavailable).';
    }

    if (payload && typeof payload === 'object') {
      const serverMsg =
        payload.msg ||
        payload.message ||
        payload.error_description ||
        payload.hint ||
        payload.details;
      if (serverMsg) {
        friendlyMessage = `${friendlyMessage} (${serverMsg})`;
      }
    } else if (typeof payload === 'string' && payload.trim().length > 0) {
      friendlyMessage = `${friendlyMessage} (${payload.trim()})`;
    }

    throw new ApiError(friendlyMessage, response.status, payload, 'HTTP_ERROR');
  }

  return payload as T;
}

// ============================================================================
// 1. DATA RESTful API (GET, POST, PATCH, DELETE) dengan Timeout & Error Handling
// ============================================================================

/**
 * HTTP GET Request ke Protected Endpoint dengan Timeout
 */
export async function apiGet<T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs?: number
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: getStandardHeaders(options?.headers),
      ...options,
    },
    timeoutMs
  );
  return handleResponse<T>(response);
}

/**
 * HTTP POST Request ke Protected Endpoint dengan Timeout
 */
export async function apiPost<T, B = unknown>(
  endpoint: string,
  body: B,
  options?: RequestInit,
  timeoutMs?: number
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: getStandardHeaders(options?.headers),
      body: JSON.stringify(body),
      ...options,
    },
    timeoutMs
  );
  return handleResponse<T>(response);
}

/**
 * HTTP PATCH Request ke Protected Endpoint dengan Timeout
 */
export async function apiPatch<T, B = unknown>(
  endpoint: string,
  body: B,
  options?: RequestInit,
  timeoutMs?: number
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const response = await fetchWithTimeout(
    url,
    {
      method: 'PATCH',
      headers: getStandardHeaders(options?.headers),
      body: JSON.stringify(body),
      ...options,
    },
    timeoutMs
  );
  return handleResponse<T>(response);
}

/**
 * HTTP DELETE Request ke Protected Endpoint dengan Timeout
 */
export async function apiDelete<T = void>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs?: number
): Promise<T> {
  const url = resolveApiUrl(endpoint);
  const response = await fetchWithTimeout(
    url,
    {
      method: 'DELETE',
      headers: getStandardHeaders(options?.headers),
      ...options,
    },
    timeoutMs
  );
  return handleResponse<T>(response);
}

// ============================================================================
// 2. AUTHENTICATION REST API (Login, Register, Logout)
// ============================================================================

export interface AuthApiResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
    created_at?: string;
  };
}

/**
 * Login melalui API menggunakan kredensial email & password
 */
export async function apiLogin(
  email: string,
  password: string,
  timeoutMs?: number
): Promise<AuthApiResponse> {
  const url = resolveAuthUrl('/auth/v1/token?grant_type=password');
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    },
    timeoutMs
  );
  return handleResponse<AuthApiResponse>(response);
}

/**
 * Registrasi akun baru melalui API
 */
export async function apiRegister(
  name: string,
  email: string,
  password: string,
  timeoutMs?: number
): Promise<AuthApiResponse> {
  const url = resolveAuthUrl('/auth/v1/signup');
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: { name },
      }),
    },
    timeoutMs
  );
  return handleResponse<AuthApiResponse>(response);
}

/**
 * Logout dari API
 */
export async function apiLogout(token?: string): Promise<void> {
  try {
    const url = resolveAuthUrl('/auth/v1/logout');
    const bearerToken = token || activeUserToken || SUPABASE_ANON_KEY;
    await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      },
      6000 // Timeout 6 detik saat logout
    );
  } catch {
    // Abaikan kegagalan jaringan saat logout agar pembersihan lokal tetap berhasil
  }
}
