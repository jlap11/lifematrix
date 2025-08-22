import { LifeMatrixData } from './types';
import { createDefaultData } from './data-utils';

export type TypeDesc = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'unknown';

function typeOf(value: any): TypeDesc {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean' || t === 'object') return t;
  return 'unknown';
}

export interface DiffReport {
  missingPaths: string[];
  extraPaths: string[];
  typeMismatches: Array<{ path: string; expected: TypeDesc; actual: TypeDesc }>;
}

export function buildExpectedShape(): any {
  // Use default data as the canonical shape
  const d: LifeMatrixData = createDefaultData();
  // Replace dynamic values with placeholders of correct type
  const clone = structuredClone(d);
  // For records (dynamic year/month structure), we only check it's an object
  clone.records = {} as any;
  return clone as any;
}

export function diffStructure(expected: any, actual: any, basePath: string = ''): DiffReport {
  const report: DiffReport = { missingPaths: [], extraPaths: [], typeMismatches: [] };

  const expType = typeOf(expected);
  const actType = typeOf(actual);
  if (expType !== actType) {
    report.typeMismatches.push({ path: basePath || '$', expected: expType, actual: actType });
    return report;
  }

  if (expType === 'object') {
    const expKeys = new Set(Object.keys(expected));
    const actKeys = new Set(Object.keys(actual || {}));

    // Missing keys
    for (const k of expKeys) {
      if (!actKeys.has(k)) {
        report.missingPaths.push(pathJoin(basePath, k));
      }
    }
    // Extra keys
    for (const k of actKeys) {
      if (!expKeys.has(k)) {
        report.extraPaths.push(pathJoin(basePath, k));
      }
    }
    // Recurse on common keys
    for (const k of expKeys) {
      if (actKeys.has(k)) {
        const sub = diffStructure(expected[k], actual[k], pathJoin(basePath, k));
        mergeReport(report, sub);
      }
    }
  } else if (expType === 'array') {
    // Only check that actual is also array; not diffing inner items deeply here
  } else {
    // primitive: ok if types match; handled above
  }

  return report;
}

export function validateLifeMatrixDataDetailed(actual: any) {
  const expected = buildExpectedShape();
  const report = diffStructure(expected, actual);
  const valid = report.missingPaths.length === 0 && report.typeMismatches.length === 0;
  return { valid, report };
}

export function renderReportText(report: DiffReport): string {
  const lines: string[] = [];
  if (report.missingPaths.length) {
    lines.push('Faltan claves:');
    for (const p of report.missingPaths) lines.push(`  - ${p}`);
  }
  if (report.typeMismatches.length) {
    lines.push('Tipos incorrectos:');
    for (const t of report.typeMismatches) lines.push(`  - ${t.path}: esperado ${t.expected}, actual ${t.actual}`);
  }
  if (report.extraPaths.length) {
    lines.push('Claves extra (no bloquean pero se ignoran):');
    for (const p of report.extraPaths) lines.push(`  - ${p}`);
  }
  if (lines.length === 0) return 'Sin diferencias.';
  return lines.join('\n');
}

function pathJoin(base: string, key: string) {
  return base ? `${base}.${key}` : key;
}

function mergeReport(a: DiffReport, b: DiffReport) {
  a.missingPaths.push(...b.missingPaths);
  a.extraPaths.push(...b.extraPaths);
  a.typeMismatches.push(...b.typeMismatches);
}
