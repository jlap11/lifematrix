const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

type HttpOptions = { method?: string; body?: any; headers?: Record<string, string> };

async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers || {})
  };
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
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function httpBlob(path: string, opts: HttpOptions = {}): Promise<Blob> {
  const headers: Record<string, string> = {
    ...(opts.headers || {})
  };
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
  register: (email: string, password: string) => http('/v1/auth/register', { method: 'POST', body: { email, password } }),
  login: (email: string, password: string) => http('/v1/auth/login', { method: 'POST', body: { email, password } }),
  refresh: () => http('/v1/auth/refresh', { method: 'POST' }),
  logout: () => http('/v1/auth/logout', { method: 'POST' }),

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
  putRecordByMonth: (monthKey: MonthKey, payload: any) => http(`/v1/records/${monthKey}`, { method: 'PUT', body: payload }),
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
  exportPdf: (month: MonthKey) => httpBlob(`/v1/export/pdf?month=${encodeURIComponent(month)}`),
};

export function setAuthHeader(token: string | null) {
  // Placeholder: para futura gestión de Authorization si no usamos cookies HttpOnly.
}
