import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// react-window dihapus
// xlsx removed - using CSV export/import
import Papa from 'papaparse';
import { 
  Type, 
  AlignLeft, 
  Calendar, 
  Hash, 
  CheckSquare, 
  Star, 
  Tag, 
  AlertCircle, 
  Link as LinkIcon, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  FileText, 
  Calculator, 
  Share2, 
  Brain, 
  TrendingUp, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Copy, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Search, 
  SlidersHorizontal,
  Lock,
  Unlock,
  EyeOff,
  Minimize2,
  Maximize2,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  HelpCircle,
  Eye,
  Settings,
  X,
  XCircle,
  FolderSync
} from 'lucide-react';
import { useERP } from '../../app/store/ERPContext';
import { toast } from '../../shared/ui/Toast';

export type ColumnType =
  | 'text' | 'longText' | 'number' | 'currency' | 'percentage'
  | 'date' | 'time' | 'datetime' | 'checkbox' | 'rating'
  | 'tags' | 'status' | 'priority' | 'url' | 'email'
  | 'phone' | 'image' | 'file' | 'formula' | 'relation'
  | 'aiSummary' | 'aiForecast' | 'aiRecommendation';

export interface ColumnDef {
  key: string;
  label: string;
  type?: ColumnType;
  isEditable?: boolean;
  isComputed?: boolean;
  selectOptions?: string[];
  align?: 'left' | 'right' | 'center';
  width?: number;
  visible?: boolean;
  formulaExpr?: string;
  relationTableId?: string; // target relation table
}

export interface SmartTableProps {
  tableId: string;
  title?: string;
  data: Record<string, any>[];
  columns: ColumnDef[];
  onDataChange?: (newData: Record<string, any>[]) => void;
  onColumnsChange?: (newCols: ColumnDef[]) => void;
  allowAddColumn?: boolean;
  allowAddRow?: boolean;
  allowImport?: boolean;
  allowExport?: boolean;
  frozenColumns?: number;
  readOnly?: boolean;
}

// Map column type to custom icon
// currencySymbol dikirim dari komponen induk untuk mendukung multi-currency (IDR/USD/EUR/dll)
export const getColumnIcon = (type: ColumnType = 'text', currencySymbol?: string) => {
  switch (type) {
    case 'text': return <AlignLeft size={13} className="text-[var(--color-text-muted)] group-hover:text-[#d4af37]" />;
    case 'longText': return <Type size={13} className="text-[var(--color-text-muted)]" />;
    case 'number': return <Hash size={13} className="text-blue-400" />;
    case 'currency': return <span className="text-xs font-bold text-emerald-400">{currencySymbol || 'Rp'}</span>;
    case 'percentage': return <span className="text-xs font-bold text-amber-400">%</span>;
    case 'date':
    case 'datetime': return <Calendar size={13} className="text-[var(--color-text-muted)]" />;
    case 'checkbox': return <CheckSquare size={13} className="text-purple-400" />;
    case 'rating': return <Star size={13} className="text-yellow-400 fill-current" />;
    case 'tags': return <Tag size={13} className="text-emerald-400" />;
    case 'priority': return <AlertCircle size={13} className="text-red-400" />;
    case 'status': return <SlidersHorizontal size={13} className="text-cyan-400" />;
    case 'url': return <LinkIcon size={13} className="text-sky-400" />;
    case 'email': return <Mail size={13} className="text-orange-400" />;
    case 'phone': return <Phone size={13} className="text-violet-400" />;
    case 'image': return <ImageIcon size={13} className="text-teal-400" />;
    case 'file': return <FileText size={13} className="text-[var(--color-text-main)]" />;
    case 'formula': return <Calculator size={13} className="text-[#d4af37]" />;
    case 'relation': return <Share2 size={13} className="text-pink-400" />;
    case 'aiSummary':
    case 'aiForecast':
    case 'aiRecommendation': return <Brain size={13} className="text-amber-300 animate-pulse" />;
    default: return <AlignLeft size={13} className="text-[var(--color-text-muted)]" />;
  }
};

/**
 * Extends formula engine with comprehensive formula text and dependency validation.
 */
export const extractFormulaDependencies = (expr: string): string[] => {
  const deps = new Set<string>();
  if (!expr) return [];
  
  // Match curly-braced variables e.g. {currentStock}, {soldQty}
  const regexCurly = /\{([^}]+)\}/g;
  let match;
  while ((match = regexCurly.exec(expr)) !== null) {
    deps.add(match[1]);
  }
  
  // Match square-bracketed variables e.g. [totalSpent], [amount]
  const regexBracket = /\[([^\]]+)\]/g;
  while ((match = regexBracket.exec(expr)) !== null) {
    deps.add(match[1]);
  }
  
  return Array.from(deps);
};

export const detectCircularReferences = (
  targetKey: string,
  expr: string,
  allColumns: Array<{ key: string; label: string; formulaExpr?: string; type?: string }>
): { hasCycle: boolean; path?: string[] } => {
  const graph = new Map<string, string[]>();
  
  // Build graph nodes
  allColumns.forEach(col => {
    const deps = col.key === targetKey || col.label === targetKey
      ? extractFormulaDependencies(expr)
      : (col.type === 'formula' && col.formulaExpr ? extractFormulaDependencies(col.formulaExpr) : []);
    graph.set(col.key, deps);
    graph.set(col.label, deps);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  
  const dfs = (node: string): boolean => {
    if (recStack.has(node)) {
      path.push(node);
      return true;
    }
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    recStack.add(node);
    path.push(node);
    
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      const matchingCol = allColumns.find(c => c.key === neighbor || c.label === neighbor);
      const neighborNode = matchingCol ? matchingCol.key : neighbor;
      if (dfs(neighborNode)) {
        return true;
      }
    }
    
    recStack.delete(node);
    path.pop();
    return false;
  };
  
  const targetCol = allColumns.find(c => c.key === targetKey || c.label === targetKey);
  const targetStartNode = targetCol ? targetCol.key : targetKey;
  
  if (dfs(targetStartNode)) {
    const cycleStartIdx = path.indexOf(path[path.length - 1]);
    const cyclePath = path.slice(cycleStartIdx);
    const readablePath = cyclePath.map(k => {
      const c = allColumns.find(col => col.key === k);
      return c ? c.label : k;
    });
    return { hasCycle: true, path: readablePath };
  }
  
  return { hasCycle: false };
};

export const validateFormulaSyntax = (expr: string): { isValid: boolean; error?: string } => {
  if (!expr) return { isValid: false, error: 'Formula expression cannot be empty.' };
  
  let cleanExpr = expr.trim();
  if (cleanExpr.startsWith('=')) {
    cleanExpr = cleanExpr.substring(1).trim();
  }
  
  if (!cleanExpr) return { isValid: false, error: 'Empty arithmetic statement after "=" sign.' };

  // Check paren balances
  let openCount = 0;
  for (let i = 0; i < cleanExpr.length; i++) {
    if (cleanExpr[i] === '(') openCount++;
    else if (cleanExpr[i] === ')') {
      openCount--;
      if (openCount < 0) return { isValid: false, error: 'Mismatched closing parenthesis ")" spotted.' };
    }
  }
  if (openCount !== 0) return { isValid: false, error: 'Unbalanced opening parenthesis "(" spotted.' };

  // Replace variable blocks with dummy constant 1 for math verification
  const dummyExpr = cleanExpr
    .replace(/\{([^}]+)\}/g, '1')
    .replace(/\[([^\]]+)\]/g, '1');

  // Check for invalid operator formatting e.g. "++", "**"
  if (/[+\-*/%]{2,}/.test(dummyExpr.replace(/\s+/g, '')) && !/[*/][-+]/ .test(dummyExpr.replace(/\s+/g, ''))) {
    return { isValid: false, error: 'Invalid repeating mathematical operators sequence.' };
  }

  const sanctionedText = dummyExpr.replace(/[^0-9.+\-*/%()\s]/g, '');
  
  try {
    const evaluator = new Function(`return (${sanctionedText})`);
    const val = evaluator();
    if (val === undefined || isNaN(val)) {
      return { isValid: false, error: 'Syntactical equation evaluates to NaN.' };
    }
    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Syntactical arithmetic compilation failure.' };
  }
};

