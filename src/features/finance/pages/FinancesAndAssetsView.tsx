import React, { useState, useMemo, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
const math = create(all, { number: 'number' });
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { AssetEquipment, Customer, CashTransaction } from '../types';
import SmartTable, { ColumnDef, validateFormulaSyntax, detectCircularReferences } from '../../../shared/table/SmartTable';
import { 
  Plus, 
  Search, 
  Trash2, 
  Smile, 
  Cpu, 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  DollarSign, 
  Download,
  Award,
  Upload,
  Sparkles,
  Palette,
  EyeOff,
  Move,
  Link,
  Tag,
  Hash,
  ChevronDown,
  Lock,
  Unlock,
  Settings,
  X,
  MessageSquare,
  HelpCircle,
  Clock,
  BookOpen,
  Check,
  Zap,
  Info,
  Calendar,
  Layers,
  Grid3X3,
  KanbanSquare,
  Repeat,
  Sliders,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUploader from '../../../shared/components/ImageUploader';
import CurrencyInput from '../../../shared/components/CurrencyInput';

interface CellMetadata {
  highlight?: string; // hex or bg class
  comment?: string;
  icon?: string;
  isLocked?: boolean;
}

interface FinancesAndAssetsViewProps extends React.Attributes {
  initialSubTab?: 'reports' | 'customers' | 'assets' | 'cashflow';
  key?: string | number | null;
}

export default function FinancesAndAssetsView({ initialSubTab = 'reports' }: FinancesAndAssetsViewProps) {
  const {
    computedSales,
    assets,
    cashflow,
    addAsset,
    updateAsset,
    deleteAsset,
    formatMoney,
    t,
    config,
    addNotification
  } = useERP();
  const accentHex = config?.customAccentColor || '#7c3aed';

  const isIdLng = config?.language === 'id';
  const currencySymbol = 'Rp';

  // Navigation Sub Tab
  const [activeTab, setActiveTab] = useState<'reports' | 'customers' | 'assets' | 'cashflow'>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Sizing and visual parameters representation
  const [density, setDensity] = useState<'high' | 'normal' | 'relaxed'>('normal');
  const [alternatingRows, setAlternatingRows] = useState(true);
  const [tableOpacity, setTableOpacity] = useState(90); // default glass opacity
  const [tableBlur, setTableBlur] = useState(12); // px
  const [activeTheme, setActiveTheme] = useState<'gold' | 'emerald' | 'crimson' | 'indigo' | 'slate'>('slate');

  // Multi-view layout switcher per active database tab
  // Options: 'spreadsheet' | 'kanban' | 'gallery' | 'calendar' | 'analytics'
  const [viewLayout, setViewLayout] = useState<'spreadsheet' | 'kanban' | 'gallery' | 'calendar' | 'analytics'>('spreadsheet');

  // Manual Drag row ordering states
  const [manualRowOrders, setManualRowOrders] = useState<Record<string, string[]>>(() => {
    try {
      const local = localStorage.getItem('nevaeh_manual_row_orders');
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });
  const [useManualSort, setUseManualSort] = useState<Record<string, boolean>>({});

  useEffect(() => {
    localStorage.setItem('nevaeh_manual_row_orders', JSON.stringify(manualRowOrders));
  }, [manualRowOrders]);

  // Input states for Add Asset Modal
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newAsset, setNewAsset] = useState<Omit<AssetEquipment, 'id'>>({
    name: '',
    category: 'Production Machine',
    value: 5000,
    status: 'Operational',
    maintenanceDate: new Date().toISOString().split('T')[0],
    qty: 1,
    purchaseValue: 5000,
    depreciation: 10
  });

  // Custom column additions mapping
  const [customColumns, setCustomColumns] = useState<Record<string, Array<{ key: string; label: string; type: 'text' | 'number' | 'tag' | 'formula' }>>>({
    customers: [
      { key: 'custom_clv_risk', label: 'VIP Status Risk', type: 'tag' },
      { key: 'custom_care_notes', label: 'Outreach Notes', type: 'text' }
    ],
    assets: [
      { key: 'custom_operator', label: 'Primary Operator', type: 'text' },
      { key: 'custom_efficiency', label: 'Efficiency (%)', type: 'number' }
    ],
    cashflow: [
      { key: 'custom_tax_eligible', label: 'Form 1099 Tax Category', type: 'tag' },
      { key: 'custom_audited', label: 'Audited Stamp', type: 'text' }
    ]
  });

  // Global override databases (Allows free-freedom cell edits of any calculated or database cell)
  const [customOverrides, setCustomOverrides] = useState<Record<string, Record<string, any>>>({
    customers: {},
    assets: {},
    cashflow: {}
  });

  // Custom spreadsheet formulas starting with '=' e.g. '=SUM(...)', '[totalSpent] * 0.1'
  const [customFormulas, setCustomFormulas] = useState<Record<string, string>>({
    'customers_arch_elite_vip_multiplier': '=[totalSpent] * 0.15',
    'cashflow_inflow_multiplier': '=[amount] * 0.9'
  });

  // Metadata attributes for cell comments, highlights or emojis
  const [cellMetadata, setCellMetadata] = useState<Record<string, CellMetadata>>({
    'customers_Alia Atreides_name': { comment: 'Executive Elite Client. High priority communications.', highlight: 'rgba(212, 175, 55, 0.12)', icon: '⭐' },
    'assets_AST-001_status': { highlight: 'rgba(16, 185, 129, 0.12)', comment: 'Recently serviced back to standard.' },
    'cashflow_CSH-002_amount': { highlight: 'rgba(239, 68, 68, 0.12)', icon: '⚠️' }
  });

  // Active cell editing states
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Selected cell for Formula Bar
  const [selectedCell, setSelectedCell] = useState<{ tabKey: string; rowId: string; colKey: string; rowIndex: number; colIndex: number } | null>(null);

  // Real-time formula validation for formula bar
  const realTimeSyntaxError = useMemo(() => {
    if (!selectedCell) return null;
    const key = `${activeTab}_${selectedCell.rowId}_${selectedCell.colKey}`;
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
  }, [selectedCell, customFormulas, activeTab]);

  // Right-click contextual dropdown coordinate state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; rowId: string; colKey: string; tabKey: string } | null>(null);

  // Sorting & multidimensional criteria filtering
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddCustomCol, setShowAddCustomCol] = useState(false);
  const [newColDetails, setNewColDetails] = useState({ label: '', type: 'text' as any });

  // Column manual widths
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    name: 180,
    email: 220,
    totalOrders: 140,
    totalSpent: 160,
    tier: 140,
    id: 110,
    category: 150,
    value: 150,
    status: 130,
    maintenanceDate: 170,
    amount: 140,
    date: 130,
    type: 120,
    custom_clv_risk: 150,
    custom_care_notes: 190,
    custom_operator: 160,
    custom_efficiency: 140,
    custom_tax_eligible: 180,
    custom_audited: 140
  });

  // Base configurations schema of columns
  const getBaseSchema = (tab: 'customers' | 'assets' | 'cashflow') => {
    const sym = currencySymbol;
    const list: Record<string, Array<{ key: string; label: string; type: 'text' | 'number' | 'tag' | 'formula' | 'date' }>> = {
      customers: [
        { key: 'name', label: 'Customer Name', type: 'text' },
        { key: 'email', label: 'E-mail Outreach ID', type: 'text' },
        { key: 'totalOrders', label: 'Fulfillment Order Count', type: 'number' },
        { key: 'totalSpent', label: `Dynamic CLV Total (${sym})`, type: 'number' },
        { key: 'tier', label: 'CRM Engagement Tier', type: 'tag' }
      ],
      assets: [
        { key: 'id', label: 'Asset Reference ID', type: 'text' },
        { key: 'name', label: 'Operational Asset Description', type: 'text' },
        { key: 'category', label: 'Functional Category Class', type: 'tag' },
        { key: 'value', label: `Appraised Capital Value (${sym})`, type: 'number' },
        { key: 'status', label: 'Current Working Status', type: 'tag' },
        { key: 'maintenanceDate', label: 'Scheduled Service Date', type: 'date' }
      ],
      cashflow: [
        { key: 'id', label: 'Ledger Registry ID', type: 'text' },
        { key: 'category', label: 'Account Ledger Category', type: 'text' },
        { key: 'type', label: 'Transaction Type Stamp', type: 'tag' },
        { key: 'amount', label: `Adjusted Ledger Amount (${sym})`, type: 'number' },
        { key: 'date', label: 'Accounting Stamp Date', type: 'date' }
      ]
    };
    return list[tab];
  };

  // Compile active columns list
  const activeColumnsSchema = useMemo(() => {
    if (activeTab === 'reports') return [];
    return [...getBaseSchema(activeTab), ...(customColumns[activeTab] || [])];
  }, [activeTab, customColumns]);

  // Derived Customers CLV Database
  const derivedCustomersList = useMemo(() => {
    const map: Record<string, { id: string; name: string; email: string; totalOrders: number; totalSpent: number; tier: string }> = {};
    computedSales.forEach((s, idx) => {
      const email = `${s.customerName.toLowerCase().replace(/\s+/g, '')}@nevaeh.luxury`;
      if (!map[s.customerName]) {
        map[s.customerName] = {
          id: `CUST-00${idx + 1}`,
          name: s.customerName,
          email,
          totalOrders: 0,
          totalSpent: 0,
          tier: 'Silver Member'
        };
      }
      map[s.customerName].totalOrders += s.qtySold;
      map[s.customerName].totalSpent += s.netRevenue;
    });

    return Object.values(map).map(c => {
      if (c.totalSpent > 1500) c.tier = 'Arch Elite VIP';
      else if (c.totalSpent > 600) c.tier = 'Gold Sovereign';
      return c;
    });
  }, [computedSales]);

  const columnsCustomers: ColumnDef[] = [
    { key: 'id', label: 'ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama Pelanggan' : 'Customer Name', isEditable: true, type: 'text' },
    { key: 'email', label: isIdLng ? 'Email / Kontak' : 'E-mail Outreach ID', isEditable: true, type: 'text' },
    { key: 'totalOrders', label: isIdLng ? 'Jumlah Pesanan' : 'Fulfillment Order Count', isEditable: true, type: 'number', align: 'right' },
    { key: 'totalSpent', label: isIdLng ? 'Total Spent' : 'Dynamic CLV Total', isEditable: true, type: 'currency', align: 'right' },
    { key: 'tier', label: isIdLng ? 'Kategori Anggota' : 'CRM Engagement Tier', isEditable: true, type: 'status', selectOptions: ['Silver Member', 'Gold Sovereign', 'Arch Elite VIP'], align: 'center' }
  ];

  const handleDataChangeCustomers = (newData: Record<string, any>[]) => {
    newData.forEach(newItem => {
      const oldItem = focusRowsData.find(c => c.id === newItem.id);
      if (oldItem) {
        columnsCustomers.forEach(col => {
          if (newItem[col.key] !== oldItem[col.key]) {
            saveCellUpdate(newItem.id, col.key, String(newItem[col.key]));
          }
        });
      }
    });
  };

  const columnsAssets: ColumnDef[] = [
    { key: 'id', label: 'Asset ID', type: 'text', isEditable: false },
    { key: 'name', label: isIdLng ? 'Nama Aset' : 'Operational Asset Description', isEditable: true, type: 'text' },
    { key: 'category', label: isIdLng ? 'Kategori Aset' : 'Functional Category Class', isEditable: true, type: 'status', selectOptions: ['Production Machine', 'Facility / Logistics', 'Office & Tech IT', 'Vehicles & Heavy Rig', 'Finished Sample Asset'], align: 'center' },
    { key: 'value', label: isIdLng ? 'Nilai Modal Aset' : 'Appraised Capital Value', isEditable: true, type: 'currency', align: 'right' },
    { key: 'status', label: isIdLng ? 'Status Kerja' : 'Current Working Status', isEditable: true, type: 'status', selectOptions: ['Operational', 'Under Maintenance', 'Retired Class', 'Spare Inventory'], align: 'center' },
    { key: 'maintenanceDate', label: isIdLng ? 'Jadwal Servis' : 'Scheduled Service Date', isEditable: true, type: 'date' }
  ];

  const handleDataChangeAssets = (newData: Record<string, any>[]) => {
    newData.forEach(newItem => {
      const oldItem = focusRowsData.find(a => a.id === newItem.id);
      if (oldItem) {
        columnsAssets.forEach(col => {
          if (newItem[col.key] !== oldItem[col.key]) {
            saveCellUpdate(newItem.id, col.key, String(newItem[col.key]));
          }
        });
      }
    });
  };

  const columnsCashflow: ColumnDef[] = [
    { key: 'id', label: 'Ledger ID', type: 'text', isEditable: false },
    { key: 'category', label: isIdLng ? 'Kategori Ledger' : 'Account Ledger Category', isEditable: true, type: 'text' },
    { key: 'type', label: isIdLng ? 'Tipe Transaksi' : 'Transaction Type Stamp', isEditable: true, type: 'status', selectOptions: ['INFLOW', 'OUTFLOW'], align: 'center' },
    { key: 'amount', label: isIdLng ? 'Nilai Transaksi' : 'Adjusted Ledger Amount', isEditable: true, type: 'currency', align: 'right' },
    { key: 'date', label: isIdLng ? 'Tanggal Buku' : 'Accounting Stamp Date', isEditable: true, type: 'date' }
  ];

  const handleDataChangeCashflow = (newData: Record<string, any>[]) => {
    newData.forEach(newItem => {
      const oldItem = focusRowsData.find(cs => cs.id === newItem.id);
      if (oldItem) {
        columnsCashflow.forEach(col => {
          if (newItem[col.key] !== oldItem[col.key]) {
            saveCellUpdate(newItem.id, col.key, String(newItem[col.key]));
          }
        });
      }
    });
  };

  // Evaluate Custom spreadsheet formula
  const evaluateCellFormula = (row: any, colKey: string, rawVal: any, tabKey: string): any => {
    const formulaKey = `${tabKey}_${row.id || row.name}_${colKey}`;
    const formula = customFormulas[formulaKey];
    if (!formula || !formula.startsWith('=')) {
      return rawVal;
    }

    try {
      let expr = formula.substring(1).trim();

      // bracket matching
      const bracketRegex = /\[(.*?)\]/g;
      let match;
      while ((match = bracketRegex.exec(expr)) !== null) {
        const fieldName = match[1];
        let val = row[fieldName];
        if (val === undefined) val = 0;
        expr = expr.replace(`[${fieldName}]`, String(val));
      }

      // Safe arithmetic via mathjs (replaces eval)
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
      const result = math.evaluate(sanitized);
      return typeof result === 'number' ? result : formula;
    } catch {
      return '#REF!';
    }
  };

  // Compile full table data integrating formula, Search queries, custom columns, and overrides
  const getCompiledData = (tabKey: 'customers' | 'assets' | 'cashflow'): any[] => {
    let raw: any[] = [];
    if (tabKey === 'customers') {
      raw = derivedCustomersList;
    } else if (tabKey === 'assets') {
      raw = assets;
    } else if (tabKey === 'cashflow') {
      raw = cashflow;
    }

    // Apply Overrides & formulas & Custom properties
    let processed = raw.map(row => {
      const idKey = row.id || row.name; 
      const overrideSet = customOverrides[tabKey]?.[idKey] || {};
      const entry = { ...row, ...overrideSet };

      // Evaluate calculated values
      const cols = [...getBaseSchema(tabKey), ...(customColumns[tabKey] || [])];
      cols.forEach(c => {
        const formulaKey = `${tabKey}_${idKey}_${c.key}`;
        if (customFormulas[formulaKey]) {
          entry[c.key] = evaluateCellFormula(entry, c.key, entry[c.key], tabKey);
        }
      });
      return entry;
    });

    // Handle string search filtering
    if (searchTerm.trim() !== '') {
      processed = processed.filter(row => {
        return Object.values(row).some(v => 
          String(v).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Interactive custom sorting
    return [...processed].sort((a, b) => {
      if (useManualSort[tabKey] && manualRowOrders[tabKey]) {
        const orderList = manualRowOrders[tabKey];
        const aId = a.id || a.name;
        const bId = b.id || b.name;
        const aIdx = orderList.indexOf(String(aId));
        const bIdx = orderList.indexOf(String(bId));
        if (aIdx !== -1 && bIdx !== -1) {
          return aIdx - bIdx;
        }
      }

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

  // Memoized lists
  const focusRowsData = useMemo(() => {
    if (activeTab === 'reports') return [];
    return getCompiledData(activeTab);
  }, [activeTab, derivedCustomersList, assets, cashflow, searchTerm, sortField, sortOrder, customFormulas, customOverrides, manualRowOrders, useManualSort]);

  // Derived financial summary
  const cashflowSummary = useMemo(() => {
    const compiledLedgers = getCompiledData('cashflow');
    const totalInflow = compiledLedgers.filter(c => c.type === 'INFLOW').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const totalOutflow = compiledLedgers.filter(c => c.type === 'OUTFLOW').reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const balance = totalInflow - totalOutflow;
    return {
      totalInflow,
      totalOutflow,
      balance
    };
  }, [cashflow, customOverrides, customFormulas]);

  const reportChannels = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    computedSales.forEach(s => {
      if (!map[s.channel]) map[s.channel] = { count: 0, value: 0 };
      map[s.channel].count += s.qtySold;
      map[s.channel].value += s.netRevenue;
    });
    return Object.entries(map).map(([channel, info]) => ({
      channel,
      ...info
    })).sort((a, b) => b.value - a.value);
  }, [computedSales]);

  // Drag Rows rearranging handlers
  const [draggedRowIdx, setDraggedRowIdx] = useState<number | null>(null);
  const [dragOverRowIdx, setDragOverRowIdx] = useState<number | null>(null);

  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverRowIdx(index);
  };

  const handleRowDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedRowIdx === null || draggedRowIdx === targetIdx) {
      setDraggedRowIdx(null);
      setDragOverRowIdx(null);
      return;
    }

    // Get current calculated order of rows
    const currentRows = [...focusRowsData];
    const [movedRow] = currentRows.splice(draggedRowIdx, 1);
    currentRows.splice(targetIdx, 0, movedRow);

    // Save this new order list of IDs/Names
    const orderKeys = currentRows.map(r => r.id || r.name);
    setManualRowOrders(prev => ({
      ...prev,
      [activeTab]: orderKeys
    }));

    setUseManualSort(prev => ({
      ...prev,
      [activeTab]: true
    }));

    setDraggedRowIdx(null);
    setDragOverRowIdx(null);
  };

  // Handle manual column resizing width drag
  const handleColResizeStart = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colWidths[colKey] || 150;

    const handleMouseMove = (mv: MouseEvent) => {
      const delta = mv.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [colKey]: Math.max(80, startWidth + delta)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Color options
  type ThemeKey = 'gold' | 'emerald' | 'crimson' | 'indigo' | 'slate';
  const PRESET_THEMES: Record<ThemeKey, { hex: string; text: string; border: string; fill: string }> = {
    gold:    { hex: '#d4af37', text: 'text-[var(--color-accent-highlight)]', border: 'border-[var(--color-accent-highlight)]/30', fill: 'bg-[var(--color-accent-highlight)]/10' },
    emerald: { hex: '#10b981', text: 'text-[#10b981]', border: 'border-[#10b981]/30', fill: 'bg-[#10b981]/10' },
    crimson: { hex: '#f43f5e', text: 'text-[#f43f5e]', border: 'border-[#f43f5e]/30', fill: 'bg-[#f43f5e]/10' },
    indigo:  { hex: '#6366f1', text: 'text-[#6366f1]', border: 'border-[#6366f1]/30', fill: 'bg-[#6366f1]/10' },
    slate:   { hex: '#94a3b8', text: 'text-[var(--color-text-main)]',  border: 'border-white/10',       fill: 'bg-[var(--color-background)]/10'   },
  };

  const selectedTheme = PRESET_THEMES[activeTheme as ThemeKey];

  // Inline grid cell update
  const saveCellUpdate = (rowId: string, colKey: string, val: string) => {
    const isFormula = val.startsWith('=');
    const fKey = `${activeTab}_${rowId}_${colKey}`;

    if (isFormula) {
      const syntaxCheck = validateFormulaSyntax(val);
      if (!syntaxCheck.isValid) {
        if (addNotification) {
          addNotification(`Formula Syntax Error in ${colKey.toUpperCase()}: ${syntaxCheck.error}`, 'warning');
        }
        return;
      }

      // Check self-reference circular reference
      const deps = val.replace('=', '').match(/\[(.*?)\]/g) || [];
      const hasSelfReference = deps.some(d => d === `[${colKey}]`);
      if (hasSelfReference) {
        if (addNotification) {
          addNotification(`Circular reference warning: custom cell in ${colKey.toUpperCase()} references itself`, 'warning');
        }
        return;
      }

      setCustomFormulas(prev => ({ ...prev, [fKey]: val }));
      setEditingCell(null);
      return;
    }

    // Save as local Override data point
    setCustomOverrides(prev => {
      const tabGroup = prev[activeTab] || {};
      const rowGroup = tabGroup[rowId] || {};
      return {
        ...prev,
        [activeTab]: {
          ...tabGroup,
          [rowId]: {
            ...rowGroup,
            [colKey]: colKey.toLowerCase().includes('value') || colKey.toLowerCase().includes('spent') || colKey.toLowerCase().includes('orders') || colKey.toLowerCase().includes('amount') ? (parseFloat(val) || 0) : val
          }
        }
      };
    });

    // Also notify contextual model states if updating primitive records directly
    if (activeTab === 'assets') {
      const parsedVal = colKey === 'value' ? (parseInt(val) || 0) : val;
      updateAsset(rowId, { [colKey]: parsedVal as any });
    }

    setEditingCell(null);
  };

  // Add custom database column
  const handleCreateCustomColumn = () => {
    if (!newColDetails.label) return;
    const colKey = 'custom_' + newColDetails.label.toLowerCase().replace(/\s+/g, '_');
    setCustomColumns(prev => ({
      ...prev,
      [activeTab]: [
        ...(prev[activeTab] || []),
        { key: colKey, label: newColDetails.label, type: newColDetails.type }
      ]
    }));
    setShowAddCustomCol(false);
    setNewColDetails({ label: '', type: 'text' });
  };

  // Handle cell right click popup trigger
  const handleCellRightClick = (e: React.MouseEvent, rowId: string, colKey: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      rowId,
      colKey,
      tabKey: activeTab
    });
  };

  useEffect(() => {
    const dismissMenu = () => setContextMenu(null);
    window.addEventListener('click', dismissMenu);
    return () => window.removeEventListener('click', dismissMenu);
  }, []);

  // Update cell color block
  const applyCellBg = (colorStr: string) => {
    if (!contextMenu) return;
    const key = `${contextMenu.tabKey}_${contextMenu.rowId}_${contextMenu.colKey}`;
    setCellMetadata(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        highlight: colorStr
      }
    }));
  };

  // Set Lock element
  const toggleRowLock = () => {
    if (!contextMenu) return;
    const key = `${contextMenu.tabKey}_${contextMenu.rowId}_${contextMenu.colKey}`;
    const curr = cellMetadata[key]?.isLocked;
    setCellMetadata(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        isLocked: !curr
      }
    }));
  };

  // Pin emoji annotation
  const insertAnnotationEmoji = (emoji: string) => {
    if (!contextMenu) return;
    const key = `${contextMenu.tabKey}_${contextMenu.rowId}_${contextMenu.colKey}`;
    setCellMetadata(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        icon: emoji
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-[var(--color-text-main)] relative">
      
      {/* 1. FUTURISTIC BANNER STRATEGY EXECUTIVE CONSOLE */}
      <div 
        className="glass-panel p-5 rounded-xl border relative overflow-hidden transition-all duration-300"
        style={{ 
          borderColor: selectedTheme.hex + '35',
          background: `rgba(9, 9, 11, ${tableOpacity / 100})`,
          backdropFilter: `blur(${tableBlur}px)`
        }}
      >
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-white/[0.02] to-transparent pointer-events-none rounded-bl-full" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px', margin: 0 }}>
              Finances &amp; Assets
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '3px', marginBottom: 0 }}>
              Pelanggan, aset, arus kas, dan laporan dalam satu tempat.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {activeTab === 'assets' && (
              <button 
                onClick={() => setShowAddAsset(true)}
                className="px-3.5 py-2 bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] text-[var(--color-text-main)] transition-all flex items-center font-bold gap-1.5 uppercase tracking-wider rounded-xl text-xs"
              >
                <Plus size={14} /> {t('fin_btn_add_asset')}
              </button>
            )}

            <button 
              onClick={() => {
                // Export simple structured text array representation
                const headerText = activeColumnsSchema.map(c => c.label).join(',');
                const rowsText = focusRowsData.map(r => activeColumnsSchema.map(c => String(r[c.key] || '')).join(',')).join('\n');
                const fullText = `${headerText}\n${rowsText}`;
                const blob = new Blob([fullText], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nevaeh_${activeTab}_export.csv`;
                a.click();
              }}
              disabled={activeTab === 'reports'}
              className="px-3 py-1.5 bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] border border-white/5 text-[var(--color-text-main)] disabled:opacity-40 rounded-xl flex items-center gap-1.5 text-xs uppercase cursor-pointer transition-all"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE METRICS FORMULA CONSOLIDATIONS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'LIQUID BANK INFLOW', val: cashflowSummary.totalInflow, color: 'text-emerald-400', desc: 'Active sales deposits & funding lines' },
          { label: 'OPERATIONAL DEBITS OUTFLOW', val: cashflowSummary.totalOutflow, color: 'text-red-400', desc: 'Raw material POs & production costs' },
          { label: 'RESERVE BALANCES', val: cashflowSummary.balance, color: 'text-[var(--color-accent-highlight)]', desc: 'Liquid capital safety assets' },
          { label: 'ASSETS VALUATION', val: assets.reduce((sum, a) => sum + (a.value ?? (a.purchaseValue || 0) * (a.qty || 1)), 0), color: 'text-indigo-400', desc: 'Equipment Appraisals' }
        ].map((card, i) => (
          <div key={i} className="glass-panel p-4 rounded-xl border border-white/[0.03] bg-[var(--color-background)]/75 flex flex-col justify-between">
            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest">{card.label}</span>
            <div className={`text-xl font-mono font-medium ${card.color} my-2`}>
              {formatMoney(card.val)}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-tight">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 3. WORKSPACE SEGMENT RIBBON SELECTION */}
      <div className="flex flex-wrap border-b border-white/[0.05] gap-6 text-sm">
        {[
          { id: 'reports', label: 'fin_tab_overview', count: null },
          { id: 'customers', label: 'fin_tab_customers', count: derivedCustomersList.length },
          { id: 'assets', label: 'fin_tab_assets', count: assets.length },
          { id: 'cashflow', label: 'fin_tab_cashflow', count: cashflow.length }
        ].map((item) => {
          const active = activeTab === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setSearchTerm('');
                setSelectedCell(null);
                setSortField(item.id === 'customers' ? 'name' : 'id');
              }}
              className={`pb-3 tracking-wider uppercase text-xs transition-colors relative cursor-pointer ${
                active ? 'text-[var(--color-accent-highlight)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              {active && <motion.div layoutId="finance-active-indicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d4af37]" />}
              {t(item.label)} {item.count !== null && `[${item.count}]`}
            </button>
          );
        })}
      </div>

      {/* 4. DYNAMIC INTERACTION CONTROLS BAR */}
      {activeTab !== 'reports' && (
        <div className="glass-panel p-4 rounded-xl border border-white/[0.03] bg-[var(--color-background)]/60 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* SEARCH & FILTERS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Realtime filtered coordinate matches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--color-card-bg)] border border-white/[0.04] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-highlight)]/50 rounded-xl text-xs"
              />
            </div>

            {/* DENSITY SELECTOR */}
            <div className="flex items-center gap-1 p-1 bg-[var(--color-card-bg)] border border-white/[0.04] rounded-xl text-xs text-[var(--color-text-muted)]">
              <span className="px-2 select-none uppercase">Density</span>
              {(['high', 'normal', 'relaxed'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`px-2 py-1 rounded-xl transition-colors uppercase font-bold text-xs ${
                    density === d ? 'bg-[#d4af37] text-[var(--color-text-main)]' : 'hover:bg-[rgba(255,255,255,0.03)] text-[var(--color-text-main)]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* SHOW ALTERNATING ROW COLOR */}
            <button
              onClick={() => setAlternatingRows(!alternatingRows)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs uppercase font-semibold ${
                alternatingRows ? 'border-[var(--color-accent-highlight)]/30 text-[var(--color-accent-highlight)]' : 'border-white/5 text-[var(--color-text-muted)]'
              }`}
            >
              🦓 Zebra: {alternatingRows ? 'ON' : 'OFF'}
            </button>

            {/* CUSTOM COLUMNS GENERATION BUTTON */}
            <button 
              onClick={() => setShowAddCustomCol(true)}
              className="px-3 py-1.5 border border-indigo-500/25 text-indigo-300 hover:border-indigo-400 hover:text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer bg-indigo-950/10"
            >
              <Plus size={14} /> ADD CUSTOM COLUMN
            </button>
          </div>

          {/* SPREADSHEET SUB-VIEWS SWITCHER */}
          <div className="flex items-center gap-1.5 bg-[var(--color-background)]/60 p-1 rounded-lg border border-white/5 text-xs">
            {[
              { id: 'spreadsheet', label: 'Spreadsheet', icon: Grid3X3 },
              { id: 'kanban', label: 'Kanban board', icon: KanbanSquare },
              { id: 'gallery', label: 'Gallery Deck', icon: Layers },
              { id: 'calendar', label: 'Service Calendar', icon: Calendar },
              { id: 'analytics', label: 'Audit Chart', icon: BarChart3 }
            ].map(vOpt => {
              const IconComp = vOpt.icon;
              const isSelected = viewLayout === vOpt.id;
              return (
                <button
                  key={vOpt.id}
                  onClick={() => setViewLayout(vOpt.id as any)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs font-bold uppercase ${
                    isSelected ? 'bg-[#d4af37] text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                  }`}
                >
                  <IconComp size={14} />
                  <span>{vOpt.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* 5. EXCEL DYNAMIC FORMULA BAR BAR */}
      {activeTab !== 'reports' && (
        <div className="glass-panel p-3.5 rounded-xl border border-white/[0.04] bg-[var(--color-background)]/80 flex items-center gap-3 text-xs">
          <div className="bg-[var(--color-card-bg)] border border-white/10 text-[var(--color-accent-highlight)] px-3 py-1.5 rounded-xl font-semibold min-w-[200px] text-center text-xs">
            {selectedCell ? (
              <span>GRID REF: {selectedCell.rowId.toUpperCase()} » COL: {selectedCell.colKey.toUpperCase()}</span>
            ) : (
              <span className="text-[var(--color-text-muted)] block uppercase tracking-wide">Select database cell</span>
            )}
          </div>
          
          <div className="text-[var(--color-text-muted)] font-bold select-none text-sm px-1 shrink-0">ƒ<sub>x</sub></div>
          
          <div className="flex-grow bg-black/60 border border-white/[0.06] rounded-xl px-3 py-1.5 flex items-center justify-between">
            <input
              type="text"
              placeholder={selectedCell ? "Type literal number or standard formulation starting with = (e.g., =[totalSpent] * 0.15)" : "Double-click spreadsheet cell grid to calculate margins, write status or append custom formula notes..."}
              disabled={!selectedCell}
              value={
                selectedCell 
                  ? (customFormulas[`${activeTab}_${selectedCell.rowId}_${selectedCell.colKey}`] ?? String(focusRowsData.find(r => (r.id || r.name) === selectedCell.rowId)?.[selectedCell.colKey] ?? ''))
                  : ''
              }
              onChange={(e) => {
                if (selectedCell) {
                  const val = e.target.value;
                  const key = `${activeTab}_${selectedCell.rowId}_${selectedCell.colKey}`;
                  if (val.startsWith('=')) {
                    setCustomFormulas(prev => ({ ...prev, [key]: val }));
                  } else {
                    saveCellUpdate(selectedCell.rowId, selectedCell.colKey, val);
                  }
                }
              }}
              className="w-full bg-transparent text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-0 text-xs"
            />
            {selectedCell && (() => {
              const formulaValue = customFormulas[`${activeTab}_${selectedCell.rowId}_${selectedCell.colKey}`] || '';
              const hasFormula = formulaValue.startsWith('=');
              return (
                <div className="flex items-center gap-2">
                  {hasFormula ? (
                    realTimeSyntaxError ? (
                      <span className="text-xs text-red-400 bg-red-950/20 border border-red-500/10 px-2 py-0.5 rounded-xl uppercase font-bold animate-fadeIn">
                        ⚠️ Error: {realTimeSyntaxError}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/10 px-2 py-0.5 rounded-xl uppercase font-bold">
                        ✓ Formula Active
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)] uppercase bg-[var(--color-background)]/40 px-1.5 py-0.5 rounded-xl">Literal Data</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const key = `${activeTab}_${selectedCell.rowId}_${selectedCell.colKey}`;
                      setCustomFormulas(prev => {
                        const next = { ...prev };
                        delete next[key];
                        return next;
                      });
                    }}
                    className="text-[var(--color-text-muted)] hover:text-red-400 text-xs uppercase font-bold cursor-pointer ml-1"
                    title="Wipe current formula"
                  >
                    Wipe
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 6. ADVANCED VIEWPORTS INJECTOR ENVIRONMENT */}
      <div 
        className="glass-panel rounded-xl overflow-hidden border border-white/5 relative bg-[var(--color-background)]/20"
        style={{
          boxShadow: `0 10px 40px ${selectedTheme.hex}05`
        }}
      >
        
        {/* --- VIEW 1: CONSOLIDATED REPORT VIEW (STATIC DASH) --- */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
                  <div>
                    <h3 className="text-base font-display font-medium uppercase tracking-wider text-[var(--color-accent-highlight)]">Financial Sourcing Balance-Sheet</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">Dynamic diagnostic of operational cashflow projections</p>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-xl">AUDIT ACTIVE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[var(--color-background)]/70 rounded-xl border border-white/[0.02]">
                    <div className="text-xs text-[var(--color-text-muted)] uppercase">Bank Net Deposits</div>
                    <div className="text-2xl text-emerald-400 font-bold font-mono mt-1">{formatMoney(cashflowSummary.totalInflow)}</div>
                  </div>
                  <div className="p-4 bg-[var(--color-background)]/70 rounded-xl border border-white/[0.02]">
                    <div className="text-xs text-[var(--color-text-muted)] uppercase">Operational Debit Expenses</div>
                    <div className="text-2xl text-red-400 font-bold font-mono mt-1">-{formatMoney(cashflowSummary.totalOutflow)}</div>
                  </div>
                </div>

                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-[var(--color-card-bg)]/60 p-3 text-xs uppercase text-[var(--color-text-muted)] flex justify-between">
                    <span>Active Marketing Channel</span>
                    <span>Contribution Value & Conversion</span>
                  </div>
                  <div className="divide-y divide-white/[0.03]">
                    {reportChannels.map(rc => (
                      <div key={rc.channel} className="p-3 text-xs flex justify-between items-center hover:bg-white/[0.01]">
                        <div>
                          <span className="font-semibold text-[var(--color-text-main)] uppercase">{rc.channel}</span>
                          <span className="text-[var(--color-text-muted)] text-xs ml-2">({rc.count.toLocaleString()} Orders Filled)</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-medium">{formatMoney(rc.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* MARGIN DIAGNOSTICS & SYSTEM RECOMMENDATIONS */}
            <div className="glass-panel p-5 rounded-lg border border-white/[0.04] bg-[var(--color-card-bg)]/40 space-y-4">
              <h4 className="text-sm font-display uppercase tracking-widest border-b border-[var(--color-border-line)] pb-3" style={{color:accentHex}}>Capital Strategy Ledger</h4>
              <div className="space-y-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
                <p>
                  Nebulæ Operating System aggregates fabric purchasing ledgers to verify current working capital.
                </p>
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-emerald-400 space-y-1">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase">Cash Reserve Balance</span>
                  <div className="text-lg font-bold">{formatMoney(cashflowSummary.balance)}</div>
                </div>

                <div className="space-y-3 pt-3">
                  <h5 className="text-xs text-[var(--color-accent-highlight)] uppercase tracking-wider">SYSTEM AI RECOMMENDATIONS</h5>
                  <div className="flex gap-2 items-start text-xs text-[var(--color-text-main)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
                    <span>Primary growth engine triggered by luxury ecommerce. Allocate surplus reserves to VIP Client outreach databases.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: STANDARD EXCEL SPREADSHEET GRID LAYOUT --- */}
        {activeTab !== 'reports' && viewLayout === 'spreadsheet' && (
          <div className="space-y-4 p-4 animate-fadeIn">
            {activeTab === 'customers' && (
              <SmartTable 
                tableId="finances_customers"
                title="Spreadsheet Customer CRM Directory"
                columns={columnsCustomers}
                data={focusRowsData}
                onDataChange={handleDataChangeCustomers}
                allowAddColumn={true}
                allowAddRow={true}
                allowImport={true}
                allowExport={true}
                frozenColumns={2}
              />
            )}
            {activeTab === 'assets' && (
              <SmartTable 
                tableId="finances_assets"
                title="Spreadsheet Capital Machinery & Assets"
                columns={columnsAssets}
                data={focusRowsData}
                onDataChange={handleDataChangeAssets}
                allowAddColumn={true}
                allowAddRow={true}
                allowImport={true}
                allowExport={true}
                frozenColumns={2}
              />
            )}
            {activeTab === 'cashflow' && (
              <SmartTable 
                tableId="finances_cashflow"
                title="Spreadsheet Double-Entry Accounting Ledger"
                columns={columnsCashflow}
                data={focusRowsData}
                onDataChange={handleDataChangeCashflow}
                allowAddColumn={true}
                allowAddRow={true}
                allowImport={true}
                allowExport={true}
                frozenColumns={2}
              />
            )}
          </div>
        )}

        {/* --- VIEW 3: KANBAN WORKSPACE BOARD --- */}
        {activeTab !== 'reports' && viewLayout === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            {[
              { id: 'Column_Alpha', title: 'High Balance Tier Priority', logic: (row: any) => (parseFloat(row.value) || parseFloat(row.totalSpent) || parseFloat(row.amount) || 0) > 1000 },
              { id: 'Column_Beta', title: 'Operational Standard Flow', logic: (row: any) => {
                const val = parseFloat(row.value) || parseFloat(row.totalSpent) || parseFloat(row.amount) || 0;
                return val >= 400 && val <= 1000;
              } },
              { id: 'Column_Gamma', title: 'Secondary / Inactive reserves', logic: (row: any) => (parseFloat(row.value) || parseFloat(row.totalSpent) || parseFloat(row.amount) || 0) < 400 }
            ].map((col) => {
              const columnRows = focusRowsData.filter(col.logic);
              return (
                <div key={col.id} className="space-y-4 bg-[var(--color-background)]/40 p-4 rounded-xl border border-white/[0.04]">
                  <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                    <span className="text-xs font-bold text-[var(--color-accent-highlight)] uppercase">{col.title}</span>
                    <span className="text-xs bg-[rgba(255,255,255,0.03)] px-2 py-0.5 rounded-full">{columnRows.length}</span>
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                    {columnRows.map((row) => (
                      <div 
                        key={row.id || row.name} 
                        className="glass-panel p-3.5 rounded-lg border border-white/5 bg-[var(--color-card-bg)]/60 shadow-lg space-y-2 hover:border-[var(--color-accent-highlight)]/30 transition-all text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-[var(--color-text-main)] uppercase truncate">{row.name || row.category}</h5>
                          <span className="text-xs text-[var(--color-accent-highlight)]">REF: {row.id || 'CRM'}</span>
                        </div>
                        <div className="text-xs text-emerald-400 font-bold">
                          {formatMoney(row.value || row.totalSpent || row.amount || 0)}
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] uppercase truncate leading-none">{row.email || row.category || row.type || 'Standard'}</p>
                      </div>
                    ))}
                    {columnRows.length === 0 && (
                      <div className="text-center py-8 text-[var(--color-text-muted)] uppercase text-xs">Empty deck</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- VIEW 4: GALLERY DECK CARDS INTERFACE --- */}
        {activeTab !== 'reports' && viewLayout === 'gallery' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {focusRowsData.map((row) => (
              <div 
                key={row.id || row.name} 
                className="glass-panel p-5 rounded-xl border border-white/[0.03] bg-[var(--color-card-bg)]/60 shadow-xl overflow-hidden hover:scale-[1.01] transition-transform flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Dynamic Asset/Customer Visual card headers */}
                  {activeTab === 'assets' && (row.image || row.id) && (
                    <div className="w-full h-36 overflow-hidden rounded-xl bg-[var(--color-background)] mb-1 border border-white/[0.05]">
                      <img 
                        src={row.image || 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400'} 
                        alt={row.name} 
                        className="w-full h-full object-cover opacity-80" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-[var(--color-text-muted)] block uppercase">SYSTEM REG: {row.id || 'VIP'}</span>
                      <h4 className="text-sm font-semibold uppercase text-[var(--color-text-main)] tracking-tight mt-1 truncate max-w-[200px]">{row.name || row.category}</h4>
                    </div>
                    {row.status && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-xl font-bold uppercase">
                        {row.status}
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/[0.04] space-y-1.5 text-xs text-[var(--color-text-muted)]">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)] text-xs">VALUATION METRIC</span>
                      <span className="text-[var(--color-accent-highlight)] font-bold">
                        {formatMoney(row.value || row.totalSpent || row.amount || 0)}
                      </span>
                    </div>
                    {row.email && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)] text-xs">REACHOUT PATH</span>
                        <span className="text-[var(--color-text-main)] truncate max-w-[150px]">{row.email}</span>
                      </div>
                    )}
                    {row.maintenanceDate && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-muted)] text-xs">SERVICE STAMP</span>
                        <span className="text-[var(--color-text-main)]">{row.maintenanceDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.03] flex justify-end gap-2 text-xs">
                  {activeTab === 'assets' && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Write-off physical asset ledger ${row.name}?`)) deleteAsset(row.id);
                      }}
                      className="p-1 px-2.5 bg-red-950/25 border border-red-500/15 text-red-400 hover:bg-red-900 hover:text-white rounded-xl text-xs uppercase font-bold"
                    >
                      DEPRECATE
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedCell({ tabKey: activeTab, rowId: row.id || row.name, colKey: activeTab === 'customers' ? 'name' : 'id', rowIndex: 0, colIndex: 0 });
                    }}
                    className="p-1.5 border border-white/5 text-[var(--color-text-muted)] hover:text-white rounded-xl text-xs uppercase"
                  >
                    Select Formula coordinates
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW 5: CALENDAR SCHEDULE INTERFACE --- */}
        {activeTab !== 'reports' && viewLayout === 'calendar' && (
          <div className="p-6 text-xs text-[var(--color-text-main)] space-y-4">
            <h4 className="text-xs uppercase text-[var(--color-accent-highlight)] tracking-wider border-b border-white/[0.04] pb-2 flex items-center gap-1.5">
              <Calendar size={14} /> Active Administrative Schedule Scheduler (2026 Grid Dates)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Q1 PREVENTATIVE DAYS', date: '2026-03-15', list: focusRowsData.filter(r => r.maintenanceDate?.includes('-01-') || r.maintenanceDate?.includes('-02-') || r.maintenanceDate?.includes('-03-')) },
                { label: 'Q2 SERVICE DAYS', date: '2026-06-20', list: focusRowsData.filter(r => r.maintenanceDate?.includes('-04-') || r.maintenanceDate?.includes('-05-') || r.maintenanceDate?.includes('-06-')) },
                { label: 'Q3 ALIGNMENT DAYS', date: '2026-09-10', list: focusRowsData.filter(r => r.maintenanceDate?.includes('-07-') || r.maintenanceDate?.includes('-08-') || r.maintenanceDate?.includes('-09-')) },
                { label: 'Q4 ANNUAL VERIFICATIONS', date: '2026-12-05', list: focusRowsData.filter(r => r.maintenanceDate?.includes('-10-') || r.maintenanceDate?.includes('-11-') || r.maintenanceDate?.includes('-12-')) }
              ].map((quarter, i) => (
                <div key={i} className="p-4 bg-[var(--color-background)]/60 rounded-xl border border-white/[0.04] space-y-3">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase block font-bold">{quarter.label}</span>
                  <div className="text-[var(--color-accent-highlight)] font-semibold">{quarter.date}</div>
                  <div className="space-y-1 text-xs text-[var(--color-text-muted)] max-h-[150px] overflow-y-auto">
                    {quarter.list.map((it: any) => (
                      <div key={it.id || it.name} className="truncate p-1 bg-[rgba(255,255,255,0.03)] rounded-xl">
                        {it.name || it.category} ({it.maintenanceDate})
                      </div>
                    ))}
                    {quarter.list.length === 0 && (
                      <span className="text-[var(--color-text-muted)] italic block">No active service appointments.</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VIEW 6: DIAGNOSTICS ANALYTICS BAR CHART SYSTEM --- */}
        {activeTab !== 'reports' && viewLayout === 'analytics' && (
          <div className="p-6 text-[var(--color-text-main)] space-y-4">
            <h4 className="text-xs uppercase text-[var(--color-accent-highlight)] tracking-wider border-b border-white/[0.04] pb-2 flex items-center gap-1.5">
              <BarChart3 size={14} /> Sourcing ledger value distribution
            </h4>

            <div className="space-y-4">
              {focusRowsData.slice(0, 10).map((row, index) => {
                const totalItemSpent = parseFloat(row.value) || parseFloat(row.totalSpent) || parseFloat(row.amount) || 0;
                const maxSpent = Math.max(...focusRowsData.map(r => parseFloat(r.value) || parseFloat(r.totalSpent) || parseFloat(r.amount) || 1));
                const percentage = Math.min(100, Math.max(8, (totalItemSpent / maxSpent) * 100));

                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs text-[var(--color-text-muted)]">
                      <span className="uppercase text-[var(--color-text-main)] font-semibold truncate max-w-xs">{row.name || row.category} ({row.id || 'CRM'})</span>
                      <span className="text-[var(--color-accent-highlight)] font-bold">{formatMoney(totalItemSpent)}</span>
                    </div>
                    <div className="w-full bg-[var(--color-background)]/85 h-3 rounded-xl overflow-hidden p-0.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-[#d4af37]/60 to-[#d4af37] rounded-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 7. BOTTOM LEVEL INTERFACE PRESETS DESIGN CUSTOMIZER */}
      <div className="glass-panel p-5 rounded-xl border border-white/[0.04] bg-[var(--color-background)]/70 space-y-4">
        <h3 className="text-xs font-bold text-[var(--color-accent-highlight)] uppercase tracking-wider flex items-center gap-2">
          <Palette size={14} /> Creative Database Customizer Canvas
        </h3>

        <div className="flex flex-wrap gap-6 items-center justify-between text-xs">
          
          {/* THEME PRESET */}
          <div className="space-y-2">
            <span className="text-[var(--color-text-muted)] uppercase text-xs font-bold">Accent Tint Color</span>
            <div className="flex gap-2">
              {[
                { id: 'gold', hex: '#d4af37', name: 'Industrial Gold' },
                { id: 'emerald', hex: '#10b981', name: 'Emerald Wave' },
                { id: 'crimson', hex: '#f43f5e', name: 'Cyber Crimson' },
                { id: 'indigo', hex: '#6366f1', name: 'Future Indigo' },
                { id: 'slate', hex: '#94a3b8', name: 'Slate Glass' }
              ].map((colOption) => (
                <button
                  key={colOption.id}
                  onClick={() => setActiveTheme(colOption.id as any)}
                  className={`relative w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                    activeTheme === colOption.id ? 'scale-110 border-white' : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ backgroundColor: colOption.hex }}
                  title={colOption.name}
                />
              ))}
            </div>
          </div>

          {/* DENSITY SELECTION */}
          <div className="space-y-2">
            <span className="text-[var(--color-text-muted)] uppercase text-xs font-bold block">Compact Grid Spacing</span>
            <div className="bg-[var(--color-card-bg)] rounded-xl p-1 flex gap-1 border border-white/5">
              {(['high', 'normal', 'relaxed'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`px-3 py-1 rounded-xl text-xs uppercase font-bold transition-colors cursor-pointer ${
                    density === d ? 'bg-[#d4af37] text-[var(--color-text-muted)]' : 'hover:text-white text-[var(--color-text-muted)]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC SHADOW OPACITY BACKGROUND */}
          <div className="space-y-2 flex-grow max-w-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)] uppercase font-bold">Glass Opacity ({tableOpacity}%)</span>
              <span className="text-[var(--color-accent-highlight)]">{tableOpacity}%</span>
            </div>
            <input 
              type="range" 
              min={10} 
              max={100} 
              step={5}
              value={tableOpacity}
              onChange={(e) => setTableOpacity(parseInt(e.target.value))}
              className="w-full accent-[#d4af37] bg-[var(--color-card-bg)] cursor-pointer text-[var(--color-text-muted)] h-1 rounded-xl"
            />
          </div>

          {/* BACKGROUND GLASS BLUR DEPTH */}
          <div className="space-y-2 flex-grow max-w-xs">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--color-text-muted)] uppercase font-bold">Diffusion backdrop Blur ({tableBlur}px)</span>
              <span className="text-[var(--color-accent-highlight)]">{tableBlur}px</span>
            </div>
            <input 
              type="range" 
              min={0} 
              max={40} 
              step={2}
              value={tableBlur}
              onChange={(e) => setTableBlur(parseInt(e.target.value))}
              className="w-full accent-[#d4af37] bg-[var(--color-card-bg)] cursor-pointer h-1 rounded-xl"
            />
          </div>

        </div>
      </div>

      {/* --- ADD ASSET MODAL DIALOG --- */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel-heavy rounded-lg max-w-md w-full p-6 space-y-4 border border-[var(--color-accent-highlight)]/30 bg-[var(--color-background)]">
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-[var(--color-accent-highlight)]">Capitalize Equipment Asset</h3>
              <button onClick={() => setShowAddAsset(false)} className="text-[var(--color-text-muted)] hover:text-white">
                <X size={15} />
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Asset Name</label>
                <input 
                  type="text" 
                  value={newAsset.name} 
                  placeholder="e.g. Masterwork Embroidery Grid"
                  onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded-xl focus:outline-none focus:border-[var(--color-accent-highlight)]/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase font-bold text-[var(--color-accent-highlight)]">Functional Category</label>
                <select 
                  value={newAsset.category} 
                  onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded-xl focus:outline-none focus:border-[var(--color-accent-highlight)]/50"
                >
                  <option value="Production Machine">Production Machine / Looms</option>
                  <option value="IT Infrastructure">Server / CAD Terminal</option>
                  <option value="Logistics Rig">Logistics / Transport Rig</option>
                  <option value="HQ Facility">HQ Facility / Showroom fixtures</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)]">VALUATION ({currencySymbol})</label>
                  <CurrencyInput
                    value={newAsset.value}
                    onChange={(val) => setNewAsset({...newAsset, value: val})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded-xl focus:outline-none focus:border-[var(--color-accent-highlight)]/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[var(--color-text-muted)] uppercase">SERVICE DATE</label>
                  <input 
                    type="date" 
                    value={newAsset.maintenanceDate} 
                    onChange={(e) => setNewAsset({...newAsset, maintenanceDate: e.target.value})}
                    className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded-xl focus:outline-none focus:border-[var(--color-accent-highlight)]/50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <ImageUploader 
                  currentImage={newAsset.image} 
                  onUpload={(b64) => setNewAsset({...newAsset, image: b64})} 
                  label="Asset Swatch Photo / Appraisal Receipt"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddAsset(false)}
                className="px-4 py-2 border border-white/5 text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if(!newAsset.name) return toast.error('Name parameter required.');
                  addAsset(newAsset);
                  setShowAddAsset(false);
                }}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded-xl"
              >
                Capitalize Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CELL CONTEXT MENU OVERLAY (RIGHT-CLICK CONTEXT MENU) --- */}
      {contextMenu && (
        <div 
          className="fixed bg-[var(--color-background)]/95 border border-[var(--color-accent-highlight)]/35 rounded-lg shadow-2xl p-2 z-[999] min-w-[200px] text-xs select-none"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <div className="text-xs text-[var(--color-text-muted)] px-2 py-1 uppercase border-b border-white/5 block font-bold leading-none mb-1.5">
            Cell Parameters Edit
          </div>

          <button
            onClick={() => {
              setEditingCell({ rowId: contextMenu.rowId, colKey: contextMenu.colKey });
              setEditValue(customFormulas[`${contextMenu.tabKey}_${contextMenu.rowId}_${contextMenu.colKey}`] ?? '');
            }}
            className="w-full text-left p-2 hover:bg-[var(--color-accent-highlight)]/10 hover:text-[var(--color-accent-highlight)] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Hash size={14} /> Double-Click Input / Equation
          </button>

          <button
            onClick={toggleRowLock}
            className="w-full text-left p-2 hover:bg-red-400/10 hover:text-red-400 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            {cellMetadata[`${contextMenu.tabKey}_${contextMenu.rowId}_${contextMenu.colKey}`]?.isLocked ? (
              <>
                <Unlock size={14} /> Unlock cell grid edits
              </>
            ) : (
              <>
                <Lock size={14} /> Lock spreadsheet editing
              </>
            )}
          </button>

          {/* Color preset list inside right-click menu */}
          <div className="border-t border-white/5 my-1.5 pt-1.5 px-2">
            <span className="text-xs text-[var(--color-accent-highlight)] uppercase font-bold block mb-1">Set Highlight Accent</span>
            <div className="flex gap-2.5">
              {[
                { hex: 'rgba(212, 175, 55, 0.15)', label: 'Gold' },
                { hex: 'rgba(16, 185, 129, 0.15)', label: 'Green' },
                { hex: 'rgba(239, 68, 68, 0.15)', label: 'Crimson' },
                { hex: 'rgba(99, 102, 241, 0.15)', label: 'Indigo' },
                { hex: 'rgba(255, 255, 255, 0)', label: 'None' }
              ].map((colorBlock, colIdx) => (
                <button
                  key={colIdx}
                  onClick={() => applyCellBg(colorBlock.hex)}
                  className="w-4 h-4 rounded-full border border-white/5 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: colorBlock.hex }}
                  title={colorBlock.label}
                />
              ))}
            </div>
          </div>

          {/* Stickers */}
          <div className="border-t border-white/5 my-1.5 pt-1.5 px-2">
            <span className="text-xs text-[var(--color-accent-highlight)] uppercase font-bold block mb-1">Add Sticker Stamp</span>
            <div className="flex gap-1.5">
              {['⭐', '⚠️', '💎', '🔥', '✅', '❌', 'None'].map((emoji, emoIdx) => (
                <button
                  key={emoIdx}
                  onClick={() => insertAnnotationEmoji(emoji === 'None' ? '' : emoji)}
                  className="p-1 hover:bg-[rgba(255,255,255,0.06)] rounded-xl cursor-pointer text-xs"
                >
                  {emoji === 'None' ? 'Wipe' : emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 mt-1.5 pt-1">
            <button
              onClick={() => {
                const comment = prompt('Write metadata cell comment annotation statement:');
                if (comment !== null) {
                  const key = `${contextMenu.tabKey}_${contextMenu.rowId}_${contextMenu.colKey}`;
                  setCellMetadata(prev => ({
                    ...prev,
                    [key]: { ...(prev[key] || {}), comment }
                  }));
                }
              }}
              className="w-full text-left p-2 hover:bg-[rgba(255,255,255,0.03)] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare size={14} /> Add static comment note
            </button>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOM COLUMN DRAW/MODAL DIALOG --- */}
      {showAddCustomCol && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel rounded-lg max-w-sm w-full p-5 space-y-4 border border-[var(--color-accent-highlight)]/30 bg-[var(--color-background)]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs uppercase font-bold text-[var(--color-accent-highlight)] tracking-wider">Initialize Custom Grid Column</span>
              <button onClick={() => setShowAddCustomCol(false)} className="text-[var(--color-text-muted)] hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase font-semibold">Column Label Name</label>
                <input
                  type="text"
                  placeholder="e.g. Audit Approval Code"
                  value={newColDetails.label}
                  onChange={(e) => setNewColDetails({ ...newColDetails, label: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase font-semibold">Database Property Type</label>
                <select
                  value={newColDetails.type}
                  onChange={(e) => setNewColDetails({ ...newColDetails, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded-xl focus:outline-none"
                >
                  <option value="text">Alphanumeric string (Text)</option>
                  <option value="number">Numeric monetary (Rp / IDR)</option>
                  <option value="tag">Status label badge (Tag)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs pt-3 border-t border-white/5">
              <button 
                onClick={() => setShowAddCustomCol(false)}
                className="px-3.5 py-1.5 border border-white/5 text-[var(--color-text-muted)] hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateCustomColumn}
                className="px-4 py-1.5 bg-[#d4af37] text-[var(--color-text-main)] font-bold rounded-xl hover:bg-[#d4af37]/80 cursor-pointer"
              >
                Assemble Column
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
