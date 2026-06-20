import React, { useState } from 'react';
import { getNavGroupsForType, getColorForType, calcHealthScore } from '../../core/constants/businessConstants';
import { findModuleByTitle } from '../../core/utils/moduleEngine';
import ModuleView from '../../shared/components/ModuleView';
import GlobalSearch from '../../shared/components/GlobalSearch';
import { soundSuccess, soundError, soundTap, soundNotification, initHapticGlobal, initSwipeGesture } from '../../core/utils/soundEffects';
import { ERPProvider, useERP }           from '../store/ERPContext';
import { BusinessProvider, useBusiness } from '../store/BusinessContext';
import { AuthProvider, useAuth }         from '../providers/AuthProvider';
import { ErrorBoundary }                 from '../../shared/components/ErrorBoundary';
import { ToastProvider, toast }          from '../../shared/ui/Toast';
import LoginPage from '../../features/auth/pages/LoginPage';
import BusinessSwitcher  from '../../features/business/components/BusinessSwitcher';
import BusinessWizard from '../../features/business/components/BusinessWizard';
import ExecutiveDashboard from '../../features/business/pages/ExecutiveDashboard';
import ExecutiveCommandCenter from '../../features/business/pages/ExecutiveCommandCenter';
import BusinessInsightView from '../../features/insights/pages/BusinessInsightView';
import PersonalFinanceView from '../../features/personal/pages/PersonalFinanceView';
import OwnerFinanceView from '../../features/personal/pages/OwnerFinanceView';
import ChartOfAccountsView from '../../features/accounting/pages/ChartOfAccountsView';
import FinancialStatementsView from '../../features/accounting/pages/FinancialStatementsView';

// Feature pages
import DashboardView          from '../../features/dashboard/pages/DashboardView';
import MaterialsView          from '../../features/fashion/pages/MaterialsView';
import ProductsView           from '../../features/fashion/pages/ProductsView';
import HPPEngineView          from '../../features/fashion/pages/HPPEngineView';
import SalesAndCostsView      from '../../features/finance/pages/SalesAndCostsView';
import FinancesAndAssetsView  from '../../features/finance/pages/FinancesAndAssetsView';
import SmartTablesView        from '../../features/workspace/pages/SmartTablesView';
import NotificationCenterView from '../../features/notifications/pages/NotificationCenterView';
import SettingsView           from '../../features/settings/pages/SettingsView';
import TeamPage               from '../../features/settings/pages/TeamPage';
import AIChat                 from '../../shared/ai/AIChat';

import {
  LayoutDashboard, Layers, Compass, Factory, Shirt, Boxes,
  DollarSign, Receipt, Megaphone, Users, ClipboardList, Truck,
  Smile, Cpu, Activity, BarChart3, Database, Bell, Sliders,
  Bot, ChevronRight, ChevronDown, Settings, LogOut,
} from 'lucide-react';

// ─── Nav Structure ────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={13}/>, Layers: <Layers size={13}/>,
  Compass: <Compass size={13}/>, Factory: <Factory size={13}/>,
  Shirt: <Shirt size={13}/>, Boxes: <Boxes size={13}/>,
  DollarSign: <DollarSign size={13}/>, Receipt: <Receipt size={13}/>,
  Megaphone: <Megaphone size={13}/>, Users: <Users size={13}/>,
  ClipboardList: <ClipboardList size={13}/>, Truck: <Truck size={13}/>,
  Smile: <Smile size={13}/>, Cpu: <Cpu size={13}/>,
  Activity: <Activity size={13}/>, BarChart3: <BarChart3 size={13}/>,
  Database: <Database size={13}/>, Bell: <Bell size={13}/>,
  Sliders: <Sliders size={13}/>, Bot: <Bot size={13}/>,
};

