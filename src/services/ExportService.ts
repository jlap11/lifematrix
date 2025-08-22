import { LifeMatrixData } from '@/lib/types';

export const ExportService = {
  toCSVByFactorMonth(data: LifeMatrixData, factorKey: string, monthKey: string): string {
    const [y, m] = monthKey.split('-');
    const rec = data.records[y]?.[m];
    if (!rec) return '';
    const f = rec.factors[factorKey];
    const rows: Array<Record<string, string | number>> = [];
    rows.push({ field: 'score', value: f?.score ?? '' });
    rows.push({ field: 'trend', value: f?.trend ?? '' });
    rows.push({ field: 'variancePct', value: f?.variancePct ?? '' });
    rows.push({ field: 'notes', value: (f?.notes || []).join(' | ') });
    const csv = ['field,value', ...rows.map(r => {
      const raw = String(r.value);
      const safe = raw.split('"').join('""');
      return `${r.field},"${safe}"`;
    })].join('\n');
    return csv;
  },

  async toPDFMonthlySummary(data: LifeMatrixData, monthKey: string) {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    const [y, m] = monthKey.split('-');
    const rec = data.records[y]?.[m];
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(`LifeMatrix — Resumen mensual ${monthKey}`, 40, 40);

    // Global section
    const globalYStart = 70;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const globalScore = rec?.global?.score ?? '';
    const trend = rec?.global?.trend ?? '';
    const variance = rec?.global?.variancePct ?? '';
    doc.text(`Global: score=${globalScore} · tendencia=${trend} · variación=${variance}%`, 40, globalYStart);

    // Factors table
    const rows: Array<(string | number)[]> = [];
    if (rec?.factors) {
      const visible = data.preferences.visibleFactors.length
        ? data.preferences.visibleFactors
        : Object.keys(rec.factors);
      for (const k of visible) {
        const f = rec.factors[k];
        if (!f) continue;
        const label = data.factorsCatalog[k]?.label || k;
        rows.push([
          label,
          f.score ?? '',
          f.trend ?? '',
          f.variancePct ?? '',
          (f.notes || []).join(' | '),
        ]);
      }
    }

  (autoTable as any)(doc, {
      startY: globalYStart + 20,
      head: [[
        'Factor',
        'Score',
        'Tendencia',
        'Variación %',
        'Notas'
      ]],
      body: rows,
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [139, 92, 246] },
      columnStyles: {
        0: { cellWidth: 150 },
        4: { cellWidth: 240 },
      },
      theme: 'striped',
    });

    // Recommendations
  const endY = (doc as any).lastAutoTable?.finalY ?? globalYStart + 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendaciones', 40, endY + 30);
    doc.setFont('helvetica', 'normal');
    let yPos = endY + 50;
    const recs: string[] = [];
    if (rec?.factors) {
      for (const f of Object.values(rec.factors)) {
        if (f?.recommendations?.length) recs.push(...f.recommendations);
      }
    }
    const unique = Array.from(new Set(recs)).slice(0, 8);
    unique.forEach((r) => {
      doc.circle(35, yPos - 3, 2, 'F');
      doc.text(r, 45, yPos);
      yPos += 18;
    });

    return doc.output('blob');
  }
};
