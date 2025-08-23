import { Api } from './api-client';
import { createDefaultData, normalizeIncomingData } from './data-utils';
import type { LifeMatrixData } from './types';

const MODE = (import.meta as any).env?.VITE_DATA_MODE || 'local'; // 'api' | 'local'

export const DataSource = {
  isApi() {
    return MODE === 'api';
  },

  async loadInitial(): Promise<LifeMatrixData> {
    if (!DataSource.isApi()) {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('lifematrix-data') : null;
      return raw ? JSON.parse(raw) : createDefaultData();
    }
    // Intento de auto-login en desarrollo si hay credenciales de demo
    const devEmail = (import.meta as any).env?.VITE_DEV_EMAIL;
    const devPassword = (import.meta as any).env?.VITE_DEV_PASSWORD;
    if (devEmail && devPassword) {
      try { await Api.login(devEmail, devPassword); } catch { /* ignore */ }
    }

    // Carga mínima: records (el backend actual ya publica /v1/records)
    // Preferencias y factores se rellenan con defaults si aún no hay endpoints.
    let prefs: any = null;
    let factors: any = null;
    try { prefs = await Api.getPreferences(); } catch { /* opcional */ }
    try { factors = await Api.getFactors(); } catch { /* opcional */ }
    const records = await Api.listRecords();

    const base = createDefaultData();
    const data = normalizeIncomingData({
      ...base,
      preferences: { ...base.preferences, ...(prefs || {}) },
      factorsCatalog: (factors || base.factorsCatalog),
      records: (records || {}),
    } as any);
    return data;
  },

  async saveAll(data: LifeMatrixData) {
    if (!DataSource.isApi()) {
      if (typeof window !== 'undefined') window.localStorage.setItem('lifematrix-data', JSON.stringify(data));
      return;
    }
    // Opcional: enviar preferencias; records se deben mutar granularmente por endpoints específicos
    try {
      await Api.updatePreferences({
        factorWeights: data.preferences.factorWeights,
        visibleFactors: data.preferences.visibleFactors,
        theme: data.preferences.theme,
        language: data.preferences.language,
        notifications: data.preferences.notifications,
      });
    } catch {
      // Silencioso si el backend aún no implementa preferencias.
    }
  }
};
