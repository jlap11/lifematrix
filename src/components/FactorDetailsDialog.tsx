import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemo, useState } from 'react';
import type { LifeMatrixData, Objective, Habit, FactorRecord } from '@/lib/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Plus, Trash2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: LifeMatrixData;
  factorKey: string;
  anchorMonth: string; // YYYY-MM to center last 12 months
  onSave: (updated: LifeMatrixData) => void;
};

export function FactorDetailsDialog({ open, onOpenChange, data, factorKey, anchorMonth, onSave }: Readonly<Props>) {
  const factorLabel = data.factorsCatalog[factorKey]?.label || factorKey;
  const last12 = useMemo(() => getLastNMonths(anchorMonth, 12), [anchorMonth]);
  const series = useMemo(() => last12.map((mk) => {
    const [y, m] = mk.split('-');
    const rec = data.records[y]?.[m]?.factors?.[factorKey];
    return { month: mk.slice(2), score: rec?.score ?? 0 };
  }), [last12, data, factorKey]);
  const radarData = useMemo(() => {
    const fr = getFactorRecord(data, factorKey, anchorMonth);
    const subs = data.factorsCatalog[factorKey]?.submetrics || [];
    const vals = (fr?.metrics?.subscores as any) || {};
    return subs.map((s: string) => ({ name: s, value: Number(vals[s] ?? 0) }));
  }, [data, factorKey, anchorMonth]);

  // Forms state
  const [noteText, setNoteText] = useState('');
  const [noteQuery, setNoteQuery] = useState('');
  const [objTitle, setObjTitle] = useState('');
  const [objDue, setObjDue] = useState('');
  const [habitName, setHabitName] = useState('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [heatHabitId, setHeatHabitId] = useState<string | null>(null);

  const frNow = getFactorRecord(data, factorKey, anchorMonth);
  const notes = (frNow?.notes ?? []).filter(n => n.toLowerCase().includes(noteQuery.toLowerCase()));
  const objectives = frNow?.objectives ?? [];
  const habits = frNow?.habits ?? [];
  

  function commit(mut: (draft: LifeMatrixData) => void) {
    const copy: LifeMatrixData = JSON.parse(JSON.stringify(data));
    mut(copy);
    onSave(copy);
  }

  function addNote() {
    if (!noteText.trim()) return;
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, anchorMonth);
      r.notes = [...(r.notes || []), noteText.trim()];
    });
    setNoteText('');
  }

  function addObjective() {
    if (!objTitle.trim()) return;
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, anchorMonth);
      const obj: Objective = { id: `obj_${Date.now()}`, title: objTitle.trim(), status: 'not_started', progressPct: 0, due: objDue || '' };
      r.objectives = [...(r.objectives || []), obj];
    });
    setObjTitle(''); setObjDue('');
  }

  function updateObjective(id: string, patch: Partial<Objective>) {
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, anchorMonth);
      r.objectives = (r.objectives || []).map(o => o.id === id ? { ...o, ...patch } : o);
    });
  }

  function removeObjective(id: string) {
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, anchorMonth);
      r.objectives = (r.objectives || []).filter(o => o.id !== id);
    });
  }

  function addHabit() {
    if (!habitName.trim()) return;
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, anchorMonth);
      const hb: Habit = { id: `hb_${Date.now()}`, name: habitName.trim(), frequency: habitFreq, streak: 0, adherencePct: 0, log: {} };
      r.habits = [...(r.habits || []), hb];
    });
    setHabitName(''); setHabitFreq('daily');
  }

  function toggleHabitDay(habitId: string, day: number) {
    const mk = anchorMonth;
    const date = `${mk}-${String(day).padStart(2, '0')}`;
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, mk);
      const hb = (r.habits || []).find(h => h.id === habitId);
      if (!hb) return;
      hb.log = hb.log || {};
      hb.log[date] = !hb.log[date];
      recomputeHabitStats(hb, mk);
    });
  }

  function removeHabit(id: string) {
    commit((c) => {
      const r = ensureFactorRecord(c, factorKey, anchorMonth);
      r.habits = (r.habits || []).filter(h => h.id !== id);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{factorLabel} - Detalle</DialogTitle>
        </DialogHeader>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="h-64 bg-muted/40 rounded p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64 bg-muted/40 rounded p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar dataKey="value" stroke="#34d399" fill="#34d399" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes */}
          <div>
            <h4 className="font-medium mb-2">Notas</h4>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Buscar (#tag)" value={noteQuery} onChange={(e) => setNoteQuery(e.target.value)} />
            </div>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Agregar nota (usa #tags)" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button onClick={addNote}><Plus className="w-4 h-4" /></Button>
            </div>
            <ul className="space-y-2 text-sm max-h-48 overflow-auto">
              {notes.map((n) => <li key={`${n}-${hash(n)}`} className="bg-muted/40 rounded p-2">{n}</li>)}
            </ul>
          </div>

          {/* Objectives */}
          <div>
            <h4 className="font-medium mb-2">Objetivos</h4>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Título" value={objTitle} onChange={(e) => setObjTitle(e.target.value)} />
              <Input type="date" value={objDue} onChange={(e) => setObjDue(e.target.value)} />
              <Button onClick={addObjective}><Plus className="w-4 h-4" /></Button>
            </div>
            <ul className="space-y-2 text-sm max-h-48 overflow-auto">
              {objectives.map(o => (
                <li key={o.id} className="bg-muted/40 rounded p-2">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="font-medium truncate">{o.title}</span>
                    <div className="flex items-center gap-2">
                      <Select value={o.status} onValueChange={(v) => updateObjective(o.id, { status: v as any })}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">No iniciado</SelectItem>
                          <SelectItem value="in_progress">En progreso</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="blocked">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input type="number" className="h-8 w-20" value={o.progressPct} onChange={(e) => updateObjective(o.id, { progressPct: Number(e.target.value) })} />
                      <Button variant="ghost" onClick={() => removeObjective(o.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {o.due && <div className="text-xs text-muted-foreground">Vence: {o.due}</div>}
                </li>
              ))}
            </ul>
          </div>

          {/* Habits */}
          <div>
            <h4 className="font-medium mb-2">Hábitos</h4>
            <div className="flex gap-2 mb-2">
              <Input placeholder="Nombre" value={habitName} onChange={(e) => setHabitName(e.target.value)} />
              <Select value={habitFreq} onValueChange={(v) => setHabitFreq(v as any)}>
                <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Frecuencia" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addHabit}><Plus className="w-4 h-4" /></Button>
            </div>
            <ul className="space-y-2 text-sm max-h-48 overflow-auto">
              {habits.map(h => (
                <li key={h.id} className="bg-muted/40 rounded p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-muted-foreground">Racha: {h.streak} · Adherencia: {h.adherencePct}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant={heatHabitId === h.id ? 'default' : 'secondary'} onClick={() => setHeatHabitId(heatHabitId === h.id ? null : h.id)}>Heatmap</Button>
                      <Button variant="ghost" onClick={() => removeHabit(h.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {heatHabitId === h.id && <MonthHeatmap monthKey={anchorMonth} log={h.log || {}} onToggle={(day) => toggleHabitDay(h.id, day)} />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getLastNMonths(anchor: string, n: number): string[] {
  const [y, m] = anchor.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(d);
    dt.setMonth(dt.getMonth() - i);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    arr.push(`${yy}-${mm}`);
  }
  return arr;
}

function ensureFactorRecord(data: LifeMatrixData, factorKey: string, monthKey: string): FactorRecord {
  const [y, m] = monthKey.split('-');
  (data.records as any)[y] = data.records[y] || {};
  (data.records[y] as any)[m] = data.records[y][m] || { factors: {}, global: { score: 0, trend: 'stable', variancePct: 0 } };
  (data.records[y][m].factors as any)[factorKey] = data.records[y][m].factors[factorKey] || {
    score: 0, trend: 'stable', variancePct: 0, summary: '', notes: [], objectives: [], habits: [], actions: [], blockers: [], recommendations: [], metrics: {}
  };
  return data.records[y][m].factors[factorKey];
}

function getFactorRecord(data: LifeMatrixData, factorKey: string, monthKey: string): FactorRecord | undefined {
  const [y, m] = monthKey.split('-');
  return data.records[y]?.[m]?.factors?.[factorKey];
}

function recomputeHabitStats(h: Habit, monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const bools: boolean[] = [];
  for (let d = 1; d <= days; d++) {
    const date = `${monthKey}-${String(d).padStart(2, '0')}`;
    bools.push(Boolean(h.log?.[date]));
  }
  const completed = bools.filter(Boolean).length;
  h.adherencePct = Math.round((completed / Math.max(1, bools.length)) * 100);
  // streak: cuenta hacia atrás
  let streak = 0;
  for (let i = bools.length - 1; i >= 0; i--) {
    if (bools[i]) streak++; else break;
  }
  h.streak = streak;
}

function MonthHeatmap({ monthKey, log, onToggle }: { monthKey: string; log: Record<string, boolean>; onToggle: (day: number) => void }) {
  const [y, m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const cells: any[] = [];
  for (let d = 1; d <= days; d++) {
    const date = `${monthKey}-${String(d).padStart(2, '0')}`;
    const done = Boolean(log?.[date]);
    cells.push(
      <button key={d} className={`w-6 h-6 rounded-sm ${done ? 'bg-green-500' : 'bg-muted'} hover:opacity-80`} title={`${date} ${done ? '✓' : ''}`} onClick={() => onToggle(d)} />
    );
  }
  return <div className="mt-2 grid grid-cols-7 gap-1">{cells}</div>;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}