// Nav per business type
const NAV_BY_TYPE: Record<string, {id:string;icon:string;group:string}[]> = {
  fashion: [
    {id:'Dashboard',             icon:'LayoutDashboard', group:'OPERATIONS CORE'},
    {id:'Material Library',      icon:'Layers',          group:'OPERATIONS CORE'},
    {id:'Sample Development',    icon:'Compass',         group:'OPERATIONS CORE'},
    {id:'Production',            icon:'Factory',         group:'OPERATIONS CORE'},
    {id:'Master Products',       icon:'Shirt',           group:'OPERATIONS CORE'},
    {id:'Size Variant Inventory',icon:'Boxes',           group:'OPERATIONS CORE'},
    {id:'Sales Tracking',        icon:'DollarSign',      group:'FINANCE & SCENARIOS'},
    {id:'Operational Cost',      icon:'Receipt',         group:'FINANCE & SCENARIOS'},
    {id:'Ads Analytics',         icon:'Megaphone',       group:'FINANCE & SCENARIOS'},
    {id:'KOL Tracking',          icon:'Users',           group:'FINANCE & SCENARIOS'},
    {id:'Purchase Orders',       icon:'ClipboardList',   group:'FINANCE & SCENARIOS'},
    {id:'Supplier Database',     icon:'Truck',           group:'FINANCE & SCENARIOS'},
    {id:'Customer Database',     icon:'Smile',           group:'FINANCE & SCENARIOS'},
    {id:'Assets & Equipment',    icon:'Cpu',             group:'FINANCE & SCENARIOS'},
    {id:'Cashflow',              icon:'Activity',        group:'FINANCE & SCENARIOS'},
    {id:'Reports & Analytics',   icon:'BarChart3',       group:'FINANCE & SCENARIOS'},
    {id:'Dynamic HPP Engine',    icon:'DollarSign',      group:'FINANCE & SCENARIOS'},
    {id:'Smart Databases',       icon:'Database',        group:'INTELLIGENT LABS'},
    {id:'AI Assistant',          icon:'Bot',             group:'INTELLIGENT LABS'},
    {id:'Notification Center',   icon:'Bell',            group:'WORKSPACE'},
    {id:'Team Management',       icon:'Users',           group:'WORKSPACE'},
    {id:'Settings',              icon:'Sliders',         group:'WORKSPACE'},
  ],
};

// Fallback nav untuk tipe lain
const buildNav = (modules: string[]) =>
  modules.map(id => ({
    id,
    icon: id==='Dashboard'?'LayoutDashboard':id.includes('Sale')?'DollarSign':id.includes('Cash')?'Activity':id.includes('Asset')?'Cpu':id.includes('Customer')?'Smile':'Database',
    group: id==='Dashboard'?'MAIN':id.includes('Sale')||id.includes('Cash')||id.includes('Asset')?'FINANCE':'OPERATIONS',
  }));

function groupNav(items: {id:string;icon:string;group:string}[]) {
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  }
  return groups;
}

// ─── Render active page ──────────────────────────────────────────────

// Icon key mapping untuk dynamic nav (string key → JSX diambil dari ICON_MAP)
const ICON_MAP_KEYS: Record<string,string> = {
  'Dashboard':'LayoutDashboard','Material Library':'Layers','Sample Development':'Compass',
  'Production':'Factory','Master Products':'Shirt','Size Variant Inventory':'Boxes',
  'Sales Tracking':'DollarSign','Invoice & Nota':'Receipt','Operational Cost':'Receipt',
  'Ads Analytics':'Megaphone','KOL Tracking':'Users','Purchase Orders':'ClipboardList',
  'Supplier Database':'Truck','Customer Database':'Smile','Analitik Pelanggan':'BarChart3',
  'Broadcast Email':'Mail','Assets & Equipment':'Cpu','Cashflow':'Activity',
  'Reports & Analytics':'BarChart3','HR System':'Users','Payroll':'DollarSign',
  'Simulasi Gaji':'Calculator','Gaji Owner':'Wallet','Piutang':'Activity',
  'Laba Rugi':'BarChart3','Arus Kas':'Activity','Accounting':'BookOpen',
  'Laporan Bulanan':'BarChart3','Dynamic HPP Engine':'Cpu','HPP Produk Turunan':'Layers',
  'Kalkulator Marketplace':'Calculator','ROI Iklan':'Megaphone','AI Center':'Bot',
  'Analisa Bisnis AI':'Sparkles','Personal Finance':'Wallet','Smart Databases':'Database',
  'Store Management':'ShoppingBag','Notification Center':'Bell','Riwayat Aktivitas':'Activity',
  'Tugas & Pengingat':'CheckSquare','Settings':'Sliders','Galeri Media':'Film',
  'Langganan':'Crown','Team Management':'Users','Employees':'Users','Attendance':'CheckSquare',
  // Deep modules
  'Bill of Materials (BOM)':'ClipboardList','Production Order':'Factory',
  'Quality Control':'Search','Finished Goods Inventory':'Boxes',
  'Recipe Management':'BookOpen','Menu Costing':'Calculator',
  'Daily Waste Tracking':'Database','Daily Closing':'Receipt',
  'Goods Receiving':'Truck','Stock Adjustment':'Sliders','Reorder Point & Stock Aging':'Activity',
  'Client Management':'Smile','Project Management':'ClipboardList','Timesheets & Utilization':'Activity',
  'Unit & Tenant Management':'Boxes','Rent Collection':'DollarSign','Maintenance Tickets':'Sliders',
  'Savings Goals':'Crown','Debt Tracking':'CreditCard','Investment Portfolio':'TrendingUp',
  'Executive Command Center':'BarChart3','Chart of Accounts':'BookOpen',
};

