/**
 * tableUtils.ts — SCALE-01 Extract
 * Formula engine dan utility functions dari SmartTable.tsx
 */
import { ColumnDef } from './tableTypes';

// ─── Formula dependency extraction ────────────────────────────────────────────
export const extractFormulaDependencies = (expr: string): string[] => {
  const matches = expr.match(/\b[A-Z_][A-Z0-9_]*\b/g);
  return matches ? [...new Set(matches)] : [];
};

// ─── Circular reference detection ─────────────────────────────────────────────
export const detectCircularReferences = (
  columns:  ColumnDef[],
  startKey: string,
  visited:  Set<string> = new Set(),
  path:     string[]    = []
): boolean => {
  if (visited.has(startKey)) return path.includes(startKey);
  visited.add(startKey);
  path.push(startKey);
  const col = columns.find(c => c.key === startKey);
  if (!col?.formula) return false;
  const deps = extractFormulaDependencies(col.formula);
  for (const dep of deps) {
    if (detectCircularReferences(columns, dep, visited, [...path])) return true;
  }
  return false;
};

// ─── Formula syntax validator ──────────────────────────────────────────────────
export const validateFormulaSyntax = (expr: string): { isValid: boolean; error?: string } => {
  if (!expr.startsWith('=')) return { isValid: false, error: 'Formula harus diawali dengan =' };
  const formula = expr.slice(1).trim();
  try {
    // Quick safety check — tidak ada eval berbahaya
    const forbidden = /\b(eval|Function|window|document|process|require|import)\b/;
    if (forbidden.test(formula)) return { isValid: false, error: 'Formula mengandung ekspresi tidak aman' };
    // Cek parentheses balance
    let depth = 0;
    for (const ch of formula) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth < 0) return { isValid: false, error: 'Kurung tidak seimbang' };
    }
    if (depth !== 0) return { isValid: false, error: 'Kurung tidak tertutup' };
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Syntax formula tidak valid' };
  }
};

// ─── Safe formula evaluation ───────────────────────────────────────────────────
export const evaluateFormula = (
  formula:  string,
  rowData:  Record<string, unknown>,
  allRows?: Record<string, unknown>[]
): unknown => {
  if (!formula.startsWith('=')) return formula;
  const expr = formula.slice(1).trim();
  try {
    const context: Record<string, unknown> = { ...rowData };
    // Tambah fungsi agregasi jika ada allRows
    if (allRows) {
      context.SUM = (key: string) => allRows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
      context.AVG = (key: string) => {
        const vals = allRows.map(r => Number(r[key])).filter(v => !isNaN(v));
        return vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;
      };
      context.COUNT = () => allRows.length;
      context.MAX   = (key: string) => Math.max(...allRows.map(r => Number(r[key]) || 0));
      context.MIN   = (key: string) => Math.min(...allRows.map(r => Number(r[key]) || 0));
    }
    const fn = new Function(...Object.keys(context), `return ${expr}`);
    const result = fn(...Object.values(context));
    return result;
  } catch {
    return '#ERROR!';
  }
};

// ─── Column width auto-calc ────────────────────────────────────────────────────
export const autoColumnWidth = (type: string, label: string): number => {
  const base = label.length * 9 + 40;
  const typeExtra: Record<string, number> = {
    currency:   160,
    date:       130,
    status:     120,
    image:      80,
    url:        200,
    longText:   250,
    formula:    180,
    percentage: 110,
  };
  return Math.max(base, typeExtra[type] || 140);
};

// ─── Export to CSV ─────────────────────────────────────────────────────────────
export const exportToCSV = (
  data:     Record<string, unknown>[],
  columns:  ColumnDef[],
  filename: string
): void => {
  const visibleCols = columns.filter(c => !c.hidden);
  const header = visibleCols.map(c => `"${c.label}"`).join(',');
  const rows   = data.map(row =>
    visibleCols.map(c => {
      const val = row[c.key];
      if (val === null || val === undefined) return '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
