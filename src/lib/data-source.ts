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
    // Desde API: juntar preferences, factors y records recientes
    const [prefs, factors, records] = await Promise.all([
      Api.getPreferences(),
      Api.getFactors(),
      Api.listRecords(),
    ]);
    const base = createDefaultData();
    const data = normalizeIncomingData({
      ...base,
      preferences: { ...base.preferences, ...((prefs as any) || {}) },
      factorsCatalog: ((factors as any) || {}),
      records: ((records as any) || {}),
    } as any);
    return data;
  },

  async saveAll(data: LifeMatrixData) {
    if (!DataSource.isApi()) {
      if (typeof window !== 'undefined') window.localStorage.setItem('lifematrix-data', JSON.stringify(data));
      return;
    }
    // Opcional: enviar preferencias; records se deben mutar granularmente por endpoints específicos
    await Api.updatePreferences({
      factorWeights: data.preferences.factorWeights,
      visibleFactors: data.preferences.visibleFactors,
      theme: data.preferences.theme,
      language: data.preferences.language,
      notifications: data.preferences.notifications,
    });
  }
};
