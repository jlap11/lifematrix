import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { LifeMatrixData } from '@/lib/types';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: LifeMatrixData;
  monthKey: string; // YYYY-MM
  factorKey: string;
  onSave: (updated: LifeMatrixData) => void;
};

export function MonthlyRecordForm({ open, onOpenChange, data, monthKey, factorKey, onSave }: Readonly<Props>) {
  const [score, setScore] = useState<number>(() => {
    const [y, m] = monthKey.split('-');
    return data.records[y]?.[m]?.factors?.[factorKey]?.score ?? 0;
  });
  const [notes, setNotes] = useState<string>('');

  const handleSave = () => {
    const [y, m] = monthKey.split('-');
    const copy: LifeMatrixData = JSON.parse(JSON.stringify(data));
    if (!copy.records[y]) (copy.records as any)[y] = {} as any;
    if (!copy.records[y][m]) (copy.records[y] as any)[m] = { factors: {}, global: { score: 0, trend: 'stable', variancePct: 0 } } as any;
    const factor = copy.records[y][m].factors[factorKey] || {
      score: 0, trend: 'stable', variancePct: 0, summary: '', notes: [], objectives: [], habits: [], actions: [], blockers: [], recommendations: [], metrics: {}
    };
    factor.score = Math.max(0, Math.min(100, Number(score) || 0));
    if (notes.trim()) factor.notes = [...(factor.notes || []), notes.trim()];
    copy.records[y][m].factors[factorKey] = factor;
    onSave(copy);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar mes - {factorKey} ({monthKey})</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs" htmlFor="score-input">Score (0-100)</label>
            <Input id="score-input" type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} min={0} max={100} />
          </div>
          <div>
            <label className="text-xs" htmlFor="notes-input">Nota</label>
            <Textarea id="notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
