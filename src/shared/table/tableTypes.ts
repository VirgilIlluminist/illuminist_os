/**
 * tableTypes.ts — SCALE-01 Extract
 * Semua types dan interfaces SmartTable dipisah ke file ini.
 * SmartTable.tsx mengimport dari sini, begitu juga komponen lain yang butuh types ini.
 */

export type ColumnType =
  | 'text' | 'longText' | 'number' | 'currency' | 'percentage'
  | 'date' | 'status' | 'select' | 'checkbox' | 'image' | 'url'
  | 'formula' | 'aiSummary' | 'aiForecast' | 'aiRecommendation'
  | 'relation' | 'badge' | 'rating' | 'color';

export interface ColumnDef {
  key:            string;
  label:          string;
  type?:          ColumnType;
  isEditable?:    boolean;
  align?:         'left' | 'center' | 'right';
  width?:         number;
  minWidth?:      number;
  frozen?:        boolean;
  hidden?:        boolean;
  selectOptions?: string[];
  formula?:       string;
  required?:      boolean;
  placeholder?:   string;
  prefix?:        string;
  suffix?:        string;
  relatedTable?:  string;
  relatedKey?:    string;
  aiPrompt?:      string;
  format?:        string;
  decimals?:      number;
  colorMap?:      Record<string, string>;
  maxLength?:     number;
}

export interface SmartTableProps {
  tableId:          string;
  title?:           string;
  subtitle?:        string;
  columns:          ColumnDef[];
  data?:            Record<string, unknown>[];
  frozenColumns?:   number;
  allowAddColumn?:  boolean;
  allowAddRow?:     boolean;
  allowImport?:     boolean;
  allowExport?:     boolean;
  allowFormulas?:   boolean;
  allowAuditLog?:   boolean;
  allowFilters?:    boolean;
  allowSearch?:     boolean;
  readOnly?:        boolean;
  compact?:         boolean;
  onDataChange?:    (data: Record<string, unknown>[]) => void;
  onRowClick?:      (row: Record<string, unknown>) => void;
  onColumnChange?:  (cols: ColumnDef[]) => void;
  maxRows?:         number;
  emptyMessage?:    string;
  headerActions?:   React.ReactNode;
  rowHeight?:       number;
  virtualScroll?:   boolean;
}

export interface AuditEntry {
  id:        string;
  timestamp: string;
  user:      string;
  action:    'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT';
  rowId?:    string;
  column?:   string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface SavedFilter {
  id:       string;
  name:     string;
  column:   string;
  operator: 'contains' | 'equals' | 'gt' | 'lt' | 'isEmpty' | 'isNotEmpty';
  value:    string;
}
