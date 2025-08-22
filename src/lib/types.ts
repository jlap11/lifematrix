export interface LifeMatrixData {
  meta: {
    schemaVersion: string;
    app: string;
    generatedAt: string;
  };
  user: {
    id: string;
    name: string;
    locale: string;
    createdAt: string;
  };
  preferences: {
    theme: 'dark' | 'light';
    primaryColor: string;
    language: string;
    factorWeights: Record<string, number>;
    visibleFactors: string[];
    notifications: {
      weeklySummary: boolean;
      habitReminders: boolean;
    };
  };
  factorsCatalog: Record<string, FactorDefinition>;
  records: Record<string, Record<string, MonthRecord>>;
  analytics: Analytics;
  sync: {
    lastBackupAt: string | null;
    pendingChanges: any[];
  };
}

export interface FactorDefinition {
  label: string;
  description: string;
  defaultWeight: number;
  submetrics: string[];
}

export interface MonthRecord {
  factors: Record<string, FactorRecord>;
  global: GlobalRecord;
}

export interface FactorRecord {
  score: number;
  trend: 'up' | 'down' | 'stable';
  variancePct: number;
  summary: string;
  notes: string[];
  objectives: Objective[];
  habits: Habit[];
  actions: Action[];
  blockers: string[];
  recommendations: string[];
  metrics: Record<string, any>;
}

export interface GlobalRecord {
  score: number;
  trend: 'up' | 'down' | 'stable';
  variancePct: number;
  commentary?: string;
}

export interface Objective {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progressPct: number;
  due: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  adherencePct: number;
  // Optional log per date (YYYY-MM-DD => done)
  log?: Record<string, boolean>;
}

export interface Action {
  id: string;
  title: string;
  impact: 'low' | 'medium' | 'high';
  done: boolean;
}

export interface Analytics {
  monthlyComparisons: {
    pairs: Array<{
      from: string;
      to: string;
      diff: Record<string, { delta: number; trend: string }>;
    }>;
  };
  annualSummary: Record<string, AnnualSummary>;
}

export interface AnnualSummary {
  factors: Record<string, { average: number; trend: string }>;
  global: { average: number; trend: string };
  highlights: string[];
  lowlights: string[];
  insights: string[];
}

export type TrendType = 'up' | 'down' | 'stable';

export interface ScoreData {
  value: number;
  trend: TrendType;
  variancePct: number;
}