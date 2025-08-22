import { LifeMatrixData } from './types';
import { LifeMatrixCalculator } from './calculator';

export const DEFAULT_FACTORS_CATALOG = {
  emotional: {
    label: "Emocional",
    description: "Estado de ánimo, regulación emocional y bienestar afectivo",
    defaultWeight: 1.0,
    submetrics: ["mood", "stress", "energy"]
  },
  financial: {
    label: "Financiero", 
    description: "Ingresos, gastos, ahorro, deudas y estabilidad económica",
    defaultWeight: 1.0,
    submetrics: ["income", "expenses", "savings", "debts"]
  },
  professional: {
    label: "Profesional",
    description: "Carrera, proyectos, aprendizaje y oportunidades laborales", 
    defaultWeight: 1.0,
    submetrics: ["projects", "skills", "applications"]
  },
  mental: {
    label: "Mental",
    description: "Claridad, foco, estrés cognitivo y sueño",
    defaultWeight: 1.0,
    submetrics: ["focus", "clarity", "sleep"]
  },
  social: {
    label: "Social",
    description: "Relaciones, apoyo y calidad de interacciones",
    defaultWeight: 1.0,
    submetrics: ["interactions", "quality"]
  },
  spiritual: {
    label: "Espiritual", 
    description: "Propósito, prácticas espirituales y sentido",
    defaultWeight: 1.0,
    submetrics: ["practices", "meaning"]
  },
  personal: {
    label: "Personal",
    description: "Salud física, hábitos y bienestar general",
    defaultWeight: 1.0,
    submetrics: ["exercise", "sleep", "nutrition"]
  }
};

export function createDefaultData(): LifeMatrixData {
  const now = new Date();
  
  return {
    meta: {
      schemaVersion: "1.0.0",
      app: "LifeMatrix",
      generatedAt: now.toISOString()
    },
    user: {
      id: `user_${Date.now()}`,
      name: "Usuario",
      locale: "es-CO", 
      createdAt: now.toISOString().split('T')[0]
    },
    preferences: {
      theme: "dark",
      primaryColor: "blue",
      language: "es",
      factorWeights: {
        emotional: 1.0,
        financial: 1.0,
        professional: 1.0,
        mental: 1.0,
        social: 1.0,
        spiritual: 1.0,
        personal: 1.0
      },
      visibleFactors: [
        "emotional", "financial", "professional", 
        "mental", "social", "spiritual", "personal"
      ],
      notifications: {
        weeklySummary: true,
        habitReminders: true
      }
    },
    factorsCatalog: DEFAULT_FACTORS_CATALOG,
    records: {},
    analytics: {
      monthlyComparisons: { pairs: [] },
      annualSummary: {}
    },
    sync: {
      lastBackupAt: null,
      pendingChanges: []
    }
  };
}

export function validateLifeMatrixData(data: any): data is LifeMatrixData {
  try {
    return (
      data &&
      typeof data === 'object' &&
      data.meta &&
      data.user &&
      data.preferences &&
      data.factorsCatalog &&
      data.records &&
      data.analytics &&
      data.sync &&
      typeof data.meta.schemaVersion === 'string' &&
      typeof data.user.id === 'string' &&
      typeof data.preferences.theme === 'string' &&
      typeof data.factorsCatalog === 'object' &&
      typeof data.records === 'object'
    );
  } catch {
    return false;
  }
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getCurrentYearKey(): string {
  return new Date().getFullYear().toString();
}

export function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long' 
  });
}

