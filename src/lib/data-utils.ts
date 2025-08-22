import { LifeMatrixData } from './types';

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