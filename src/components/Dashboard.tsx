import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScoreCircle } from '@/components/ScoreCircle';
import { FactorCard } from '@/components/FactorCard';
import { MiniLineChart } from '@/components/MiniLineChart';
import { LifeMatrixData } from '@/lib/types';
import { createDefaultData, getCurrentMonthKey, formatMonthKey, validateLifeMatrixData, getAvailableMonthsFromData, createSafeDataShape, normalizeIncomingData } from '@/lib/data-utils';
import { validateLifeMatrixDataDetailed, buildExpectedShape } from '@/lib/validation';
import { JsonDiffDialog } from '@/components/JsonDiffDialog';
import { ImportStrategyDialog } from '@/components/ImportStrategyDialog';
import { LifeMatrixCalculator } from '@/lib/calculator';
import { PersistenceService } from '@/services/PersistenceService';
import { 
  TrendingUp as TrendUp,
  TrendingDown as TrendDown,
  Calendar,
  Target,
  Plus,
  Download,
  Upload
} from 'lucide-react';
import { AnnualDialog } from '@/components/AnnualDialog';
import { ExportService } from '@/services/ExportService';
import { MonthlyRecordForm } from '@/components/MonthlyRecordForm';
import { FactorDetailsDialog } from '@/components/FactorDetailsDialog';
import { SettingsDialog } from '@/components/SettingsDialog';
 

export function Dashboard() {
  const [data, setData] = useLocalStorage<LifeMatrixData>('lifematrix-data', createDefaultData());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const current = getCurrentMonthKey();
    const avail = getAvailableMonthsFromData(createSafeDataShape(data));
    if (avail.includes(current)) return current;
    return avail[0] ?? current;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffActual, setDiffActual] = useState<any>(null);
  const [diffReport, setDiffReport] = useState<any>(null);
  const [importStrategyOpen, setImportStrategyOpen] = useState(false);
  const importBufferRef = useRef<any>(null);
  const [annualOpen, setAnnualOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const recordFactorRef = useRef<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Derive year/month from selection
  const selectedYear = useMemo(() => selectedMonth.split('-')[0], [selectedMonth]);
  const selectedMM = useMemo(() => selectedMonth.split('-')[1], [selectedMonth]);

  // Get current month data
  const currentMonthData = useMemo(() => {
    return data.records[selectedYear]?.[selectedMM];
  }, [data, selectedYear, selectedMM]);

  // Calculate global score for current month
  const globalScore = useMemo(() => {
    if (!currentMonthData?.factors) return 0;
    
    const factorScores: Record<string, number> = {};
  Object.entries(currentMonthData.factors).forEach(([key, factor]) => {
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
    const [y, m] = selectedMonth.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
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
  }, [data, selectedMonth]);

  // Get recommendations
  const recommendations = useMemo(() => {
    if (!currentMonthData?.factors) return [];
    
    const allRecommendations: string[] = [];
  Object.values(currentMonthData.factors).forEach((f) => {
      allRecommendations.push(...(f.recommendations || []));
    });
    
    return allRecommendations.slice(0, 3); // Top 3 recommendations
  }, [currentMonthData]);

  const handleEditFactor = (factorKey: string) => {
    recordFactorRef.current = factorKey;
    setRecordOpen(true);
  };

  const handleViewFactorDetails = (factorKey: string) => {
  recordFactorRef.current = factorKey;
  setDetailsOpen(true);
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

  const handleExportPDF = async () => {
    try {
      const blob = await ExportService.toPDFMonthlySummary(data, selectedMonth);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifematrix-${selectedMonth}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('No se pudo exportar a PDF');
    }
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
  importBufferRef.current = json;
  setImportStrategyOpen(true);
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
  <AnnualDialog open={annualOpen} onOpenChange={setAnnualOpen} data={data} year={selectedYear} />
        <MonthlyRecordForm
          open={recordOpen}
          onOpenChange={setRecordOpen}
          data={data}
          monthKey={selectedMonth}
          factorKey={recordFactorRef.current || data.preferences.visibleFactors[0]}
          onSave={(updated) => setData(updated)}
        />
        <FactorDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          data={data}
          factorKey={recordFactorRef.current || data.preferences.visibleFactors[0]}
          anchorMonth={selectedMonth}
          onSave={(updated) => setData(updated)}
        />
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          data={data}
          onSave={(updated) => setData(updated)}
        />
        <ImportStrategyDialog
          open={importStrategyOpen}
          onOpenChange={setImportStrategyOpen}
          onConfirm={(strategy) => {
            const json = importBufferRef.current;
            if (!json) return setImportStrategyOpen(false);
            const normalized = normalizeIncomingData(json);
            const merged = strategy === 'overwrite'
              ? normalized
              : PersistenceService.mergeData(createSafeDataShape(data), normalized, strategy);
            setData(merged);
            const avail = getAvailableMonthsFromData(createSafeDataShape(merged));
            if (avail.length) setSelectedMonth(avail[0]);
            setImportStrategyOpen(false);
            alert('Datos importados correctamente.');
          }}
        />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">LifeMatrix</h1>
            <div className="text-muted-foreground flex items-center gap-3">
              <span>Dashboard personal</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-44 h-8 text-sm">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {getAvailableMonthsFromData(createSafeDataShape(data)).map((mk) => (
                    <SelectItem key={mk} value={mk} className="text-sm">
                      {formatMonthKey(mk)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              PDF mes
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              <Upload className="w-4 h-4 mr-2" />
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
                  Object.values(currentMonthData.factors)
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
                  Object.values(currentMonthData.factors)
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
                  onExportCSV={() => {
                    const csv = ExportService.toCSVByFactorMonth(data, factorKey, selectedMonth);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `lifematrix-${factorKey}-${selectedMonth}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
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
          <Button variant="default" onClick={() => {
            recordFactorRef.current = data.preferences.visibleFactors[0];
            setRecordOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar mes actual
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              const res = await fetch('/seed.json');
              const json = await res.json();
              importBufferRef.current = json;
              setImportStrategyOpen(true);
            } catch {
              alert('No se pudo cargar el seed.json');
            }
          }}>
            Cargar demo
          </Button>
          <Button variant="outline" onClick={() => setAnnualOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Ver análisis anual
          </Button>
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Configuración
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