export function getPrevMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yy}-${mm}`;
}

// Ensure incoming data has required top-level shape; shallow merge with defaults
export function createSafeDataShape(data: any): LifeMatrixData {
  const def = createDefaultData();
  const d = data || {};
  return {
    ...def,
    ...d,
    meta: { ...def.meta, ...(d.meta || {}) },
    user: { ...def.user, ...(d.user || {}) },
    preferences: { ...def.preferences, ...(d.preferences || {}) },
    factorsCatalog: d.factorsCatalog || def.factorsCatalog,
    records: d.records || {},
    analytics: { ...def.analytics, ...(d.analytics || {}) },
    sync: { ...def.sync, ...(d.sync || {}) }
  } as LifeMatrixData;
}

// Return month keys like YYYY-MM sorted desc (latest first)
export function getAvailableMonthsFromData(data: LifeMatrixData): string[] {
  const months: string[] = [];
  const years = Object.keys(data.records || {}).filter(Boolean).sort((a, b) => Number(b) - Number(a));
  for (const y of years) {
    const ms = Object.keys((data.records as any)[y] || {}).filter(Boolean).sort((a, b) => Number(b) - Number(a));
    for (const m of ms) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }
  return months;
}

// Normalize incoming data: ensure month keys are MM (two digits) and basic shape exists
export function normalizeIncomingData(input: LifeMatrixData): LifeMatrixData {
  const data = createSafeDataShape(input);
  const out: LifeMatrixData = { ...data, records: {} } as LifeMatrixData;
  const recs: Record<string, any> = (data.records as any) || {};

  const topKeys = Object.keys(recs);
  const isFlat = topKeys.some(isMonthKey);

  if (isFlat) fillRecordsFromFlat(recs, out);
  else fillRecordsFromNested(recs, out);

  ensureVisibleFactors(out);
  ensureCatalogAndVisibility(out);
  return out;
}

function isMonthKey(k: string): boolean {
  return /\d{4}-\d{1,2}/.test(k);
}

function ensureMonthRecordShape(rec: any, catalog?: Record<string, any>) {
  if (rec?.factors && rec?.global) return rec;
  // Try to convert legacy month shape: { emotional: {...}, financial: {...}, ... }
  if (catalog && isLegacyMonth(rec, catalog)) {
    return convertLegacyMonth(rec, catalog);
  }
  return {
    factors: rec?.factors || {},
    global: rec?.global || { score: 0, trend: 'stable', variancePct: 0 }
  };
}

function isLegacyMonth(obj: any, catalog: Record<string, any>): boolean {
  if (!obj || typeof obj !== 'object') return false;
  return Object.keys(obj).some((k) => Boolean((catalog as any)[k]));
}

function convertLegacyMonth(obj: any, catalog: Record<string, any>) {
  const factors: Record<string, any> = {};
  const factorScores: Record<string, number> = {};

  for (const fk of Object.keys(obj)) {
    if (!(catalog as any)[fk]) continue;
    const src = obj[fk] || {};
    const subs: string[] = ((catalog as any)[fk]?.submetrics as string[]) || [];
    // Numeric subscores only and <= 100 to avoid financial raw amounts skewing
    const entries = Object.entries(src).filter(([k, v]) => typeof v === 'number' && v <= 100 && (subs.length === 0 || subs.includes(k)));
    let score = 0;
    if (entries.length > 0) {
      const sum = entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
      score = Math.round((sum / entries.length) * 10) / 10;
    } else if (typeof (src as any).score === 'number') {
      score = Math.max(0, Math.min(100, Number((src as any).score)));
    } else {
      score = 0;
    }
    const notes: string[] = [];
    if (typeof (src as any).notes === 'string' && (src as any).notes.trim()) notes.push((src as any).notes.trim());
    if (Array.isArray((src as any).achievements)) notes.push(...(src as any).achievements.map((s: any) => String(s)));
    const blockers: string[] = Array.isArray((src as any).challenges) ? (src as any).challenges.map((s: any) => String(s)) : [];

    const subscores: Record<string, number> = {};
    for (const [k, v] of entries) subscores[k] = Number(v);

    factors[fk] = {
      score,
      trend: 'stable',
      variancePct: 0,
      summary: '',
      notes,
      objectives: [],
      habits: [],
      actions: [],
      blockers,
      recommendations: [],
      metrics: { subscores }
    };
    factorScores[fk] = score;
  }

  const globalScore = LifeMatrixCalculator.calculateGlobalScore(factorScores, {} as any);
  return {
    factors,
    global: { score: globalScore, trend: 'stable', variancePct: 0 }
  };
}

function fillRecordsFromFlat(recs: Record<string, any>, out: LifeMatrixData) {
  for (const k of Object.keys(recs)) {
    if (!isMonthKey(k)) continue;
    const [yy, mmRaw] = k.split('-');
    const mm = String(mmRaw).padStart(2, '0');
    (out.records as any)[yy] = (out.records as any)[yy] || {};
  (out.records as any)[yy][mm] = ensureMonthRecordShape(recs[k], out.factorsCatalog as any);
  }
}

function fillRecordsFromNested(recs: Record<string, any>, out: LifeMatrixData) {
  for (const y of Object.keys(recs || {})) {
    const months: Record<string, any> = recs[y] || {};
    (out.records as any)[y] = (out.records as any)[y] || {};
    for (const mk of Object.keys(months)) {
      const mm = String(mk).padStart(2, '0');
  (out.records as any)[y][mm] = ensureMonthRecordShape(months[mk], out.factorsCatalog as any);
    }
  }
}

function ensureVisibleFactors(out: LifeMatrixData) {
  if (!out.preferences.visibleFactors || out.preferences.visibleFactors.length === 0) {
    out.preferences.visibleFactors = Object.keys(out.factorsCatalog || {});
  }
}

function ensureCatalogAndVisibility(out: LifeMatrixData) {
  const found = new Set<string>();
  for (const y of Object.keys(out.records || {})) {
    const months = (out.records as any)[y] || {};
    for (const mm of Object.keys(months)) {
      const rec = months[mm] || {};
      for (const fk of Object.keys(rec.factors || {})) found.add(fk);
    }
  }
  for (const fk of Array.from(found)) {
    if (!out.factorsCatalog[fk]) {
      out.factorsCatalog[fk] = {
        label: fk.charAt(0).toUpperCase() + fk.slice(1),
        description: '',
        defaultWeight: 1,
        submetrics: []
      };
    }
    if (!out.preferences.visibleFactors.includes(fk)) {
      out.preferences.visibleFactors.push(fk);
      if (!out.preferences.factorWeights[fk]) out.preferences.factorWeights[fk] = 1;
    }
  }
}