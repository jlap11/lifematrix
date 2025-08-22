import { LifeMatrixData, MonthRecord, FactorRecord } from '@/lib/types';

export type MergeStrategy = 'overwrite' | 'merge-keep-existing';

export const PersistenceService = {
  mergeData(base: LifeMatrixData, incoming: LifeMatrixData, strategy: MergeStrategy = 'merge-keep-existing'): LifeMatrixData {
    const out: LifeMatrixData = {
      ...base,
      meta: { ...base.meta, ...incoming.meta },
      user: { ...base.user, ...incoming.user },
      preferences: { ...base.preferences, ...incoming.preferences },
      factorsCatalog: { ...base.factorsCatalog, ...incoming.factorsCatalog },
      records: { ...base.records },
      analytics: { ...base.analytics, ...incoming.analytics },
      sync: { ...base.sync, lastBackupAt: incoming.sync?.lastBackupAt || base.sync.lastBackupAt, pendingChanges: [] },
    };

    const inRecords = incoming.records || {};
    for (const year of Object.keys(inRecords)) {
      const months = (inRecords as any)[year] || {};
      if (!out.records[year]) out.records[year] = {} as any;
      for (const mm of Object.keys(months)) {
        const rec = months[mm] as MonthRecord;
        if (!out.records[year][mm] || strategy === 'overwrite') {
          out.records[year][mm] = rec;
          continue;
        }
        // merge-keep-existing
        const current = out.records[year][mm];
        const incomingRec = rec;
        const mergedFactors: Record<string, FactorRecord> = { ...(current.factors || {}) };
        for (const fk of Object.keys(incomingRec.factors || {})) {
          if (!mergedFactors[fk]) mergedFactors[fk] = incomingRec.factors[fk];
        }
        out.records[year][mm] = { ...current, ...incomingRec, factors: mergedFactors };
      }
    }
    return out;
  }
};