function renderPage(activePage: string, setActivePage: (p: string) => void, switchBusiness?: (id: string) => void) {
  switch (activePage) {
    case 'Dashboard':              return <DashboardView onNavigate={setActivePage} />;
    case 'Material Library':       return <MaterialsView initialSubTab="library"    key="library" />;
    case 'Purchase Orders':        return <MaterialsView initialSubTab="purchase"   key="purchase" />;
    case 'Supplier Database':      return <MaterialsView initialSubTab="suppliers"  key="suppliers" />;
    case 'Sample Development':     return <ProductsView  initialSubTab="sample"     key="sample" />;
    case 'Production':             return <ProductsView  initialSubTab="production" key="production" />;
    case 'Master Products':        return <ProductsView  initialSubTab="master"     key="master" />;
    case 'Size Variant Inventory': return <ProductsView  initialSubTab="variants"   key="variants" />;
    case 'Sales Tracking':         return <SalesAndCostsView initialSubTab="sales"  key="sales" />;
    case 'Operational Cost':       return <SalesAndCostsView initialSubTab="ops"    key="ops" />;
    case 'Ads Analytics':          return <SalesAndCostsView initialSubTab="ads"    key="ads" />;
    case 'KOL Tracking':           return <SalesAndCostsView initialSubTab="kol"    key="kol" />;
    case 'Customer Database':      return <FinancesAndAssetsView initialSubTab="customers" key="customers" />;
    case 'Assets & Equipment':     return <FinancesAndAssetsView initialSubTab="assets"    key="assets" />;
    case 'Cashflow':               return <FinancesAndAssetsView initialSubTab="cashflow"  key="cashflow" />;
    case 'Reports & Analytics':    return <FinancesAndAssetsView initialSubTab="reports"   key="reports" />;
    case 'Dynamic HPP Engine':     return <HPPEngineView />;
    case 'Smart Databases':        return <SmartTablesView />;
    case 'AI Assistant':           return <AIChatPage />;
    case 'Analisa Bisnis AI':     return <BusinessInsightView />;

    // ── KEUANGAN ────────────────────────────────────────────────────────────
    case 'Accounting':          return <FinancialStatementsView />;
    case 'Laba Rugi':           return <FinancialStatementsView />;
    case 'Arus Kas':            return <FinancialStatementsView />;
    case 'Piutang':             return <SalesAndCostsView initialSubTab="sales" />;
    case 'Laporan Bulanan':     return <FinancialStatementsView />;
    case 'Analitik Pelanggan':  return <SalesAndCostsView initialSubTab="sales" />;
    case 'ROI Iklan':           return <SalesAndCostsView initialSubTab="ads" />;
    case 'Broadcast Email':     return <SettingsView />;

    // ── HR & TIM ────────────────────────────────────────────────────────────
    case 'HR System':           return <TeamPage />;
    case 'Payroll':             return <TeamPage />;
    case 'Simulasi Gaji':       return <TeamPage />;
    case 'Employees':           return <TeamPage />;
    case 'Attendance':          return <TeamPage />;

    // ── FASHION ─────────────────────────────────────────────────────────────
    case 'HPP Produk Turunan':  return <HPPEngineView />;

    // ── WORKSPACE ───────────────────────────────────────────────────────────
    case 'Tugas & Pengingat':   return <NotificationCenterView />;
    case 'Riwayat Aktivitas':   return <NotificationCenterView />;
    case 'Store Management':    return <SmartTablesView />;
    case 'Galeri Media':        return <SmartTablesView />;
    case 'Kelola File':         return <SmartTablesView />;
    case 'Langganan':           return <SettingsView />;
    case 'AI Center':           return <BusinessInsightView />;

    // ── EXECUTIVE ───────────────────────────────────────────────────────────
    case 'Executive Command Center': return <ExecutiveCommandCenter onNavigate={setActivePage} onSwitchBusiness={switchBusiness} />;

    // ── DEEP MODULE PAGES (dari moduleEngine) ────────────────────────────────
    case 'Personal Finance':      return <PersonalFinanceView />;
    case 'Gaji Owner':            return <OwnerFinanceView />;
    case 'Chart of Accounts':     return <ChartOfAccountsView />;
    case 'Notification Center':    return <NotificationCenterView />;
    case 'Team Management':        return <TeamPage />;
    case 'Settings':               return <SettingsView />;
    default: {
      // Deep module check (V5.1)
      const deepMod = findModuleByTitle(activePage);
      if (deepMod) return <ModuleView module={deepMod} />;
      return <DashboardView onNavigate={setActivePage} />;
    }
  }
}

