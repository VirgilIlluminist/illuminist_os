import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import CurrencyInput from '../../../shared/components/CurrencyInput';
import { 
  Database, 
  Grid3X3, 
  KanbanSquare, 
  Sparkles, 
  Plus, 
  EyeOff, 
  ArrowUpDown, 
  Download, 
  Layers, 
  Search, 
  Link, 
  Tag, 
  Hash, 
  Move, 
  Check, 
  Type, 
  ChevronDown, 
  Sliders, 
  Palette, 
  X, 
  Upload, 
  Coins, 
  Maximize2,
  Minimize2,
  Trash2,
  Calendar,
  BarChart4,
  Split,
  MessageSquare,
  HelpCircle,
  Zap,
  Info,
  Filter,
  Lock,
  Unlock,
  Copy,
  Settings,
  Play,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Material, MasterProduct, SampleDevelopment, SalesRecord } from '../../../core/types';
import { validateFormulaSyntax, detectCircularReferences } from '../../../shared/table/SmartTable';

interface CellMetadata {
  highlight?: string; // hex or bg class
  comment?: string;
  icon?: string;
  aiApproved?: boolean;
  isLocked?: boolean;
}

interface SandboxTable {
  id: string;
  title: string;
  titleKey: 'materials' | 'products' | 'samples' | 'sales';
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  isMaximized: boolean;
  view: 'spreadsheet' | 'kanban' | 'gallery' | 'calendar' | 'analytics' | 'timeline' | 'chart' | 'split';
  themePreset: 'gold' | 'emerald' | 'crimson' | 'indigo' | 'amethyst' | 'platinum';
  opacity: number;
  blur: number;
  alternatingRows: boolean;
  density: 'high' | 'normal' | 'relaxed';
}

