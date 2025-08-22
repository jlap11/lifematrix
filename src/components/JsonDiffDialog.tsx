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
  const missing = new Set(report?.missingPaths ?? []);
  const extra = new Set(report?.extraPaths ?? []);
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
            <div className="text-xs font-mono whitespace-pre bg-muted/50 border rounded p-3 overflow-auto max-h-64">
              <JsonView data={expected} mode="expected" missing={missing} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Recibido</h3>
              <Badge variant="destructive">Importado</Badge>
            </div>
            <div className="text-xs font-mono whitespace-pre bg-muted/50 border rounded p-3 overflow-auto max-h-64">
              <JsonView data={actual} mode="actual" extra={extra} />
            </div>
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

type JsonViewProps = {
  readonly data: any;
  readonly mode: 'expected' | 'actual';
  readonly missing?: Set<string>; // paths to mark in expected
  readonly extra?: Set<string>;   // paths to mark in actual
};

function JsonView({ data, mode, missing, extra }: JsonViewProps) {
  return (
    <div>
      {renderNode(data, '', 0, mode, missing ?? new Set(), extra ?? new Set())}
    </div>
  );
}

function renderNode(
  value: any,
  basePath: string,
  indent: number,
  mode: 'expected' | 'actual',
  missing: Set<string>,
  extra: Set<string>
) {
  const pad = (n: number) => '  '.repeat(n);
  const type = typeof value;
  if (value === null || type === 'string' || type === 'number' || type === 'boolean') {
    return <div>{pad(indent)}{JSON.stringify(value)}</div>;
  }
  if (Array.isArray(value)) {
    return (
      <div>
        <div>{pad(indent)}[</div>
        {value.map((v) => (
          <div key={`${basePath}:${valueKey(v)}`}>
            {renderNode(v, `${basePath}[]`, indent + 1, mode, missing, extra)}
          </div>
        ))}
        <div>{pad(indent)}]</div>
      </div>
    );
  }
  if (type === 'object') {
    const keys = Object.keys(value || {});
    return (
      <div>
        <div>
          {pad(indent)}{'{'}
        </div>
        {keys.map((k) => {
          const path = basePath ? `${basePath}.${k}` : k;
          const isMissing = mode === 'expected' && missing.has(path);
          const isExtra = mode === 'actual' && extra.has(path);
          let marker = null as any;
          if (isMissing) {
            marker = <span className="text-red-500 mr-1">−</span>;
          } else if (isExtra) {
            marker = <span className="text-red-500 mr-1">+</span>;
          }
          return (
            <div key={k} className={isMissing || isExtra ? 'text-red-500' : undefined}>
              {pad(indent + 1)}{marker}<span className="text-sky-700 dark:text-sky-300">"{k}"</span>: {renderInline(value[k], path, indent + 1, mode, missing, extra)}
            </div>
          );
        })}
        <div>
          {pad(indent)}{'}'}
        </div>
      </div>
    );
  }
  return <div>{pad(indent)}{String(value)}</div>;
}

function renderInline(
  v: any,
  path: string,
  indent: number,
  mode: 'expected' | 'actual',
  missing: Set<string>,
  extra: Set<string>
) {
  const isPrimitive = v === null || ['string', 'number', 'boolean'].includes(typeof v);
  if (isPrimitive) return <>{JSON.stringify(v)}</>;
  if (Array.isArray(v)) {
    return (
      <>
        [
        <div>{renderNode(v, `${path}`, indent + 1, mode, missing, extra)}</div>
        {']'}
      </>
    );
  }
  // object inline
  return (
    <>
      {'{'}
      <div>{renderNode(v, path, indent + 1, mode, missing, extra)}</div>
      {'}'}
    </>
  );
}

function valueKey(v: any): string {
  try {
    const s = JSON.stringify(v);
    return `${typeof v}:${s?.slice(0, 64)}`;
  } catch {
    return typeof v;
  }
}