function AIChatPage() {
  const { config } = useERP();
  const accent = config?.customAccentColor || '#d4af37';
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <span className="text-xs font-mono tracking-widest uppercase" style={{color:accent}}>AI INTELLIGENCE LAYER</span>
        <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">ILLUMINIST AI</h2>
      </div>
      <AIChat className="min-h-[500px]" />
    </div>
  );
}

// ─── Main App Content ─────────────────────────────────────────────────
function AppContent({ onSignOut, userEmail }: { onSignOut:()=>void; userEmail?:string }) {
  const { config, t, notifications }   = useERP();
  const { activeBusiness, isHolding, currentModules, currentNavGroups, currentColor, switchBusiness } = useBusiness();
  const [activePage,     setActivePage]     = useState('Dashboard');
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [showCreateBiz,  setShowCreateBiz]  = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [folderOpen,     setFolderOpen]     = useState<Record<string,boolean>>({});

  const isLight   = config?.themeMode === 'light';

  // Keyboard: ⌘K buka search
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); setActivePage('Dashboard'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);


  // Sync theme class ke <html> untuk CSS vars dan glass
  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('is-light', 'glass', 'is-dark');
    if (config?.themeMode === 'light') {
      html.classList.add('is-light');
    } else if (config?.themeMode === 'glass') {
      html.classList.add('glass');
    } else {
      html.classList.add('is-dark');
    }
  }, [config?.themeMode]);

  // Init haptic global + swipe gesture
  React.useEffect(() => {
    initHapticGlobal();
    const cleanup = initSwipeGesture({
      onSwipeRight: () => setMobileOpen(false),
      onSwipeLeft:  () => setMobileOpen(true),
    });
    return cleanup;
  }, []);

  const accent    = config?.customAccentColor || '#d4af37';
  const unread    = notifications.filter(n => !n.read).length;

  // Nav dinamis dari businessConstants per tipe bisnis
  const bizType = activeBusiness?.business_type || 'fashion';
  const bizColor = getColorForType(bizType);
  const bccNavGroups = getNavGroupsForType(bizType);
  const effectiveAccent = bizColor || accent;

  // Merge businessConstants navGroups dengan ICON_MAP
  const buildNavFromConstants = () => {
    const grps: Record<string, {id:string;icon:string;group:string}[]> = {};
    const staticItems: {id:string;icon:string;group:string}[] = [
      { id:'Dashboard',           icon:'LayoutDashboard', group:'WORKSPACE' },
      { id:'Notification Center', icon:'Bell',            group:'WORKSPACE' },
      { id:'Tugas & Pengingat',   icon:'CheckSquare',     group:'WORKSPACE' },
      { id:'Settings',            icon:'Sliders',         group:'WORKSPACE' },
    ];
    grps['WORKSPACE'] = staticItems;
    Object.entries(bccNavGroups).forEach(([grp, pages]) => {
      const items = pages
        .filter(p => p !== 'Dashboard' && p.trim().length > 0)
        .map(p => ({
          id: p,
          icon: ICON_MAP_KEYS[p] || 'Database',
          group: grp,
        }));
      if (items.length > 0) grps[grp] = items;
    });
    // Hapus group yang tidak punya items
    Object.keys(grps).forEach(k => { if (!grps[k] || grps[k].length === 0) delete grps[k]; });
    return grps;
  };

  const navGroups = buildNavFromConstants();

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-[var(--color-background)] text-[var(--color-text-main)]`}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={()=>setMobileOpen(false)} />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────────────── */}
      <aside className={`flex flex-col shrink-0 w-56 border-r z-40 fixed md:relative inset-y-0 left-0 h-screen md:h-auto transition-transform duration-300 ${mobileOpen?'translate-x-0':'-translate-x-full'} md:translate-x-0 ${'bg-[var(--color-card-bg)] border-[var(--color-border-line)]'}`}>

        {/* Business Switcher */}
        <div className="p-3 border-b border-[var(--color-border-line)] shrink-0">
          <BusinessSwitcher onCreateNew={()=>setShowCreateBiz(true)} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {Object.entries(navGroups).map(([group, items]) => (
            <div key={group} className="mb-3">
              <button
                onClick={()=>setFolderOpen(p=>({...p,[group]:p[group]===false}))}
                className="w-full flex items-center justify-between px-2 py-1 mb-1 group cursor-pointer"
              >
                <span className="text-[8.5px] font-mono font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {t(group)||group}
                </span>
                {folderOpen[group]===false
                  ? <ChevronRight size={10} className="text-[var(--color-text-muted)]"/>
                  : <ChevronDown  size={10} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100"/>
                }
              </button>

              {folderOpen[group]!==false && items.map(item=>{
                const isActive = activePage===item.id;
                return (
                  <button key={item.id}
                    onClick={()=>{setActivePage(item.id);setMobileOpen(false);}}
                    className={`w-full flex items-center gap-2 px-3 py-[7px] rounded-lg mb-0.5 text-[11px] font-mono uppercase tracking-wider transition-all duration-100 cursor-pointer ${isActive?'font-bold':'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/[0.03]'}`}
                    style={isActive?{background:effectiveAccent,color:'#fff',boxShadow:`0 2px 8px ${effectiveAccent}40`}:{}}
                  >
                    <span className={isActive?'opacity-100':'opacity-60'}>{ICON_MAP[item.icon]||<Database size={13}/>}</span>
                    <span className="truncate">{t(item.id)||item.id}</span>
                    {item.id==='Notification Center' && unread>0 && (
                      <span className="ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white shrink-0">{unread}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Health Score widget */}
        {activeBusiness && (() => {
          const score = [true, true, true, true, true, true].filter(Boolean).length * 16 + 4;
          const hs = { score, grade: score>=80?'A':score>=60?'B':score>=40?'C':'D',
            color: score>=80?'#34c759':score>=60?'#0071e3':score>=40?'#ff9500':'#ff3b30',
            label: score>=80?'Sangat Sehat':score>=60?'Sehat':score>=40?'Perlu Perhatian':'Kritis' };
          return (
            <div className="px-3 pb-2 shrink-0 border-t border-[var(--color-border-line)] pt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-semibold text-[var(--color-text-muted)]">HEALTH</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:hs.color}}>{hs.grade} {hs.score}</span>
              </div>
              <div className="h-1.5 bg-[var(--color-border-line)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${hs.score}%`,background:hs.color}}/>
              </div>
            </div>
          );
        })()}

        {/* User footer */}
        <div className="p-3 border-t border-[var(--color-border-line)] shrink-0 space-y-1">
          {userEmail && (
            <p className="text-[9px] font-mono text-[var(--color-text-muted)] truncate px-2 mb-2">{userEmail}</p>
          )}
          <button onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10.5px] font-mono text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/[0.04] transition-all cursor-pointer">
            <LogOut size={12}/><span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main className={`flex-1 overflow-y-auto ${isLight?'bg-[#f2f4f7]':'bg-[#050505]'}`}>

        {/* Top bar */}
        <div className={`sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--color-border-line)] ${isLight?'bg-white/80':'bg-[#050505]/80'} backdrop-blur-md`}>
          {/* Mobile hamburger */}
          <button onClick={()=>setMobileOpen(true)} className="md:hidden p-2 rounded-lg border border-[var(--color-border-line)] text-[var(--color-text-muted)] cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-[var(--color-text-muted)]">
            <span>{activeBusiness?.name||'ILLUMINIST'}</span>
            <ChevronRight size={10}/>
            <span className="text-[var(--color-text-main)] font-semibold">{activePage}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={()=>setActivePage('Notification Center')}
              className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/[0.04] transition-all cursor-pointer">
              <Bell size={15}/>
              {unread>0&&<span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"/>}
            </button>
            <button onClick={()=>setActivePage('Settings')}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/[0.04] transition-all cursor-pointer">
              <Settings size={15}/>
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {isHolding
              ? <ExecutiveDashboard />
              : renderPage(activePage, setActivePage, switchBusiness)
            }
          </div>
        </div>
      </main>

      {/* Global Search */}
      <GlobalSearch open={showSearch} onClose={()=>setShowSearch(false)} onNavigate={(p)=>{ setActivePage(p); setShowSearch(false); }} />

      {/* Business Wizard */}
      <BusinessWizard open={showCreateBiz} onClose={()=>setShowCreateBiz(false)} />
    </div>
  );
}

// ─── Auth gate ────────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading, signOut } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="font-mono text-xs text-[var(--color-text-muted)] animate-pulse uppercase tracking-widest">ILLUMINIST OS · Memuat...</p>
    </div>
  );
  const needsLogin = !user && Boolean(
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL
  );
  if (needsLogin) return <LoginPage />;
  return (
    <BusinessProvider>
      <ERPProvider>
        <AppContent
          onSignOut={signOut}
          userEmail={user?.email}
        />
      </ERPProvider>
    </BusinessProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
