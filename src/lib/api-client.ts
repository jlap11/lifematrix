const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Simple token store (persisted in localStorage for DEV)
let accessToken: string | null = null;
let refreshToken: string | null = null;

function loadTokens() {
  try {
    accessToken = localStorage.getItem('lm_access_token');
    refreshToken = localStorage.getItem('lm_refresh_token');
  } catch { /* ignore */ }
}
function saveTokens(at: string | null, rt: string | null) {
  accessToken = at; refreshToken = rt;
  try {
    if (at) localStorage.setItem('lm_access_token', at); else localStorage.removeItem('lm_access_token');
    if (rt) localStorage.setItem('lm_refresh_token', rt); else localStorage.removeItem('lm_refresh_token');
  } catch { /* ignore */ }
}
loadTokens();

type HttpOptions = { method?: string; body?: any; headers?: Record<string, string>; ifUnmodifiedSince?: string; _retry?: boolean };

async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include'
  });
  if (!res.ok) {
    // Try refresh once on 401/403
    if ((res.status === 401 || res.status === 403) && refreshToken && !opts._retry) {
      try {
        const refreshed = await fetch(`${BASE_URL}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshed.ok) {
          const body = await refreshed.json();
          if (body?.accessToken) saveTokens(body.accessToken, body.refreshToken || refreshToken);
          return await http<T>(path, { ...opts, _retry: true });
        }
      } catch { /* ignore */ }
    }
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function httpBlob(path: string, opts: HttpOptions = {}): Promise<Blob> {
  const headers: Record<string, string> = {
    ...(opts.headers || {})
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return await res.blob();
}

async function httpText(path: string, opts: HttpOptions = {}): Promise<string> {
  const headers: Record<string, string> = {
    ...(opts.headers || {})
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (opts.ifUnmodifiedSince) headers['If-Unmodified-Since'] = opts.ifUnmodifiedSince;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return await res.text();
}

export type MonthKey = string; // YYYY-MM

export const Api = {
  // Auth (cookie-based recommended; credentials: 'include')
  register: (email: string, password: string, name?: string, locale?: string) => http('/v1/auth/register', { method: 'POST', body: { email, password, name, locale } }),
  login: async (email: string, password: string) => {
    const res = await http<any>('/v1/auth/login', { method: 'POST', body: { email, password } });
    if (res?.accessToken) saveTokens(res.accessToken, res.refreshToken || null);
    return res;
  },
  refresh: async () => {
    if (!refreshToken) return null as any;
    const res = await http<any>('/v1/auth/refresh', { method: 'POST', body: { refreshToken } });
    if (res?.accessToken) saveTokens(res.accessToken, res.refreshToken || refreshToken);
    return res;
  },
  logout: async () => { try { await http('/v1/auth/logout', { method: 'POST' }); } finally { saveTokens(null, null); } },

  // Preferences
  // NOTE: El backend aún puede no exponer estas rutas; se usan de forma opcional
  getPreferences: () => http('/v1/me/preferences'),
  updatePreferences: (data: any) => http('/v1/me/preferences', { method: 'PATCH', body: data }),

  // Records
  listRecords: (from?: MonthKey, to?: MonthKey) => {
    const q = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : '';
    return http(`/v1/records${q}`);
  },
  getRecordById: (id: string) => http(`/v1/records/${id}`),
  putRecordByMonth: (monthKey: MonthKey, payload: any, ifUnmodifiedSince?: string) =>
    http(`/v1/records/${monthKey}`, { method: 'PUT', body: payload, ifUnmodifiedSince }),
  patchRecord: (id: string, patch: any) => http(`/v1/records/${id}`, { method: 'PATCH', body: patch }),

  // Factors
  getFactors: () => http('/v1/factors'),
  upsertFactorRecord: (recordId: string, factorKey: string, payload: any) =>
    http(`/v1/records/${recordId}/factors/${factorKey}`, { method: 'PUT', body: payload }),

  // Notes/Objectives/Habits
  addNote: (recordId: string, factorKey: string, text: string) =>
    http(`/v1/records/${recordId}/factors/${factorKey}/notes`, { method: 'POST', body: { text } }),
  deleteNote: (recordId: string, factorKey: string, noteId: string) =>
    http(`/v1/records/${recordId}/factors/${factorKey}/notes/${noteId}`, { method: 'DELETE' }),

  upsertObjective: (recordId: string, factorKey: string, obj: any) =>
    http(`/v1/records/${recordId}/factors/${factorKey}/objectives/${obj.id || ''}`, { method: obj.id ? 'PATCH' : 'POST', body: obj }),
  deleteObjective: (recordId: string, factorKey: string, id: string) =>
    http(`/v1/records/${recordId}/factors/${factorKey}/objectives/${id}`, { method: 'DELETE' }),

  upsertHabit: (recordId: string, factorKey: string, habit: any) =>
    http(`/v1/records/${recordId}/factors/${factorKey}/habits/${habit.id || ''}`, { method: habit.id ? 'PATCH' : 'POST', body: habit }),
  deleteHabit: (recordId: string, factorKey: string, id: string) =>
    http(`/v1/records/${recordId}/factors/${factorKey}/habits/${id}`, { method: 'DELETE' }),
  putHabitLog: (habitId: string, date: string, done: boolean) =>
    http(`/v1/habits/${habitId}/log/${date}`, { method: 'PUT', body: { done } }),

  // Analytics
  getAnnual: (year: string) => http(`/v1/analytics/annual/${year}`),
  getTrends: (window: number) => http(`/v1/analytics/trends?window=${window}`),

  // Import/Export
  importData: (payload: any, strategy: 'overwrite' | 'merge-keep-existing') =>
    http(`/v1/import?strategy=${strategy}`, { method: 'POST', body: payload }),
  exportAll: () => http('/v1/export'),
  exportCsv: (factor: string, month: MonthKey) => httpText(`/v1/export/csv?factor=${encodeURIComponent(factor)}&month=${encodeURIComponent(month)}`),
  // PDF puede no existir aún en el backend; si 404, el caller deberá fallback a client-side
  exportPdf: (month: MonthKey) => httpBlob(`/v1/export/pdf?month=${encodeURIComponent(month)}`),

  // Helpers
  getTokens: () => ({ accessToken, refreshToken }),
  setTokens: (at: string | null, rt: string | null) => saveTokens(at, rt),
  async findRecordIdByMonth(month: MonthKey): Promise<string | null> {
    const list = await Api.listRecords(month, month) as any[];
    const [y, m] = month.split('-');
    const found = Array.isArray(list) ? list.find(r => String(r.year) === y && String(r.month).padStart(2,'0') === m) : null;
    return found?.id || null;
  },
};

export function setAuthHeader(token: string | null) {
  saveTokens(token, refreshToken);
}
