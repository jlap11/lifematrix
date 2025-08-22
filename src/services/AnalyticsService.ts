import { AnnualSummary, LifeMatrixData, TrendType } from '@/lib/types';
import { LifeMatrixCalculator } from '@/lib/calculator';

export const AnalyticsService = {
  buildAnnualSummary(data: LifeMatrixData, year: string): AnnualSummary {
    const months = Object.keys(data.records[year] || {});
    const factorTotals: Record<string, number[]> = {};
    const globalScores: number[] = [];
    for (const mm of months) {
      const rec = data.records[year][mm];
      globalScores.push(rec.global?.score ?? 0);
      for (const [fk, fr] of Object.entries(rec.factors)) {
        if (!factorTotals[fk]) factorTotals[fk] = [];
        factorTotals[fk].push(fr.score);
      }
    }
    const factors: AnnualSummary['factors'] = {};
    for (const [fk, arr] of Object.entries(factorTotals)) {
      const avg = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
      const trend = this.seriesTrend(arr) as TrendType;
      factors[fk] = { average: avg, trend };
    }
    const globalAvg = globalScores.length ? Math.round((globalScores.reduce((a,b)=>a+b,0)/globalScores.length)*10)/10 : 0;
    const globalTrend = this.seriesTrend(globalScores);
    const highlights = Object.entries(factors).sort((a,b)=>b[1].average - a[1].average).slice(0,2).map(([fk]) => `Fuerte desempeño en ${fk}`);
    const lowlights = Object.entries(factors).sort((a,b)=>a[1].average - b[1].average).slice(0,2).map(([fk]) => `Área a mejorar: ${fk}`);
    const insights = this.generateInsightsFromSeries(factors);
    return { factors, global: { average: globalAvg, trend: globalTrend }, highlights, lowlights, insights };
  },

  seriesTrend(values: number[], threshold = 1): TrendType {
    if (values.length < 2) return 'stable';
    const prev = values[values.length - 2] ?? 0;
    const curr = values[values.length - 1] ?? 0;
    return LifeMatrixCalculator.calculateTrend(curr, prev, threshold);
  },

  generateInsightsFromSeries(factors: Record<string, { average: number; trend: string }>): string[] {
    const downs = Object.entries(factors).filter(([, v]) => v.trend === 'down');
    const insights: string[] = [];
    if (downs.length >= 2) insights.push('Múltiples factores en descenso requieren atención');
    return insights;
  }
};
