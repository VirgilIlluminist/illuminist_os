import React, { useMemo, useState, useRef } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  AlertTriangle, 
  Layers, 
  TrendingDown,
  ShoppingBag,
  Bell,
  ArrowRight,
  Sparkles,
  Bot,
  Sliders,
  X,
  Plus,
  Trash2,
  Calendar,
  Image as ImageIcon,
  Tag as TagIcon,
  Settings,
  Copy,
  ArrowUp,
  ArrowDown,
  Volume2,
  Move,
  Palette,
  Type,
  Zap,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ImageUploader from '../../../shared/components/ImageUploader';

export default function DashboardView({ onNavigate }: { onNavigate: (page: string) => void }) {
  const {
    computedMaterials,
    computedProducts,
    computedVariants,
    computedSales,
    computedAds,
    computedKols,
    notifications,
    cashflow,
    config,
    updateConfig,
    moodboard,
    addMoodboardItem,
    deleteMoodboardItem,
    formatMoney,
    t
  } = useERP();

  const [showCustomize, setShowCustomize] = useState(false);
  const [showAddMood, setShowAddMood] = useState(false);
  const [selectedMoodImage, setSelectedMoodImage] = useState<string | null>(null);

  // New Moodboard state inputs
  const [newMood, setNewMood] = useState({
    title: '',
    tag: 'Inspiration',
    notes: '',
    image: ''
  });

  // Dynamic Theme Mapping
  const colorMap = {
    gold: { text: 'text-[#d4af37]', bg: 'bg-[#d4af37]', hoverBg: 'hover:bg-[#b08e23]', border: 'border-[#d4af37]', textBg: 'bg-[#d4af37]/10', pulseBg: 'bg-[#d4af37]', borderHover: 'hover:border-[#d4af37]/50', fill: '#d4af37', gradient: 'from-[#8c7324] to-[#d4af37]' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', hoverBg: 'hover:bg-emerald-600', border: 'border-emerald-500', textBg: 'bg-emerald-500/10', pulseBg: 'bg-emerald-500', borderHover: 'hover:border-emerald-500/50', fill: '#10b981', gradient: 'from-emerald-700 to-emerald-400' },
    crimson: { text: 'text-rose-500', bg: 'bg-rose-500', hoverBg: 'hover:bg-rose-600', border: 'border-rose-500', textBg: 'bg-rose-500/10', pulseBg: 'bg-rose-500', borderHover: 'hover:border-rose-500/50', fill: '#ef4444', gradient: 'from-rose-800 to-rose-500' },
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500', hoverBg: 'hover:bg-indigo-600', border: 'border-indigo-500', textBg: 'bg-indigo-500/10', pulseBg: 'bg-indigo-500', borderHover: 'hover:border-indigo-500/50', fill: '#6366f1', gradient: 'from-indigo-800 to-indigo-400' },
    platinum: { text: 'text-[var(--color-text-main)]', bg: 'bg-[rgba(255,255,255,0.05)]', hoverBg: 'hover:bg-[rgba(255,255,255,0.08)]', border: 'border-[var(--color-border-line)]', textBg: 'bg-[rgba(255,255,255,0.08)]/10', pulseBg: 'bg-[rgba(255,255,255,0.05)]', borderHover: 'hover:border-[var(--color-border-line)]', fill: '#e4e4e7', gradient: 'from-[var(--color-card-bg)] to-[var(--color-background)]' }
  };
  const activeColor = colorMap[(config?.accentColor as keyof typeof colorMap) || 'gold'] || colorMap.gold;
  const accentHex   = config?.customAccentColor || '#d4af37';
  const currencySymbol = config?.currencySymbol || 'Rp';

  // FREEFORM DESIGN STATES
  const [floatMode, setFloatMode] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [activeDragCardId, setActiveDragCardId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

// POLISH-01 FIX: default positions dihitung relatif terhadap lebar layar
// Bukan hardcoded pixel — jadi konsisten di semua resolusi
function getDefaultCards(containerW: number = 1180) {
  const full  = Math.max(containerW - 40, 300);
  const two3  = Math.max(Math.round(full * 0.655), 240);
  const third = Math.max(Math.round(full * 0.33), 200);
  const half  = Math.max(Math.round(full * 0.49), 240);
  const gap = 20;

  return [
    { id: 'card-kpis',       key: 'kpis',       defaultTitle: 'KPI Bento Statistics Grid',       width: 'full',       color: '#d4af37', glow: true,  floating: false, bilingual: 'en', x: gap, y: gap,            w: full,  h: 220, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-kpis',       relations: ['Material Library', 'Sales Tracking'] },
    { id: 'card-chart',      key: 'chart',      defaultTitle: 'Weekly Revenue Vector Stream',    width: 'two-thirds', color: '#3b82f6', glow: false, floating: false, bilingual: 'en', x: gap, y: gap+240,       w: two3,  h: 380, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-chart',      relations: ['Sales Tracking'] },
    { id: 'card-aiInsight',  key: 'aiInsight',  defaultTitle: 'Core AI Agent Diagnostics',       width: 'third',      color: '#a855f7', glow: true,  floating: false, bilingual: 'en', x: gap+two3+gap, y: gap+240, w: third, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-ai',        relations: ['Material Library'] },
    { id: 'card-lookbook',   key: 'lookbook',   defaultTitle: 'Digital Moodboard Lookbook',      width: 'full',       color: '#10b981', glow: false, floating: false, bilingual: 'en', x: gap, y: gap+240+400,  w: full,  h: 525, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-lookbook',   relations: ['Sample Development'] },
    { id: 'card-safeguards', key: 'safeguards', defaultTitle: 'Critical Stock Safeguards',       width: 'half',       color: '#ef4444', glow: false, floating: false, bilingual: 'en', x: gap, y: gap+240+400+545, w: half,  h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-safeguards', relations: ['Material Library'] },
    { id: 'card-sales',      key: 'sales',      defaultTitle: 'Latest Sales Ledger Sync',        width: 'half',       color: '#f59e0b', glow: false, floating: false, bilingual: 'en', x: gap+half+gap,  y: gap+240+400+545, w: half, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-sales',     relations: ['Sales Tracking'] },
  ];
}


  const defaultDashboardCards = [
    { id: 'card-kpis', key: 'kpis', defaultTitle: 'KPI Bento Statistics Grid', width: 'full', color: '#d4af37', glow: true, floating: false, bilingual: 'en', x: 20, y: 20, w: 1160, h: 220, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-kpis', relations: ['Material Library', 'Sales Tracking'] },
    { id: 'card-chart', key: 'chart', defaultTitle: 'Weekly Revenue Vector Stream', width: 'two-thirds', color: '#3b82f6', glow: false, floating: false, bilingual: 'en', x: 20, y: 260, w: 760, h: 380, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-chart', relations: ['Sales Tracking'] },
    { id: 'card-aiInsight', key: 'aiInsight', defaultTitle: 'Core AI Agent Diagnostics', width: 'third', color: '#a855f7', glow: true, floating: false, bilingual: 'en', x: 800, y: 260, w: 380, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-ai', relations: ['Material Library'] },
    { id: 'card-lookbook', key: 'lookbook', defaultTitle: 'Digital Moodboard Lookbook', width: 'full', color: '#10b981', glow: false, floating: false, bilingual: 'en', x: 20, y: 660, w: 1160, h: 525, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-lookbook', relations: ['Sample Development'] },
    { id: 'card-safeguards', key: 'safeguards', defaultTitle: 'Critical Stock Safeguards', width: 'half', color: '#ef4444', glow: false, floating: false, bilingual: 'en', x: 20, y: 1200, w: 570, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-safeguards', relations: ['Material Library'] },
    { id: 'card-salesLog', key: 'salesLog', defaultTitle: 'Latest Sales Ledger Sync', width: 'half', color: '#f59e0b', glow: false, floating: false, bilingual: 'en', x: 610, y: 1200, w: 570, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-salesLog', relations: ['Sales Tracking'] }
  ];

  const [cards, setCards] = React.useState<Array<{
    id: string;
    key: string;
    defaultTitle: string;
    customTitle?: string;
    width: 'full' | 'two-thirds' | 'third' | 'half';
    color: string;
    glow: boolean;
    floating: boolean;
    bilingual: 'en' | 'id';
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize: number;
    fontFamily: string;
    automationWebhook?: string;
    relations?: string[];
  }>>(() => {
    const saved = localStorage.getItem('erp_dashboard_cards');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultDashboardCards;
      }
    }
    return defaultDashboardCards;
  });

  React.useEffect(() => {
    localStorage.setItem('erp_dashboard_cards', JSON.stringify(cards));
  }, [cards]);

  // DRAG ENGINE — mendukung mouse dan touch (mobile/tablet)
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, cardId: string) => {
    if (!floatMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;
    e.preventDefault();

    const getCoords = (ev: MouseEvent | TouchEvent) => {
      if ('touches' in ev) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
      return { x: (ev as MouseEvent).clientX, y: (ev as MouseEvent).clientY };
    };

    const startCoords = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };

    setActiveDragCardId(cardId);
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    dragOffset.current = { x: startCoords.x - (card.x || 0), y: startCoords.y - (card.y || 0) };

    const handleMove = (movEvt: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(movEvt);
      let nextX = x - dragOffset.current.x;
      let nextY = y - dragOffset.current.y;
      if (snapToGrid) { nextX = Math.round(nextX / 20) * 20; nextY = Math.round(nextY / 20) * 20; }
      nextX = Math.max(0, nextX);
      nextY = Math.max(0, nextY);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, x: nextX, y: nextY } : c));
    };

    const handleEnd = () => {
      setActiveDragCardId(null);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup',   handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend',  handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup',   handleEnd);
    document.addEventListener('touchmove', handleMove,  { passive: false });
    document.addEventListener('touchend',  handleEnd);
  };

  // RESIZE ENGINE — mendukung mouse dan touch
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const startW = card.w || 300;
    const startH = card.h || 200;
    const startCoords = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };

    const getCoords = (ev: MouseEvent | TouchEvent) => {
      if ('touches' in ev) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
      return { x: (ev as MouseEvent).clientX, y: (ev as MouseEvent).clientY };
    };

    const handleMove = (movEvt: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(movEvt);
      let nextW = startW + (x - startCoords.x);
      let nextH = startH + (y - startCoords.y);
      if (snapToGrid) { nextW = Math.round(nextW / 20) * 20; nextH = Math.round(nextH / 20) * 20; }
      nextW = Math.max(240, nextW);
      nextH = Math.max(160, nextH);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, w: nextW, h: nextH } : c));
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup',   handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend',  handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup',   handleEnd);
    document.addEventListener('touchmove', handleMove,  { passive: false });
    document.addEventListener('touchend',  handleEnd);
  };

  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [activeAIReport, setActiveAIReport] = useState<string | null>(null);
  const [activeAITitle, setActiveAITitle] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const playLocalSound = (freq: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (_) {}
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    playLocalSound(520);
    setCards(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index - 1];
      copy[index - 1] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    setCards(prev => {
      if (index === prev.length - 1) return prev;
      playLocalSound(440);
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + 1];
      copy[index + 1] = temp;
      return copy;
    });
  };

  const handleDuplicateCard = (card: any) => {
    playLocalSound(330);
    setCards(prev => {
      const newCard = {
        ...card,
        id: `card-clone-${Date.now()}`,
        defaultTitle: `${card.customTitle || card.defaultTitle} (Clone)`
      };
      const idx = prev.findIndex(c => c.id === card.id);
      const copy = [...prev];
      copy.splice(idx + 1, 0, newCard);
      return copy;
    });
  };

  const handleRemoveCard = (id: string, name: string) => {
    if (window.confirm(`Hide "${name}" dashboard widget?`)) {
      playLocalSound(220);
      setCards(prev => prev.filter(c => c.id !== id));
    }
  };

  const triggerAIDiagnostic = (cardKey: string, cardName: string) => {
    playLocalSound(660);
    setIsAnalyzing(true);
    setActiveAITitle(cardName);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      let reportText = '';
      if (cardKey === 'kpis') {
        reportText = `[AI OS DIAGNOSTICS - REVENUE & INVENTORIES]
        
 Tokyo outerwears and tech stretch hoodies are driving margins with high conversion coefficients. Tokyo Cargo ROAS holds at 3.01x.
 SARAN OPERASIONAL: Pertahankan alokasi anggaran ads pada serat Nylon Shroud v2.0 karena koefisien repeat-order naik 18%. Kurangi budget testing untuk model rajut katun.`;
      } else if (cardKey === 'chart') {
        reportText = `[AI OS DIAGNOSTICS - SALES FLOW TRENDS]
        
 Sunday and Friday streams show consistent multi-platform integration synergy, but Wednesday exhibits minor pipeline drop-offs.
 ANALISIS DRIFT: Penurunan hari Rabu dikarenakan gap jadwal upload KOL. Jadwalkan ulang draft KOL Bandung batch ke hari Selasa sore untuk menopang volume konversi tengah pekan.`;
      } else if (cardKey === 'aiInsight') {
        reportText = `[AI OS DIAGNOSTICS - BRAIN RECOMMENDATIONS]
        
 Nylon stocks are highly volatile due to active production. Immediate reorder points breached for size XL.
 AUDIT SAFEGUARD: Segera kirim purchase order (PO) otomatis via smart-tables ke Supplier SUP-001 dalam 48 jam untuk mengunci diskon grosir 5% tambahan.`;
      } else if (cardKey === 'lookbook') {
        reportText = `[AI OS DIAGNOSTICS - CREATIVE SPECS]
        
 Visual lookbook colors focus mainly on Obsidian Slate and Platinum tones. Color harmony alignment verified.
 DIAGNOSIS DESAIN: Paduan visual ini sangat baik untuk demografi urban. Rekomendasi penambahan aksen jahitan kontras putih (contrast stitching) untuk menonjolkan fitur fungsional.`;
      } else if (cardKey === 'safeguards') {
        reportText = `[AI OS DIAGNOSTICS - RAW INVENTORIES]
        
 Fabric stocks warnings enabled. Sub-materials limits have 4 red alerts.
 STATUS STOK: Ada 4 item bahan baku di bawah batas aman. Lakukan restrukturasi sisa anggaran kas unallocated sebesar ${formatMoney(48150)} untuk pengisian ulang bahan taktis.`;
      } else {
        reportText = `[AI OS DIAGNOSTICS - SALES LEDGER AUDIT]
        
 Dynamic delivery logs are synced. 100% invoices settled under tax brackets.
 AUDIT LEDGER: Arus laba bersih (net profit ratio) sehat sebesar 62.3% per unit pesanan. Lakukan audit pengiriman sisa item pre-order Shroud Hoodie agar saldo kas tetap terlikuidasi tepat waktu.`;
      }
      setActiveAIReport(reportText);
    }, 850);
  };

  // 1. Core KPIs
  const metrics = useMemo(() => {
    // Total Revenue
    const totalRevenue = computedSales.reduce((sum, s) => sum + s.netRevenue, 0);
    // Total gross sales
    const grossSales = computedSales.reduce((sum, s) => sum + s.grossRevenue, 0);
    // Total Profit
    const totalProfit = computedSales.reduce((sum, s) => sum + s.profit, 0);
    // Net Margin %
    const netMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Remaining inventory value
    const materialValue = computedMaterials.reduce((sum, m) => sum + m.totalValue, 0);

    // Active Warnings
    const lowStockMaterials = computedMaterials.filter(m => m.stockStatus === 'LOW_STOCK').length;
    const lowStockVariants = computedVariants.filter(v => v.status === 'LOW_STOCK').length;
    const activeAlerts = lowStockMaterials + lowStockVariants;

    // Direct Marketing spend (Ads + KOL)
    const adsSpend = computedAds.reduce((sum, a) => sum + a.spend, 0);
    const kolSpend = computedKols.reduce((sum, k) => sum + k.cost, 0);
    const marketingSpend = adsSpend + kolSpend;

    return {
      totalRevenue,
      grossSales,
      totalProfit,
      netMargin,
      materialValue,
      activeAlerts,
      marketingSpend
    };
  }, [computedSales, computedMaterials, computedVariants, computedAds, computedKols]);

  // 2. Best Selling Products
  const bestSellers = useMemo(() => {
    return [...computedProducts]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 3);
  }, [computedProducts]);

  // 3. Low Stock Items Aggregated
  const lowStockList = useMemo(() => {
    const list: Array<{ name: string; type: 'Material' | 'Size Variant'; id: string; qty: number; unit: string; min: number }> = [];
    
    computedMaterials.forEach(m => {
      if (m.stockStatus === 'LOW_STOCK') {
        list.push({
          name: m.name,
          type: 'Material',
          id: m.id,
          qty: m.remainingQty,
          unit: m.unit,
          min: m.minStock
        });
      }
    });

    computedVariants.forEach(v => {
      if (v.status === 'LOW_STOCK') {
        list.push({
          name: `${v.productName} [${v.color} - Size ${v.size}]`,
          type: 'Size Variant',
          id: v.sku,
          qty: v.remainingStock,
          unit: 'pcs',
          min: v.minStock
        });
      }
    });

    return list.slice(0, 4);
  }, [computedMaterials, computedVariants]);

  // 4. Custom Inline SVG Charts Data
  const weeklySalesData = [
    { day: 'Mon', value: 3400 },
    { day: 'Tue', value: 4500 },
    { day: 'Wed', value: 6800 },
    { day: 'Thu', value: 5200 },
    { day: 'Fri', value: 8900 },
    { day: 'Sat', value: 11200 },
    { day: 'Sun', value: 12400 }
  ];
  const maxWeekly = Math.max(...weeklySalesData.map(d => d.value));

  // Handle saving customizable settings
  const handleConfigChange = (field: string, val: any) => {
    updateConfig({ [field]: val });
  };

  const handleWidgetToggle = (widgetKey: string, val: boolean) => {
    const visibleWidgets = config?.visibleWidgets || {
      kpis: true, chart: true, aiInsight: true, lookbook: true, safeguards: true, salesLog: true
    };
    updateConfig({
      visibleWidgets: {
        ...visibleWidgets,
        [widgetKey]: val
      }
    });
  };

  const saveNewMood = () => {
    if (!newMood.title || !newMood.image) {
      toast.info("Please specify a title and attach a visual media file.");
      return;
    }
    addMoodboardItem(newMood);
    setNewMood({ title: '', tag: 'Inspiration', notes: '', image: '' });
    setShowAddMood(false);
  };

  const visible = config?.visibleWidgets || {
    kpis: true, chart: true, aiInsight: true, lookbook: true, safeguards: true, salesLog: true
  };

  const isId = (config?.language || 'en') === 'id';
  const currentLocalHour = new Date().getUTCHours();
  const welcomeMessage = isId 
    ? (currentLocalHour < 12 ? 'Selamat Pagi' : currentLocalHour < 15 ? 'Selamat Siang' : currentLocalHour < 18 ? 'Selamat Sore' : 'Selamat Malam')
    : (currentLocalHour < 12 ? 'Good Morning' : currentLocalHour < 18 ? 'Good Afternoon' : 'Good Evening');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner - Custom customizable items */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <span className={`text-xs font-mono tracking-widest ${activeColor.text} uppercase`}>
            {isId ? `PANEL UTAMA • ${welcomeMessage}` : `OPERATIONAL BOARD • ${welcomeMessage}`}
          </span>
          <h1 className="text-3xl font-display font-semibold tracking-tight uppercase text-[var(--color-text-main)] mt-1">
            {config?.systemName || (isId ? 'NEVAEH WORKSPACE' : 'NEVAEH WORKSPACE')}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] font-sans mt-0.5">
            {config?.systemSubName || (isId 
              ? 'Penyelarasan inventori material, kalkulasi margin HPP, dan pencatatan transaksi kas.' 
              : 'Real-time inventory tracking, margins calculation, and cash ledger records.')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowCustomize(true)}
            className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-main)] bg-[var(--color-card-bg)] border border-white/[0.05] shadow hover:bg-[var(--color-background)] transition-colors px-3.5 py-2 rounded-md cursor-pointer"
          >
            <Sliders size={13} className={activeColor.text} />
            <span>{isId ? 'ATUR WORKSPACE' : 'CUSTOMIZE WORKSPACE'}</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)] bg-white/[0.02] border border-white/[0.05] px-3 py-2 rounded-md">
            <span className={`h-1.5 w-1.5 rounded-full ${activeColor.pulseBg} animate-pulse`}></span>
            <span>{isId ? 'SISTEM OPERASIONAL' : 'SYSTEM OPERATIONAL'}</span>
          </div>
        </div>
      </div>

      {/* WORKSPACE LAYOUT PANEL */}
      <div className="bg-[#0b0b0b]/60 border border-white/[0.05] p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h3 className="text-xs font-mono font-gold tracking-widest uppercase flex items-center gap-1.5 font-bold">
            <Sparkles size={12} className={activeColor.text} /> {isId ? 'PENGATURAN TATA LETAK PANEL' : 'WORKSPACE LAYOUT CONFIGURATION'}
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] font-sans mt-0.5">
            {isId 
              ? 'Kartu-kartu di bawah ini dapat diatur ulang posisinya, disesuaikan ukurannya, diubah bahasanya, dan mendukung audit asisten analisis bisnis secara berkala.' 
              : 'The panels below support flexible spatial positioning, inline resizing, custom language toggles, and direct integration audits.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => {
              playLocalSound(600);
              setFloatMode(!floatMode);
            }}
            className={`px-3 py-1.5 border rounded uppercase font-bold transition-all cursor-pointer ${
              floatMode ? 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border-white font-bold' : 'bg-[var(--color-card-bg)] border-white/5 text-[var(--color-text-main)]'
            }`}
          >
            {floatMode ? (isId ? 'TATA LETAK BEBAS' : 'FREEFORM POSITIONING') : (isId ? 'TATA LETAK GRID' : 'GRID ALIGNED POSITIONING')}
          </button>

          {floatMode && (
            <button
              type="button"
              onClick={() => {
                playLocalSound(500);
                setSnapToGrid(!snapToGrid);
              }}
              className={`px-3 py-1.5 border rounded uppercase font-bold transition-all cursor-pointer ${
                snapToGrid ? 'bg-[var(--color-background)] text-[var(--color-text-main)] border-white/20' : 'bg-[var(--color-background)]/20 text-[var(--color-text-muted)] border-white/5'
              }`}
            >
              🎯 {isId ? 'IKAT KE GRID' : 'SNAP TO GRID'}: {snapToGrid ? (isId ? 'AKTIF' : 'ON') : (isId ? 'TIDAK' : 'OFF')}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playLocalSound(880);
              setCards([
                { id: 'card-kpis', key: 'kpis', defaultTitle: 'KPI Bento Statistics Grid', width: 'full', color: '#d4af37', glow: false, floating: false, bilingual: 'en', x: 20, y: 20, w: 1160, h: 220, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-kpis', relations: ['Material Library', 'Sales Tracking'] },
                { id: 'card-chart', key: 'chart', defaultTitle: 'Weekly Revenue Vector Stream', width: 'two-thirds', color: '#3b82f6', glow: false, floating: false, bilingual: 'en', x: 20, y: 260, w: 760, h: 380, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-chart', relations: ['Sales Tracking'] },
                { id: 'card-aiInsight', key: 'aiInsight', defaultTitle: 'Core AI Agent Diagnostics', width: 'third', color: '#a855f7', glow: false, floating: false, bilingual: 'en', x: 800, y: 260, w: 380, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-ai', relations: ['Material Library'] },
                { id: 'card-lookbook', key: 'lookbook', defaultTitle: 'Digital Moodboard Lookbook', width: 'full', color: '#10b981', glow: false, floating: false, bilingual: 'en', x: 20, y: 660, w: 1160, h: 525, fontSize: 12, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-lookbook', relations: ['Sample Development'] },
                { id: 'card-safeguards', key: 'safeguards', defaultTitle: 'Critical Stock Safeguards', width: 'half', color: '#ef4444', glow: false, floating: false, bilingual: 'en', x: 20, y: 1200, w: 570, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-safeguards', relations: ['Material Library'] },
                { id: 'card-salesLog', key: 'salesLog', defaultTitle: 'Latest Sales Ledger Sync', width: 'half', color: '#f59e0b', glow: false, floating: false, bilingual: 'en', x: 610, y: 1200, w: 570, h: 380, fontSize: 11, fontFamily: 'Inter', automationWebhook: 'https://n8n.nevaeh.io/webhook/v1/trigger-salesLog', relations: ['Sales Tracking'] }
              ]);
            }}
            className="px-2.5 py-1.5 bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] border border-white/[0.05] hover:border-white/20 text-[var(--color-text-main)] rounded uppercase font-bold transition-all duration-150 cursor-pointer"
          >
            {isId ? 'ATUR ULANG PANEL' : 'RESET PANEL GRID'}
          </button>
        </div>
      </div>

      {/* Grid containing our flexible upgraded custom tiles */}
      <div 
        className={floatMode && typeof window !== 'undefined' && window.innerWidth >= 768
          ? 'relative w-full border border-[var(--color-border-line)] bg-[var(--color-card-bg)] rounded-xl p-4 overflow-auto min-h-[800px]'
          : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}
        style={floatMode ? { height: '1620px' } : {}}
      >
        {floatMode && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        )}
        
        {cards.map((card, idx) => {
          const widthClass = 
            card.width === 'full' ? 'col-span-1 lg:col-span-3' :
            card.width === 'two-thirds' ? 'col-span-1 lg:col-span-2' :
            card.width === 'third' ? 'col-span-1 lg:col-span-1' :
            'col-span-1 lg:col-span-1.5';

          const cardAccent = card.color;
          const isEditing = editingCardId === card.id;

          const cardW = card.w || (card.width === 'full' ? 1160 : card.width === 'two-thirds' ? 760 : card.width === 'third' ? 360 : 560);
          const cardH = card.h || (card.key === 'lookbook' ? 525 : card.key === 'kpis' ? 220 : 380);

          // Di mobile (≤767px) selalu gunakan flow layout, bukan absolute positioning
          // Ini mencegah widget keluar layar di perangkat kecil
          const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
          const useAbsolute = floatMode && !isMobileView;

          const customWrapperStyle: React.CSSProperties = useAbsolute ? {
            position: 'absolute',
            left: `${card.x || 0}px`,
            top: `${card.y || 0}px`,
            width: `${cardW}px`,
            height: `${cardH}px`,
            zIndex: activeDragCardId === card.id ? 100 : 10,
            borderColor: `${cardAccent}25`,
            borderTopColor: cardAccent,
            borderTopWidth: '3.5px',
            fontSize: card.fontSize ? `${card.fontSize}px` : 'inherit',
            fontFamily: card.fontFamily || 'inherit'
          } : {
            borderColor: `${cardAccent}25`,
            borderTopColor: cardAccent,
            borderTopWidth: '3.5px',
            fontSize: card.fontSize ? `${card.fontSize}px` : 'inherit',
            fontFamily: card.fontFamily || 'inherit'
          };

          const isId = (config?.language || 'en') === 'id' || card.bilingual === 'id';

          return (
            <motion.div
              layout={!useAbsolute}
              key={card.id}
              data-widget={card.id}
              className={`rounded-xl border bg-[var(--color-card-bg)] backdrop-blur-md transition-all duration-350 ${
                useAbsolute ? 'overflow-hidden shadow-2xl' : `${widthClass} ${
                  card.glow ? 'shadow-[0_0_20px_rgba(255,255,255,0.02)]' : ''
                } ${card.floating ? 'hover:-translate-y-1.5 hover:shadow-lg' : ''}`
              }`}
              style={customWrapperStyle}
            >
              {/* Dynamic Header with precise Godmode Controllers */}
              <div 
                className={`flex justify-between items-center p-4 border-b border-[var(--color-border-line)] bg-[var(--color-card-bg)] rounded-t-xl ${
                  floatMode ? 'cursor-grab active:cursor-grabbing select-none font-bold' : ''
                }`}
                onMouseDown={(e) => handleDragStart(e, card.id)}
                onTouchStart={(e) => handleDragStart(e, card.id)}
              >
                <div className="space-y-0.5 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cardAccent }} />
                    <h4 className="text-xs font-mono font-bold text-[var(--color-text-main)] uppercase tracking-wider">
                      {card.customTitle || t(card.defaultTitle)}
                    </h4>
                  </div>
                  <p 
                    className="text-[10px] text-[var(--color-text-muted)] font-mono italic cursor-help hover:text-white pointer-events-auto"
                    title={
                      !isId 
                        ? `Connected Core Pipeline • Standard UI Widget connected to: ${card.relations?.join(', ') || 'No Relations'}. Action: Double-click content cells to modify manual data.`
                        : `Pipeline Inti Terhubung • Widget standar terhubung dengan: ${card.relations?.join(', ') || 'Tidak Ada Hubungan'}. Aksi: Klik ganda sel konten untuk mengedit manual.`
                    }
                  >
                    {!isId ? 'Active modules connected' : 'Modul aktif terhubung'}
                  </p>
                </div>

                {/* Controller Buttons */}
                <div className="flex items-center gap-1.5">
                  {/* Lang toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      playLocalSound(400);
                      setCards(cards.map(c => c.id === card.id ? { ...c, bilingual: c.bilingual === 'en' ? 'id' : 'en' } : c));
                    }}
                    title="Bilingual translation (EN / ID)"
                    className="p-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.04] text-[var(--color-text-muted)] hover:text-[#d4af37] rounded text-[9.5px] font-bold font-mono px-1.5 uppercase"
                  >
                    {isId ? 'id' : 'en'}
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerAIDiagnostic(card.key, card.customTitle || card.defaultTitle)}
                    title="Trigger AI Strategic Audit"
                    className="p-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.04] rounded-md text-emerald-400 hover:text-emerald-300 transition-all"
                  >
                    <Sparkles size={11} className="animate-pulse" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCardId(isEditing ? null : card.id)}
                    title="Customize Widget Deck"
                    className="p-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.04] rounded-md text-[var(--color-text-muted)] hover:text-white transition-all"
                  >
                    <Settings size={11} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicateCard(card)}
                    title="Clone / Duplicate block"
                    className="p-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.04] rounded-md text-[var(--color-text-muted)] hover:text-white transition-all"
                  >
                    <Copy size={11} />
                  </button>

                  {!floatMode && (
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        className="p-0.5 text-[var(--color-text-muted)] hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp size={8} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === cards.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        className="p-0.5 text-[var(--color-text-muted)] hover:text-white disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown size={8} />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveCard(card.id, card.customTitle || card.defaultTitle)}
                    title="Hide card"
                    className="p-1 cursor-pointer hover:bg-red-500/10 rounded-md text-[var(--color-text-muted)] hover:text-red-400 transition-all"
                  >
                    <X size={11} />
                  </button>
                </div>
              </div>

              {/* Inline Customizer Menu Dialog drawer */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#050505] border-b border-white/[0.04] p-4 text-xs font-mono space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                          <Settings size={10} style={{ color: cardAccent }} /> Custom Title Label
                        </label>
                        <input
                          type="text"
                          value={card.customTitle || card.defaultTitle}
                          onChange={(e) => {
                            setCards(cards.map(c => c.id === card.id ? { ...c, customTitle: e.target.value } : c));
                          }}
                          className="w-full text-[11px] px-2.5 py-1.5 bg-[var(--color-background)] border border-white/[0.08] rounded text-[var(--color-text-main)] focus:outline-none"
                        />
                      </div>

                      {floatMode ? (
                        <div className="space-y-1">
                          <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                            <Move size={10} style={{ color: cardAccent }} /> Absolute Coordinates
                          </label>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex items-center bg-[var(--color-background)] px-2 py-1 rounded border border-white/5">
                              <span className="text-[var(--color-text-muted)] mr-2 font-bold">X:</span>
                              <input 
                                type="number" 
                                value={card.x === 0 ? '' : card.x} 
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  setCards(cards.map(c => c.id === card.id ? { ...c, x: isNaN(parsed) ? 0 : parsed } : c));
                                }} 
                                className="bg-transparent text-[var(--color-text-main)] w-full focus:outline-none font-bold"
                              />
                            </div>
                            <div className="flex items-center bg-[var(--color-background)] px-2 py-1 rounded border border-white/5">
                              <span className="text-[var(--color-text-muted)] mr-2 font-bold">Y:</span>
                              <input 
                                type="number" 
                                value={card.y === 0 ? '' : card.y} 
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  setCards(cards.map(c => c.id === card.id ? { ...c, y: isNaN(parsed) ? 0 : parsed } : c));
                                }} 
                                className="bg-transparent text-[var(--color-text-main)] w-full focus:outline-none font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                            <Sliders size={10} style={{ color: cardAccent }} /> Grid Column Width
                          </label>
                          <select
                            value={card.width}
                            onChange={(e) => {
                              setCards(cards.map(c => c.id === card.id ? { ...c, width: e.target.value as any } : c));
                            }}
                            className="w-full text-[11px] px-2.5 py-1.5 bg-[var(--color-background)] border border-white/[0.08] rounded text-[var(--color-text-main)] focus:outline-none"
                          >
                            <option value="full">Full Board Width (col-span-3)</option>
                            <option value="two-thirds">Large Width (col-span-2)</option>
                            <option value="half">Normal Medium (col-span-1.5)</option>
                            <option value="third">Compact Panel (col-span-1)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/[0.02] pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                          <Palette size={10} style={{ color: cardAccent }} /> Custom Theme Colors
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-[var(--color-text-muted)]">Accent:</span>
                            <input
                              type="color"
                              value={card.color}
                              onChange={(e) => {
                                setCards(cards.map(c => c.id === card.id ? { ...c, color: e.target.value } : c));
                              }}
                              className="w-5 h-4 bg-transparent border-0 cursor-pointer"
                            />
                          </div>
                          
                          <label className="flex items-center gap-1 cursor-pointer text-[var(--color-text-muted)] text-[10px]">
                            <input
                              type="checkbox"
                              checked={card.glow}
                              onChange={(e) => {
                                setCards(cards.map(c => c.id === card.id ? { ...c, glow: e.target.checked } : c));
                              }}
                              className="rounded bg-[var(--color-background)] border-white/[0.08]"
                            />
                            <span>Glow shadow</span>
                          </label>

                          <label className="flex items-center gap-1 cursor-pointer text-[var(--color-text-muted)] text-[10px]">
                            <input
                              type="checkbox"
                              checked={card.floating}
                              onChange={(e) => {
                                setCards(cards.map(c => c.id === card.id ? { ...c, floating: e.target.checked } : c));
                              }}
                              className="rounded bg-[var(--color-background)] border-white/[0.08]"
                            />
                            <span>Levitate</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                          <Type size={10} style={{ color: cardAccent }} /> Custom font typography
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <select
                            value={card.fontFamily}
                            onChange={(e) => setCards(cards.map(c => c.id === card.id ? { ...c, fontFamily: e.target.value } : c))}
                            className="bg-[var(--color-background)] border border-white/[0.08] text-[var(--color-text-main)] px-2 py-1 rounded focus:outline-none"
                          >
                            <option value="Inter">Clean Inter</option>
                            <option value="Space Grotesk">Space Grotesk</option>
                            <option value="JetBrains Mono">JetBrains Mono</option>
                            <option value="Playfair Display">Playfair Display</option>
                          </select>
                          <input
                            type="number"
                            value={card.fontSize === 0 ? '' : card.fontSize}
                            min={10}
                            max={18}
                            onChange={(e) => {
                              const parsed = parseInt(e.target.value, 10);
                              setCards(cards.map(c => c.id === card.id ? { ...c, fontSize: isNaN(parsed) ? 12 : parsed } : c));
                            }}
                            className="bg-[var(--color-background)] border border-white/[0.08] text-[var(--color-text-main)] px-2 py-1 rounded focus:outline-none w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/[0.02] pt-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                          <Zap size={10} style={{ color: cardAccent }} /> Webhook Automation Node
                        </label>
                        <input
                          type="text"
                          value={card.automationWebhook || ''}
                          onChange={(e) => setCards(cards.map(c => c.id === card.id ? { ...c, automationWebhook: e.target.value } : c))}
                          className="w-full text-[10px] px-2 py-1 bg-[var(--color-background)] border border-white/[0.08] rounded text-emerald-450 focus:outline-none"
                          placeholder="https://n8n.webhook/sync"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold flex items-center gap-1">
                          <Link size={10} style={{ color: cardAccent }} /> Smart Database Relations
                        </label>
                        <div className="flex flex-wrap gap-1 text-[9px] pt-0.5">
                          {['Material Library', 'Sales Tracking', 'Products'].map(rel => {
                            const existing = card.relations || [];
                            const hasRel = existing.includes(rel);
                            return (
                              <button
                                key={rel}
                                type="button"
                                onClick={() => {
                                  const next = hasRel ? existing.filter(r => r !== rel) : [...existing, rel];
                                  setCards(cards.map(c => c.id === card.id ? { ...c, relations: next } : c));
                                }}
                                className={`px-2 py-0.5 rounded border transition-colors ${
                                  hasRel 
                                    ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/20' 
                                    : 'bg-[var(--color-background)] text-[var(--color-text-muted)] border-white/5'
                                }`}
                              >
                                {rel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Central Dynamic Content Renderer */}
              <div 
                className="p-5 font-sans overflow-y-auto"
                style={floatMode ? { height: `calc(${cardH}px - ${isEditing ? 220 : 60}px)` } : {}}
              >
                {card.key === 'kpis' && (
                  // KPI Content Block
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-bento-grid">
                    {/* Revenue */}
                    <div className="p-3 border border-white/[0.02] bg-[#020202]/30 rounded-lg flex flex-col justify-between hover:border-white/[0.08] transition-all relative overflow-hidden group">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
                          {isId ? 'TOTAL PENDAPATAN' : 'TOTAL REVENUE'}
                        </span>
                        <p className="text-xl font-mono text-[var(--color-text-main)] font-semibold flex items-baseline">
                          {formatMoney(metrics.totalRevenue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-2 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                        <TrendingUp size={11} />
                        <span>{isId ? '+18.4% bulan ini' : '+18.4% this month'}</span>
                      </div>
                    </div>

                    {/* NET Profit */}
                    <div className="p-3 border border-white/[0.02] bg-[#020202]/30 rounded-lg flex flex-col justify-between hover:border-white/[0.08] transition-all relative overflow-hidden group">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
                          {isId ? 'LABA BERSIH BERJALAN' : 'NET RUNNING PROFIT'}
                        </span>
                        <p className="text-xl font-mono text-[var(--color-text-main)] font-semibold flex items-baseline">
                          {formatMoney(metrics.totalProfit)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-2 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                        <TrendingUp size={11} />
                        <span>{metrics.netMargin.toFixed(1)}% {isId ? 'Margin Laba' : 'Net Margin'}</span>
                      </div>
                    </div>

                    {/* Sourcing inventory value */}
                    <div className="p-3 border border-white/[0.02] bg-[#020202]/30 rounded-lg flex flex-col justify-between hover:border-white/[0.08] transition-all relative overflow-hidden group">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase">
                          {isId ? 'VALUASI STOK BAHAN BAKU' : 'RAW MATERIALS INVENTORY VALUATION'}
                        </span>
                        <p className="text-xl font-mono text-[var(--color-text-main)] font-semibold flex items-baseline">
                          {formatMoney(metrics.materialValue)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-text-muted)] mt-2 bg-white/[0.02] px-2 py-0.5 rounded border border-white/[0.05] w-fit">
                        <Layers size={11} className={activeColor.text} />
                        <span>{isId ? 'Bahan Baku Aktif' : 'Active Materials'}</span>
                      </div>
                    </div>

                    {/* Alert count */}
                    <div className={`p-3 border rounded-lg flex flex-col justify-between transition-all relative overflow-hidden group ${
                      metrics.activeAlerts > 0 ? 'border-red-500/[0.15] bg-red-950/5' : 'border-white/[0.02] bg-[#020202]/30'
                    }`}>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono tracking-wider text-[var(--color-text-muted)] uppercase text-[var(--color-text-muted)]">
                          {isId ? 'PERINGATAN OPERASIONAL' : 'OPERATIONAL WARNINGS'}
                        </span>
                        <p className="text-xl font-mono text-[var(--color-text-main)] font-semibold">
                          {metrics.activeAlerts > 0 
                            ? (isId ? `${metrics.activeAlerts} BAHAN KRITIS` : `${metrics.activeAlerts} CRITICAL ITEMS`) 
                            : (isId ? 'NORMAL / STABIL' : 'STABLE / NORMAL')}
                        </p>
                      </div>
                      {metrics.activeAlerts > 0 ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 mt-2 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 w-fit">
                          <AlertTriangle size={11} />
                          <span>{isId ? 'MOHON RE-ORDER' : 'REORDER REQUIRED'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-2 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 w-fit">
                          <Sparkles size={11} />
                          <span>{isId ? 'LEVEL SEHAT' : 'HEALTHY LEVEL'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {card.key === 'chart' && (
                  // Chart block content
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <div>
                        <h4 className="text-[var(--color-text-main)] font-bold uppercase">
                          {isId ? 'Arus Pendapatan Ritel Mingguan' : 'Weekly Retail Revenue Streams'}
                        </h4>
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                          {isId ? 'Metrik penjualan mingguan teratribusi di semua saluran ritel' : 'Weekly retail sales numbers updated dynamically'}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {isId ? 'Pendapatan Kotor' : 'Attributed Gross Sales'}
                      </span>
                    </div>

                    {/* Line columns chart */}
                    <div className="h-44 w-full flex items-end justify-between pt-4 pb-2 px-2 border-b border-white/[0.05]">
                      {weeklySalesData.map((d, i) => {
                        const barHeightPercent = (d.value / maxWeekly) * 80;
                        return (
                          <div key={d.day} className="flex flex-col items-center gap-1 group/bar cursor-pointer w-[12%]">
                            <div className="text-[var(--color-text-muted)] text-[9px] font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity bg-[var(--color-background)] border border-white/10 px-1 py-0.5 rounded -translate-y-1">
                              {formatMoney(d.value)}
                            </div>
                            <div className="relative w-full rounded-t overflow-hidden bg-[var(--color-background)] border border-white/[0.02]" style={{ height: '110px' }}>
                              <motion.div 
                                className="absolute bottom-0 left-0 right-0 bg-blue-500 group-hover/bar:bg-[var(--color-card-bg)] transition-all rounded-t"
                                initial={{ height: 0 }}
                                animate={{ height: `${barHeightPercent}%` }}
                                transition={{ duration: 0.6, delay: i * 0.05 }}
                              />
                            </div>
                            <span className="text-[var(--color-text-muted)] text-[10px] font-mono font-medium uppercase mt-1">{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                      <span>{isId ? 'Hari Puncak: Minggu' : 'Peak Day: Sunday'} ({formatMoney(12400)})</span>
                      <span>{isId ? 'Total Pekan: ' : 'Total Week: '}{formatMoney(51400)}</span>
                    </div>
                  </div>
                )}

                {card.key === 'aiInsight' && (
                  // AI advisor details
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/[0.05] pb-2 text-[var(--color-text-main)]">
                      <Bot size={15} />
                      <h4 className="text-xs font-mono font-bold uppercase">
                        {isId ? 'Asisten Rekomendasi Bisnis' : 'Business Analytics Assistant'}
                      </h4>
                    </div>
                    <div className="p-3 bg-[var(--color-background)]/70 border border-white/[0.04] rounded-md space-y-2 relative overflow-hidden">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-bold">
                        <Sparkles size={11} className="animate-pulse" />
                        <span>{isId ? 'REKOMENDASI BAHAN OPERATOR' : 'MATERIAL RE-ORDER INSIGHT'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                        {isId 
                          ? 'Persediaan Bahan Nylon Melar (Tech Stretch Nylon) berkurang cepat dikarenakan sampling aktif pada produk Shroud Hoodie v2.0. Disarankan re-order atau konfirmasi supplier untuk mengamankan margin HPP.'
                          : 'Tech Stretch Nylon is depleting quickly due to active sample developments on Shroud Hoodie v2.0. Re-order suggested to secure margins.'}
                      </p>
                      <div className="flex justify-between items-center text-[9px] font-mono text-[var(--color-text-muted)] pt-1.5 border-t border-white/[0.02]">
                        <span>{isId ? 'PRIORITAS: SEDANG' : 'PRIORITY: MEDIUM'}</span>
                        <span>{isId ? 'VOUCHER PILIHAN: SUP-001' : 'PREFERRED SUPPLIER: SUP-001'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('Interactive Guidebook')}
                      className="w-full text-center py-1.5 border border-white/[0.08] hover:bg-white/[0.04] transition-colors rounded text-[11px] font-mono uppercase text-[var(--color-text-muted)] cursor-pointer text-[var(--color-text-main)] font-bold"
                    >
                      {isId ? 'Buka Buku Panduan' : 'Launch Guidebook'}
                    </button>
                  </div>
                )}

                {card.key === 'lookbook' && (
                  // Lookbook content
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-[var(--color-text-main)] flex items-center gap-2">
                          <ImageIcon size={14} className="text-[#10b981]" />
                          {isId ? 'Moodboard & Inspirasi Desain' : 'Design Moodboard & Lookbook'}
                        </h4>
                        <p className="text-[9.5px] text-[var(--color-text-muted)] font-mono">
                          {isId ? 'Siluet pakaian, inspirasi warna kain, dan pola contoh jahitan' : 'Silhouette fits, fabric swatches & style inspiration'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddMood(true)}
                        className="px-2.5 py-1 bg-[var(--color-card-bg)] hover:bg-[var(--color-background)] text-[var(--color-text-main)] text-[9.5px] font-mono uppercase rounded flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                      >
                        <Plus size={10} /> {isId ? 'Semat Gambar' : 'Pin Image'}
                      </button>
                    </div>

                    <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      {moodboard.length > 0 ? (
                        moodboard.map((item) => (
                          <div key={item.id} className="relative flex-none w-52 p-2 bg-[#050505]/40 border border-white/[0.04] rounded-lg group/mood">
                            <div className="relative aspect-video w-full rounded overflow-hidden bg-[var(--color-background)] border border-white/5">
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover/mood:scale-105 transition-transform duration-300 cursor-zoom-in"
                                onClick={() => setSelectedMoodImage(item.image)}
                              />
                              <div className="absolute top-1.5 left-1.5 px-1 py-0.2 rounded bg-black/85 border border-white/10 text-[8px] font-mono uppercase tracking-wider text-[#d4af37]">
                                {item.tag}
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm(isId ? `Hapus pin inspirasi "${item.title}"?` : `Remove custom mood-pin "${item.title}"?`)) {
                                    deleteMoodboardItem(item.id);
                                  }
                                }}
                                className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 rounded text-[var(--color-text-main)] opacity-0 group-hover/mood:opacity-100 transition-opacity"
                                title="Delete Pin"
                              >
                                <Trash2 size={9} />
                              </button>
                            </div>
                            <div className="mt-2 space-y-0.5">
                              <h5 className="text-[11px] font-mono font-bold text-[var(--color-text-main)] line-clamp-1">{item.title}</h5>
                              {item.notes && <p className="text-[10px] text-[var(--color-text-muted)] font-sans line-clamp-1">{item.notes}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="w-full text-center py-6 font-mono text-[var(--color-text-muted)] text-[11px] flex flex-col items-center justify-center gap-1.5">
                          <ImageIcon size={18} className="text-[var(--color-text-muted)] animate-pulse" />
                          <span>{isId ? 'Papan inspirasi kosong. Unggah gambar!' : 'Moodboard empty. Upload swatches!'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {card.key === 'safeguards' && (
                  // Stock checks
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-[var(--color-text-main)] flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-400" />
                        {isId ? 'Batas Aman Stok Kain' : 'Materials Safety Limits'}
                      </h4>
                      <button 
                        onClick={() => onNavigate('Notification Center')} 
                        className="text-[10px] font-mono text-[#ef4444] hover:underline cursor-pointer"
                      >
                        {isId ? 'Pusat Peringatan' : 'Alert Center'} →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {lowStockList.length > 0 ? (
                        lowStockList.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-red-950/15 border border-red-500/10 rounded">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-mono bg-red-500/10 text-red-400 px-1 py-0.2 rounded">
                                  {item.type}
                                </span>
                                <span className="text-[9.5px] font-mono text-[var(--color-text-muted)]">ID: {item.id}</span>
                              </div>
                              <h5 className="text-[11px] font-mono font-bold text-[var(--color-text-muted)] mt-1 line-clamp-1">{item.name}</h5>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-mono text-red-400">
                                {item.qty} / <span className="text-[var(--color-text-muted)]">{item.min} {item.unit}</span>
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-[var(--color-text-muted)] text-center py-4 font-mono">
                          {isId ? 'Semua persediaan stok kain terhitung sehat dan aman.' : 'All raw cloth logs healthy or stable.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {card.key === 'salesLog' && (
                  // Sales tracking logs
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                      <h4 className="text-xs font-mono font-bold uppercase text-[var(--color-text-main)] flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#f59e0b]" />
                        {isId ? 'Penyelarasan Ledger Penjualan Terkini' : 'Latest Sales Ledger Sync'}
                      </h4>
                      <button 
                        onClick={() => onNavigate('Sales Tracking')} 
                        className="text-[10px] font-mono text-[var(--color-text-muted)] hover:underline cursor-pointer"
                      >
                        {isId ? 'Pelacakan Lengkap' : 'Full Tracking'} →
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto w-full">
                      {computedSales.slice(0, 3).map((sale) => (
                        <div key={sale.id} className="flex justify-between items-center p-2 hover:bg-[var(--color-background)]/60 border border-white/[0.02] rounded transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-[var(--color-text-main)] font-bold">{sale.id}</span>
                              <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded">
                                {sale.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">{sale.productName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-mono text-[var(--color-text-main)]">+{formatMoney(sale.netRevenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dynamic Bottom Resize Handle — mendukung mouse dan touch */}
              {floatMode && (
                <div 
                  className="absolute bottom-0 right-0 w-7 h-7 cursor-se-resize bg-transparent z-30 flex items-end justify-end p-1 group"
                  onMouseDown={(e) => handleResizeStart(e, card.id)}
                  onTouchStart={(e) => handleResizeStart(e, card.id)}
                  title="Seret untuk ubah ukuran"
                >
                  <svg width="12" height="12" viewBox="0 0 10 10" className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-highlight)] transition-colors duration-150">
                    <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="5" x2="5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* --- DASHBOARD CUSTOMIZER DIALOG DRAWER --- */}
      <AnimatePresence>
        {showCustomize && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="glass-panel-heavy h-full max-w-md w-full p-6 space-y-6 overflow-y-auto border-l border-white/[0.04] shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/[0.05] pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders size={16} className={activeColor.text} />
                    <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)]">OS Cockpit Customizer</h3>
                  </div>
                  <button 
                    onClick={() => setShowCustomize(false)} 
                    className="p-1.5 text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.05] rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Accent Colors */}
                <div className="space-y-2.5">
                  <span className="block text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest">Accent Core Color</span>
                  <div className="flex gap-2">
                    {Object.keys(colorMap).map((colorKey) => {
                      const colorObj = colorMap[colorKey as keyof typeof colorMap];
                      const isSelected = config?.accentColor === colorKey;
                      return (
                        <button
                          key={colorKey}
                          onClick={() => handleConfigChange('accentColor', colorKey)}
                          className={`h-8 px-2.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all flex items-center justify-center border ${
                            isSelected 
                              ? `${colorObj.border} ${colorObj.textBg} ${colorObj.text} font-bold scale-105 shadow`
                              : 'border-white/[0.05] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                          }`}
                        >
                          {colorKey}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Core Brand Text Assets Custom labels */}
                <div className="space-y-3.5 pt-4 border-t border-white/[0.02]">
                  <span className="block text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest">Enterprise Brand Identity</span>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">OS Core system title Name</label>
                    <input 
                      type="text" 
                      value={config?.systemName || 'NEVAEH AI OS'} 
                      onChange={(e) => handleConfigChange('systemName', e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-[var(--color-card-bg)]/80 border border-white/[0.05] focus:border-white/20 text-white rounded focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Interactive subtitle slogan</label>
                    <input 
                      type="text" 
                      value={config?.systemSubName || ''} 
                      onChange={(e) => handleConfigChange('systemSubName', e.target.value)}
                      className="w-full text-xs font-sans px-3 py-2 bg-[var(--color-card-bg)]/80 border border-white/[0.05] focus:border-white/20 text-white rounded focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Brand monogram</label>
                      <input 
                        type="text" 
                        maxLength={3}
                        value={config?.brandMonogram || 'N'} 
                        onChange={(e) => handleConfigChange('brandMonogram', e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 bg-[var(--color-card-bg)]/80 border border-white/[0.05] text-white rounded focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Local Base Currency symbol</label>
                      <select 
                        value="Rp" 
                        disabled
                        className="w-full text-xs font-mono px-3 py-1.5 bg-[var(--color-background)] border border-white/[0.04] text-[var(--color-text-muted)] rounded focus:outline-none cursor-not-allowed"
                      >
                        <option value="Rp">IDR (Rp) [LOCKED]</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dashboard Widget Toggles */}
                <div className="space-y-3.5 pt-4 border-t border-white/[0.02]">
                  <span className="block text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest">Interactive Cockpit widgets</span>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { key: 'kpis', label: 'KPI Bento Statistics Grid' },
                      { key: 'chart', label: 'Weekly Revenue Vector Stream' },
                      { key: 'aiInsight', label: 'AI Agent Diagnostic Advice' },
                      { key: 'lookbook', label: 'Creative Moodboard & Lookbook Deck' },
                      { key: 'safeguards', label: 'Critical Stock Safeguards' },
                      { key: 'salesLog', label: 'Latest Live Customer Sales log' },
                    ].map((w) => {
                      const isActive = visible[w.key as keyof typeof visible] !== false;
                      return (
                        <div key={w.key} className="flex justify-between items-center p-2.5 bg-[var(--color-card-bg)]/40 border border-white/[0.03] rounded-md hover:bg-[var(--color-card-bg)]/70 transition-colors">
                          <span className="text-xs text-[var(--color-text-muted)] font-sans">{w.label}</span>
                          <button
                            onClick={() => handleWidgetToggle(w.key, !isActive)}
                            className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${isActive ? activeColor.bg : 'bg-[var(--color-background)]'}`}
                          >
                            <span className={`h-4.5 w-4.5 rounded-full bg-[var(--color-background)] shadow transition-transform ${isActive ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowCustomize(false)}
                className={`w-full py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] text-xs font-mono uppercase font-semibold hover:bg-[var(--color-background)] transition-colors rounded tracking-wider mt-6`}
              >
                APPLY PREFERENCES
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD MOOD SNAPSHOT MODAL DIALOG --- */}
      {showAddMood && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" id="pin-mood-modal">
          <div className="glass-panel-heavy rounded-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] border-b border-white/[0.05] pb-3">Pin Lookbook Inspiration</h3>
            
            <div className="space-y-3 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Title / Vision name</label>
                <input 
                  type="text" 
                  value={newMood.title} 
                  onChange={(e) => setNewMood({...newMood, title: e.target.value})}
                  placeholder="e.g. Neo-Matrix Fit mock-up"
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white focus:outline-none focus:border-[#d4af37] rounded"
                />
              </div>

              <div className="space-y-1 font-mono">
                <label className="text-[var(--color-text-muted)] uppercase">Aesthetic tag Class</label>
                <select 
                  value={newMood.tag} 
                  onChange={(e) => setNewMood({...newMood, tag: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none"
                >
                  <option value="Inspiration">Inspiration swatch</option>
                  <option value="Fabric">Fabric texture</option>
                  <option value="Fit check">Silhouettes & fit checks</option>
                  <option value="Lookbook">Editorial lookbook shot</option>
                  <option value="Design Sketch">Design Sketch block</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">Notes / Swatch detail</label>
                <textarea 
                  value={newMood.notes} 
                  onChange={(e) => setNewMood({...newMood, notes: e.target.value})}
                  placeholder="Seam curves, fit observations, texture comments..."
                  className="w-full h-16 p-3 bg-[var(--color-card-bg)] border border-white/[0.05] text-white rounded focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-2">
                <ImageUploader 
                  currentImage={newMood.image} 
                  onUpload={(b64) => setNewMood({...newMood, image: b64 || ''})} 
                  label="Reference Swatch File (Visual)"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end text-xs font-mono pt-4 border-t border-white/[0.05]">
              <button 
                onClick={() => setShowAddMood(false)}
                className="px-4 py-2 border border-white/[0.03] text-[var(--color-text-muted)] hover:text-white transition-colors uppercase rounded"
              >
                Cancel
              </button>
              <button 
                onClick={saveNewMood}
                className="px-4 py-2 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-semibold hover:bg-[var(--color-background)] transition-colors uppercase rounded"
              >
                Pin To Moodboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SELECTED IMAGE ZOOM MODAL --- */}
      <AnimatePresence>
        {selectedMoodImage && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
            onClick={() => setSelectedMoodImage(null)}
          >
            <button 
              onClick={() => setSelectedMoodImage(null)}
              className="absolute top-4 right-4 p-2 bg-[rgba(255,255,255,0.03)] border border-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
            <img 
              src={selectedMoodImage} 
              alt="Expanded preview" 
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl border border-white/10 object-contain animate-scaleIn"
            />
          </div>
        )}
      </AnimatePresence>

      {/* --- AI STRATEGIC DIAGNOSTIC OVERLAYS --- */}
      <AnimatePresence>
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-t-[#d4af37] border-white/5 animate-spin" />
                <Sparkles size={24} className="absolute inset-0 m-auto text-[#d4af37] animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono tracking-widest text-[#d4af37] uppercase animate-pulse">
                  {isId ? 'Sedang Menganalisis Berkas & Metrik...' : 'Analyzing Records & Metrics...'}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                  {isId ? 'MENGUMPULKAN RIWAYAT INVENTORIS & PENJUALAN' : 'GATHERING ACTIVE INVENTORIES & SALES SUMMARY'}
                </p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAIReport && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-white/10 max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center p-4 bg-[var(--color-background)] border-b border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-[#d4af37]" />
                  <span className="text-xs font-mono font-bold text-[var(--color-text-main)] uppercase">
                    {isId ? `REKOMENDASI ANALISIS BISNIS: ${activeAITitle}` : `BUSINESS ANALYTICS ADVICE: ${activeAITitle}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { playLocalSound(330); setActiveAIReport(null); }}
                  className="p-1 cursor-pointer text-[var(--color-text-muted)] hover:text-white hover:bg-white/[0.05] rounded transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 font-mono text-xs text-[var(--color-text-main)] leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-[#d4af37] border-b border-white/[0.04] pb-2 font-bold flex items-center gap-2">
                  <Sparkles size={12} /> {isId ? 'AUDIT REKOMENDASI OPERASIONAL WORKSPACE' : 'WORKSPACE OPERATIONAL AUDIT RECOMMENDATIONS'}
                </p>
                <div className="whitespace-pre-line text-[11px] bg-black/40 p-4 rounded border border-white/[0.04]">
                  {activeAIReport}
                </div>
                
                <div className="pt-2 border-t border-white/[0.04] flex justify-between items-center text-[10px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Volume2 size={11} className="text-[#d4af37]" /> {isId ? 'Suara notifikasi aktif' : 'Audio notification active'}
                  </span>
                  <span>{isId ? 'INTEGRASI CATATAN TRANSAKSI AKTIF' : 'TRANSACTION LEDGER INTEGRATION VERIFIED'}</span>
                </div>
              </div>

              <div className="p-4 bg-[var(--color-background)] border-t border-white/[0.04] flex justify-end gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    playLocalSound(520);
                    navigator.clipboard.writeText(activeAIReport || '');
                    toast.success(isId ? "Disalin ke clipboard!" : "Copied to clipboard!");
                  }}
                  className="px-3.5 py-1.5 bg-[var(--color-card-bg)] text-[var(--color-text-main)] border border-white/[0.05] hover:bg-[var(--color-background)] rounded uppercase flex items-center gap-1.5 cursor-pointer font-bold transition-all text-[11px]"
                >
                  <Copy size={11} /> {isId ? 'Salin Analisis' : 'Copy Recommendations'}
                </button>
                <button
                  type="button"
                  onClick={() => { playLocalSound(330); setActiveAIReport(null); }}
                  className="px-3.5 py-1.5 bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-bold hover:bg-[var(--color-background)] rounded uppercase cursor-pointer transition-all text-[11px]"
                >
                  {isId ? 'Tutup Laporan' : 'Close Report'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
