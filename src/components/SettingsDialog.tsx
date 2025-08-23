import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useMemo, useState } from 'react';
import type { LifeMatrixData } from '@/lib/types';
import { isApiMode } from '@/lib/config';
import { DataSource } from '@/lib/data-source';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: LifeMatrixData;
  onSave: (updated: LifeMatrixData) => void;
};

export function SettingsDialog({ open, onOpenChange, data, onSave }: Readonly<Props>) {
  const keys = useMemo(() => Object.keys(data.factorsCatalog), [data.factorsCatalog]);
  const [weights, setWeights] = useState<Record<string, number>>(() => ({ ...data.preferences.factorWeights }));
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const k of keys) map[k] = data.preferences.visibleFactors.includes(k);
    return map;
  });

  function commit() {
    const copy: LifeMatrixData = JSON.parse(JSON.stringify(data));
    copy.preferences.factorWeights = { ...copy.preferences.factorWeights, ...weights };
    copy.preferences.visibleFactors = keys.filter(k => visible[k]);
    onSave(copy);
    if (isApiMode()) {
      // Guardar preferencias en backend si está disponible
      void DataSource.saveAll(copy);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Factores</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {keys.map((k) => {
                const def = data.factorsCatalog[k];
                return (
                  <div key={k} className="flex items-center justify-between gap-3 rounded border p-2">
                    <label className="flex items-center gap-2">
                      <Checkbox checked={!!visible[k]} onCheckedChange={(v) => setVisible(prev => ({ ...prev, [k]: Boolean(v) }))} />
                      <span className="text-sm">{def?.label || k}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Peso</span>
                      <Input
                        className="h-8 w-20"
                        type="number"
                        step="0.1"
                        value={weights[k] ?? def?.defaultWeight ?? 1}
                        onChange={(e) => setWeights(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={commit}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
