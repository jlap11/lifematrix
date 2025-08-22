import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMemo } from 'react';
import { AnalyticsService } from '@/services/AnalyticsService';
import { LifeMatrixData } from '@/lib/types';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: LifeMatrixData;
  year: string;
};

export function AnnualDialog({ open, onOpenChange, data, year }: Readonly<Props>) {
  const summary = useMemo(() => AnalyticsService.buildAnnualSummary(data, year), [data, year]);
  const radarData = useMemo(() => Object.entries(summary.factors).map(([k, v]) => ({ factor: k, avg: v.average })), [summary]);
  const monthsBar = useMemo(() => {
    const m = Object.keys(data.records[year] || {}).sort((a,b)=>Number(a)-Number(b));
    return m.map(mm => ({ month: mm, score: data.records[year][mm]?.global?.score ?? 0 }));
  }, [data, year]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Resumen anual {year}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-muted/40 rounded-md p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar dataKey="avg" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64 bg-muted/40 rounded-md p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsBar}>
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>
            <h4 className="font-medium mb-2">Highlights</h4>
            <ul className="list-disc pl-5 space-y-1">
              {summary.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Lowlights</h4>
            <ul className="list-disc pl-5 space-y-1">
              {summary.lowlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Insights</h4>
            <ul className="list-disc pl-5 space-y-1">
              {summary.insights.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
