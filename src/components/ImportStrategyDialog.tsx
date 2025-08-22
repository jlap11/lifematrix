import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (strategy: 'overwrite' | 'merge-keep-existing') => void;
};

export function ImportStrategyDialog({ open, onOpenChange, onConfirm }: Readonly<Props>) {
  const [value, setValue] = useState<'overwrite' | 'merge-keep-existing'>('merge-keep-existing');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cómo quieres importar?</DialogTitle>
          <DialogDescription>Elige si deseas sobrescribir todo o fusionar conservando lo existente.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={value} onValueChange={(v) => setValue(v as any)} className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="merge" value="merge-keep-existing" />
            <Label htmlFor="merge">Fusionar (mantener existente)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="overwrite" value="overwrite" />
            <Label htmlFor="overwrite">Sobrescribir todo</Label>
          </div>
        </RadioGroup>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onConfirm(value)}>Continuar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