export default function SmartTable({
  tableId,
  title,
  data: propData,
  columns: propColumns,
  onDataChange,
  onColumnsChange,
  allowAddColumn = true,
  allowAddRow = true,
  allowImport = true,
  allowExport = true,
  frozenColumns = 0,
  readOnly = false
}: SmartTableProps) {
  // Access global context to resolve custom formatters like formatMoney()
  const erpContext = useERP();
  const formatMoney = erpContext?.formatMoney || ((val: number) => `Rp ${val.toLocaleString()}`);

  // Base state tracking rows and columns
  const [gridData, setGridData] = useState<Record<string, any>[]>([]);
  const [columnsConfig, setColumnsConfig] = useState<ColumnDef[]>([]);
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Layout configurations states
  const activeTab = 'table';
  const [showColSettings, setShowColSettings] = useState(false);
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [formulaError, setFormulaError] = useState<string | null>(null);

  useEffect(() => {
    if (!showAddColModal) {
      setFormulaError(null);
    }
  }, [showAddColModal]);

  // --- ADVANCED ERP DECISION-SUPPORT STATES ---
  const [activeFilters, setActiveFilters] = useState<Array<{ colKey: string; operator: string; value: string }>>([]);
  const [filterNameInput, setFilterNameInput] = useState('');
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: any[] }>>(() => {
    try {
      const saved = localStorage.getItem(`smarttable_${tableId}_saved_filters`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [groupByCol, setGroupByCol] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [auditLogs, setAuditLogs] = useState<Array<{ timestamp: string; action: string; details: string }>>(() => {
    try {
      const logs = localStorage.getItem(`smarttable_${tableId}_audit_logs`);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);

  useEffect(() => {
    localStorage.setItem(`smarttable_${tableId}_saved_filters`, JSON.stringify(savedFilters));
  }, [savedFilters, tableId]);

  useEffect(() => {
    localStorage.setItem(`smarttable_${tableId}_audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs, tableId]);

  const logAuditAction = (action: string, details: string) => {
    const newLog = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  // New Column Form values
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<ColumnType>('text');
  const [newColOptions, setNewColOptions] = useState('');
  const [newColFormula, setNewColFormula] = useState('');

  // Interactive Excel-like cells state
  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectionEnd, setSelectionEnd] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  // Modals / Overlays
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [generatingCell, setGeneratingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);

  // Virtualized list scrolling and cache refs
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<any>(null);
  const listOuterRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(({ scrollLeft }: { scrollLeft: number }) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'header' | 'cell';
    colKey?: string;
    rowIndex?: number;
  } | null>(null);

  // --- PERSISTENCE LOGIC & TABLE SYNC ---
  useEffect(() => {
    // Load state from localStorage on build / key switch
    const localDataKey = `smarttable_${tableId}_data`;
    const localColsKey = `smarttable_${tableId}_columns`;

    const savedData = localStorage.getItem(localDataKey);
    const savedCols = localStorage.getItem(localColsKey);

    let finalData = propData;
    let finalCols = propColumns;

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sync with new items from props if local doesn't have them
          // We merge by ID (or name/sku)
          const merged = [...parsed];
          propData.forEach(pItem => {
            const matchKey = pItem.id || pItem.name || pItem.sku;
            const exists = parsed.some(eItem => (eItem.id || eItem.name || eItem.sku) === matchKey);
            if (!exists) {
              merged.push(pItem);
            }
          });
          finalData = merged;
        }
      } catch (err) {
        console.error("Local data restore failed:", err);
      }
    }

    if (savedCols) {
      try {
        const parsed = JSON.parse(savedCols);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge props columns definitions to ensure missing original fields are visible
          const mergedCols = [...parsed];
          propColumns.forEach(pCol => {
            if (!mergedCols.some(mCol => mCol.key === pCol.key)) {
              mergedCols.push(pCol);
            }
          });
          finalCols = mergedCols;
        }
      } catch (err) {
        console.error("Local cols restore failed:", err);
      }
    } else {
      // Initialize with reasonable widths
      finalCols = propColumns.map(col => ({
        ...col,
        width: col.width || 150,
        visible: col.visible !== false
      }));
    }

    setGridData(finalData);
    setColumnsConfig(finalCols);
  }, [tableId]);

  // Sync back on state modification
  const handleDataChange = (newData: Record<string, any>[]) => {
    setGridData(newData);
    localStorage.setItem(`smarttable_${tableId}_data`, JSON.stringify(newData));
    if (onDataChange) {
      onDataChange(newData);
    }
    logAuditAction("DATA_MUTATION", `Updated row data cells. Total register count: ${newData.length}`);
  };

  const handleColumnsChange = (newCols: ColumnDef[]) => {
    setColumnsConfig(newCols);
    localStorage.setItem(`smarttable_${tableId}_columns`, JSON.stringify(newCols));
    if (onColumnsChange) {
      onColumnsChange(newCols);
    }
    logAuditAction("SCHEMA_MUTATION", `Altered active columns layout context. Total columns: ${newCols.filter(c => c.visible !== false).length}`);
  };

  // Safe evaluation system for computational fields
  const getEvaluatedFormula = (expr: string, row: Record<string, any>): string => {
    try {
      let normalized = expr;
      const regex = /\{([^}]+)\}/g;
      let match;
      while ((match = regex.exec(expr)) !== null) {
        const colKey = match[1];
        const val = row[colKey] !== undefined ? row[colKey] : 0;
        normalized = normalized.split(`{${colKey}}`).join(String(Number(val) || 0));
      }
      
      const sanitized = normalized.replace(/[^0-9.+\-*/%()\s]/g, '');
      const result = new Function(`return (${sanitized})`)();
      return typeof result === 'number' && !isNaN(result) ? result.toFixed(2) : '0.00';
    } catch (err) {
      return '#VALUE!';
    }
  };

  // --- STICKY COLUMN ACCUMULATED WIDTHS ---
  const getCumulativeLeft = (colIdx: number) => {
    let sum = 50; // default for index cell (#)
    const visibleCols = columnsConfig.filter(c => c.visible !== false);
    for (let i = 0; i < colIdx; i++) {
      sum += visibleCols[i]?.width || 150;
    }
    return sum;
  };

  // --- REORDER DRAG TRIGGERS (NATIVE HTML5) ---
  const [draggedColIdx, setDraggedColIdx] = useState<number | null>(null);
  const [draggedRowIdx, setDraggedRowIdx] = useState<number | null>(null);

  const handleColDragStart = (idx: number) => {
    setDraggedColIdx(idx);
  };

  const handleColDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
  };

  const handleColDrop = (idx: number) => {
    if (draggedColIdx === null || draggedColIdx === idx) return;
    const reordered = [...columnsConfig];
    const item = reordered.splice(draggedColIdx, 1)[0];
    reordered.splice(idx, 0, item);
    handleColumnsChange(reordered);
    setDraggedColIdx(null);
  };

  const handleRowDragStart = (idx: number) => {
    setDraggedRowIdx(idx);
  };

  const handleRowDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
  };

  const handleRowDrop = (idx: number) => {
    if (draggedRowIdx === null || draggedRowIdx === idx) return;
    const reordered = [...gridData];
    const item = reordered.splice(draggedRowIdx, 1)[0];
    reordered.splice(idx, 0, item);
    handleDataChange(reordered);
    setDraggedRowIdx(null);
  };

  // --- COLUMN / ROW CUSTOM SIZINGS ---
  const handleColResizeStart = (e: React.MouseEvent, colKey: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(70, Math.min(800, currentWidth + deltaX));
      handleColumnsChange(columnsConfig.map(col => {
        if (col.key === colKey) {
          return { ...col, width: newWidth };
        }
        return col;
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleRowResizeStart = (e: React.MouseEvent, rIndex: number, currentHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(30, Math.min(300, currentHeight + deltaY));
      setRowHeights(prev => ({
        ...prev,
        [rIndex]: newHeight
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // --- GRID CELLS NAVIGATION & BULK OPERATIONS ---
  const handleCellClick = (rowIndex: number, colKey: string, isShift: boolean) => {
    if (isShift && selectedCell) {
      setSelectionEnd({ rowIndex, colKey });
    } else {
      setSelectedCell({ rowIndex, colKey });
      setSelectionEnd(null);
      
      // Auto cancel preceding editing to avoid data corrupting offsets
      if (editingCell && (editingCell.rowIndex !== rowIndex || editingCell.colKey !== colKey)) {
        commitCellEdit();
      }
    }
  };

  const startCellEdit = (rowIndex: number, colKey: string) => {
    if (readOnly) return;
    const col = columnsConfig.find(c => c.key === colKey);
    if (col?.isComputed || col?.type === 'formula' || col?.type === 'aiSummary' || col?.type === 'aiForecast' || col?.type === 'aiRecommendation') return;
    
    setEditingCell({ rowIndex, colKey });
    let val = gridData[rowIndex]?.[colKey];
    if (val === undefined || val === null) {
      val = '';
    }
    
    if (col?.type === 'number' || col?.type === 'currency' || col?.type === 'percentage') {
      const activeCurrency = erpContext?.config?.activeCurrency || 'IDR';
      let cleaned = String(val).trim();
      cleaned = cleaned.replace(/[Rp$€£\s]/g, '');
      if (activeCurrency === 'IDR') {
        if (cleaned.includes(',') && cleaned.includes('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        } else if (cleaned.includes(',')) {
          cleaned = cleaned.replace(/,/g, '.');
        } else if (cleaned.includes('.')) {
          if (cleaned.match(/^\d+(\.\d{3})+$/) || cleaned.split('.').length > 2) {
            cleaned = cleaned.replace(/\./g, '');
          }
        }
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
      const parsed = parseFloat(cleaned);
      val = isNaN(parsed) ? (cleaned || '0') : parsed;
    }
    
    setEditValue(String(val));
  };

  const commitCellEdit = () => {
    if (!editingCell) return;
    const { rowIndex, colKey } = editingCell;
    const col = columnsConfig.find(c => c.key === colKey);
    
    let parsedValue: any = editValue;
    if (col?.type === 'number' || col?.type === 'currency' || col?.type === 'percentage') {
      if (typeof editValue === 'string') {
        const isIDR = erpContext?.config?.activeCurrency === 'IDR' || erpContext?.config?.currencySymbol === 'Rp';
        let cleaned = editValue.trim();
        // Remove currency symbols/spaces
        cleaned = cleaned.replace(/[Rp$€£\s]/g, '');
        
        if (isIDR) {
          if (cleaned.includes(',') && cleaned.includes('.')) {
            cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
          } else if (cleaned.includes(',')) {
            cleaned = cleaned.replace(/,/g, '.');
          } else if (cleaned.includes('.')) {
            if (cleaned.match(/^\d+(\.\d{3})+$/) || cleaned.split('.').length > 2) {
              cleaned = cleaned.replace(/\./g, '');
            }
          }
        } else {
          cleaned = cleaned.replace(/,/g, '');
        }
        const valNum = parseFloat(cleaned);
        parsedValue = isNaN(valNum) ? 0 : valNum;
      } else {
        parsedValue = Number(editValue) || 0;
      }
    } else if (col?.type === 'checkbox') {
      parsedValue = editValue === 'true';
    }

    const updated = [...gridData];
    if (updated[rowIndex]) {
      updated[rowIndex] = {
        ...updated[rowIndex],
        [colKey]: parsedValue
      };
      handleDataChange(updated);
    }
    setEditingCell(null);
  };

  // Key navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || editingCell) return;

      const visibleCols = columnsConfig.filter(c => c.visible !== false);
      const currentColIdx = visibleCols.findIndex(c => c.key === selectedCell.colKey);
      const rIndex = selectedCell.rowIndex;

      if (e.key === 'ArrowUp' && rIndex > 0) {
        setSelectedCell({ rowIndex: rIndex - 1, colKey: selectedCell.colKey });
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && rIndex < gridData.length - 1) {
        setSelectedCell({ rowIndex: rIndex + 1, colKey: selectedCell.colKey });
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && currentColIdx > 0) {
        setSelectedCell({ rowIndex: rIndex, colKey: visibleCols[currentColIdx - 1].key });
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && currentColIdx < visibleCols.length - 1) {
        setSelectedCell({ rowIndex: rIndex, colKey: visibleCols[currentColIdx + 1].key });
        e.preventDefault();
      } else if (e.key === 'Enter') {
        startCellEdit(rIndex, selectedCell.colKey);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setSelectedCell(null);
        setSelectionEnd(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, gridData, columnsConfig]);

  // Bulk clipboard integration
  const handleCopy = (e: React.ClipboardEvent) => {
    if (!selectedCell) return;
    e.preventDefault();

    const range = getSelectedRangeBox();
    let text = '';

    for (let r = range.minRow; r <= range.maxRow; r++) {
      const rowParts: string[] = [];
      range.cols.forEach(colKey => {
        rowParts.push(String(gridData[r]?.[colKey] ?? ''));
      });
      text += rowParts.join('\t') + '\n';
    }

    e.clipboardData.setData('text/plain', text.trim());
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!selectedCell || readOnly) return;
    e.preventDefault();

    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    const pastedRows = text.split('\n').map(line => line.split('\t'));
    const visibleCols = columnsConfig.filter(c => c.visible !== false);
    const startColIdx = visibleCols.findIndex(c => c.key === selectedCell.colKey);
    const startRowIdx = selectedCell.rowIndex;

    const nextData = [...gridData];

    pastedRows.forEach((rowVals, rOffset) => {
      const targetRowIdx = startRowIdx + rOffset;
      if (targetRowIdx >= nextData.length) {
        if (allowAddRow) {
          nextData.push({ id: `${tableId}_pasted_${Date.now()}_${targetRowIdx}` });
        } else {
          return;
        }
      }

      rowVals.forEach((val, cOffset) => {
        const targetColIdx = startColIdx + cOffset;
        if (targetColIdx < visibleCols.length) {
          const col = visibleCols[targetColIdx];
          if (!col.isComputed && col.type !== 'formula' && !readOnly) {
            let parsedVal: any = val;
            if (col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
              parsedVal = Number(val) || 0;
            } else if (col.type === 'checkbox') {
              parsedVal = val.toLowerCase() === 'true';
            }
            nextData[targetRowIdx] = {
              ...nextData[targetRowIdx],
              [col.key]: parsedVal
            };
          }
        }
      });
    });

    handleDataChange(nextData);
  };

  // Helper box layout formula
  const getSelectedRangeBox = () => {
    if (!selectedCell) return { minRow: 0, maxRow: 0, cols: [] };
    const visibleCols = columnsConfig.filter(c => c.visible !== false);
    const cursorColIdx = visibleCols.findIndex(c => c.key === selectedCell.colKey);

    if (!selectionEnd) {
      return {
        minRow: selectedCell.rowIndex,
        maxRow: selectedCell.rowIndex,
        cols: [selectedCell.colKey]
      };
    }

    const endColIdx = visibleCols.findIndex(c => c.key === selectionEnd.colKey);
    const minRow = Math.min(selectedCell.rowIndex, selectionEnd.rowIndex);
    const maxRow = Math.max(selectedCell.rowIndex, selectionEnd.rowIndex);
    const minCol = Math.min(cursorColIdx, endColIdx);
    const maxCol = Math.max(cursorColIdx, endColIdx);

    const cols = visibleCols.slice(minCol, maxCol + 1).map(c => c.key);
    return { minRow, maxRow, cols };
  };

  const isCellSelected = (rowIndex: number, colKey: string) => {
    if (!selectedCell) return false;
    const box = getSelectedRangeBox();
    return rowIndex >= box.minRow && rowIndex <= box.maxRow && box.cols.includes(colKey);
  };

  // --- ACTIONS: ROWS / COLS ADDITION & TRASHES ---
  const handleAddNewRow = () => {
    if (readOnly) return;
    const newRowId = `${tableId}_row_${Date.now()}`;
    const newEntry: Record<string, any> = { id: newRowId };

    // Set default keys fields to look clean
    columnsConfig.forEach(col => {
      if (col.type === 'checkbox') {
        newEntry[col.key] = false;
      } else if (col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
        newEntry[col.key] = 0;
      } else {
        newEntry[col.key] = '';
      }
    });

    handleDataChange([...gridData, newEntry]);
    setSelectedCell({ rowIndex: gridData.length, colKey: columnsConfig[0]?.key || 'id' });
  };

  const deleteRowHandler = (rIndex: number) => {
    if (readOnly) return;
    const confirmed = confirm("Are you sure you want to purge this record permanently?");
    if (confirmed) {
      const copy = [...gridData];
      copy.splice(rIndex, 1);
      handleDataChange(copy);
      setSelectedCell(null);
    }
  };

  const duplicateRowHandler = (rIndex: number) => {
    if (readOnly) return;
    const source = gridData[rIndex];
    if (!source) return;
    const copy = {
      ...source,
      id: `${tableId}_row_dup_${Date.now()}`
    };
    const next = [...gridData];
    next.splice(rIndex + 1, 0, copy);
    handleDataChange(next);
  };

  const createCustomColumn = () => {
    if (!newColLabel.trim()) return;

    if (newColType === 'formula') {
      const syntaxCheck = validateFormulaSyntax(newColFormula);
      if (!syntaxCheck.isValid) {
        setFormulaError(syntaxCheck.error || 'Invalid formula syntax');
        return;
      }

      const circularCheck = detectCircularReferences('PROPOSED_KEY', newColFormula, [
        ...columnsConfig,
        { key: 'PROPOSED_KEY', label: newColLabel.toUpperCase(), formulaExpr: newColFormula, type: 'formula' }
      ]);
      if (circularCheck.hasCycle) {
        setFormulaError(`Circular dependency loop detected: ${circularCheck.path?.join(' ➔ ')}`);
        return;
      }
    }

    setFormulaError(null);
    const key = `custom_${Date.now()}`;
    const newCol: ColumnDef = {
      key,
      label: newColLabel.toUpperCase(),
      type: newColType,
      width: 150,
      visible: true,
      isEditable: true,
      selectOptions: newColType === 'status' && newColOptions ? newColOptions.split(',').map(s => s.trim()) : undefined,
      formulaExpr: newColType === 'formula' ? newColFormula : undefined
    };

    handleColumnsChange([...columnsConfig, newCol]);
    setShowAddColModal(false);
    setNewColLabel('');
    setNewColOptions('');
    setNewColFormula('');
  };

  const deleteColumnHandler = (colKey: string) => {
    if (confirm(`Remove column "${colKey.toUpperCase()}" permanently from the view?`)) {
      handleColumnsChange(columnsConfig.filter(c => c.key !== colKey));
      // clean associated values
      const cleansed = gridData.map(row => {
        const next = { ...row };
        delete next[colKey];
        return next;
      });
      handleDataChange(cleansed);
    }
  };

  const duplicateColumnHandler = (colKey: string) => {
    const orig = columnsConfig.find(c => c.key === colKey);
    if (!orig) return;
    const nextKey = `dup_${colKey}_${Date.now()}`;
    const copyCol: ColumnDef = {
      ...orig,
      key: nextKey,
      label: `${orig.label} COPY`,
      width: orig.width || 150,
    };
    
    // duplicate data cells
    const nextData = gridData.map(row => ({
      ...row,
      [nextKey]: row[colKey]
    }));

    handleColumnsChange([...columnsConfig, copyCol]);
    handleDataChange(nextData);
  };

  // --- CSV / EXCEL PARSERS & GENERATORS ---
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const mapped = (results.data as any[]).filter(row => Object.keys(row).length > 1).map((row, idx) => ({
            id: row.id || `${tableId}_csv_${Date.now()}_${idx}`,
            ...row
          }));
          handleDataChange([...gridData, ...mapped]);
        }
        setLoading(false);
      },
      error: () => {
        setLoading(false);
        toast.error("Failed to parse CSV file standard structure.");
      }
    });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // CSV import - pakai PapaParse
    if (file.name.toLowerCase().endsWith('.csv')) {
      setLoading(true);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: { data: Record<string, unknown>[] }) => {
          const mapped = results.data.map((row, idx) => ({
            id: (row.id as string) || `${tableId}_import_${Date.now()}_${idx}`,
            ...row
          }));
          handleDataChange([...gridData, ...mapped]);
          toast.success(`${mapped.length} baris diimport`);
          setLoading(false);
        },
        error: () => { toast.error('Gagal baca CSV'); setLoading(false); }
      });
    } else {
      toast.info('Export data dari Excel sebagai CSV dulu, lalu import CSV di sini.');
    }
  };

  // Filters out operational helper functions to clean downloads
  const getProcessedPlainData = (): Record<string, any>[] => {
    return gridData.map(row => {
      const next: Record<string, any> = {};
      columnsConfig.filter(c => c.visible !== false).forEach(col => {
        if (col.type === 'formula' && col.formulaExpr) {
          next[col.label] = getEvaluatedFormula(col.formulaExpr, row);
        } else {
          next[col.label] = row[col.key] ?? '';
        }
      });
      return next;
    });
  };

  const doExportCSV = () => {
    const processed = getProcessedPlainData();
    const csv = Papa.unparse(processed);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title || tableId}_database_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const doExportExcel = () => {
    // Export sebagai CSV (bisa dibuka Excel, Google Sheets)
    const processed = getProcessedPlainData();
    if (!processed.length) { toast.error('Tidak ada data'); return; }
    const csv  = Papa.unparse(processed);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${title || tableId}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export selesai — buka dengan Excel atau Google Sheets');
  };

  // --- REAL-TIME INTUITIVE GEMINI AI ACTIONS ---
  const runAICellAction = async (rowIndex: number, colKey: string, aiType: 'aiSummary' | 'aiForecast' | 'aiRecommendation') => {
    const row = gridData[rowIndex];
    if (!row) return;

    setGeneratingCell({ rowIndex, colKey });
    
    // Construct descriptive prompt incorporating row metrics
    const contextStr = Object.entries(row)
      .filter(([k]) => k !== 'id' && !k.startsWith('custom_'))
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join(', ');

    let prompt = '';
    if (aiType === 'aiSummary') {
      prompt = `Provide a short, elegant, 1-sentence strategic summary for the following operations index dataset: ${contextStr}`;
    } else if (aiType === 'aiForecast') {
      prompt = `Evaluate the following dataset snapshot: ${contextStr}. Generate a short, 1-sentence analytical forecast predict for quantity demand, values growth, or operational outlook.`;
    } else {
      prompt = `Based on these metrics: ${contextStr}, formulate a single crisp and strategic 1-sentence actionable recommendation or reorder advisor for the brand Chief Operating Officer.`;
    }

    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, temperature: 0.3 })
      });
      const result = await response.json();
      
      const text = result.text || "Reasoning response undefined.";
      
      const copy = [...gridData];
      copy[rowIndex] = { ...copy[rowIndex], [colKey]: text };
      handleDataChange(copy);
    } catch {
      toast.error("Error reaching strategic intelligence. Configure GEMINI_API_KEY in process workspace.");
    } finally {
      setGeneratingCell(null);
    }
  };

  // --- RIGHT CLICK CUSTOM OVERLAYS (CONTEXT MENU) ---
  const handleCellRightClick = (e: React.MouseEvent, rowIndex: number, colKey: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'cell',
      colKey,
      rowIndex
    });
  };

  const handleHeaderRightClick = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'header',
      colKey
    });
  };

  useEffect(() => {
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // --- COMPUTE ACTIVE PROCESSED FILTER RESULTS ---
  const processedData = useMemo(() => {
    let filtered = gridData;

    // Apply main Search text query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row => {
        return Object.values(row).some(v => String(v).toLowerCase().includes(query));
      });
    }

    // Apply Active Smart Query Filters
    if (activeFilters.length > 0) {
      filtered = filtered.filter(row => {
        return activeFilters.every(filter => {
          const { colKey, operator, value } = filter;
          const cellRaw = row[colKey];
          if (cellRaw === undefined || cellRaw === null) {
            if (operator === 'is_empty') return true;
            if (operator === 'is_not_empty') return false;
            return false;
          }
          const cellStr = String(cellRaw).toLowerCase();
          const filterStr = value.toLowerCase();
          const cellNum = parseFloat(cellRaw);
          const filterNum = parseFloat(value);

          switch (operator) {
            case 'contains':
              return cellStr.includes(filterStr);
            case 'not_contains':
              return !cellStr.includes(filterStr);
            case 'equals':
              return cellStr === filterStr;
            case 'not_equals':
              return cellStr !== filterStr;
            case 'greater_than':
              return !isNaN(cellNum) && !isNaN(filterNum) && cellNum > filterNum;
            case 'less_than':
              return !isNaN(cellNum) && !isNaN(filterNum) && cellNum < filterNum;
            case 'is_empty':
              return cellStr.trim() === '';
            case 'is_not_empty':
              return cellStr.trim() !== '';
            default:
              return true;
          }
        });
      });
    }

    return filtered;
  }, [gridData, searchQuery, activeFilters]);

  // Recalculate heights within VariableSizeList and reset react-window index coordinate offset mapping on state changes
  useEffect(() => {
    if (listRef.current && typeof listRef.current.resetAfterIndex === 'function') {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [rowHeights, processedData]);

  // Compute Grouped Map when activeGroupBy is selected
  const groupedData = useMemo(() => {
    if (!groupByCol) return null;
    const groups: Record<string, any[]> = {};
    processedData.forEach(row => {
      const val = row[groupByCol] !== undefined && row[groupByCol] !== '' ? String(row[groupByCol]) : 'UNASSIGNED';
      if (!groups[val]) groups[val] = [];
      groups[val].push(row);
    });
    return groups;
  }, [processedData, groupByCol]);
  
  // Precompute duplicate sets per column to eliminate recursive O(N^2) checks in getCellExceptionInfo
  const duplicateSets = useMemo(() => {
    const targetKeys = ['id', 'sku', 'name', 'email'];
    const counts: Record<string, Map<string, number>> = {};
    
    targetKeys.forEach(k => {
      counts[k] = new Map<string, number>();
    });

    gridData.forEach(row => {
      targetKeys.forEach(k => {
        const val = row[k];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const valStr = String(val).toLowerCase().trim();
          const currentCount = counts[k].get(valStr) || 0;
          counts[k].set(valStr, currentCount + 1);
        }
      });
    });

    const dupSets: Record<string, Set<string>> = {};
    targetKeys.forEach(k => {
      dupSets[k] = new Set<string>();
      counts[k].forEach((count, valStr) => {
        if (count > 1) {
          dupSets[k].add(valStr);
        }
      });
    });

    return dupSets;
  }, [gridData]);

  // Exception analysis scanning helper
  const getCellExceptionInfo = useCallback((row: Record<string, any>, colKey: string, rowIndex: number) => {
    const rawVal = row[colKey];
    if (rawVal === undefined || rawVal === null) return null;

    // 1. Duplicate check (on primary IDs/SKU)
    if (['id', 'sku', 'name', 'email'].includes(colKey) && String(rawVal).trim() !== '') {
      const valStr = String(rawVal).toLowerCase().trim();
      const isDuplicate = duplicateSets[colKey]?.has(valStr);
      if (isDuplicate) {
        return {
          type: 'duplicate',
          msg: `Duplicate entry error: "${rawVal}" exists elsewhere in this column.`,
          style: 'border-l-2 border-l-amber-500 bg-amber-500/[0.04] text-amber-400 font-bold'
        };
      }
    }

    // 2. Stock levels (LOW STOCK warning flag)
    if (['currentStock', 'remainingStock', 'remainingQty', 'baseQty', 'qty'].includes(colKey)) {
      const numVal = parseFloat(rawVal);
      const minStockThreshold = parseFloat(row.minStock) || (colKey === 'qty' ? 0 : 20);
      if (!isNaN(numVal) && numVal < minStockThreshold) {
        return {
          type: 'low_stock',
          msg: `Operational Alert: Stock quantity (${numVal}) is below safety threshold (${minStockThreshold})`,
          style: 'border-l-2 border-l-red-500 bg-red-500/10 text-red-400 font-semibold'
        };
      }
    }

    // 3. Profitability margins
    if (['profit', 'netProfit', 'marginPercentage', 'roas', 'netMargin'].includes(colKey)) {
      const numVal = parseFloat(rawVal);
      if (!isNaN(numVal) && numVal <= 0) {
        return {
          type: 'unstable_deficit',
          msg: `Financial Warning: Deficit or zero margin detected (${numVal})! Check pricing structure or reduce overhead costs.`,
          style: 'border-l-2 border-l-rose-500 bg-rose-500/10 text-rose-400 font-semibold'
        };
      }
    }

    // 4. Overdue process exceptions
    if (['date', 'maintenanceDate', 'productionDate'].includes(colKey)) {
      const dateVal = new Date(rawVal);
      const today = new Date();
      const isPast = dateVal.getTime() < today.getTime() - 86400000;
      const isNotDone = row.status && !['Completed', 'Passed', 'Received', 'Approved'].includes(row.status);
      if (isPast && isNotDone) {
        return {
          type: 'overdue',
          msg: `Operational Bottleneck: Scheduled date (${rawVal}) is in the past, but current status remains "${row.status}"!`,
          style: 'border-l-2 border-l-orange-500 bg-orange-500/10 text-orange-400'
        };
      }
    }

    return null;
  }, [duplicateSets]);

  // Determine rendering layout type
  const totalVisibleColsWidth = useMemo(() => {
    return columnsConfig.filter(c => c.visible !== false).reduce((sum, col) => sum + (col.width || 150), 50);
  }, [columnsConfig]);

  return (
    <div 
      className="space-y-4 text-xs font-mono antialiased"
      onPaste={handlePaste}
      onCopy={handleCopy}
    >
      {/* HEADER CONTROLS TOOLBAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-[var(--color-background)]/65 border border-white/[0.04] rounded-lg shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--color-card-bg)] border border-white/5 px-2 py-1 rounded-md">
            <span className="text-[#d4af37] font-semibold tracking-wider text-[11px] uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="animate-spin text-[#d4af37]" /> {title || "Notion Studio Database"}
            </span>
          </div>
          
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search databases indexes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-1.5 pl-8 pr-3 w-56 text-xs bg-[var(--color-card-bg)] focus:bg-[var(--color-background)] text-white hover:text-white border border-white/5 rounded-md focus:border-[#d4af37] focus:outline-none transition-all placeholder-[var(--color-text-muted)] font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all flex items-center gap-1 ${
                showFilterPanel || activeFilters.length > 0
                  ? 'bg-amber-500/15 text-[#d4af37] border border-amber-500/30'
                  : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border border-white/5 hover:bg-[var(--color-background)]'
              }`}
              title="Configure advanced multi-column decision filters"
            >
              <SlidersHorizontal size={11} className={activeFilters.length > 0 ? 'text-[#d4af37]' : ''} />
              <span>Smart Filters {activeFilters.length > 0 ? `(${activeFilters.length})` : ''}</span>
            </button>

            <button
              onClick={() => setShowAuditPanel(!showAuditPanel)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold tracking-tight uppercase transition-all flex items-center gap-1 ${
                showAuditPanel
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border border-white/5 hover:bg-[var(--color-background)]'
              }`}
              title="Show ledger transaction edit logs"
            >
              <FileText size={11} />
              <span>Audit Timeline</span>
            </button>

            <div className="flex items-center gap-1.5 bg-[var(--color-card-bg)]/80 px-2.5 py-1 rounded border border-white/5">
              <span className="text-[9px] text-[var(--color-text-muted)] font-sans uppercase">Group:</span>
              <select
                value={groupByCol}
                onChange={(e) => {
                  setGroupByCol(e.target.value);
                  logAuditAction("GROUPBY_ALIGN", e.target.value ? `Grouped table rows by column "${e.target.value}"` : "Disabled row grouping");
                }}
                className="bg-transparent text-[10px] text-[#d4af37] focus:outline-none focus:ring-0 border-none p-0 cursor-pointer font-sans"
              >
                <option value="" className="bg-[var(--color-background)] text-[var(--color-text-main)]">Flat Grid</option>
                {columnsConfig.filter(c => c.type === 'status' || c.type === 'priority' || c.key === 'category' || c.key === 'tier' || c.key === 'factory' || c.key === 'channel' || c.key === 'qcStatus' || c.key === 'productionStatus').map(c => (
                  <option key={c.key} value={c.key} className="bg-[var(--color-background)] text-[var(--color-text-main)]">{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Imports Buttons */}
          {allowImport && !readOnly && (
            <div className="flex items-center gap-1.5 border-r border-white/10 pr-2">
              <label className="px-2.5 py-1.5 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:text-[var(--color-text-main)] border border-white/5 hover:bg-[var(--color-background)] rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold">
                <Upload size={12} className="text-[#d4af37]" />
                <span>CSV</span>
                <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
              </label>
              
              <label className="px-2.5 py-1.5 bg-[var(--color-card-bg)] text-[var(--color-text-main)] hover:text-[var(--color-text-main)] border border-white/5 hover:bg-[var(--color-background)] rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-[10px] font-bold">
                <FileSpreadsheet size={12} className="text-[var(--color-text-muted)]" />
                <span>EXCEL</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="hidden" />
              </label>
            </div>
          )}

          {/* Export buttons */}
          {allowExport && (
            <div className="flex items-center gap-1">
              <button 
                onClick={doExportCSV} 
                className="p-1.5 bg-[var(--color-card-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-white/5 hover:bg-[var(--color-background)] rounded-md transition-all" 
                title="CSV Database backup dump"
              >
                <Download size={13} />
              </button>
              <button 
                onClick={doExportExcel} 
                className="p-1.5 bg-[var(--color-card-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-white/5 hover:bg-[var(--color-background)] rounded-md transition-all" 
                title="Excel sheets snapshot (.xlsx)"
              >
                <FileSpreadsheet size={13} className="text-[#d4af37]" />
              </button>
            </div>
          )}

          {/* Manage Columns Setup Toggle */}
          <button
            onClick={() => setShowColSettings(!showColSettings)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border rounded-md transition-all flex items-center gap-1.5 ${
              showColSettings ? 'bg-[#d4af37]/20 border-[#d4af37]/30 text-[#d4af37]' : 'bg-[var(--color-card-bg)] border-white/5 text-[var(--color-text-muted)] hover:bg-[var(--color-background)]'
            }`}
          >
            <SlidersHorizontal size={12} />
            <span>Layout</span>
          </button>

          {/* Add Column button */}
          {allowAddColumn && !readOnly && (
            <button
              onClick={() => setShowAddColModal(true)}
              className="px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600/70 border border-emerald-500/20 rounded-md text-[var(--color-text-main)] text-[10px] font-bold flex items-center gap-1 uppercase transition-all"
            >
              <Plus size={12} />
              <span>Col</span>
            </button>
          )}
        </div>
      </div>

      {/* SMART DECISION FILTERS WORKSPACE */}
      {showFilterPanel && (
        <div className="p-3 bg-[#0a0a0d] border border-amber-500/20 rounded-lg shadow-xl backdrop-blur-md space-y-3 text-[var(--color-text-main)]">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-bold text-[#d4af37] tracking-widest uppercase flex items-center gap-1.5">
              <SlidersHorizontal size={12} /> Decision-Support Database Rule Builder
            </span>
            <button onClick={() => setShowFilterPanel(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
              <X size={12} />
            </button>
          </div>

          <div className="space-y-2">
            {activeFilters.length === 0 ? (
              <p className="text-[10px] text-[var(--color-text-muted)] italic">No active validation rules. Add rules below to partition or isolate operational records.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map((flt, idx) => {
                  const label = columnsConfig.find(c => c.key === flt.colKey)?.label || flt.colKey;
                  return (
                    <div key={idx} className="flex items-center gap-1.5 bg-[var(--color-card-bg)] border border-white/[0.05] rounded px-2 py-0.5 text-[10px]">
                      <span className="text-[#d4af37] font-semibold">{label}</span>
                      <span className="text-[var(--color-text-muted)] font-sans">{flt.operator.replace('_', ' ')}</span>
                      <span className="text-[var(--color-text-main)] font-mono">{flt.value || '(empty)'}</span>
                      <button 
                        onClick={() => {
                          const next = [...activeFilters];
                          next.splice(idx, 1);
                          setActiveFilters(next);
                          logAuditAction("FILTER_REMOVE", `Retired filter on column "${flt.colKey}"`);
                        }}
                        className="text-red-400 hover:text-red-300 ml-1 font-bold font-sans"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Rule Line Form */}
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.03]">
              <select
                id="filter-col-key-selector"
                onClick={(e) => e.stopPropagation()}
                className="w-44 bg-[var(--color-background)] border border-white/10 text-[10px] text-[var(--color-text-main)] rounded px-2 py-1 focus:outline-none"
                defaultValue={columnsConfig[0]?.key || ''}
              >
                {columnsConfig.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>

              <select
                id="filter-operator-selector"
                onClick={(e) => e.stopPropagation()}
                className="w-32 bg-[var(--color-background)] border border-white/10 text-[10px] text-[var(--color-text-main)] rounded px-2 py-1 focus:outline-none"
                defaultValue="contains"
              >
                <option value="contains">contains (str)</option>
                <option value="not_contains">not contains</option>
                <option value="equals">equals</option>
                <option value="not_equals">not equals</option>
                <option value="greater_than">&gt; (numeric)</option>
                <option value="less_than">&lt; (numeric)</option>
                <option value="is_empty">is empty</option>
                <option value="is_not_empty">is not empty</option>
              </select>

              <input
                id="filter-value-input"
                type="text"
                placeholder="Match condition cell value..."
                className="bg-[var(--color-background)] border border-white/10 text-[10px] text-white rounded px-2 py-1 w-44 focus:outline-none focus:border-[#d4af37]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const addBtn = document.getElementById('add-filter-rule-btn');
                    if (addBtn) addBtn.click();
                  }
                }}
              />

              <button
                id="add-filter-rule-btn"
                onClick={() => {
                  const colSel = document.getElementById('filter-col-key-selector') as HTMLSelectElement;
                  const opSel = document.getElementById('filter-operator-selector') as HTMLSelectElement;
                  const valInp = document.getElementById('filter-value-input') as HTMLInputElement;
                  if (colSel && opSel) {
                    const rule = {
                      colKey: colSel.value,
                      operator: opSel.value,
                      value: valInp ? valInp.value : ''
                    };
                    setActiveFilters([...activeFilters, rule]);
                    logAuditAction("FILTER_CREATE", `Added active filter "${rule.colKey}" ${rule.operator} "${rule.value}"`);
                    if (valInp) valInp.value = '';
                  }
                }}
                className="px-2.5 py-1 bg-[#d4af37]/25 hover:bg-[#d4af37]/40 text-[#d4af37] border border-[#d4af37]/35 rounded text-[9px] font-bold uppercase transition-all"
              >
                Add Constraint
              </button>

              <div className="w-[1px] h-4 bg-[rgba(255,255,255,0.06)] mx-1" />

              <input
                type="text"
                placeholder="Filter template name..."
                value={filterNameInput}
                onChange={(e) => setFilterNameInput(e.target.value)}
                className="bg-[var(--color-background)] border border-white/10 text-[10px] text-[var(--color-text-main)] rounded px-2 py-1 w-32 focus:outline-none"
              />

              <button
                onClick={() => {
                  if (!filterNameInput.trim()) return;
                  const newLayout = { name: filterNameInput.trim(), filters: [...activeFilters] };
                  setSavedFilters([...savedFilters, newLayout]);
                  logAuditAction("FILTER_SAVE", `Saved filter template "${newLayout.name}"`);
                  setFilterNameInput('');
                }}
                className="px-2.5 py-1 border border-white/5 text-[var(--color-text-main)] hover:text-[var(--color-text-main)] bg-[var(--color-card-bg)] rounded text-[9px] font-bold uppercase transition-all"
              >
                Save Layout
              </button>

              {activeFilters.length > 0 && (
                <button
                  onClick={() => {
                    setActiveFilters([]);
                    logAuditAction("FILTER_CLEAR", "Discharged all active filter search overlays");
                  }}
                  className="px-2.5 py-1 bg-red-950/40 text-red-400 hover:text-red-300 border border-red-500/10 rounded text-[9px] font-bold uppercase transition-all ml-auto"
                >
                  Reset All
                </button>
              )}
            </div>
          )}

          {/* Saved Layouts List */}
          {savedFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.03]">
              <span className="text-[9px] text-[#d4af37] font-semibold uppercase">Saved Templates:</span>
              {savedFilters.map((lay, layIdx) => (
                <div key={layIdx} className="inline-flex items-center bg-[var(--color-card-bg)] border border-white/5 rounded pl-2 pr-1 py-0.5 text-[9px]">
                  <button
                    onClick={() => {
                      setActiveFilters(lay.filters);
                      logAuditAction("FILTER_LOAD", `Applied filter template: "${lay.name}"`);
                    }}
                    className="text-[var(--color-text-main)] hover:text-[#d4af37] font-semibold truncate max-w-[120px]"
                  >
                    {lay.name}
                  </button>
                  <button
                    onClick={() => {
                      const next = [...savedFilters];
                      next.splice(layIdx, 1);
                      setSavedFilters(next);
                      logAuditAction("FILTER_DELETE", `Purged saved layout configuration "${lay.name}"`);
                    }}
                    className="text-red-400/60 hover:text-red-300 ml-1 ml-2 font-bold focus:outline-none text-[9px] font-sans"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG TIMELINE */}
      {showAuditPanel && (
        <div className="p-3 bg-[#0a0a0d] border border-purple-500/20 rounded-lg shadow-xl backdrop-blur-md space-y-2 text-[var(--color-text-main)]">
          <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
            <span className="text-[10px] font-bold text-purple-300 tracking-widest uppercase flex items-center gap-1.5 align-middle">
              <FileText size={12} className="text-purple-400" /> Database Registry Operations Audit History
            </span>
            <button onClick={() => setShowAuditPanel(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
              <X size={12} />
            </button>
          </div>
          <div className="max-h-24 overflow-y-auto divide-y divide-white/[0.02] pr-1 scrollbar-thin">
            {auditLogs.length === 0 ? (
              <p className="text-[10px] text-[var(--color-text-muted)] italic py-1">No transaction modifications logged in current sandbox session.</p>
            ) : (
              auditLogs.map((log, logIdx) => (
                <div key={logIdx} className="flex items-center justify-between py-1 text-[9px] font-mono hover:bg-[rgba(255,255,255,0.01)]">
                  <span className="text-purple-400 w-24 shrink-0">{log.timestamp}</span>
                  <span className="text-[#d4af37] font-bold border border-[#d4af37]/20 rounded px-1.5 text-[8px] tracking-tight mr-2 uppercase shrink-0">{log.action}</span>
                  <span className="text-[var(--color-text-main)] truncate flex-1 text-left">{log.details}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BULK SELECTION ACTION WORKSPACE */}
      {selectedRows.size > 0 && (
        <div className="p-3 bg-[var(--color-background)] border border-[#d4af37]/30 rounded-lg shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4 border-t-2 border-t-[#d4af37]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
            <span className="text-[10px] font-bold text-[var(--color-text-main)] uppercase tracking-wider">
              {selectedRows.size} Database Process Records Selected
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] italic">| Mass decision-support system in flight</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Mass status updates if 'status' column is present */}
            {columnsConfig.some(c => c.type === 'status') && (
              <div className="flex items-center gap-1.5 bg-[var(--color-background)] border border-white/10 px-2 py-0.5 rounded">
                <span className="text-[9px] text-[var(--color-text-muted)] font-sans uppercase">Mass Status:</span>
                <select
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const statusVal = e.target.value;
                    const statusColKey = columnsConfig.find(c => c.type === 'status')?.key || 'status';
                    const next = gridData.map(row => {
                      const idVal = row.id || row.sku || row.name;
                      if (selectedRows.has(String(idVal))) {
                        return { ...row, [statusColKey]: statusVal };
                      }
                      return row;
                    });
                    handleDataChange(next);
                    setSelectedRows(new Set());
                    logAuditAction("BULK_STATUS_MUT", `Mass assigned selected registers rows count ${selectedRows.size} status to "${statusVal}"`);
                    e.target.value = '';
                  }}
                  className="bg-transparent text-[10px] text-[#d4af37] border-none focus:ring-0 p-0 cursor-pointer font-sans"
                >
                  <option value="" className="bg-[var(--color-background)]">Set Status...</option>
                  {(columnsConfig.find(c => c.type === 'status')?.selectOptions || ['Passed', 'Approved', 'Failed', 'Under Auditing', 'Completed', 'Operational', 'Under Maintenance', 'DRAFT', 'Silver Member', 'Gold Sovereign', 'Arch Elite VIP']).map(opt => (
                    <option key={opt} value={opt} className="bg-[var(--color-background)]">{opt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Mass approval stamping Action */}
            <button
              onClick={() => {
                const approvalCol = columnsConfig.find(c => c.key.toLowerCase().includes('approval') || c.key.toLowerCase().includes('status') || c.key.toLowerCase().includes('qc'))?.key || 'status';
                const next = gridData.map(row => {
                  const idVal = row.id || row.sku || row.name;
                  if (selectedRows.has(String(idVal))) {
                    return { ...row, [approvalCol]: 'Passed', custom_audited: 'Approved' };
                  }
                  return row;
                });
                handleDataChange(next);
                setSelectedRows(new Set());
                logAuditAction("BULK_APPROVAL_SEAL", `Imposed executive Mass Approval on ${selectedRows.size} business records`);
              }}
              className="px-3 py-1 bg-emerald-800/80 hover:bg-emerald-700/80 border border-emerald-500/20 text-[var(--color-text-main)] text-[10px] font-bold rounded uppercase transition-all flex items-center gap-1"
            >
              <CheckCircle2 size={12} className="text-[#d4af37]" />
              <span>Mass Approve</span>
            </button>

            {/* Mass delete selected option */}
            <button
              onClick={() => {
                const beforeCount = gridData.length;
                const next = gridData.filter(row => {
                  const idVal = row.id || row.sku || row.name;
                  return !selectedRows.has(String(idVal));
                });
                handleDataChange(next);
                setSelectedRows(new Set());
                logAuditAction("BULK_PURGE", `Purged and deleted selected row indices. Selected count: ${selectedRows.size}`);
              }}
              className="px-3 py-1 bg-red-950/70 hover:bg-red-900/40 border border-red-500/20 text-red-100 text-[10px] font-bold rounded uppercase transition-all flex items-center gap-1"
            >
              <Trash2 size={12} />
              <span>Bulk Purge</span>
            </button>

            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] px-2 py-1 font-sans font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DETAILED COLUMN CONFIGURATION DRAWER */}
      {showColSettings && (
        <div className="p-4 bg-[var(--color-background)]/90 border border-white/[0.05] rounded-lg animate-fadeIn text-[var(--color-text-main)]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/5">
            <span className="text-[11px] font-bold tracking-widest text-[#d4af37] uppercase flex items-center gap-1.5">
              <Settings size={13} /> Relational Column Architecture
            </span>
            <button onClick={() => setShowColSettings(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
              <X size={13} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {columnsConfig.map((col, idx) => (
              <div key={col.key} className="p-2 border border-white/5 bg-[var(--color-card-bg)]/60 rounded flex flex-col gap-1.5 w-44">
                <div className="flex items-center justify-between gap-1 overflow-hidden">
                  <span className="text-xs font-semibold truncate text-[var(--color-text-main)]" title={col.label}>{col.label}</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => duplicateColumnHandler(col.key)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                      title="Duplicate column"
                    >
                      <Copy size={9} />
                    </button>
                    {!readOnly && col.key.startsWith('custom_') && (
                      <button 
                        onClick={() => deleteColumnHandler(col.key)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete custom column"
                      >
                        <Trash2 size={9} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[9px] text-[var(--color-text-muted)] flex justify-between">
                  <span>Width: {col.width || 150}px</span>
                  <span className="uppercase text-amber-500/80 font-bold">{col.type || 'text'}</span>
                </div>

                <div className="flex items-center justify-between gap-1 mt-1 border-t border-white/5 pt-1.5">
                  <label className="flex items-center gap-1.5 text-[9px] text-[var(--color-text-muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.visible !== false}
                      onChange={(e) => {
                        const val = e.target.checked;
                        handleColumnsChange(columnsConfig.map(c => c.key === col.key ? { ...c, visible: val } : c));
                      }}
                      className="accent-[#d4af37]"
                    />
                    <span>Visible</span>
                  </label>

                  <div className="flex items-center gap-0.5">
                    <button
                      disabled={idx === 0}
                      onClick={() => {
                        const re = [...columnsConfig];
                        const temp = re[idx];
                        re[idx] = re[idx - 1];
                        re[idx - 1] = temp;
                        handleColumnsChange(re);
                      }}
                      className="px-1.5 py-0.5 bg-[var(--color-background)] hover:bg-[var(--color-background)] disabled:opacity-20 border border-white/5 rounded text-[8px]"
                    >
                      ◀
                    </button>
                    <button
                      disabled={idx === columnsConfig.length - 1}
                      onClick={() => {
                        const re = [...columnsConfig];
                        const temp = re[idx];
                        re[idx] = re[idx + 1];
                        re[idx + 1] = temp;
                        handleColumnsChange(re);
                      }}
                      className="px-1.5 py-0.5 bg-[var(--color-background)] hover:bg-[var(--color-background)] disabled:opacity-20 border border-white/5 rounded text-[8px]"
                    >
                      ▶
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- RENDER GRID SPREADSHEET VIEW --- */}
      <div className="relative border border-white/[0.04] bg-[var(--color-background)]/40 rounded-lg overflow-hidden shadow-2xl backdrop-blur-sm">
          
          {/* STICKY COLUMN GRIDS HEADERS SCROLL WRAPPER */}
          <div ref={headerScrollRef} className="overflow-hidden border-b border-white/[0.06] bg-[#0d0d0f] relative">
            <table className="w-full text-left border-collapse table-fixed select-none" style={{ minWidth: `${totalVisibleColsWidth}px` }}>
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0d0d0f] text-[10px] tracking-widest font-bold uppercase text-[var(--color-text-muted)]">
                  
                  {/* Ledger indexes row numbering selector */}
                  <th className="py-2.5 px-2 w-[55px] text-center bg-[#0d0d0f] select-none sticky left-0 z-50 border-r border-[#0d0d0f]" style={{ width: '55px' }}>
                    <div className="flex items-center justify-center gap-1.5 h-full w-full">
                      <input 
                        type="checkbox" 
                        checked={processedData.length > 0 && selectedRows.size === processedData.length}
                        onChange={() => {
                          if (selectedRows.size === processedData.length) {
                            setSelectedRows(new Set());
                          } else {
                            setSelectedRows(new Set(processedData.map(r => String(r.id || r.sku || r.name))));
                          }
                        }}
                        className="accent-[#d4af37] scale-100 cursor-pointer"
                        title="Select all rows"
                      />
                      <span className="text-[9px]">#</span>
                    </div>
                  </th>
                  
                  {columnsConfig.filter(col => col.visible !== false).map((col, colIdx) => {
                    const isFrozen = colIdx < frozenColumns;
                    const headerStyle: React.CSSProperties = {
                      width: `${col.width || 150}px`,
                      minWidth: `${col.width || 150}px`,
                      maxWidth: `${col.width || 150}px`,
                      ...(isFrozen ? {
                        position: 'sticky',
                        left: `${getCumulativeLeft(colIdx)}px`,
                        zIndex: 45,
                      } : {})
                    };

                    return (
                      <th
                        key={col.key}
                        style={headerStyle}
                        draggable
                        onDragStart={() => handleColDragStart(colIdx)}
                        onDragOver={(e) => handleColDragOver(e, colIdx)}
                        onDrop={() => handleColDrop(colIdx)}
                        onContextMenu={(e) => handleHeaderRightClick(e, col.key)}
                        className={`py-3 px-3 relative border-r border-white/[0.04] select-none cursor-grab group/header ${
                          isFrozen ? 'bg-[#0f0f12] border-r-2 border-white/[0.1]' : 'bg-[#09090b]'
                        }`}
                      >
                        <div className="flex items-center justify-between max-w-full">
                          <div className="flex items-center gap-1.5 truncate">
                            {getColumnIcon(col.type, erpContext?.config?.currencySymbol)}
                            <span 
                              className="truncate font-sans font-bold text-[var(--color-text-main)]" 
                              title="Double click to rename column inline"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                if (readOnly) return;
                                const n = prompt(`Enter new label for "${col.label}":`, col.label);
                                if (n) {
                                  handleColumnsChange(columnsConfig.map(c => c.key === col.key ? { ...c, label: n.toUpperCase() } : c));
                                }
                              }}
                            >
                              {col.label}
                            </span>
                          </div>
                          <div className="opacity-0 group-hover/header:opacity-100 flex items-center shrink-0 ml-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColumnsChange(columnsConfig.map(c => c.key === col.key ? { ...c, width: Math.max(70, (col.width || 150) + 20) } : c));
                              }}
                              className="p-0.5 hover:text-[var(--color-text-main)] rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Col border drags resize action node */}
                        <div
                          onMouseDown={(e) => handleColResizeStart(e, col.key, col.width || 150)}
                          className="absolute right-0 top-0 bottom-0 w-1 px-1.5 cursor-col-resize hover:bg-[#d4af37]/60 group-hover/header:bg-[rgba(255,255,255,0.06)] z-30 transition-all select-none"
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
            </table>
          </div>
                {/* VIRTUALIZED SPREADSHEEET ROWS CELLS WRAPPERS */}
          {(() => {
            const Row = React.useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
              const row = processedData[index];
              if (!row) return null;
              const customHeight = rowHeights[index] || 32;

              const rowStyle: React.CSSProperties = {
                ...style,
                height: `${customHeight}px`,
                display: 'flex',
                alignItems: 'center',
                width: `${totalVisibleColsWidth + 55}px`,
              };

              return (
                <div 
                  key={row.id || index}
                  style={rowStyle}
                  className="absolute left-0 right-0 border-b border-white/[0.04] transition-colors hover:bg-[rgba(255,255,255,0.015)] group/row flex"
                >
                  {/* Interactive Drag handles with numbered index counts */}
                  <div
                    draggable
                    onDragStart={() => handleRowDragStart(index)}
                    onDragOver={(e) => handleRowDragOver(e, index)}
                    onDrop={() => handleRowDrop(index)}
                    className="py-1 px-2 text-center bg-[var(--color-background)]/85 border-r border-white/[0.08] text-[var(--color-text-muted)] font-bold sticky left-0 z-30 flex items-center justify-center gap-1.5 cursor-grab shrink-0 font-mono"
                    style={{ height: `${customHeight}px`, width: '55px', minWidth: '55px', maxWidth: '55px' }}
                  >
                    <span className="opacity-30 group-hover/row:opacity-100 text-[9px] select-none text-[var(--color-text-muted)]">⋮⋮</span>
                    <input 
                      type="checkbox"
                      checked={selectedRows.has(String(row.id || row.sku || row.name))}
                      onChange={() => {
                        const key = String(row.id || row.sku || row.name);
                        const next = new Set(selectedRows);
                        if (next.has(key)) {
                          next.delete(key);
                        } else {
                          next.add(key);
                        }
                        setSelectedRows(next);
                      }}
                      className="accent-[#d4af37] scale-90 cursor-pointer shrink-0"
                    />
                    <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">{index + 1}</span>
                    
                    {/* Row drags resize handles */}
                    <div
                      onMouseDown={(e) => handleRowResizeStart(e, index, customHeight)}
                      className="absolute bottom-0 left-0 right-0 h-1 hover:bg-[#d4af37]/40 cursor-row-resize z-20"
                    />
                  </div>

                  {columnsConfig.filter(col => col.visible !== false).map((col, colIdx) => {
                    const isFrozen = colIdx < frozenColumns;
                    const cellKey = col.key;
                    const rawVal = row[cellKey];
                    const selected = isCellSelected(index, cellKey);
                    const isEditingState = editingCell?.rowIndex === index && editingCell?.colKey === cellKey;

                    const cellStyle: React.CSSProperties = {
                      height: `${customHeight}px`,
                      width: `${col.width || 150}px`,
                      minWidth: `${col.width || 150}px`,
                      maxWidth: `${col.width || 150}px`,
                      padding: '4px 8px',
                      verticalAlign: 'middle',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      ...(isFrozen ? {
                        position: 'sticky',
                        left: `${getCumulativeLeft(colIdx) + 55}px`,
                        zIndex: 25,
                      } : {})
                    };

                    const renderCellContents = () => {
                      if (col.type === 'formula' && col.formulaExpr) {
                        const calc = getEvaluatedFormula(col.formulaExpr, row);
                        return <span className="text-[#d4af37] font-bold font-mono">{calc}</span>;
                      }

                      if (col.type === 'checkbox') {
                        return (
                          <input
                            type="checkbox"
                            checked={!!rawVal}
                            onChange={(e) => {
                              if (readOnly) return;
                              const next = [...gridData];
                              next[index] = { ...next[index], [cellKey]: e.target.checked };
                              handleDataChange(next);
                            }}
                            className="accent-[#d4af37] cursor-pointer scale-110"
                          />
                        );
                      }

                      if (col.type === 'rating') {
                        return (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => {
                                  if (readOnly) return;
                                  const next = [...gridData];
                                  next[index] = { ...next[index], [cellKey]: star };
                                  handleDataChange(next);
                                }}
                                className="focus:outline-none text-yellow-500 hover:scale-110 cursor-pointer"
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        );
                      }

                      if (col.type === 'priority') {
                        const p = String(rawVal || '').toLowerCase();
                        return (
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            p.includes('hi') ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
                            p.includes('med') ? 'bg-yellow-950/40 text-yellow-300 border border-yellow-500/20' :
                            'bg-green-950/40 text-green-400 border border-green-500/20'
                          }`}>
                            {rawVal || 'Low'}
                          </span>
                        );
                      }

                      if (col.type === 'status') {
                        return (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-bold border border-white/5 uppercase text-[9px]">
                            {rawVal || 'DRAFT'}
                          </span>
                        );
                      }

                      if (col.type === 'image') {
                        return rawVal ? (
                          <div className="flex items-center gap-1.5">
                            <img 
                              src={rawVal} 
                              alt="thumb" 
                              referrerPolicy="no-referrer"
                              onClick={() => setEnlargedImage(rawVal)}
                              className="w-6 h-6 object-cover rounded border border-white/10 hover:border-[#d4af37] cursor-zoom-in"
                            />
                            <span className="text-[10px] text-[var(--color-text-muted)] truncate block max-w-[80px]">{rawVal}</span>
                          </div>
                        ) : <span className="text-[var(--color-text-muted)] italic">No image</span>;
                      }

                      if (col.type === 'file') {
                        return rawVal ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--color-card-bg)] border border-white/5 py-0.5 px-1.5 rounded text-[var(--color-text-main)] hover:text-[var(--color-text-main)]">
                            <FileText size={10} className="text-[#d4af37]" /> {String(rawVal).substring(0, 15)}
                          </span>
                        ) : '-';
                      }

                      if (col.type === 'currency') {
                        return <span className="font-mono text-emerald-400 font-semibold">{formatMoney(rawVal)}</span>;
                      }

                      if (col.type === 'percentage') {
                        return <span className="font-mono text-teal-400 font-semibold">{Number(rawVal || 0).toFixed(1)}%</span>;
                      }

                      if (col.type === 'url' && rawVal) {
                        return (
                          <a href={rawVal} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-0.5">
                            {String(rawVal).substring(0, 18)}...
                          </a>
                        );
                      }

                      // AI Operations Integrals
                      if (col.type === 'aiSummary' || col.type === 'aiForecast' || col.type === 'aiRecommendation') {
                        if (rawVal) {
                          return (
                            <div className="group/ai flex items-start gap-1 p-0.5 w-full">
                              <Brain size={11} className="text-amber-300 shrink-0 mt-0.5" />
                              <span className="text-[var(--color-text-main)] italic text-[10px] whitespace-normal leading-relaxed">{rawVal}</span>
                              {!readOnly && (
                                <button 
                                  onClick={() => runAICellAction(index, cellKey, col.type as any)}
                                  className="opacity-0 group-hover/ai:opacity-100 p-0.5 hover:text-[#d4af37] ml-auto shrink-0 cursor-pointer"
                                  title="Re-run core intelligence reasoning"
                                >
                                  <RefreshCw size={9} />
                                </button>
                              )}
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={() => runAICellAction(index, cellKey, col.type as any)}
                            disabled={generatingCell?.rowIndex === index && generatingCell?.colKey === cellKey}
                            className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 active:scale-95 text-[9px] rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {generatingCell?.rowIndex === index && generatingCell?.colKey === cellKey ? (
                              <>
                                <RefreshCw size={9} className="animate-spin text-amber-300" />
                                <span>REASONING...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles size={9} className="text-amber-300" />
                                <span>Generate ✨</span>
                              </>
                            )}
                          </button>
                        );
                      }

                      return <span className="truncate block font-sans text-[var(--color-text-main)]">{rawVal === undefined || rawVal === null ? '-' : String(rawVal)}</span>;
                    };

                    return (
                      <div
                        key={cellKey}
                        style={cellStyle}
                        onContextMenu={(e) => handleCellRightClick(e, index, cellKey)}
                        onClick={(e) => handleCellClick(index, cellKey, e.shiftKey)}
                        onDoubleClick={() => startCellEdit(index, cellKey)}
                        className={`border-r border-white/[0.04] transition-all overflow-hidden shrink-0 ${
                          selected ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
                        } ${isFrozen ? 'bg-[#0f0f12] border-r-2 border-white/[0.08] z-25' : 'bg-[#09090b]/85'}`}
                      >
                        {isEditingState ? (
                          <div className="absolute inset-0 p-1 bg-[var(--color-background)] z-30 flex items-center" onClick={(e) => e.stopPropagation()}>
                            {(col.type as string) === 'select' || col.type === 'priority' || col.type === 'status' || !!col.selectOptions ? (
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitCellEdit}
                                className="w-full bg-[var(--color-card-bg)] border border-white/20 text-[var(--color-text-main)] rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-[#d4af37] focus:outline-none font-sans"
                                autoFocus
                              >
                                <option value="">-- select option --</option>
                                {(col.selectOptions || ['High', 'Medium', 'Low', 'Silver Member', 'Gold Sovereign', 'Arch Elite VIP', 'Operational', 'Under Maintenance', 'Retired Class', 'Spare Inventory', 'Production Machine', 'Facility / Logistics', 'Office & Tech IT', 'Vehicles & Heavy Rig', 'Finished Sample Asset', 'INFLOW', 'OUTFLOW']).map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : col.type === 'longText' ? (
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitCellEdit}
                                rows={2}
                                className="w-full bg-[var(--color-card-bg)] border border-[#d4af37] text-white rounded p-1 text-xs focus:outline-none resize-none font-sans"
                                autoFocus
                              />
                            ) : (
                              <input
                                type="text"
                                className="w-full bg-[var(--color-card-bg)] border border-[#d4af37] text-white rounded px-1.5 py-0.5 text-xs focus:outline-none font-sans select-all"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={commitCellEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitCellEdit();
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                autoFocus
                              />
                            )}
                            <button onClick={commitCellEdit} className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer">
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center w-full h-full max-w-full truncate">
                            {renderCellContents()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }, [
              processedData,
              rowHeights,
              selectedRows,
              editingCell,
              columnsConfig,
              frozenColumns,
              readOnly,
              isCellSelected,
              editValue,
              generatingCell,
              commitCellEdit,
              getCumulativeLeft,
              getEvaluatedFormula,
              formatMoney,
              handleCellClick,
              handleCellRightClick,
              handleRowDragStart,
              handleRowDragOver,
              handleRowDrop,
              handleRowResizeStart,
              runAICellAction,
              totalVisibleColsWidth
            ]);

            const handleScrollEvent = (e: React.UIEvent<HTMLDivElement>) => {
              const target = e?.currentTarget as HTMLElement | undefined;
              if (target && headerScrollRef.current) {
                headerScrollRef.current.scrollLeft = target.scrollLeft;
              }
            };

            return processedData.length > 0 ? (
              <div
                ref={listRef}
                className="scrollbar-custom relative bg-[#09090b]/45 overflow-auto"
                onScroll={handleScrollEvent}
                style={{ height: `${Math.min(640, Math.max(150, processedData.length * 36 + 10))}px`, width: '100%' }}
              >
                {processedData.map((_, index) => (
                  <Row key={index} index={index} style={{ height: `${rowHeights[index] || 32}px` }} />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center text-[var(--color-text-muted)] italic font-sans bg-[#0c0c0e]/30 border-b border-white/[0.04]">
                No matching data indexes stored in current view. Create records to begin analytics.
              </div>
            );
          })()}

          {/* ADD ROW BOTTOM TRIGGER */}
          {allowAddRow && !readOnly && (
            <div className="p-2 border-t border-white/[0.04] bg-[#0c0c0e] flex items-center justify-start">
              <button
                onClick={handleAddNewRow}
                className="px-3 py-1.5 rounded bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] text-[var(--color-text-main)] hover:text-[var(--color-text-main)] flex items-center gap-1.5 font-bold text-[10px] tracking-wide uppercase transition-all"
              >
                <Plus size={13} className="text-[#d4af37]" />
                <span>Append Operational Database Row</span>
              </button>
            </div>
          )}

        </div>

      {/* --- RIGHT-CLICK POPPORTAL CONTEXT MENU --- */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-[100] bg-[#0c0c0f] border border-white/[0.08] text-[var(--color-text-main)] py-1.5 px-1 rounded-md shadow-2xl backdrop-blur-md min-w-[170px] flex flex-col gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'cell' && contextMenu.rowIndex !== undefined && (
            <>
              <div className="px-2 py-1 text-[9px] text-[#d4af37] font-bold border-b border-white/5 uppercase tracking-wider select-none">
                Cell Index #{contextMenu.rowIndex + 1} Action
              </div>
              <button
                onClick={() => {
                  if (contextMenu.rowIndex !== undefined && contextMenu.colKey) {
                    startCellEdit(contextMenu.rowIndex, contextMenu.colKey);
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-[#d4af37]/15 hover:text-white rounded text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>✎ Edit Cell Inline</span>
              </button>
              <button
                onClick={() => {
                  if (contextMenu.rowIndex !== undefined) {
                    duplicateRowHandler(contextMenu.rowIndex);
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-[var(--color-card-bg)] rounded text-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>❐ Duplicate Row Dataset</span>
              </button>
              <button
                onClick={() => {
                  if (contextMenu.rowIndex !== undefined && contextMenu.colKey) {
                    const next = [...gridData];
                    next[contextMenu.rowIndex][contextMenu.colKey] = '';
                    handleDataChange(next);
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-[var(--color-card-bg)] text-yellow-300 rounded text-xs cursor-pointer"
              >
                Clear Cell Value
              </button>
              <button
                onClick={() => {
                  if (contextMenu.rowIndex !== undefined) {
                    deleteRowHandler(contextMenu.rowIndex);
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-red-950/20 text-red-400 rounded text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={11} />
                <span>Delete Data Row</span>
              </button>
            </>
          )}

          {contextMenu.type === 'header' && contextMenu.colKey && (
            <>
              <div className="px-2 py-1 text-[9px] text-[#d4af37] font-bold border-b border-white/5 uppercase tracking-wider select-none">
                Column Ops: {contextMenu.colKey.toUpperCase()}
              </div>
              <button
                onClick={() => {
                  if (contextMenu.colKey) {
                    const col = columnsConfig.find(c => c.key === contextMenu.colKey);
                    const n = prompt(`Rename core column "${col?.label}":`, col?.label);
                    if (n) {
                      handleColumnsChange(columnsConfig.map(c => c.key === contextMenu.colKey ? { ...c, label: n.toUpperCase() } : c));
                    }
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-[var(--color-card-bg)] rounded text-xs cursor-pointer"
              >
                Rename Column
              </button>
              <button
                onClick={() => {
                  if (contextMenu.colKey) {
                    duplicateColumnHandler(contextMenu.colKey);
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-[var(--color-card-bg)] rounded text-xs cursor-pointer"
              >
                Duplicate Column
              </button>
              <button
                onClick={() => {
                  if (contextMenu.colKey) {
                    handleColumnsChange(columnsConfig.map(c => c.key === contextMenu.colKey ? { ...c, visible: false } : c));
                  }
                  setContextMenu(null);
                }}
                className="text-left px-2 py-1 hover:bg-[var(--color-card-bg)] rounded text-xs cursor-pointer text-[var(--color-text-muted)]"
              >
                Hide This Column
              </button>
              {!readOnly && contextMenu.colKey.startsWith('custom_') && (
                <button
                  onClick={() => {
                    if (contextMenu.colKey) {
                      deleteColumnHandler(contextMenu.colKey);
                    }
                    setContextMenu(null);
                  }}
                  className="text-left px-2 py-1 hover:bg-red-950/20 text-red-400 rounded text-xs cursor-pointer"
                >
                  Delete Column
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* --- NEW ADD COLUMN OVERLAY MODAL --- */}
      {showAddColModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b0b0d] border border-white/10 p-5 rounded-lg max-w-sm w-full space-y-4 text-[var(--color-text-main)]">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] border-b border-white/5 pb-2">
              Inject Custom Database Column
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase block mb-1">Column Name</label>
                <input
                  type="text"
                  placeholder="e.g. TAX_RATE"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  className="w-full bg-[var(--color-card-bg)] border border-white/10 rounded px-2.5 py-1.5 focus:border-[#d4af37] focus:outline-none uppercase text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--color-text-muted)] uppercase block mb-1">Architectural Type</label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value as ColumnType)}
                  className="w-full bg-[var(--color-card-bg)] border border-white/10 rounded px-2.5 py-1.5 focus:border-[#d4af37] focus:outline-none text-white font-sans"
                >
                  <option value="text">Short Text (📝)</option>
                  <option value="longText">Paragraph Text (📓)</option>
                  <option value="number">Numeric Index (🔢)</option>
                  <option value="currency">Currency Ledger (💵)</option>
                  <option value="percentage">Percentage (📊)</option>
                  <option value="checkbox">Boolean Toggle (☑️)</option>
                  <option value="rating">Satisfaction Rating (★)</option>
                  <option value="priority">Priority Stamp (🔴)</option>
                  <option value="status">Status Ledger (🏷️)</option>
                  <option value="date">Scheduled Date (📅)</option>
                  <option value="url">Hyperlink Anchor (🔗)</option>
                  <option value="image">Asset Image URL (🖼️)</option>
                  <option value="formula">Excel Formula (ƒ)</option>
                  <option value="aiSummary">AI Row Summary (✨)</option>
                  <option value="aiForecast">AI Future Forecast (🔮)</option>
                  <option value="aiRecommendation">AI Action advisor (💡)</option>
                </select>
              </div>

              {newColType === 'formula' && (
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase block mb-1">Formula String Math expression</label>
                  <input
                    type="text"
                    placeholder="e.g. {qty} * {capital_value}"
                    value={newColFormula}
                    onChange={(e) => {
                      setNewColFormula(e.target.value);
                      setFormulaError(null);
                    }}
                    className="w-full bg-[var(--color-card-bg)] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                  <span className="text-[8px] text-[var(--color-text-muted)] leading-tight mt-1 block">
                    Use braces to encapsulate column names like <code className="text-[#d4af37] font-bold">{"{VAL}"}</code>. Simple symbols supported: +, -, *, /, %, (, ).
                  </span>
                  {formulaError && (
                    <p className="text-[10px] text-red-400 font-mono mt-1.5 bg-red-950/20 border border-red-500/10 rounded p-1.5 animate-fadeIn">
                      ⚠️ {formulaError}
                    </p>
                  )}
                </div>
              )}

              {newColType === 'status' && (
                <div>
                  <label className="text-[10px] text-[var(--color-text-muted)] uppercase block mb-1">Tag Options (comma separated)</label>
                  <input
                    type="text"
                    placeholder="DRAFT, SHIPPED, PENDING"
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    className="w-full bg-[var(--color-card-bg)] border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/5 pt-3">
              <button
                onClick={() => setShowAddColModal(false)}
                className="px-3 py-1.5 bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] text-[var(--color-text-muted)] rounded text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={createCustomColumn}
                disabled={!newColLabel.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-[var(--color-text-main)] rounded text-xs font-bold disabled:opacity-45"
              >
                Inject Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ENLARGED IMAGE DIALOG POPUP --- */}
      {enlargedImage && (
        <div 
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border border-white/10">
            <img 
              src={enlargedImage} 
              alt="large" 
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] object-contain" 
            />
            <button 
              onClick={() => setEnlargedImage(null)}
              className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-[var(--color-background)] rounded-full text-[var(--color-text-main)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
