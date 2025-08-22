import { DiffReport } from '@/lib/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface JsonDiffDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly expected: any;
  readonly actual: any;
  readonly report: DiffReport | null;
}

export function JsonDiffDialog({ open, onOpenChange, expected, actual, report }: JsonDiffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Formato inválido al importar</DialogTitle>
          <DialogDescription>
            Compara lo esperado vs lo recibido. Corrige las diferencias y vuelve a intentar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Esperado (shape)</h3>
              <Badge variant="outline">Referencia</Badge>
            </div>
            <pre className="text-xs bg-muted/50 border rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap">
              {JSON.stringify(expected, null, 2)}
            </pre>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Recibido</h3>
              <Badge variant="destructive">Importado</Badge>
            </div>
            <pre className="text-xs bg-muted/50 border rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap">
              {JSON.stringify(actual, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Faltan claves</h4>
            <ul className="text-xs space-y-1 max-h-40 overflow-auto">
              {report?.missingPaths?.length ? (
                report.missingPaths.map((p) => <li key={p}>• {p}</li>)
              ) : (
                <li className="text-muted-foreground">—</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Tipos incorrectos</h4>
            <ul className="text-xs space-y-1 max-h-40 overflow-auto">
              {report?.typeMismatches?.length ? (
                report.typeMismatches.map((t, i) => (
                  <li key={`${t.path}-${i}`}>• {t.path}: esperado {t.expected}, actual {t.actual}</li>
                ))
              ) : (
                <li className="text-muted-foreground">—</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Claves extra</h4>
            <ul className="text-xs space-y-1 max-h-40 overflow-auto">
              {report?.extraPaths?.length ? (
                report.extraPaths.map((p) => <li key={p}>• {p}</li>)
              ) : (
                <li className="text-muted-foreground">—</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
