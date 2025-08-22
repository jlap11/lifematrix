import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreCircle } from '@/components/ScoreCircle';
import { FactorCard } from '@/components/FactorCard';
import { MiniLineChart } from '@/components/MiniLineChart';
import { LifeMatrixData, FactorRecord } from '@/lib/types';
import { createDefaultData, getCurrentMonthKey, getCurrentYearKey, formatMonthKey, validateLifeMatrixData } from '@/lib/data-utils';
import { validateLifeMatrixDataDetailed, buildExpectedShape } from '@/lib/validation';
import { JsonDiffDialog } from '@/components/JsonDiffDialog';
import { LifeMatrixCalculator } from '@/lib/calculator';
import { 
  TrendUp, 
  TrendDown, 
  Calendar, 
  Target,
  Plus,
  DownloadSimple,
  UploadSimple
} from '@phosphor-icons/react';
 

export function Dashboard() {
  const [data, setData] = useLocalStorage<LifeMatrixData>('lifematrix-data', createDefaultData());
  const selectedMonth = getCurrentMonthKey();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffActual, setDiffActual] = useState<any>(null);
  const [diffReport, setDiffReport] = useState<any>(null);
  
  const currentYear = getCurrentYearKey();
  const currentMonth = getCurrentMonthKey();
  
  // Get current month data
  const currentMonthData = useMemo(() => {
    return data.records[currentYear]?.[selectedMonth.split('-')[1]];
  }, [data, currentYear, selectedMonth]);

  // Calculate global score for current month
  const globalScore = useMemo(() => {
    if (!currentMonthData?.factors) return 0;
    
    const factorScores: Record<string, number> = {};
    const factors = currentMonthData.factors as Record<string, FactorRecord>;
    Object.entries(factors).forEach(([key, factor]) => {
      factorScores[key] = factor.score;
    });
    
    return LifeMatrixCalculator.calculateGlobalScore(
      factorScores,
      data.preferences.factorWeights
    );
  }, [currentMonthData, data.preferences.factorWeights]);

  // Get mini chart data for last 6 months
  const miniChartData = useMemo(() => {
    const months: Record<string, Array<{ month: string; value: number }>> = {};
    
    data.preferences.visibleFactors.forEach(factor => {
      months[factor] = [];
    });

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = String(date.getMonth() + 1).padStart(2, '0');
      const yearKey = date.getFullYear().toString();
      const displayMonth = date.toLocaleDateString('es-ES', { month: 'short' });
      
      const monthData = data.records[yearKey]?.[monthKey];
      
      data.preferences.visibleFactors.forEach(factor => {
        const score = monthData?.factors[factor]?.score || 0;
        months[factor].push({
          month: displayMonth,
          value: score
        });
      });
    }
    
  return months;
  }, [data]);

  // Get recommendations
  const recommendations = useMemo(() => {
    if (!currentMonthData?.factors) return [];
    
    const allRecommendations: string[] = [];
    const factors = currentMonthData.factors as Record<string, FactorRecord>;
    Object.values(factors).forEach((f) => {
      allRecommendations.push(...(f.recommendations || []));
    });
    
    return allRecommendations.slice(0, 3); // Top 3 recommendations
  }, [currentMonthData]);

  const handleEditFactor = (factorKey: string) => {
    console.log('Edit factor:', factorKey);
  };

  const handleViewFactorDetails = (factorKey: string) => {
    console.log('View factor details:', factorKey);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifematrix-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo supera 2MB. Reduce el tamaño del JSON.');
        return;
      }
      const text = await file.text();
      const json = JSON.parse(text);
      if (!validateLifeMatrixData(json)) {
        const { report } = validateLifeMatrixDataDetailed(json);
        setDiffActual(json);
        setDiffReport(report);
        setDiffOpen(true);
        return;
      }
      setData(json);
  alert('Datos importados correctamente.');
    } catch (err) {
      console.error(err);
      alert('No se pudo importar el archivo. Verifica que sea JSON válido.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="application/json" 
          className="hidden" 
          onChange={handleFileChange}
        />
        <JsonDiffDialog 
          open={diffOpen}
          onOpenChange={setDiffOpen}
          expected={buildExpectedShape()}
          actual={diffActual}
          report={diffReport}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">LifeMatrix</h1>
            <p className="text-muted-foreground">
              Dashboard personal - {formatMonthKey(currentMonth)}
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <DownloadSimple className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              <UploadSimple className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
        </motion.div>

        {/* Global KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="col-span-1 md:col-span-2 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Score Global</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tabular-nums mb-1">
                  {globalScore.toFixed(1)}
                </div>
                <div className="flex items-center gap-2">
                  {currentMonthData?.global?.trend === 'up' && (
                    <Badge variant="default">
                      <TrendUp className="w-3 h-3 mr-1" />
                      En alza
                    </Badge>
                  )}
                  {currentMonthData?.global?.trend === 'down' && (
                    <Badge variant="destructive">
                      <TrendDown className="w-3 h-3 mr-1" />
                      Descendente
                    </Badge>
                  )}
                  {currentMonthData?.global?.variancePct !== undefined && (
                    <span className="text-sm text-muted-foreground">
                      {currentMonthData.global.variancePct > 0 ? '+' : ''}
                      {currentMonthData.global.variancePct}%
                    </span>
                  )}
                </div>
              </div>
              <ScoreCircle score={globalScore} trend={currentMonthData?.global?.trend} />
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                Objetivos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMonthData ?
                  (Object.values(currentMonthData.factors) as FactorRecord[])
                    .flatMap(f => f.objectives)
                    .filter(obj => obj.status === 'in_progress').length 
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">En progreso</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Hábitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentMonthData ?
                  (Object.values(currentMonthData.factors) as FactorRecord[])
                    .flatMap(f => f.habits).length 
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">Registrados</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-accent/10 border-accent/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendUp className="w-5 h-5" />
                  Recomendaciones del mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((rec) => (
                    <li key={rec} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Factors Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {data.preferences.visibleFactors.map((factorKey, index) => {
            const factorDefinition = data.factorsCatalog[factorKey];
            const factorData = currentMonthData?.factors[factorKey];
            
            return (
              <motion.div
                key={factorKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <FactorCard
                  factorKey={factorKey}
                  factorLabel={factorDefinition?.label || factorKey}
                  data={factorData}
                  onEdit={() => handleEditFactor(factorKey)}
                  onViewDetails={() => handleViewFactorDetails(factorKey)}
                />
                
                {/* Mini line chart for each factor */}
                <div className="mt-3 px-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    Últimos 6 meses
                  </div>
                  <MiniLineChart
                    data={miniChartData[factorKey]}
                    color="#8b5cf6"
                    height={50}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap gap-3"
        >
          <Button variant="default">
            <Plus className="w-4 h-4 mr-2" />
            Registrar mes actual
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Ver análisis anual
          </Button>
          <Button variant="outline">
            <Target className="w-4 h-4 mr-2" />
            Gestionar objetivos
          </Button>
        </motion.div>
      </div>
    </div>
  );
}