export default function SmartTablesView() {
  const {
    materials,
    products,
    samples,
    sales,
    computedMaterials,
    computedProducts,
    computedSamples,
    computedProduction,
    computedSales,
    setMaterials,
    setProducts,
    setSamples,
    setSales,
    config,
    updateConfig,
    formatMoney,
    t,
    addNotification
  } = useERP();

  // Mode state: Focus Desk Mode (classic single full table) vs Sandbox Canvas (multi floats)
  const [interfaceMode, setInterfaceMode] = useState<'focus' | 'sandbox'>('focus');

  // Multi-window sandbox states
  const [sandboxTables, setSandboxTables] = useState<SandboxTable[]>([
    {
      id: 'win-materials',
      title: 'Materials Sourcing Library',
      titleKey: 'materials',
      x: 20,
      y: 110,
      w: 580,
      h: 460,
      zIndex: 10,
      isMaximized: false,
      view: 'spreadsheet',
      themePreset: 'gold',
      opacity: 75,
      blur: 12,
      alternatingRows: true,
      density: 'high'
    },
    {
      id: 'win-products',
      title: 'Master Collection Products',
      titleKey: 'products',
      x: 630,
      y: 110,
      w: 580,
      h: 460,
      zIndex: 20,
      isMaximized: false,
      view: 'spreadsheet',
      themePreset: 'indigo',
      opacity: 80,
      blur: 10,
      alternatingRows: true,
      density: 'normal'
    },
    {
      id: 'win-samples',
      title: 'Sampling Prototypes Check',
      titleKey: 'samples',
      x: 80,
      y: 540,
      w: 520,
      h: 420,
      zIndex: 15,
      isMaximized: false,
      view: 'kanban',
      themePreset: 'amethyst',
      opacity: 70,
      blur: 8,
      alternatingRows: false,
      density: 'normal'
    },
    {
      id: 'win-sales',
      title: 'Active Sales Ledger Tracking',
      titleKey: 'sales',
      x: 690,
      y: 540,
      w: 520,
      h: 420,
      zIndex: 25,
      isMaximized: false,
      view: 'analytics',
      themePreset: 'emerald',
      opacity: 75,
      blur: 15,
      alternatingRows: true,
      density: 'relaxed'
    }
  ]);

  // Active collection selection (for Focus Desk Mode)
  const [activeCollection, setActiveCollection] = useState<'materials' | 'products' | 'samples' | 'sales'>('materials');
  const [viewLayout, setViewLayout] = useState<SandboxTable['view']>('spreadsheet');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Settings drawers
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [showSizingPanel, setShowSizingPanel] = useState(false);
  const [showAIAudit, setShowAIAudit] = useState(false);
  const [showFormulaMap, setShowFormulaMap] = useState(false);

  // Custom User Formulas Storage
  // Key format: `${collection}_${rowId}_${colKey}`
  const [customFormulas, setCustomFormulas] = useState<Record<string, string>>({
    'materials_MAT-001_custom_lead_time': '=14',
    'materials_MAT-002_custom_eco_rating': '="Deadstock Hemp"',
    'products_PROD-001_custom_designer_name': '="Atelier Core Design"',
    'products_PROD-001_sellingPrice': '=120 * 1.5'
  });

  // Highlight, Comment & Lock states
  const [cellMetadata, setCellMetadata] = useState<Record<string, CellMetadata>>({
    'materials_MAT-001_id': { comment: 'High priority waterproof grade', highlight: 'rgba(212, 175, 55, 0.15)', icon: '⭐', isLocked: false },
    'materials_MAT-002_remainingQty': { highlight: 'rgba(239, 68, 68, 0.15)', comment: 'Stock falling near automated trigger threshold', icon: '⚠️' },
    'products_PROD-001_sellingPrice': { highlight: 'rgba(16, 185, 129, 0.15)', icon: '💎' }
  });

  // Selected cell & context menu details
  const [selectedCell, setSelectedCell] = useState<{ tableKey: string; rowId: string; colKey: string; rowIndex: number; colIndex: number } | null>(null);

  // Real-time formula validation for formula bar
  const realTimeSyntaxError = useMemo(() => {
    if (!selectedCell) return null;
    const key = `${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`;
    const val = customFormulas[key] || '';
    if (!val || !val.startsWith('=')) return null;

    const test = validateFormulaSyntax(val);
    if (!test.isValid) return test.error;

    // Self-reference check
    const deps = val.replace('=', '').match(/\[(.*?)\]/g) || [];
    if (deps.some(d => d === `[${selectedCell.colKey}]`)) {
      return `Circular Reference: formula references its own cell [${selectedCell.colKey}]`;
    }
    return null;
  }, [selectedCell, customFormulas]);
  const [hoveredCell, setHoveredCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [contextMenuCell, setContextMenuCell] = useState<{ x: number; y: number; tableKey: string; rowId: string; colKey: string } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Column Headers state
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerEditVal, setHeaderEditVal] = useState<string>('');

  // Multi-column sorting arrays
  const [multiFilters, setMultiFilters] = useState<Array<{ field: string; op: 'contains' | '^' | '>' | '<'; val: string }>>([]);
  const [filterDrawer, setFilterDrawer] = useState(false);

  // Snapping setting
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Window drag & resize handlers
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
  const [resizeStartSize, setResizeStartSize] = useState({ w: 0, h: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });

  // Custom added Column definitions
  const [showAddCustomCol, setShowAddCustomCol] = useState(false);
  const [newCol, setNewCol] = useState({ label: '', type: 'text' });
  const [customColumns, setCustomColumns] = useState<Record<string, Array<{ key: string; label: string; type: string }>>>({
    materials: [
      { key: 'custom_lead_time', label: 'Lead Time (Days)', type: 'number' },
      { key: 'custom_eco_rating', label: 'Eco Material Class', type: 'tag' }
    ],
    products: [
      { key: 'custom_designer_name', label: 'Assigned Designer', type: 'text' }
    ],
    samples: [],
    sales: []
  });

  // Track frozen elements
  const [frozenColumns, setFrozenColumns] = useState<string[]>(['id']);

  // Custom column widths
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    id: 110,
    name: 240,
    category: 155,
    costPerUnit: 140,
    remainingQty: 160,
    stockStatus: 165,
    collection: 155,
    sellingPrice: 150,
    finalHPP: 150,
    marginPercentage: 170,
    productName: 240,
    version: 120,
    usageQty: 150,
    status: 140,
    qtySold: 140,
    pricePerPcs: 140,
    netRevenue: 155,
    custom_lead_time: 140,
    custom_eco_rating: 150,
    custom_designer_name: 160
  });

  // Local static overrides mapping
  const [materialsOverride, setMaterialsOverride] = useState<Record<string, any>>({});

  // Core Schema dictionary
  const getBaseSchema = (key: 'materials' | 'products' | 'samples' | 'sales') => {
    const baseCols: Record<string, Array<{ key: string; label: string; type: string }>> = {
      materials: [
        { key: 'id', label: 'Material ID', type: 'relation' },
        { key: 'name', label: 'Material Text Name', type: 'text' },
        { key: 'category', label: 'Category Option', type: 'tag' },
        { key: 'costPerUnit', label: 'Unit Sourcing Cost', type: 'number' },
        { key: 'remainingQty', label: 'Remaining Stock Quantity', type: 'number' },
        { key: 'stockStatus', label: 'Safe status threshold', type: 'tag' }
      ],
      products: [
        { key: 'id', label: 'Product ID', type: 'relation' },
        { key: 'name', label: 'Collection Name', type: 'text' },
        { key: 'collection', label: 'Seasons Campaign', type: 'tag' },
        { key: 'sellingPrice', label: 'Selling Pricing Tag', type: 'number' },
        { key: 'finalHPP', label: 'Aggregate COGS HPP', type: 'formula' },
        { key: 'marginPercentage', label: 'Expected Profit margin %', type: 'formula' }
      ],
      samples: [
        { key: 'id', label: 'Sample ID', type: 'relation' },
        { key: 'productName', label: 'Linked product block', type: 'text' },
        { key: 'version', label: 'Tech Edition Check', type: 'tag' },
        { key: 'usageQty', label: 'Pattern Usage Unit', type: 'number' },
        { key: 'status', label: 'Fulfillment status', type: 'tag' }
      ],
      sales: [
        { key: 'id', label: 'Sales ID', type: 'relation' },
        { key: 'productName', label: 'Retail Item', type: 'text' },
        { key: 'qtySold', label: 'Purchase items', type: 'number' },
        { key: 'pricePerPcs', label: 'List Price Unit', type: 'number' },
        { key: 'netRevenue', label: 'Net Receipts after Fees', type: 'formula' },
        { key: 'status', label: 'Delivery Status', type: 'tag' }
      ]
    };
    return baseCols[key];
  };

  const activeColor = config?.customAccentColor || '#d4af37';
  const tableFontSize = config?.tableFontSize || 11;
  const tablePadding = config?.tableRowPadding || 8;
  const appScale = config?.appScale || 100;
  const cardWidth = config?.tableCardWidth || 280;

  // Formula Evaluator Function
  const evaluateCellFormula = (tableKey: string, row: any, colKey: string, rawVal: any): any => {
    const formulaKey = `${tableKey}_${row.id}_${colKey}`;
    const formula = customFormulas[formulaKey];
    if (!formula || !formula.startsWith('=')) {
      return rawVal;
    }

    try {
      let expression = formula.substring(1).trim();

      // Clean brackets representing other field variables e.g. [costPerUnit]
      const bracketRegex = /\[(.*?)\]/g;
      let match;
      while ((match = bracketRegex.exec(expression)) !== null) {
        const fieldName = match[1];
        let val = row[fieldName];
        if (val === undefined) {
          // Fallback parsing from sibling tables or fallback
          val = 0;
        }
        expression = expression.replace(`[${fieldName}]`, String(val));
      }

      // Handle margin custom function
      if (expression.startsWith('MARGIN(')) {
        const inner = expression.replace('MARGIN(', '').replace(')', '');
        const parts = inner.split(',').map(p => p.trim());
        const sell = parseFloat(row[parts[0]] ?? parts[0]);
        const hpp = parseFloat(row[parts[1]] ?? parts[1]);
        if (!sell) return 0;
        return ((sell - hpp) / sell) * 100;
      }

      // Handle custom AI suggestions
      if (expression.startsWith('AI_SUGGEST(')) {
        const itemText = String(row.name || row.productName || 'Material');
        if (itemText.toLowerCase().includes('cotton')) return 'Supplier: Obs Textiles, Quality: Premium. Risk: Low.';
        if (itemText.toLowerCase().includes('merino')) return 'Supplier: Obsidian Tokyo, Quality: Heavy Rib. Risk: Stock Low.';
        if (itemText.toLowerCase().includes('avant-garde')) return 'Waterproof Membrane. COGS optimization possible.';
        return 'Organic high-density weave. Safe status.';
      }

      if (expression.startsWith('UPPER(')) {
        const inner = expression.replace('UPPER(', '').replace(')', '').replace(/"/g, '');
        return String(row[inner] || inner).toUpperCase();
      }

      // Secure local Arithmetic calculations
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      return typeof result === 'number' ? result : formula;
    } catch (err) {
      return '#REF!';
    }
  };

  // Compile full table data utilizing custom calculations & multi-filtering
  const getCompiledData = (tableKey: 'materials' | 'products' | 'samples' | 'sales') => {
    let raw: any[] = [];
    if (tableKey === 'materials') {
      raw = computedMaterials.map(m => ({
        ...m,
        ...(materialsOverride[m.id] || {})
      }));
    } else if (tableKey === 'products') {
      raw = computedProducts;
    } else if (tableKey === 'samples') {
      raw = computedSamples;
    } else if (tableKey === 'sales') {
      raw = computedSales;
    }

    // Apply Live Formula calculations across the whole grid row item
    let processed = raw.map(row => {
      const entry = { ...row };
      const schemaCols = [...getBaseSchema(tableKey), ...(customColumns[tableKey] || [])];
      schemaCols.forEach(col => {
        const formulaKey = `${tableKey}_${row.id}_${col.key}`;
        if (customFormulas[formulaKey]) {
          entry[col.key] = evaluateCellFormula(tableKey, row, col.key, row[col.key]);
        }
      });
      return entry;
    });

    // Filtering by Search Term
    let filtered = processed.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Multi-criteria filters
    if (multiFilters.length > 0) {
      filtered = filtered.filter(row => {
        return multiFilters.every(f => {
          const val = String(row[f.field] || '').toLowerCase();
          const check = f.val.toLowerCase();
          if (f.op === 'contains') return val.includes(check);
          if (f.op === '^') return val.startsWith(check);
          const valNum = parseFloat(row[f.field]) || 0;
          const checkNum = parseFloat(f.val) || 0;
          if (f.op === '>') return valNum > checkNum;
          if (f.op === '<') return valNum < checkNum;
          return true;
        });
      });
    }

    // Sorting algorithm
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === 'asc' 
        ? String(aVal).localeCompare(String(bVal)) 
        : String(bVal).localeCompare(String(aVal));
    });
  };

  const focusRows = useMemo(() => {
    return getCompiledData(activeCollection);
  }, [activeCollection, computedMaterials, computedProducts, computedSamples, computedSales, searchTerm, sortField, sortOrder, customFormulas, multiFilters, materialsOverride]);

  const activeColumnsSchema = useMemo(() => {
    return [...getBaseSchema(activeCollection), ...(customColumns[activeCollection] || [])];
  }, [activeCollection, customColumns]);

  // Sizing adjust start
  const handleColResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;

    const handleMouseMove = (mv: MouseEvent) => {
      const delta = mv.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(70, startWidth + delta)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag Rows index handlers
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dragOverRowIndex, setDragOverRowIndex] = useState<number | null>(null);

  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverRowIndex(index);
  };

  const handleRowDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedRowIndex === null || draggedRowIndex === targetIdx) {
      setDraggedRowIndex(null);
      setDragOverRowIndex(null);
      return;
    }

    const sourceItem = focusRows[draggedRowIndex];
    const targetItem = focusRows[targetIdx];

    const reorderedHandler = (itemsList: any[], setItems: (v: any) => void) => {
      const copy = [...itemsList];
      const sIdx = copy.findIndex(item => item.id === sourceItem.id);
      const tIdx = copy.findIndex(item => item.id === targetItem.id);
      if (sIdx !== -1 && tIdx !== -1) {
        const [moved] = copy.splice(sIdx, 1);
        copy.splice(tIdx, 0, moved);
        setItems(copy);
      }
    };

    if (activeCollection === 'materials') reorderedHandler(materials, setMaterials);
    if (activeCollection === 'products') reorderedHandler(products, setProducts);
    if (activeCollection === 'samples') reorderedHandler(samples, setSamples);
    if (activeCollection === 'sales') reorderedHandler(sales, setSales);

    setDraggedRowIndex(null);
    setDragOverRowIndex(null);
  };

  // Inline cells updates persistence
  const handleCellEdit = (rowId: string, colKey: string, value: string) => {
    const isFormula = value.startsWith('=');
    const cellKey = `${activeCollection}_${rowId}_${colKey}`;

    if (isFormula) {
      const syntaxCheck = validateFormulaSyntax(value);
      if (!syntaxCheck.isValid) {
        if (addNotification) {
          addNotification(`Formula Syntax Error in ${colKey.toUpperCase()}: ${syntaxCheck.error}`, 'warning');
        }
        return;
      }

      // Check self-reference circular reference
      const deps = value.replace('=', '').match(/\[(.*?)\]/g) || [];
      const hasSelfReference = deps.some(d => d === `[${colKey}]`);
      if (hasSelfReference) {
        if (addNotification) {
          addNotification(`Circular reference warning: custom cell in ${colKey.toUpperCase()} references itself`, 'warning');
        }
        return;
      }

      setCustomFormulas(prev => ({ ...prev, [cellKey]: value }));
      setEditingCell(null);
      return;
    }

    // Is regular numeric update
    const isNumeric = colKey.toLowerCase().includes('qty') ||
                      colKey.toLowerCase().includes('price') ||
                      colKey.toLowerCase().includes('cost') ||
                      colKey.toLowerCase().includes('revenue') ||
                      colKey.toLowerCase().includes('spend') ||
                      colKey === 'sellingPrice' ||
                      colKey === 'usageQty' ||
                      colKey === 'qtySold' ||
                      colKey === 'pricePerPcs';

    let parsedVal: any = value;
    if (isNumeric) {
      parsedVal = parseFloat(value) || 0;
    }

    // Custom col override
    if (colKey.startsWith('custom_')) {
      setMaterialsOverride(prev => ({
        ...prev,
        [rowId]: {
          ...(prev[rowId] || {}),
          [colKey]: value
        }
      }));
      setEditingCell(null);
      return;
    }

    // Persist to Context state for real-time operations updating
    if (activeCollection === 'materials') {
      setMaterials(prev => prev.map(m => m.id === rowId ? { ...m, [colKey]: parsedVal } : m));
    } else if (activeCollection === 'products') {
      setProducts(prev => prev.map(p => p.id === rowId ? { ...p, [colKey]: parsedVal } : p));
    } else if (activeCollection === 'samples') {
      setSamples(prev => prev.map(s => s.id === rowId ? { ...s, [colKey]: parsedVal } : s));
    } else if (activeCollection === 'sales') {
      setSales(prev => prev.map(s => s.id === rowId ? { ...s, [colKey]: parsedVal } : s));
    }

    setEditingCell(null);
  };

  const handleAddColumn = () => {
    if (!newCol.label) return;
    const colKey = 'custom_' + newCol.label.toLowerCase().replace(/\s+/g, '_');
    setCustomColumns(prev => ({
      ...prev,
      [activeCollection]: [
        ...prev[activeCollection],
        { key: colKey, label: newCol.label, type: newCol.type }
      ]
    }));
    setShowAddCustomCol(false);
    setNewCol({ label: '', type: 'text' });
  };

  // Currency Switch Desk - supporting dynamic IDR and USD
  const currenciesList = [
    { code: 'IDR', symbol: 'Rp', rate: 1, name: 'Indonesian Rupiah (IDR)' },
    { code: 'USD', symbol: '$', rate: 15400, name: 'US Dollar ($)' }
  ];

  const handleCurrencySwitch = (item: typeof currenciesList[0]) => {
    updateConfig({
      activeCurrency: item.code,
      currencySymbol: item.symbol,
      currencyRate: item.rate
    });
  };

  type STVThemeKey = 'gold' | 'emerald' | 'crimson' | 'indigo' | 'amethyst' | 'platinum';
  const PRESET_THEMES: Record<STVThemeKey, { hex: string; label: string; shadow: string }> = {
    gold:     { hex: '#d4af37', label: 'Industrial Gold',  shadow: 'rgba(212, 175, 55, 0.15)' },
    emerald:  { hex: '#10b981', label: 'Emerald Wave',     shadow: 'rgba(16, 185, 129, 0.15)' },
    crimson:  { hex: '#f43f5e', label: 'Cyber Crimson',    shadow: 'rgba(244, 63, 94, 0.15)'  },
    indigo:   { hex: '#6366f1', label: 'Future Indigo',    shadow: 'rgba(99, 102, 241, 0.15)' },
    amethyst: { hex: '#a855f7', label: 'Royal Amethyst',   shadow: 'rgba(168, 85, 247, 0.15)' },
    platinum: { hex: '#94a3b8', label: 'Gloss Platinum',   shadow: 'rgba(148, 163, 184, 0.15)'}
  };

  // Drag Window event routines
  const handleWindowDragStart = (e: React.MouseEvent, tableId: string) => {
    if ((e.target as HTMLElement).closest('.window-control-button')) return;
    const item = sandboxTables.find(t => t.id === tableId);
    if (!item) return;

    // Bring clicked window to top
    const maxZ = Math.max(...sandboxTables.map(t => t.zIndex), 10);
    setSandboxTables(prev => prev.map(t => t.id === tableId ? { ...t, zIndex: maxZ + 1 } : t));

    setActiveDragId(tableId);
    setDragOffset({
      x: e.clientX - item.x,
      y: e.clientY - item.y
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (activeDragId) {
        let nextX = e.clientX - dragOffset.x;
        let nextY = e.clientY - dragOffset.y;
        if (snapToGrid) {
          nextX = Math.round(nextX / 20) * 20;
          nextY = Math.round(nextY / 20) * 20;
        }
        setSandboxTables(prev => prev.map(t => t.id === activeDragId ? { ...t, x: Math.max(0, nextX), y: Math.max(60, nextY) } : t));
      }

      if (activeResizeId) {
        const item = sandboxTables.find(t => t.id === activeResizeId);
        if (!item) return;
        const deltaW = e.clientX - resizeStartPos.x;
        const deltaH = e.clientY - resizeStartPos.y;
        let nextW = resizeStartSize.w + deltaW;
        let nextH = resizeStartSize.h + deltaH;
        if (snapToGrid) {
          nextW = Math.round(nextW / 20) * 20;
          nextH = Math.round(nextH / 20) * 20;
        }
        setSandboxTables(prev => prev.map(t => t.id === activeResizeId ? { ...t, w: Math.max(300, nextW), h: Math.max(250, nextH) } : t));
      }
    };

    const handleGlobalMouseUp = () => {
      setActiveDragId(null);
      setActiveResizeId(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activeDragId, dragOffset, activeResizeId, resizeStartSize, resizeStartPos, sandboxTables, snapToGrid]);

  const handleResizeStart = (e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const item = sandboxTables.find(t => t.id === tableId);
    if (!item) return;
    setActiveResizeId(tableId);
    setResizeStartSize({ w: item.w, h: item.h });
    setResizeStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleCellRightClick = (e: React.MouseEvent, tableKey: string, rowId: string, colKey: string) => {
    e.preventDefault();
    setContextMenuCell({
      x: e.clientX,
      y: e.clientY,
      tableKey,
      rowId,
      colKey
    });
  };

  // Close context menu
  useEffect(() => {
    const clickAway = () => setContextMenuCell(null);
    window.addEventListener('click', clickAway);
    return () => window.removeEventListener('click', clickAway);
  }, []);

  // Set Cell Highlighting preset
  const applyCellHighlight = (color: string) => {
    if (!contextMenuCell) return;
    const { tableKey, rowId, colKey } = contextMenuCell;
    const metaKey = `${tableKey}_${rowId}_${colKey}`;
    setCellMetadata(prev => ({
      ...prev,
      [metaKey]: {
        ...(prev[metaKey] || {}),
        highlight: color
      }
    }));
  };

  // Set Cell lock status
  const toggleCellLock = () => {
    if (!contextMenuCell) return;
    const { tableKey, rowId, colKey } = contextMenuCell;
    const metaKey = `${tableKey}_${rowId}_${colKey}`;
    const curr = cellMetadata[metaKey]?.isLocked;
    setCellMetadata(prev => ({
      ...prev,
      [metaKey]: {
        ...(prev[metaKey] || {}),
        isLocked: !curr
      }
    }));
  };

  // Add emoji annotation
  const insertCellEmoji = (emoji: string) => {
    if (!contextMenuCell) return;
    const { tableKey, rowId, colKey } = contextMenuCell;
    const metaKey = `${tableKey}_${rowId}_${colKey}`;
    setCellMetadata(prev => ({
      ...prev,
      [metaKey]: {
        ...(prev[metaKey] || {}),
        icon: emoji
      }
    }));
  };

  // Set Comment Note
  const addCellComment = (commentStr: string) => {
    if (!selectedCell) return;
    const { tableKey, rowId, colKey } = selectedCell;
    const metaKey = `${tableKey}_${rowId}_${colKey}`;
    setCellMetadata(prev => ({
      ...prev,
      [metaKey]: {
        ...(prev[metaKey] || {}),
        comment: commentStr
      }
    }));
  };

  // AI Prompt fill trigger mockup
  const autofillCellWithAI = (colKey: string, row: any) => {
    const metaKey = `${activeCollection}_${row.id}_${colKey}`;
    setCustomFormulas(prev => ({
      ...prev,
      [metaKey]: `=AI_SUGGEST(${colKey})`
    }));
  };

  // Global presets for tables colors
  const tableTheme = PRESET_THEMES.gold;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-[var(--color-text-main)] relative">
      
      {/* 1. TOP BAR CONTROL DESK */}
      <div className="glass-panel p-4 rounded-xl border border-white/[0.04] bg-[var(--color-background)]/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#d4af37]" />
            <h1 className="text-sm font-mono font-bold tracking-widest text-[#d4af37] uppercase">NEVAEH DATABASE WORKSPACE ENGINE</h1>
            <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[9px] font-mono px-1.5 py-0.5 rounded tracking-widest uppercase">Excel Grade</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
            Interactive relational schema linking supply line fabric parameters with aggregate production COGS and real-time HPP tags.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => {
              setInterfaceMode('focus');
              setViewLayout('spreadsheet');
            }}
            className={`px-3 py-1.5 rounded border transition-all cursor-pointer flex items-center gap-1.5 uppercase font-bold text-[10.5px] ${
              interfaceMode === 'focus' ? 'bg-[#d4af37] text-[var(--color-text-main)] border-[#d4af37]' : 'bg-[var(--color-card-bg)] border-white/5 text-[var(--color-text-main)]'
            }`}
          >
            <Grid3X3 size={12} /> Focus Desk view
          </button>

          <button
            onClick={() => setInterfaceMode('sandbox')}
            className={`px-3 py-1.5 rounded border transition-all cursor-pointer flex items-center gap-1.5 uppercase font-bold text-[10.5px] ${
              interfaceMode === 'sandbox' ? 'bg-indigo-600 text-[var(--color-text-main)] border-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-[var(--color-card-bg)] border-white/5 text-[var(--color-text-main)]'
            }`}
          >
            <Sliders size={12} /> Sandbox Glass Canvas
          </button>

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-3 py-1.5 rounded border text-[10.5px] font-bold ${
              snapToGrid ? 'bg-[var(--color-background)] text-teal-400 border-teal-500/20' : 'bg-transparent border-white/5 text-[var(--color-text-muted)]'
            }`}
          >
            🎯 SNAP: {snapToGrid ? '20PX ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      {interfaceMode === 'focus' ? (
        // FOCUS DESK LAYOUT - IMMERSIVE FULLSCREEN MODE
        <div className="space-y-6">
          
          {/* Top Selection Ribbon with KPI counts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { id: 'materials', label: 'Material Sourcing Library', count: computedMaterials.length, color: '#d4af37' },
              { id: 'products', label: 'Master Products Inventory', count: computedProducts.length, color: '#6366f1' },
              { id: 'samples', label: 'Sample Prototype Development', count: computedSamples.length, color: '#a855f7' },
              { id: 'sales', label: 'Sales Revenue Tracking', count: computedSales.length, color: '#10b981' }
            ].map((tab) => {
              const active = activeCollection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCollection(tab.id as any);
                    setSortField('id');
                  }}
                  className="glass-panel p-3.5 rounded-lg text-left border relative transition-all duration-200 cursor-pointer group"
                  style={{ 
                    borderColor: active ? tab.color : 'rgba(255,255,255,0.03)',
                    boxShadow: active ? `0 0 15px ${tab.color}15` : 'none'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest font-bold">Workspace Segment</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)] text-[var(--color-text-main)] font-mono font-bold">{tab.count}</span>
                  </div>
                  <h3 className="text-xs font-mono font-bold text-white mt-2 uppercase flex items-center gap-1.5 group-hover:text-white transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tab.color }} />
                    {t(tab.label)}
                  </h3>
                </button>
              );
            })}
          </div>

          {/* Quick interactive utility tool list */}
          <div className="glass-panel p-3 rounded-lg border border-white/[0.03] bg-[var(--color-background)]/40 flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase flex items-center gap-1 bg-black/40 px-2 py-1 rounded">
                <Info size={11} className="text-[#d4af37]" /> Double click cell to input Formula or values! Use Right-Click for annotations & coloring.
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button 
                onClick={() => setShowAIAudit(!showAIAudit)}
                className="px-3 py-1.5 bg-[var(--color-card-bg)] border border-purple-500/20 hover:border-purple-500/40 text-purple-300 rounded flex items-center gap-1 cursor-pointer transition-all"
              >
                <Sparkles size={12} className="animate-pulse" /> AI Agent Audit
              </button>

              <button 
                onClick={() => setShowFormulaMap(!showFormulaMap)}
                className="px-3 py-1.5 bg-[var(--color-card-bg)] border border-indigo-400/20 hover:border-indigo-400/40 text-indigo-300 rounded flex items-center gap-1 cursor-pointer transition-all"
              >
                <Hash size={12} /> Formula builder
              </button>

              <button 
                onClick={() => setShowColorPanel(!showColorPanel)}
                className="px-3 py-1.5 bg-[var(--color-card-bg)] border border-white/5 rounded flex items-center gap-1 cursor-pointer hover:bg-[var(--color-background)]"
              >
                <Palette size={12} /> Layout Preset Lab
              </button>
            </div>
          </div>

          {/* SPREADSHEET FORMULA INPUT BAR */}
          <div className="glass-panel p-3 rounded-lg border border-white/[0.04] bg-[var(--color-background)]/80 flex items-center gap-3 font-mono text-xs">
            <div className="bg-[var(--color-card-bg)] px-3 py-1.5 border border-white/5 rounded font-mono text-[#d4af37] font-semibold min-w-[150px] shrink-0 text-center">
              {selectedCell ? (
                <span>{selectedCell.tableKey.toUpperCase()}: Row {selectedCell.rowIndex + 1}, Col {selectedCell.colKey.toUpperCase()}</span>
              ) : (
                <span className="text-[var(--color-text-muted)] block text-[10px]">SELECT CELL</span>
              )}
            </div>
            
            <div className="text-[var(--color-text-muted)] font-bold select-none text-sm px-1 shrink-0">ƒ<sub>x</sub></div>
            
            <div className="flex-1 bg-black/60 border border-white/[0.06] rounded px-3 py-1.5 flex items-center justify-between">
              <input
                type="text"
                placeholder={selectedCell ? "Enter math, literal value, or formula starting with = like =SUM([costPerUnit], 10)" : "Select any cell grid coordinates below to inspect or run custom calculations..."}
                disabled={!selectedCell}
                value={
                  selectedCell 
                    ? (customFormulas[`${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`] || String(focusRows.find(r => r.id === selectedCell.rowId)?.[selectedCell.colKey] || ''))
                    : ''
                }
                onChange={(e) => {
                  if (selectedCell) {
                    const val = e.target.value;
                    const fKey = `${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`;
                    if (val.startsWith('=')) {
                      setCustomFormulas(prev => ({ ...prev, [fKey]: val }));
                    } else {
                      // Save literal value directly
                      handleCellEdit(selectedCell.rowId, selectedCell.colKey, val);
                    }
                  }
                }}
                className="w-full bg-transparent text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-0 text-[11px]"
              />
              {selectedCell && (() => {
                const formulaValue = customFormulas[`${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`] || '';
                const hasFormula = formulaValue.startsWith('=');
                return (
                  <div className="flex items-center gap-2">
                    {hasFormula ? (
                      realTimeSyntaxError ? (
                        <span className="text-[9px] text-red-400 bg-red-950/20 border border-red-500/10 px-2 py-0.5 rounded uppercase font-bold animate-fadeIn shrink-0">
                          ⚠️ Error: {realTimeSyntaxError}
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold shrink-0">
                          ✓ Formula Active
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] text-[var(--color-text-muted)] uppercase bg-[var(--color-background)]/40 px-1.5 py-0.5 rounded shrink-0">Literal Data</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const fKey = `${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`;
                        setCustomFormulas(prev => {
                          const next = { ...prev };
                          delete next[fKey];
                          return next;
                        });
                      }}
                      className="text-[var(--color-text-muted)] hover:text-white hover:underline text-[10px] uppercase cursor-pointer ml-1 shrink-0"
                    >
                      Clear Dynamic Formula
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* VIEW TYPE CONTROL SWITCHER */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 border border-white/[0.05] p-1 bg-[var(--color-background)]/80 rounded-lg text-xs font-mono">
              {[
                { id: 'spreadsheet', label: 'Spreadsheet Grid', icon: Grid3X3 },
                { id: 'kanban', label: 'Kanban board', icon: KanbanSquare },
                { id: 'gallery', label: 'Gallery deck', icon: Layers },
                { id: 'calendar', label: 'Delivery Calendar', icon: Calendar },
                { id: 'analytics', label: 'Operations Analytics', icon: BarChart4 },
                { id: 'timeline', label: 'Gantt schedule', icon: Sliders },
                { id: 'split', label: 'Dual Split Comparison', icon: Split }
              ].map((viewOpt) => {
                const IconComp = viewOpt.icon;
                return (
                  <button
                    key={viewOpt.id}
                    onClick={() => setViewLayout(viewOpt.id as any)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded transition-all cursor-pointer text-[10.5px] font-bold uppercase ${
                      viewLayout === viewOpt.id ? 'bg-[#d4af37] text-[var(--color-text-muted)] font-bold' : 'text-[var(--color-text-muted)] hover:text-white'
                    }`}
                  >
                    <IconComp size={12} />
                    <span>{viewOpt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative font-mono">
                <Search size={12} className="absolute left-2 top-2.5 text-[var(--color-text-muted)]" />
                <input 
                  type="text" 
                  placeholder="Filter grid values..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[var(--color-card-bg)] border border-white/[0.05] lg:w-48 text-[11px] pl-6.5 pr-2 py-1.5 text-[var(--color-text-main)] focus:outline-none rounded"
                />
              </div>

              <button
                onClick={() => setFilterDrawer(!filterDrawer)}
                className="px-3 py-1.5 border border-white/5 bg-[var(--color-card-bg)] rounded text-xs text-[var(--color-text-muted)] hover:text-white font-mono flex items-center gap-1 cursor-pointer"
              >
                <Filter size={11} /> Filter parameters ({multiFilters.length})
              </button>

              <button 
                onClick={() => setShowAddCustomCol(true)}
                className="px-3 py-1.5 border border-[#d4af37]/35 hover:border-[#d4af37] text-[#d4af37] rounded text-xs font-mono flex items-center gap-1 cursor-pointer"
              >
                <Plus size={11} /> Create custom column
              </button>
            </div>
          </div>

          {/* DYNAMIC VIEWPORT INJECTOR */}
          <div className="glass-panel rounded-xl overflow-hidden border border-white/[0.04] bg-[var(--color-background)]/20">
            {renderActiveViewport(activeCollection, activeColumnsSchema, focusRows, viewLayout)}
          </div>

          {/* Selected cell comment drawer */}
          <AnimatePresence>
            {selectedCell && cellMetadata[`${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`]?.comment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-panel p-4 rounded-lg bg-[var(--color-card-bg)] border border-indigo-500/20 font-mono text-[11px] flex gap-3 items-start justify-between"
              >
                <div className="space-y-1">
                  <p className="text-[var(--color-text-muted)] uppercase font-black tracking-widest text-[9px] flex items-center gap-1">
                    <MessageSquare size={10} className="text-indigo-400" /> Static Annotation comment block
                  </p>
                  <p className="text-white text-xs">{cellMetadata[`${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`].comment}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const metaKey = `${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`;
                    setCellMetadata(p => ({
                      ...p,
                      [metaKey]: { ...(p[metaKey] || {}), comment: '' }
                    }));
                  }}
                  className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors cursor-pointer text-[10px]"
                >
                  Remove Comment Note
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      ) : (
        // SANDBOX GRID WORKSPACE - FLOATING WINDOWS MODE
        <div className="relative w-full h-[650px] border border-white/[0.04] bg-[#020202]/50 rounded-xl overflow-hidden" id="sandbox-workspace-canvas">
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          <div className="absolute top-3 left-3 bg-[var(--color-card-bg)]/40 p-2 rounded border border-white/5 backdrop-blur z-40 text-[10px] font-mono text-[var(--color-text-muted)]">
            🌌 Free-floating Workspace • Drag from window headers • Drag corner edge to resize • double click headers to toggle fullscreen maximize
          </div>

          <div className="w-full h-full p-4 relative overflow-auto">
            {sandboxTables.map((win) => {
              const rowsSet = getCompiledData(win.titleKey);
              const colsSet = [...getBaseSchema(win.titleKey), ...(customColumns[win.titleKey] || [])];
              const theme = PRESET_THEMES[(win.themePreset as STVThemeKey) || 'gold'];

              return (
                <div
                  key={win.id}
                  className="absolute rounded-xl border bg-black/60 backdrop-blur-md overflow-hidden flex flex-col hover:shadow-2xl transition-shadow border-white/10 group"
                  style={{
                    left: `${win.x}px`,
                    top: `${win.y}px`,
                    width: `${win.w}px`,
                    height: `${win.h}px`,
                    zIndex: win.zIndex,
                    borderColor: `${theme.hex}25`,
                    borderTopColor: theme.hex,
                    borderTopWidth: '4px',
                    boxShadow: `0 10px 30px ${theme.shadow}40`
                  }}
                >
                  {/* Handle Drag bar */}
                  <div
                    className="p-3 bg-[var(--color-background)]/80 border-b border-white/[0.04] flex justify-between items-center cursor-move select-none"
                    onMouseDown={(e) => handleWindowDragStart(e, win.id)}
                    onDoubleClick={() => {
                      setSandboxTables(prev => prev.map(t => t.id === win.id ? { ...t, w: t.w === 1160 ? 580 : 1160, h: t.h === 600 ? 460 : 600 } : t));
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.hex }} />
                      <h4 className="text-[11px] font-mono font-bold text-[var(--color-text-main)] uppercase tracking-wider">{win.title}</h4>
                    </div>

                    <div className="flex items-center gap-1 window-control-button">
                      {/* Switer View selection per table */}
                      <select
                        value={win.view}
                        onChange={(e) => {
                          const v = e.target.value as any;
                          setSandboxTables(prev => prev.map(t => t.id === win.id ? { ...t, view: v } : t));
                        }}
                        className="bg-[var(--color-card-bg)] border border-white/5 text-[9.5px] leading-none px-1.5 py-0.5 rounded text-[var(--color-text-main)] focus:outline-none uppercase font-mono mr-2"
                      >
                        <option value="spreadsheet">Spreadsheet</option>
                        <option value="kanban">Kanban status</option>
                        <option value="gallery">Gallery deck</option>
                        <option value="calendar">Scheduler</option>
                        <option value="analytics">Analytics</option>
                        <option value="timeline">Timeline</option>
                        <option value="chart">Distribution</option>
                        <option value="split">Comparisons</option>
                      </select>

                      <button
                        onClick={() => {
                          const maxZ = Math.max(...sandboxTables.map(t => t.zIndex), 10);
                          setSandboxTables(prev => prev.map(t => t.id === win.id ? { ...t, zIndex: maxZ + 1 } : t));
                        }}
                        className="p-1 hover:bg-[rgba(255,255,255,0.03)] rounded text-[var(--color-text-muted)] hover:text-white"
                        title="Bring to Front"
                      >
                        <Layers size={10} />
                      </button>

                      <button
                        onClick={() => {
                          const presets: Array<SandboxTable['themePreset']> = ['gold', 'emerald', 'crimson', 'indigo', 'amethyst', 'platinum'];
                          const currentIdx = presets.indexOf(win.themePreset);
                          const next = presets[(currentIdx + 1) % presets.length];
                          setSandboxTables(prev => prev.map(t => t.id === win.id ? { ...t, themePreset: next } : t));
                        }}
                        className="p-1 hover:bg-[rgba(255,255,255,0.03)] rounded text-[var(--color-text-muted)] hover:text-white"
                        title="Alternate theme"
                      >
                        <Palette size={10} />
                      </button>

                      <button
                        onClick={() => {
                          setSandboxTables(prev => prev.filter(t => t.id !== win.id));
                        }}
                        className="p-1 hover:bg-[rgba(255,255,255,0.03)] rounded text-[var(--color-text-muted)] hover:text-red-400"
                        title="Close workspace block"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Table window body viewports */}
                  <div className="flex-1 overflow-auto bg-[var(--color-background)]/60 p-3">
                    {renderActiveViewport(win.titleKey, colsSet, rowsSet, win.view)}
                  </div>

                  {/* Drag Resize Bottom Corner */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, win.id)}
                    className="absolute bottom-0 right-0 h-4 w-4 bg-transparent cursor-se-resize flex items-end justify-end p-0.5"
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" className="text-[var(--color-text-muted)] hover:text-[#d4af37]">
                      <line x1="6" y1="1" x2="1" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                      <line x1="6" y1="3" x2="3" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          {sandboxTables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-[var(--color-text-muted)]">
              <Layers size={24} className="animate-bounce" />
              <span>All Workspace modules closed. Press Reset Orchestrator Canvas below.</span>
              <button
                onClick={() => {
                  setSandboxTables([
                    { id: 'win-materials', title: 'Materials Sourcing Library', titleKey: 'materials', x: 20, y: 110, w: 580, h: 460, zIndex: 10, isMaximized: false, view: 'spreadsheet', themePreset: 'gold', opacity: 75, blur: 12, alternatingRows: true, density: 'high' },
                    { id: 'win-products', title: 'Master Collection Products', titleKey: 'products', x: 630, y: 110, w: 580, h: 460, zIndex: 20, isMaximized: false, view: 'spreadsheet', themePreset: 'indigo', opacity: 80, blur: 10, alternatingRows: true, density: 'normal' },
                    { id: 'win-samples', title: 'Sampling Prototypes Check', titleKey: 'samples', x: 80, y: 540, w: 520, h: 420, zIndex: 15, isMaximized: false, view: 'kanban', themePreset: 'amethyst', opacity: 70, blur: 8, alternatingRows: false, density: 'normal' },
                    { id: 'win-sales', title: 'Active Sales Ledger Tracking', titleKey: 'sales', x: 690, y: 540, w: 520, h: 420, zIndex: 25, isMaximized: false, view: 'analytics', themePreset: 'emerald', opacity: 75, blur: 15, alternatingRows: true, density: 'relaxed' }
                  ]);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] border border-white/10 rounded uppercase hover:text-white"
              >
                Reset Database Grid Frame Windows
              </button>
            </div>
          )}

        </div>
      )}

      {/* --- CELL CONTEXT-RIGHT-CLICK MENU OVERLAY --- */}
      {contextMenuCell && (
        <div
          className="fixed bg-[var(--color-background)] border border-white/10 p-2.5 rounded-lg shadow-2xl space-y-2.5 z-55 w-52 font-mono text-[10.5px] select-none"
          style={{ left: `${contextMenuCell.x}px`, top: `${contextMenuCell.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block text-[9px] text-[var(--color-text-muted)] uppercase pb-1.5 border-b border-white/[0.04]">Excel Cell Actions</span>
          
          <div className="space-y-1">
            <span className="block text-[8px] text-[var(--color-text-muted)] uppercase">Paint Highlight</span>
            <div className="flex gap-1.5">
              {[
                { hex: 'rgba(212, 175, 55, 0.2)', name: 'Gold' },
                { hex: 'rgba(16, 185, 129, 0.2)', name: 'Green' },
                { hex: 'rgba(239, 68, 68, 0.2)', name: 'Red' },
                { hex: 'rgba(59, 130, 246, 0.2)', name: 'Blue' },
                { hex: 'transparent', name: 'Clear' }
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => applyCellHighlight(c.hex)}
                  className="h-4 flex-1 rounded border border-white/10 cursor-pointer"
                  style={{ backgroundColor: c.hex === 'transparent' ? '#18181b' : c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="block text-[8px] text-[var(--color-text-muted)] uppercase">Embed Emoji Signifier</span>
            <div className="flex gap-1.5 justify-between">
              {['⭐', '⚠️', '💎', '✅', '🔥', '🔒'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertCellEmoji(emoji)}
                  className="px-1 py-0.5 hover:bg-[rgba(255,255,255,0.06)] rounded cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={toggleCellLock}
            className="w-full text-left py-1 px-1.5 rounded hover:bg-[rgba(255,255,255,0.03)] flex items-center gap-1.5"
          >
            <Lock size={10} /> Toggle Sourcing Protection lock
          </button>

          <button
            onClick={() => {
              const metaKey = `${contextMenuCell.tableKey}_${contextMenuCell.rowId}_${contextMenuCell.colKey}`;
              const pStr = prompt("Attach audit annotation comment details: ");
              if (pStr) {
                setCellMetadata(p => ({
                  ...p,
                  [metaKey]: { ...(p[metaKey] || {}), comment: pStr }
                }));
              }
            }}
            className="w-full text-left py-1 px-1.5 rounded hover:bg-[rgba(255,255,255,0.03)] flex items-center gap-1.5"
          >
            <MessageSquare size={10} /> Attach comment comment
          </button>
          
          <button
            onClick={() => {
              const { tableKey, rowId, colKey } = contextMenuCell;
              const formulaKey = `${tableKey}_${rowId}_${colKey}`;
              const promptF = prompt("Enter Excel-Grade Formula (e.g. =[sellingPrice] * 0.15):");
              if (promptF) {
                setCustomFormulas(prev => ({ ...prev, [formulaKey]: promptF }));
              }
            }}
            className="w-full text-left py-1 px-1.5 rounded hover:bg-emerald-600/20 text-emerald-300 flex items-center gap-1.5"
          >
            <Sparkles size={10} /> Write Formula function
          </button>
        </div>
      )}

      {/* --- DIALOGS & OVERLAY SLIDE DRAWERS --- */}

      {/* A. AI SPREADSHEET OS AUDITING DRAWER */}
      <AnimatePresence>
        {showAIAudit && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-45"
              onClick={() => setShowAIAudit(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--color-background)] border-l border-purple-500/10 z-50 p-6 flex flex-col justify-between font-mono"
            >
              <div className="space-y-6 overflow-y-auto max-h-[90%] pr-1">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400 animate-pulse" /> AI OPERATIONAL AUDITOR ACTIVE
                  </h3>
                  <button onClick={() => setShowAIAudit(false)} className="text-[var(--color-text-muted)] hover:text-white"><X size={14}/></button>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <p className="text-[var(--color-text-muted)] text-[10.5px]">Scanning materials, expected collection selling prices, and sample ratios for HPP anomalies.</p>
                  
                  <div className="bg-purple-950/15 border border-purple-500/20 p-3.5 rounded space-y-2.5">
                    <div className="flex items-center gap-2 text-purple-300 text-[11px] font-bold">
                      <Zap size={11} className="text-purple-400 animate-bounce" /> PATTERN EXTRAPOLATION HIGHLIGHT
                    </div>
                    <ul className="space-y-2 text-[10.5px] text-[var(--color-text-main)]">
                      <li>• <strong>Fabric Pricing Optimization</strong>: Sourcing waterproof membranes MAT-001 from supplier Supra Tokyo lists high ({formatMoney(14.20)}). Alternative partnersup Sup-002 can optimize cost per meter by 12%.</li>
                      <li className="pt-1.5 border-t border-white/[0.04]">• <strong>Production Yield Safe threshold</strong>: Expected profit margins on product PROD-001 is falling to 12%. Suggest utilizing selling price formula: <code>=[sellingPrice] * 1.5</code> for health check.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-[var(--color-card-bg)] border border-white/5 rounded space-y-2">
                    <span className="text-[9.5px] uppercase text-[var(--color-text-muted)] block font-bold">AI Supplier Advisor search</span>
                    <input
                      type="text"
                      className="w-full bg-[var(--color-background)] border border-white/10 rounded px-2 py-1 text-[var(--color-text-main)] text-[10.5px]"
                      placeholder="Ask supplier, previous usage, low stock threshold..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          toast.error("AI Search results: Supplier Phronesis Eco Packaging has Tier 1 delivery metrics. Sourcing terry fabric cuts COGS shipping by 8.5%. Recommendation applied to Workspace!");
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9.5px] uppercase text-[var(--color-text-muted)] block font-bold">Automated formulas recommended:</span>
                    <div className="bg-black/60 p-2.5 rounded border border-white/5 font-mono text-[9.5px] text-[var(--color-text-muted)] space-y-1">
                      <div><code>=MARGIN([sellingPrice], [finalHPP])</code></div>
                      <div>Returns expected profit index percentage margin dynamically.</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[var(--color-text-muted)] text-[9px]">Autofills intelligent dropdown options based on pattern history.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* B. GRAPHICAL FORMULA BUILDER / MAP MAPOVERLAY */}
      <AnimatePresence>
        {showFormulaMap && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel-heavy rounded-xl max-w-2xl w-full p-6 space-y-5 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
                <h3 className="text-sm font-bold text-[var(--color-text-main)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-indigo-400" /> Interactive Excel Visual Formula map Builder
                </h3>
                <button onClick={() => setShowFormulaMap(false)} className="text-[var(--color-text-muted)] hover:text-white"><X size={15} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 bg-[var(--color-background)] rounded border border-white/5">
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-bold">Variable components (Drag structure)</span>
                  <div className="flex flex-wrap gap-2">
                    {['[costPerUnit]', '[remainingQty]', '[sellingPrice]', '[finalHPP]', '[qtySold]', '[pricePerPcs]'].map(token => (
                      <button
                        key={token}
                        onClick={() => {
                          if (selectedCell) {
                            const fKey = `${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`;
                            const curr = customFormulas[fKey] || '=';
                            setCustomFormulas(p => ({ ...p, [fKey]: curr + token }));
                          } else {
                            toast.error("Select a grid cell first to append this factor!");
                          }
                        }}
                        className="px-2 py-1 bg-[var(--color-card-bg)] border border-white/5 hover:border-[#d4af37] text-[var(--color-text-main)] rounded text-[10.5px] font-bold"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-[var(--color-background)] rounded border border-white/5">
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-bold font-mono">Algebraic operators</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {['+', '-', '*', '/', 'MARGIN()', 'AI_SUGGEST()'].map(op => (
                      <button
                        key={op}
                        onClick={() => {
                          if (selectedCell) {
                            const fKey = `${selectedCell.tableKey}_${selectedCell.rowId}_${selectedCell.colKey}`;
                            const curr = customFormulas[fKey] || '=';
                            setCustomFormulas(p => ({ ...p, [fKey]: curr + op }));
                          } else {
                            toast.error("Select cell first!");
                          }
                        }}
                        className="p-1 px-2.5 bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] text-[10.5px] rounded font-bold"
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Map of Data Pipeline */}
              <div className="p-3 bg-[var(--color-card-bg)]/40 rounded border border-white/[0.04]">
                <span className="text-[9.5px] uppercase text-[var(--color-text-muted)] block pb-1 border-b border-white/[0.02]">Realtime Data Sourcing Recalculation Flow</span>
                <div className="flex justify-between items-center text-center mt-3 text-[10px]">
                  <div className="bg-[var(--color-background)] px-2 py-1 rounded border border-white/5">
                    <strong>Fabric Library Cost</strong><br/>
                    <span className="text-[#d4af37]">{formatMoney(14.20)} / meter</span>
                  </div>
                  <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
                  <div className="bg-[var(--color-background)] px-2 py-1 rounded border border-white/5">
                    <strong>Sampling Recipe HPP</strong><br/>
                    <span className="text-purple-400">Sum final usage qty</span>
                  </div>
                  <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
                  <div className="bg-[var(--color-background)] px-2 py-1 rounded border border-white/5 animate-pulse">
                    <strong>Product Profit margin</strong><br/>
                    <span className="text-[#10b981]">Dynamic net ROI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* C. CONFIG LAYOUT / PRESENT COLOR PICKER DRAWER */}
      <AnimatePresence>
        {showColorPanel && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
            <div className="glass-panel-heavy rounded-xl max-w-sm w-full p-6 space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                <span className="text-xs font-bold text-[var(--color-text-main)] uppercase flex items-center gap-1.5">
                  <Palette size={14} style={{ color: activeColor }} /> ATELIER STYLE LAB
                </span>
                <button onClick={() => setShowColorPanel(false)} className="text-[var(--color-text-muted)] hover:text-white"><X size={15} /></button>
              </div>

              {/* Presets Theme Selection */}
              <div className="space-y-2">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-bold">Select workspace styling preset</span>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESET_THEMES).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => updateConfig({ customAccentColor: theme.hex })}
                      className="p-3.5 bg-[var(--color-card-bg)] border border-white/[0.02] hover:border-white/20 rounded-md text-left flex flex-col justify-between transition-colors uppercase cursor-pointer"
                    >
                      <span className="text-[10.5px] font-bold text-[var(--color-text-main)]">{theme.label}</span>
                      <span className="text-[9.5px] text-[var(--color-text-muted)] select-all truncate">{theme.hex}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-white/[0.04] pt-3.5">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase block font-bold">Dynamic Dimension Controllers</span>
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <label className="text-[var(--color-text-muted)] block pb-1">Font Size</label>
                    <input 
                      type="number" 
                      min="9" 
                      max="16" 
                      value={tableFontSize === 0 ? '' : tableFontSize} 
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        updateConfig({ tableFontSize: isNaN(parsed) ? 11 : parsed });
                      }}
                      className="w-full bg-[var(--color-card-bg)] border border-white/10 px-2 py-1 text-white rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--color-text-muted)] block pb-1">Row padding</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="20" 
                      value={tablePadding === 0 ? '' : tablePadding} 
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        updateConfig({ tableRowPadding: isNaN(parsed) ? 8 : parsed });
                      }}
                      className="w-full bg-[var(--color-card-bg)] border border-white/10 px-2 py-1 text-white rounded focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* D. ADD CUSTOM COLUMN MODAL */}
      {showAddCustomCol && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4 font-mono text-xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-white/[0.05] pb-3">Create Dynamic Column</h3>
            
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Column Title Head</label>
                <input 
                  type="text" 
                  value={newCol.label} 
                  onChange={(e) => setNewCol({...newCol, label: e.target.value})}
                  placeholder="e.g. Lead Sourcing Time"
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white focus:outline-none focus:border-[#d4af37] rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Column Sourcing Data Type option</label>
                <select 
                  value={newCol.type} 
                  onChange={(e) => setNewCol({...newCol, type: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="text">Text value</option>
                  <option value="number">Numeric price/unit</option>
                  <option value="tag">Status tags selector</option>
                  <option value="formula">Dynamic Excel Formula calculated</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddCustomCol(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddColumn}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded cursor-pointer"
              >
                Insert Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER PARAMETERS CONFIG DRAWER */}
      <AnimatePresence>
        {filterDrawer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel-heavy rounded-xl max-w-sm w-full p-5 space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                <span className="text-xs font-bold text-[var(--color-text-main)] uppercase flex items-center gap-1.5">
                  <Filter size={14} style={{ color: activeColor }} /> Multi-filtering queries
                </span>
                <button onClick={() => setFilterDrawer(false)} className="text-[var(--color-text-muted)] hover:text-white"><X size={15} /></button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)] border-b border-white/[0.02] pb-1">
                  <span>Current Active Grid filter rules</span>
                  <button onClick={() => setMultiFilters([])} className="text-red-400 hover:underline">Clear all</button>
                </div>
                
                {multiFilters.length === 0 ? (
                  <p className="text-[var(--color-text-muted)] text-center py-4">No filter criteria specified yet.</p>
                ) : (
                  <div className="space-y-2">
                    {multiFilters.map((f, i) => (
                      <div key={i} className="flex gap-2 items-center bg-black/35 p-2 rounded justify-between">
                        <span><code>{f.field}</code> {f.op} <code>{f.val}</code></span>
                        <X size={12} className="cursor-pointer text-red-500 hover:text-white" onClick={() => setMultiFilters(prev => prev.filter((_, idx) => idx !== i))} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[9.5px] uppercase text-[var(--color-text-muted)] block font-bold">Add criteria item:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <select id="filt-field" className="bg-[var(--color-card-bg)] border border-white/10 rounded p-1 text-[10px] text-[var(--color-text-main)]">
                      {activeColumnsSchema.map(col => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                      ))}
                    </select>
                    <select id="filt-op" className="bg-[var(--color-card-bg)] border border-white/10 rounded p-1 text-[10px] text-[var(--color-text-main)]">
                      <option value="contains">Contains</option>
                      <option value="^">Starts with</option>
                      <option value=">">&gt; greater</option>
                      <option value="<">&lt; lesser</option>
                    </select>
                    <input id="filt-val" type="text" className="bg-[var(--color-card-bg)] border border-white/10 rounded p-1 text-[10px] text-[var(--color-text-main)]" placeholder="Value..." />
                  </div>
                  <button
                    onClick={() => {
                      const fSelect = document.getElementById('filt-field') as HTMLSelectElement;
                      const oSelect = document.getElementById('filt-op') as HTMLSelectElement;
                      const vInput = document.getElementById('filt-val') as HTMLInputElement;
                      if (!fSelect || !oSelect || !vInput) return;
                      setMultiFilters(prev => [...prev, { field: fSelect.value, op: oSelect.value as any, val: vInput.value }]);
                      vInput.value = '';
                    }}
                    className="w-full py-1 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold rounded uppercase mt-2 text-[10.5px]"
                  >
                    Append criteria rule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // 3. CORE ADAPTIVE RE-RENDERABLE CELL VIEWPORTS SWITCHER
  function renderActiveViewport(
    tableKey: 'materials' | 'products' | 'samples' | 'sales',
    cols: Array<{ key: string; label: string; type: string }>,
    rows: any[],
    layoutType: SandboxTable['view']
  ) {
    if (layoutType === 'spreadsheet') {
      // TRUE SPREADSHEET EXCEL GRADE WITH DOUBLE COORDINATES
      return (
        <div className="w-full overflow-x-auto select-text">
          <table className="w-full text-[11px] font-mono border-collapse text-left select-text">
            <thead>
              <tr className="bg-[var(--color-background)]/90 border-b border-white/[0.08] text-[var(--color-text-muted)] uppercase select-none text-[9px] tracking-wider font-bold">
                <th className="py-2.5 px-3 border-r border-white/5 text-center w-8 bg-[var(--color-card-bg)]">#</th>
                <th className="py-2.5 px-4 border-r border-white/5 text-center w-12 text-[var(--color-text-muted)] bg-[var(--color-background)]">Reorder</th>
                {cols.map((col, idx) => {
                  const excellChar = String.fromCharCode(65 + (idx % 26)) + (idx >= 26 ? Math.floor(idx / 26) : '');
                  const isColFrozen = frozenColumns.includes(col.key);

                  return (
                    <th
                      key={col.key}
                      className={`py-2.5 px-4 border-r border-white/5 relative group cursor-pointer font-bold ${
                        isColFrozen ? 'sticky left-0 bg-[var(--color-card-bg)]/90 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.3)]' : 'bg-black/90'
                      }`}
                      style={{ width: colWidths[col.key] || 150, minWidth: colWidths[col.key] || 150, maxWidth: colWidths[col.key] || 150 }}
                    >
                      <div className="flex items-center justify-between gap-1 select-none">
                        <div className="flex flex-col select-none">
                          <span className="text-[8px] text-[#d4af37] tracking-widest">{excellChar}</span>
                          <span className="truncate text-[var(--color-text-main)]">{getColHeaderLabel(col)}</span>
                        </div>
                        <ArrowUpDown size={8} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => {
                          setSortField(col.key);
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }} />
                      </div>

                      {/* Manual column frozen pinning options */}
                      <div 
                        onClick={() => {
                          if (isColFrozen) setFrozenColumns(frozenColumns.filter(c => c !== col.key));
                          else setFrozenColumns([...frozenColumns, col.key]);
                        }}
                        className="opacity-0 group-hover:opacity-80 absolute top-0.5 right-1.5 text-[8px] text-[var(--color-text-muted)] hover:text-white"
                        title="Toggle frozen Column pinning"
                      >
                        {isColFrozen ? <Lock size={8}/> : <Unlock size={8}/>}
                      </div>

                      {/* Header rename override */}
                      <div 
                        onDoubleClick={() => {
                          setEditingHeader(col.key);
                          setHeaderEditVal(getColHeaderLabel(col));
                        }}
                        className="absolute inset-0 cursor-text select-text"
                        style={{ height: '3px' }}
                        title="Double click edge to rename title heading"
                      />

                      {/* Dynamic Column drag resizing trigger */}
                      <div
                        onMouseDown={(e) => handleColResizeStart(e, col.key)}
                        className="absolute top-0 right-0 bottom-0 w-[4px] cursor-col-resize hover:bg-[#d4af37] bg-white/[0.04]"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {rows.map((row, rIdx) => {
                const isDraggingRow = rIdx === draggedRowIndex;
                const isOverRow = rIdx === dragOverRowIndex;

                return (
                  <tr
                    key={row.id || rIdx}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, rIdx)}
                    onDragOver={(e) => handleRowDragOver(e, rIdx)}
                    onDrop={(e) => handleRowDrop(e, rIdx)}
                    className={`border-b border-white/[0.02] select-text ${
                      isDraggingRow ? 'opacity-30' : ''
                    } ${isOverRow ? 'border-dashed border-t-2 border-indigo-500' : ''}`}
                  >
                    {/* Linear spreadsheet count number */}
                    <td className="py-2.5 px-3 border-r border-white/5 text-center bg-[var(--color-background)]/70 select-none text-[var(--color-text-muted)] font-bold">
                      {rIdx + 1}
                    </td>

                    {/* Left Move reorder grab layout handle */}
                    <td className="py-2.5 px-4 border-r border-white/5 text-center bg-[var(--color-background)]/20 align-middle">
                      <span className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex justify-center items-center">
                        <Move size={11} />
                      </span>
                    </td>

                    {cols.map((col, cIdx) => {
                      const val = row[col.key];
                      const metaKey = `${tableKey}_${row.id}_${col.key}`;
                      const meta = cellMetadata[metaKey] || {};
                      const isColFrozen = frozenColumns.includes(col.key);

                      const isSelected = selectedCell?.tableKey === tableKey &&
                                         selectedCell?.rowId === row.id &&
                                         selectedCell?.colKey === col.key;

                      const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;

                      return (
                        <td
                          key={col.key}
                          onContextMenu={(e) => handleCellRightClick(e, tableKey, row.id, col.key)}
                          onMouseEnter={() => setHoveredCell({ rowId: row.id, colKey: col.key })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`py-2 px-4 border-r border-white/5 relative font-mono text-[var(--color-text-main)] cursor-text select-text truncate ${
                            isSelected ? 'ring-2 ring-indigo-500 ring-inset z-30' : ''
                          } ${
                            isColFrozen ? 'sticky left-0 bg-[#08080c]/95 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.5)]' : ''
                          }`}
                          style={{
                            width: colWidths[col.key] || 150,
                            minWidth: colWidths[col.key] || 150,
                            maxWidth: colWidths[col.key] || 150,
                            backgroundColor: meta.highlight || (isSelected ? 'rgba(99,102,241,0.1)' : 'transparent')
                          }}
                        >
                          {/* Top-right annotation comment red tag bookmark */}
                          {meta.comment && (
                            <div className="absolute top-0 right-0 w-0 h-0 border-t-[5px] border-l-[5px] border-t-red-500 border-l-transparent" title="Review note comments in desk" />
                          )}

                          {/* Lock icon indicators */}
                          {meta.isLocked && (
                            <Lock size={8} className="absolute bottom-1 right-1 text-[var(--color-text-muted)]" />
                          )}

                          {isEditing ? (
                            <input
                              type="text"
                              value={editValue}
                              autoFocus
                              onBlur={() => handleCellEdit(row.id, col.key, editValue)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellEdit(row.id, col.key, editValue);
                              }}
                              className="w-full bg-[var(--color-card-bg)] border border-white/20 text-white rounded px-2 py-0.5 text-[11px] focus:outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => setSelectedCell({ tableKey, rowId: row.id, colKey: col.key, rowIndex: rIdx, colIndex: cIdx })}
                              onDoubleClick={() => {
                                if (meta.isLocked) {
                                  toast.error("Cell is locked. Sourcing safety locked.");
                                  return;
                                }
                                setEditingCell({ rowId: row.id, colKey: col.key });
                                setEditValue(customFormulas[`${tableKey}_${row.id}_${col.key}`] || (val !== undefined ? String(val) : ''));
                              }}
                              className="w-full min-h-[1.5rem] flex items-center gap-1 overflow-hidden truncate"
                              title="Double click cell to edit literal or equation"
                            >
                              {meta.icon && <span className="select-none">{meta.icon}</span>}
                              {col.key === 'id' ? (
                                <span className="font-bold text-[#d4af37] px-1 bg-[var(--color-card-bg)] border border-white/5 rounded">{val}</span>
                              ) : col.type === 'formula' || typeof val === 'number' && (col.key.toLowerCase().includes('price') || col.key.toLowerCase().includes('revenue') || col.key.toLowerCase().includes('cost') || col.key === 'finalHPP') ? (
                                <span className="text-[var(--color-text-main)] font-bold">{formatMoney(val ?? 0)}</span>
                              ) : col.type === 'tag' ? (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold text-center border truncate ${
                                  String(val).includes('LOW_STOCK') ? 'bg-red-500/10 text-red-400 border-red-550/25' :
                                  String(val).includes('SURPLUS') || String(val).includes('Passed') || String(val).includes('Complete') || String(val).includes('Active') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-550/25' : 'bg-[var(--color-card-bg)] border-[var(--color-border-line)]/30'
                                }`}>
                                  {val}
                                </span>
                              ) : (
                                <span className="truncate text-[var(--color-text-main)]">{val !== undefined ? String(val) : ''}</span>
                              )}
                            </div>
                          )}

                          {/* Quick popover hover AI fill icon suggestions */}
                          {hoveredCell?.rowId === row.id && hoveredCell?.colKey === col.key && !meta.isLocked && col.key !== 'id' && (
                            <button
                              onClick={() => autofillCellWithAI(col.key, row)}
                              className="absolute right-1 top-1 text-[#d4af37] hover:scale-110 cursor-pointer hidden group-hover/cell:flex"
                              title="Ask AI Suggestion formula fill"
                            >
                              <Sparkles size={10} className="animate-spin" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="py-12 text-center text-[var(--color-text-muted)] text-[11px] font-mono">No matching records found.</div>
          )}
        </div>
      );
    }

    if (layoutType === 'kanban') {
      // GROUPED STATUS LANE CARDS
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono select-none" id="tables-kanban-board">
          {[
            { title: 'DRAFT REGISTRATION / INVENTORY ALERTS', keys: ['LOW_STOCK', 'Design', 'Pending', 'Draft'] },
            { title: 'IN VELOCITY PROCESS / SAMPLING', keys: ['Sampling', 'In Progress', 'Shipped', 'Sampling'] },
            { title: 'FULLY COMPLETED / SURPLUS RECORD', keys: ['Completed', 'Passed', 'Approved', 'SURPLUS', 'Active'] }
          ].map((lane, lIdx) => {
            const laneRows = rows.filter(r => {
              const statusName = r.status || r.stockStatus || r.qcStatus || 'Draft';
              return lane.keys.includes(statusName);
            });

            return (
              <div key={lIdx} className="glass-panel p-3.5 rounded-lg space-y-4 bg-[var(--color-card-bg)] border border-white/[0.04] flex flex-col">
                <div className="flex justify-between items-center border-b border-white/[0.03] pb-2 text-[10px]">
                  <span className="text-[var(--color-text-main)] font-bold uppercase tracking-wider">{lane.title}</span>
                  <span className="h-4.5 px-2 bg-[var(--color-card-bg)] rounded-full text-[var(--color-text-muted)] font-black">{laneRows.length}</span>
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {laneRows.map((card, cIdx) => (
                    <div
                      key={card.id || cIdx}
                      className="p-3 bg-black/60 rounded border border-white/[0.02] hover:border-[#d4af37]/30 transition-all space-y-2 select-all relative"
                    >
                      <div className="flex justify-between">
                        <span className="text-[9.5px] font-bold text-[#d4af37]">{card.id}</span>
                        <span className="text-[8.5px] text-[var(--color-text-muted)] uppercase">{card.category || card.collection || 'Record'}</span>
                      </div>
                      <h5 className="text-[11.5px] font-bold text-[var(--color-text-main)] leading-tight font-sans mt-1">{card.name || card.productName || 'Unnamed Sourcing'}</h5>
                      
                      <div className="flex justify-between pt-2 border-t border-white/[0.02] text-[10px]">
                        <span className="text-indigo-400 font-bold">{formatMoney(card.costPerUnit || card.sellingPrice || 0)}</span>
                        <span className="text-[var(--color-text-muted)] italic">{card.remainingQty !== undefined ? `${card.remainingQty} units` : 'Synced'}</span>
                      </div>
                    </div>
                  ))}

                  {laneRows.length === 0 && (
                    <div className="py-12 border border-dashed border-white/[0.02] text-center text-[var(--color-text-muted)] text-[10px] rounded uppercase">
                      Lane Queue empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (layoutType === 'gallery') {
      // IMAGE RICH MATRIX
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 font-mono select-none">
          {rows.map((card, idx) => (
            <div key={card.id || idx} className="glass-panel p-3 rounded-lg bg-[var(--color-card-bg)]/60 border border-white/[0.02] hover:border-white/10 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="aspect-video w-full rounded bg-black/50 overflow-hidden relative flex items-center justify-center border border-white/5">
                  {card.image ? (
                    <img src={card.image} alt={card.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <Database size={24} className="text-[var(--color-text-muted)] animate-pulse" />
                  )}
                  <span className="absolute bottom-1 right-1 text-[8.5px] uppercase bg-black/75 text-[var(--color-text-main)] font-black tracking-widest px-1.5 py-0.5 rounded border border-white/5">
                    {card.category || 'Atelier'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px]">
                    <span className="text-[#d4af37] font-bold">{card.id}</span>
                    <span className="text-[var(--color-text-muted)]">{card.collection || 'Active season'}</span>
                  </div>
                  <h4 className="text-[11.5px] font-sans font-bold text-[var(--color-text-main)] line-clamp-1">{card.name || card.productName || 'Custom Asset'}</h4>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.04] mt-3.5 flex justify-between items-center text-[10px]">
                <span className="text-indigo-400 font-bold">{formatMoney(card.costPerUnit || card.sellingPrice || 0)}</span>
                <span className="px-1.5 py-0.5 bg-[var(--color-background)] border border-white/5 text-[var(--color-text-muted)] uppercase text-[9px] rounded">
                  {card.status || card.stockStatus || 'Sync OK'}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (layoutType === 'calendar') {
      // 31 DAY SCHEDULE MATRIX WITH DETAILED ASSIGNMENTS
      const days = Array.from({ length: 31 }, (_, i) => i + 1);
      return (
        <div className="space-y-4 font-mono select-none p-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-black">📅 NEVAEH ATELIER DELIVERY & SCHEDULE SCHEMAS</span>
            <span className="text-[9.5px] text-[var(--color-text-muted)]">MAPPED SYSTEM EVENTS FOR 2026-05</span>
          </div>
          
          <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] text-[var(--color-text-muted)] uppercase font-bold pb-1 border-b border-white/[0.02]">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              // Distribute row items mock-wise dynamically across calendar days based on index number
              const dayEvents = rows.filter((r, idx) => (idx % 7) + 1 === (day % 7));
              const hasEvents = dayEvents.length > 0;

              return (
                <div 
                  key={day} 
                  className={`min-h-[65px] p-1.5 border rounded flex flex-col justify-between transition-colors bg-[var(--color-background)]/40 border-white/[0.04] ${
                    hasEvents ? 'hover:border-[#d4af37]/30' : 'opacity-40'
                  }`}
                >
                  <span className="text-[10px] text-[var(--color-text-muted)] font-bold">{day}</span>
                  {hasEvents && (
                    <div className="space-y-0.5 max-h-12 overflow-y-auto pr-0.5">
                      {dayEvents.slice(0, 2).map((evt, idx) => (
                        <div 
                          key={idx} 
                          className="bg-[var(--color-card-bg)] border border-white/5 rounded p-0.5 text-[8px] text-[#d4af37] truncate"
                          title={`${evt.id}: ${evt.name || evt.productName}`}
                        >
                          {evt.id}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[7px] text-right text-[var(--color-text-muted)] font-bold font-mono">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (layoutType === 'analytics') {
      // REAL-TIME OPERATIONS ANALYTICS CHART BREAKDOWN
      const totalInventoryVal = computedMaterials.reduce((acc, curr) => acc + (curr.remainingQty * curr.costPerUnit), 0);
      const totalProfitsPotential = computedProducts.reduce((acc, curr) => acc + curr.netProfit, 0);
      const averageHPPVal = computedProducts.reduce((acc, curr) => acc + curr.finalHPP, 0) / (computedProducts.length || 1);

      return (
        <div className="space-y-5 p-5 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--color-card-bg)]/60 p-4 rounded-lg border border-white/[0.04] text-left">
              <span className="text-[9.5px] uppercase tracking-widest text-[#d4af37]">Core Inventory asset Valuation</span>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] mt-1">{formatMoney(totalInventoryVal)}</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Calculated dynamically: Sum (costPerUnit * remainingQty)</p>
            </div>
            
            <div className="bg-[var(--color-card-bg)]/60 p-4 rounded-lg border border-white/[0.04] text-left">
              <span className="text-[9.5px] uppercase tracking-widest text-indigo-400">Net profitability potential cogs HPP</span>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] mt-1">{formatMoney(totalProfitsPotential)}</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Calculated from Master Product unitsSold ratio metrics</p>
            </div>

            <div className="bg-[var(--color-card-bg)]/60 p-4 rounded-lg border border-white/[0.04] text-left">
              <span className="text-[9.5px] uppercase tracking-widest text-emerald-400">Average Aggregate item HPP</span>
              <h3 className="text-lg font-bold text-[var(--color-text-main)] mt-1">{formatMoney(averageHPPVal)}</h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Base labor, fabric cuts, and shipping fees factor average</p>
            </div>
          </div>

          {/* Interactive SVG compare line graph */}
          <div className="bg-[var(--color-background)]/80 p-4 rounded-lg border border-white/[0.04]">
            <span className="text-[9.5px] uppercase block pb-2 border-b border-white/[0.01]">Atelier Gross retail Pricing vs Aggregate Sourcing Cost stream</span>
            <div className="h-44 w-full flex items-end justify-between font-mono pt-4 select-none">
              
              <svg className="w-full h-full text-[var(--color-text-muted)]" viewBox="0 0 450 120">
                {/* SVG comparison lines */}
                <path 
                  d="M 10 100 Q 110 50 210 80 T 410 20" 
                  fill="none" 
                  stroke="#d4af37" 
                  strokeWidth="2.5" 
                  className="animate-pulse"
                />
                <path 
                  d="M 10 110 Q 110 90 210 100 T 410 70" 
                  fill="none" 
                  stroke="#6366f1" 
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                
                {/* SVG point elements */}
                <circle cx="210" cy="80" r="4.5" fill="#d4af37" />
                <circle cx="410" cy="20" r="4.5" fill="#d4af37" />
                <text x="210" y="65" fill="#d4af37" fontSize="8" className="font-mono">Midpoint check</text>
              </svg>

            </div>
            <div className="flex justify-between font-mono text-[9px] text-[var(--color-text-muted)] pt-2 border-t border-white/[0.02]">
              <span>Sourcing base</span>
              <span>Prototype Lab trials</span>
              <span>V1 Launch batch</span>
              <span>Sales scale Peak</span>
            </div>
          </div>
        </div>
      );
    }

    if (layoutType === 'timeline') {
      // INTERACTIVE GANTT ROADMAP ADJUSTABLE TRACKS
      const stages = [
        { id: 1, name: 'Sourcing Fabric Core', start: 10, end: 35, color: '#d4af37' },
        { id: 2, name: 'Pattern Grading Sampling', start: 30, end: 55, color: '#a855f7' },
        { id: 3, name: 'Prototype Validation Check', start: 50, end: 72, color: '#ebd122' },
        { id: 4, name: 'Bulk Production Batch V1', start: 68, end: 95, color: '#f43f5e' }
      ];

      return (
        <div className="p-4 space-y-4 font-mono select-none">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
            <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-black">🗺️ PIPELINE DEVELOPMENT MILESTONES ROADMAP TIMELINE</span>
            <span className="text-[9.5px] text-[var(--color-text-muted)]">Adjust milestones range</span>
          </div>

          <div className="space-y-4 pt-2">
            {stages.map(item => (
              <div key={item.id} className="space-y-1 text-left">
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-bold">
                  <span>{item.name}</span>
                  <span className="text-[9px] text-[var(--color-text-muted)]">Day {item.start} - Day {item.end} ({item.end - item.start} days period)</span>
                </div>
                
                <div className="h-6 w-full bg-[var(--color-background)]/70 rounded-full border border-white/5 relative overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 rounded-full cursor-ew-resize transition-all"
                    style={{
                      left: `${item.start}%`,
                      width: `${item.end - item.start}%`,
                      backgroundColor: item.color + '25',
                      borderLeft: `3px solid ${item.color}`,
                      borderRight: `3px solid ${item.color}`
                    }}
                    title="Milestone timeline drag track"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[9px] text-[var(--color-text-muted)] pt-2 border-t border-white/[0.02]">
            <span>Start (May 01)</span>
            <span>Midpoint (May 15)</span>
            <span>Completion (May 31)</span>
          </div>
        </div>
      );
    }

    if (layoutType === 'chart') {
      // BUSINESS BAR HISTOGRAM ANALYSES
      return (
        <div className="p-4 font-mono text-center space-y-4 select-none">
          <div className="flex justify-between items-center border-b border-white/[0.04] pb-2 text-left">
            <div>
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-black">📊 STATISTICAL DISTRIBUTION BREAKDOWN ANALYSIS CHARTS</span>
              <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">Quantity parameters and pricing allocations ratio levels</p>
            </div>
            <span className="text-[9.5px] text-[#d4af37] font-bold">Sum Profit Margins safe</span>
          </div>

          <div className="h-48 flex justify-between items-end gap-3.5 pt-6 bg-[var(--color-background)]/70 p-4 rounded-lg border border-white/[0.04]">
            {rows.map((row, idx) => {
              const heightVal = Math.min(100, Math.max(15, (parseFloat(row.costPerUnit || row.sellingPrice || row.qtySold || 15) / 120) * 100));
              const color = idx % 3 === 0 ? '#d4af37' : idx % 3 === 1 ? '#6366f1' : '#10b981';

              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                  <div 
                    className="w-full rounded-t transition-all hover:scale-x-105 cursor-pointer max-w-10 relative" 
                    style={{ height: `${heightVal}%`, backgroundColor: color + '25', borderTop: `2px solid ${color}` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 p-1 text-[8px] rounded border border-white/10 hidden group-hover:block z-30 font-bold">
                      {row.id}
                    </span>
                  </div>
                  <span className="text-[8.5px] text-[var(--color-text-muted)] font-mono mt-1.5 truncate max-w-12 block">{row.id || 'QTY'}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[8.5px] text-[var(--color-text-muted)]">Auto-generated business distribution chart from live dataset.</p>
        </div>
      );
    }

    if (layoutType === 'split') {
      // Bidirectional side-by-side split screens syncing live
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono select-text p-1 h-[400px] overflow-hidden">
          
          {/* L. Materials Mini Sheet */}
          <div className="bg-[var(--color-background)]/90 rounded border border-white/[0.04] p-3 flex flex-col overflow-auto text-left">
            <span className="text-[10px] text-[var(--color-text-muted)] font-black tracking-widest uppercase pb-2 border-b border-white/[0.03] block">LEFT SPEC SHEET: FABRIC & SOURCING LIBRARY</span>
            <table className="w-full text-[10px] mt-2 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.03] text-[var(--color-text-muted)] select-none">
                  <th className="py-1 px-2 text-left">ID</th>
                  <th className="py-1 px-2 text-left">Cost / Unit</th>
                  <th className="py-1 px-2 text-left">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {computedMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-white/[0.015]">
                    <td className="py-1 text-[#d4af37] font-bold">{m.id}</td>
                    <td className="py-1">
                      <CurrencyInput
                        value={m.costPerUnit}
                        onChange={(val) => {
                          setMaterials(prev => prev.map(item => item.id === m.id ? { ...item, costPerUnit: val } : item));
                        }}
                        className="bg-[var(--color-card-bg)] border border-white/10 text-white rounded px-1.5 py-0.5 text-[10px] w-20"
                      />
                    </td>
                    <td className="py-1 text-[var(--color-text-muted)] font-bold">{m.remainingQty} m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* R. Master Products HPP recals live */}
          <div className="bg-[var(--color-background)]/90 rounded border border-white/[0.04] p-3 flex flex-col overflow-auto text-left">
            <span className="text-[10px] text-[var(--color-text-muted)] font-black tracking-widest uppercase pb-2 border-b border-white/[0.03] block">RIGHT CALCULATOR SHEET: PRODUCTS & REAL HPP SYNC</span>
            <table className="w-full text-[10px] mt-2 border-collapse">
              <thead>
                <tr className="border-b border-white/[0.03] text-[var(--color-text-muted)] select-none">
                  <th className="py-1 px-2 text-left">ID</th>
                  <th className="py-1 px-2 text-left">Selling Price</th>
                  <th className="py-1 px-2 text-[#10b981] text-left">Recalculated HPP COGS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {computedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.015]">
                    <td className="py-1 text-[#6269eb] font-bold">{p.id}</td>
                    <td className="py-1">
                      <CurrencyInput
                        value={p.sellingPrice}
                        onChange={(val) => {
                          setProducts(prev => prev.map(item => item.id === p.id ? { ...item, sellingPrice: val } : item));
                        }}
                        className="bg-[var(--color-card-bg)] border border-white/10 text-white rounded px-1.5 py-0.5 text-[10px] w-24"
                      />
                    </td>
                    <td className="py-1 text-emerald-400 font-bold">
                      {formatMoney(p.finalHPP)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      );
    }

    return null;
  }

  function getColHeaderLabel(col: { key: string; label: string }) {
    if (config?.labelOverrides && config.labelOverrides[col.key]) {
      return config.labelOverrides[col.key];
    }
    return t(col.label);
  }
}
