import { TrendType } from './types';

export class LifeMatrixCalculator {
  static calculateGlobalScore(
    factorScores: Record<string, number>,
    weights: Record<string, number>
  ): number {
    const totalWeightedScore = Object.entries(factorScores).reduce(
      (sum, [factor, score]) => sum + (score * (weights[factor] || 1)),
      0
    );
    const totalWeights = Object.entries(factorScores).reduce(
      (sum, [factor]) => sum + (weights[factor] || 1),
      0
    );
    
    return Math.round((totalWeightedScore / Math.max(1, totalWeights)) * 10) / 10;
  }

  static calculateTrend(current: number, previous: number, threshold: number = 1): TrendType {
    if (current > previous + threshold) return 'up';
    if (current < previous - threshold) return 'down';
    return 'stable';
  }

  static calculateVariancePct(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  static generateRecommendations(
    factorScore: number,
    factorKey: string,
    metrics?: Record<string, any>
  ): string[] {
    const recommendations: string[] = [];

    // General low score recommendations
    if (factorScore < 40) {
      recommendations.push(`Priorizar mejoras en área ${factorKey}`);
    }

    // Factor-specific recommendations
    switch (factorKey) {
      case 'emotional':
        if (factorScore < 50) {
          recommendations.push('Practicar respiración 5 minutos diarios');
          recommendations.push('Programar sesión de reflexión semanal');
        }
        if (metrics?.subscores?.stress > 70) {
          recommendations.push('Considerar técnicas de reducción de estrés');
        }
        break;

      case 'financial':
        if (factorScore < 50) {
          recommendations.push('Revisar presupuesto y gastos discrecionales');
          recommendations.push('Establecer % fijo de ahorro mensual');
        }
        break;

      case 'professional':
        if (factorScore < 50) {
          recommendations.push('Definir objetivos profesionales claros');
          recommendations.push('Dedicar tiempo semanal a desarrollo de habilidades');
        }
        break;

      case 'mental':
        if (factorScore < 50) {
          recommendations.push('Implementar rutina matutina estructurada');
          recommendations.push('Practicar técnica Pomodoro para foco');
        }
        break;

      case 'social':
        if (factorScore < 50) {
          recommendations.push('Programar interacciones sociales regulares');
          recommendations.push('Buscar comunidades con intereses afines');
        }
        break;

      case 'spiritual':
        if (factorScore < 50) {
          recommendations.push('Dedicar tiempo diario a prácticas espirituales');
          recommendations.push('Reflexionar sobre propósito y valores');
        }
        break;

      case 'personal':
        if (factorScore < 50) {
          recommendations.push('Establecer rutina de ejercicio regular');
          recommendations.push('Mejorar hábitos de sueño y nutrición');
        }
        break;
    }

    return recommendations;
  }

  static generateInsights(data: Record<string, any>): string[] {
    const insights: string[] = [];
    
    // Analyze trends across factors
    const factors = Object.keys(data);
    const downwardTrends = factors.filter(f => 
      data[f]?.trend === 'down' && data[f]?.score < 50
    );
    
    if (downwardTrends.length >= 2) {
      insights.push(`Tendencia descendente en ${downwardTrends.length} áreas requiere atención`);
    }

    // Identify correlations
    if (data.emotional?.score < 40 && data.mental?.score < 40) {
      insights.push('Considerar enfoque integral bienestar emocional-mental');
    }

    if (data.financial?.score < 40 && data.emotional?.score < 50) {
      insights.push('Estrés financiero puede estar afectando bienestar emocional');
    }

    return insights;
  }

  static calculateStreaks(habitLog: boolean[], frequency: 'daily' | 'weekly' | 'monthly'): number {
    if (habitLog.length === 0) return 0;
    
    let currentStreak = 0;
    for (let i = habitLog.length - 1; i >= 0; i--) {
      if (habitLog[i]) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return currentStreak;
  }

  static calculateAdherence(habitLog: boolean[]): number {
    if (habitLog.length === 0) return 0;
    const completedDays = habitLog.filter(day => day).length;
    return Math.round((completedDays / habitLog.length) * 100);
  }
}