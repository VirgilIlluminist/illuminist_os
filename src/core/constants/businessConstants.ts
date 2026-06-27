/**
 * businessConstants.ts — Business Architecture Engine V5
 * 10 tipe bisnis: modules, KPI, navGroups, warna, health score.
 */

export type BusinessTypeId =
  | 'fashion' | 'coffee' | 'restaurant' | 'retail'
  | 'agency' | 'service' | 'property' | 'personal_finance'
  | 'investment' | 'holding' | 'custom';

export interface BusinessTypeConfig {
  id: BusinessTypeId;
  label: string;
  icon: string;
  colorHex: string;
  description: string;
  tagline: string;
  modules: string[];
  kpis: { key: string; label: string; icon: string; color: string }[];
  defaultName: string;
  navGroups: Record<string, string[]>;
}

const FINANCE_CORE = ['Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Laporan Bulanan','Reports & Analytics'];
const HR_CORE      = ['HR System','Payroll','Simulasi Gaji','Gaji Owner'];
const COMMON       = ['Invoice & Nota','Customer Database','Analitik Pelanggan','Assets & Equipment',
                      'Notification Center','Riwayat Aktivitas','Smart Databases','AI Center',
                      'Analisa Bisnis AI','Tugas & Pengingat'];

export const BUSINESS_TYPE_CONFIGS: Record<BusinessTypeId, BusinessTypeConfig> = {
  fashion: {
    id:'fashion', label:'Fashion Brand', icon:'👗', colorHex:'#7c3aed',
    description:'Clothing, apparel, dan accessories',
    tagline:'Dari bahan baku ke produk jadi',
    defaultName:'Fashion Brand Baru',
    modules:['Dashboard','Material Library','HPP Produk Turunan','Dynamic HPP Engine',
      'Bill of Materials (BOM)','Production Order','Quality Control','Finished Goods Inventory',
      'Sample Development','Production','Master Products','Size Variant Inventory',
      'Kalkulator Marketplace','ROI Iklan','Sales Tracking','Operational Cost',
      'Ads Analytics','KOL Tracking','Purchase Orders','Supplier Database',
      'Broadcast Email','Chart of Accounts','Executive Command Center',
      ...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue',   label:'Revenue',     icon:'💰', color:'#0071e3'},
      {key:'profit',    label:'Laba Bersih', icon:'📈', color:'#34c759'},
      {key:'inventory', label:'Nilai Stok',  icon:'📦', color:'#ff9500'},
      {key:'production',label:'Produksi',    icon:'⚙️', color:'#af52de'},
      {key:'piutang',   label:'Piutang',     icon:'🕐', color:'#ff3b30'},
      {key:'customers', label:'Pelanggan',   icon:'👥', color:'#5ac8fa'},
    ],
    navGroups:{
      'Produksi':['Material Library','Bill of Materials','Produksi','Sample Development','Quality Control'],
      'Produk':['Master Products','Size Variants','Dynamic HPP'],
      'Penjualan':['Sales Tracking','Shopee','Customers','Purchase Orders'],
      'Keuangan':['Finance','Accounting'],
      'SDM':['Karyawan','Absensi','Payroll'],
      'Marketing':['Ads & Analytics','KOL Tracking'],
      'AI':['AI Chief of Staff'],
      'Settings':['Settings'],
    },
  },
  coffee: {
    id:'coffee', label:'Coffee Shop / Cafe', icon:'☕', colorHex:'#d97706',
    description:'Cafe, kopi, minuman, dan F&B',
    tagline:'Dari biji kopi ke cangkir pelanggan',
    defaultName:'Coffee Shop Baru',
    modules:['Dashboard','Recipe Management','Menu Costing','Daily Waste Tracking','Daily Closing',
      'Sales Tracking','Operational Cost','Purchase Orders','Supplier Database',
      'Chart of Accounts','Executive Command Center',
      ...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue',   label:'Revenue Hari Ini', icon:'💰', color:'#d97706'},
      {key:'orders',    label:'Total Order',      icon:'☕', color:'#0071e3'},
      {key:'avgticket', label:'Avg Ticket',       icon:'🎫', color:'#34c759'},
      {key:'profit',    label:'Profit',           icon:'📈', color:'#af52de'},
      {key:'customers', label:'Pelanggan',        icon:'👥', color:'#5ac8fa'},
      {key:'opex',      label:'Biaya Operasi',    icon:'💸', color:'#ff3b30'},
    ],
    navGroups:{
      'Operasi F&B':['Recipe Management','Menu Costing','Daily Waste Tracking','Daily Closing'],
      'Penjualan':['Sales Tracking','Operational Cost'],
      'Pembelian':['Purchase Orders','Supplier Database'],
      'Pelanggan':['Customer Database','Analitik Pelanggan','Broadcast Email'],
      'Keuangan':['Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll','Simulasi Gaji'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Executive Command Center','Analisa Bisnis AI'],
    },
  },
  restaurant: {
    id:'restaurant', label:'Restaurant', icon:'🍽', colorHex:'#dc2626',
    description:'Restoran, warung, dan food business',
    tagline:'Operasional dapur sampai meja tamu',
    defaultName:'Restaurant Baru',
    modules:['Dashboard','Sales Tracking','Operational Cost','Purchase Orders','Supplier Database',
      'Chart of Accounts',...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue', label:'Revenue',    icon:'💰', color:'#dc2626'},
      {key:'orders',  label:'Order',      icon:'🍽', color:'#0071e3'},
      {key:'profit',  label:'Profit',     icon:'📈', color:'#34c759'},
      {key:'opex',    label:'Food Cost',  icon:'🥗', color:'#ff9500'},
    ],
    navGroups:{
      'Operasional':['Sales Tracking','Operational Cost','Purchase Orders'],
      'Supplier':['Supplier Database'],
      'Keuangan':['Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Analisa Bisnis AI'],
    },
  },
  retail: {
    id:'retail', label:'Retail Store', icon:'🏪', colorHex:'#2563eb',
    description:'Toko fisik, online, dan multi-channel',
    tagline:'Stok selalu ready, penjualan maksimal',
    defaultName:'Toko Retail Baru',
    modules:['Dashboard','Goods Receiving','Stock Adjustment','Reorder Point & Stock Aging',
      'Master Products','Size Variant Inventory','Sales Tracking','Operational Cost',
      'Purchase Orders','Supplier Database','Store Management','Kalkulator Marketplace',
      'Chart of Accounts','Executive Command Center',
      ...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue',   label:'Revenue',    icon:'💰', color:'#2563eb'},
      {key:'profit',    label:'Profit',     icon:'📈', color:'#34c759'},
      {key:'inventory', label:'Nilai Stok', icon:'📦', color:'#ff9500'},
      {key:'orders',    label:'Transaksi',  icon:'🛒', color:'#af52de'},
    ],
    navGroups:{
      'Operasi Retail':['Goods Receiving','Stock Adjustment','Reorder Point & Stock Aging'],
      'Produk & Stok':['Master Products','Size Variant Inventory','Store Management'],
      'Penjualan':['Sales Tracking','Kalkulator Marketplace'],
      'Pembelian':['Purchase Orders','Supplier Database'],
      'Keuangan':['Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Executive Command Center','Analisa Bisnis AI'],
    },
  },
  agency: {
    id:'agency', label:'Agency / Studio', icon:'💼', colorHex:'#4f46e5',
    description:'Creative agency, digital, consulting',
    tagline:'Kelola klien, proyek, dan tim kreatif',
    defaultName:'Agency Baru',
    modules:['Dashboard','Client Management','Project Management','Timesheets & Utilization',
      'Sales Tracking','Operational Cost','Chart of Accounts','Executive Command Center',
      ...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue',  label:'Revenue',           icon:'💰', color:'#4f46e5'},
      {key:'clients',  label:'Klien Aktif',        icon:'🤝', color:'#ff9500'},
      {key:'projects', label:'Proyek Berjalan',    icon:'📋', color:'#0071e3'},
      {key:'margin',   label:'Profit Margin',      icon:'📈', color:'#34c759'},
    ],
    navGroups:{
      'Operasi Agency':['Client Management','Project Management','Timesheets & Utilization'],
      'Penjualan':['Sales Tracking'],
      'Keuangan':['Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Executive Command Center','Analisa Bisnis AI'],
    },
  },
  service: {
    id:'service', label:'Service Business', icon:'🛠', colorHex:'#0d9488',
    description:'Jasa profesional, klinik, laundry',
    tagline:'Kelola jadwal, klien, dan pembayaran',
    defaultName:'Bisnis Jasa Baru',
    modules:['Dashboard','Sales Tracking','Operational Cost','Customer Database',
      'Chart of Accounts',...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue', label:'Revenue',    icon:'💰', color:'#0d9488'},
      {key:'clients', label:'Klien',      icon:'👥', color:'#0071e3'},
      {key:'piutang', label:'Piutang',    icon:'🕐', color:'#ff3b30'},
      {key:'profit',  label:'Profit',     icon:'📈', color:'#34c759'},
    ],
    navGroups:{
      'Operasional':['Sales Tracking','Operational Cost'],
      'Klien':['Customer Database','Analitik Pelanggan','Broadcast Email'],
      'Keuangan':['Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Analisa Bisnis AI'],
    },
  },
  property: {
    id:'property', label:'Property', icon:'🏠', colorHex:'#16a34a',
    description:'Kos, kontrakan, ruko, properti',
    tagline:'Occupancy tinggi, cash flow lancar',
    defaultName:'Bisnis Properti Baru',
    modules:['Dashboard','Unit & Tenant Management','Rent Collection','Maintenance Tickets',
      'Customer Database','Assets & Equipment','Chart of Accounts','Executive Command Center',
      ...FINANCE_CORE,...HR_CORE,...COMMON],
    kpis:[
      {key:'revenue',   label:'Rental Income',    icon:'💰', color:'#16a34a'},
      {key:'occupancy', label:'Occupancy Rate',   icon:'🏠', color:'#0071e3'},
      {key:'units',     label:'Unit Aktif',       icon:'🏢', color:'#ff9500'},
      {key:'piutang',   label:'Sewa Terlambat',   icon:'⚠️', color:'#ff3b30'},
    ],
    navGroups:{
      'Operasi Properti':['Unit & Tenant Management','Rent Collection','Maintenance Tickets'],
      'Aset':['Assets & Equipment','Customer Database'],
      'Keuangan':['Sales Tracking','Cashflow','Piutang','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Executive Command Center','Analisa Bisnis AI'],
    },
  },
  personal_finance: {
    id:'personal_finance', label:'Personal Finance', icon:'💎', colorHex:'#7c3aed',
    description:'Keuangan pribadi, budget, investasi',
    tagline:'Kontrol penuh atas keuangan pribadi',
    defaultName:'Keuangan Pribadi',
    modules:['Dashboard','Savings Goals','Debt Tracking','Investment Portfolio',
      'Cashflow','Personal Finance','Assets & Equipment','Laba Rugi','Arus Kas',
      'Accounting','Chart of Accounts','Gaji Owner','Laporan Bulanan',
      'Reports & Analytics','Smart Databases','Notification Center',
      'Riwayat Aktivitas','Tugas & Pengingat'],
    kpis:[
      {key:'networth',   label:'Net Worth',    icon:'💎', color:'#7c3aed'},
      {key:'income',     label:'Pemasukan',    icon:'💰', color:'#34c759'},
      {key:'expenses',   label:'Pengeluaran',  icon:'💸', color:'#ff3b30'},
      {key:'savings',    label:'Tabungan',     icon:'🏦', color:'#0071e3'},
      {key:'investment', label:'Investasi',    icon:'📈', color:'#af52de'},
    ],
    navGroups:{
      'Perencanaan':['Savings Goals','Debt Tracking','Investment Portfolio'],
      'Keuangan':['Cashflow','Personal Finance','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'Aset':['Assets & Equipment','Smart Databases'],
      'Laporan':['Laporan Bulanan','Reports & Analytics'],
      'Tools':['Notification Center','Tugas & Pengingat','Riwayat Aktivitas'],
    },
  },
  investment: {
    id:'investment', label:'Investment Portfolio', icon:'📈', colorHex:'#059669',
    description:'Portfolio saham, reksa dana, properti',
    tagline:'Track portofolio, maksimalkan return',
    defaultName:'Portfolio Investasi',
    modules:['Dashboard','Investment Portfolio','Assets & Equipment','Cashflow',
      'Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Laporan Bulanan',
      'Reports & Analytics','Smart Databases','Notification Center','Analisa Bisnis AI'],
    kpis:[
      {key:'portfolio', label:'Nilai Portfolio', icon:'📈', color:'#059669'},
      {key:'return',    label:'Total Return',    icon:'💰', color:'#34c759'},
      {key:'assets',    label:'Jumlah Aset',     icon:'📊', color:'#0071e3'},
      {key:'yield',     label:'Yield',           icon:'🏦', color:'#ff9500'},
    ],
    navGroups:{
      'Portofolio':['Investment Portfolio','Assets & Equipment','Smart Databases'],
      'Keuangan':['Cashflow','Laba Rugi','Arus Kas','Accounting','Chart of Accounts'],
      'Laporan':['Laporan Bulanan','Reports & Analytics','Analisa Bisnis AI'],
    },
  },
  holding: {
    id:'holding', label:'Holding / Grup Bisnis', icon:'🏛', colorHex:'#475569',
    description:'Induk perusahaan, konsolidasi grup',
    tagline:'Satu pandangan, semua bisnis',
    defaultName:'Holding Company',
    modules:['Dashboard','Executive Command Center','Cashflow','Laba Rugi','Arus Kas',
      'Accounting','Chart of Accounts','Assets & Equipment','HR System','Payroll','Gaji Owner',
      'Laporan Bulanan','Reports & Analytics','Analisa Bisnis AI',
      'Smart Databases','Notification Center','Tugas & Pengingat'],
    kpis:[
      {key:'totalrev',    label:'Total Revenue',   icon:'💰', color:'#475569'},
      {key:'totalprofit', label:'Total Profit',    icon:'📈', color:'#34c759'},
      {key:'cashpos',     label:'Cash Position',   icon:'🏦', color:'#0071e3'},
      {key:'receivable',  label:'Total Piutang',   icon:'🕐', color:'#ff3b30'},
    ],
    navGroups:{
      'Konsolidasi':['Executive Command Center','Laporan Bulanan','Reports & Analytics','Analisa Bisnis AI'],
      'Keuangan':['Cashflow','Laba Rugi','Arus Kas','Accounting','Chart of Accounts','Gaji Owner'],
      'SDM':['HR System','Payroll'],
      'Aset':['Assets & Equipment','Smart Databases'],
    },
  },
  custom: {
    id:'custom', label:'Custom Business', icon:'⚡', colorHex:'#ea580c',
    description:'Konfigurasi modul sesuai kebutuhan',
    tagline:'Fleksibel untuk bisnis apa pun',
    defaultName:'Bisnis Custom',
    modules:['Dashboard','Sales Tracking','Cashflow','Laba Rugi','Accounting',
      'Chart of Accounts','Customer Database','Assets & Equipment','HR System','Payroll','Gaji Owner',
      'Reports & Analytics','Smart Databases','Notification Center','Analisa Bisnis AI'],
    kpis:[
      {key:'revenue',   label:'Revenue',   icon:'💰', color:'#ea580c'},
      {key:'profit',    label:'Profit',    icon:'📈', color:'#34c759'},
      {key:'cashflow',  label:'Arus Kas',  icon:'💸', color:'#0071e3'},
      {key:'customers', label:'Pelanggan', icon:'👥', color:'#5ac8fa'},
    ],
    navGroups:{
      'Operasional':['Sales Tracking','Customer Database'],
      'Keuangan':['Cashflow','Laba Rugi','Accounting','Chart of Accounts','Gaji Owner'],
      'HR & Payroll':['HR System','Payroll'],
      'Laporan':['Reports & Analytics','Analisa Bisnis AI'],
    },
  },
};

export function getBusinessConfig(typeId: string): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIGS[typeId as BusinessTypeId] || BUSINESS_TYPE_CONFIGS.custom;
}
export function getModulesForType(typeId: string): string[] {
  return getBusinessConfig(typeId).modules;
}
export function getNavGroupsForType(typeId: string): Record<string, string[]> {
  return getBusinessConfig(typeId).navGroups;
}
export function getKPIsForType(typeId: string) {
  return getBusinessConfig(typeId).kpis;
}
export function getColorForType(typeId: string): string {
  return getBusinessConfig(typeId).colorHex;
}
export function calcHealthScore(d: {
  hasRevenue:boolean; isProfitable:boolean; positiveCashflow:boolean;
  hasPaidEmployees:boolean; lowDebt:boolean; growthPositive:boolean;
}): { score:number; grade:'A'|'B'|'C'|'D'; label:string; color:string } {
  const score = [d.hasRevenue,d.isProfitable,d.positiveCashflow,d.hasPaidEmployees,d.lowDebt,d.growthPositive]
    .filter(Boolean).length * 16 + 4;
  const capped = Math.min(100, score);
  const grade  = capped>=80?'A':capped>=60?'B':capped>=40?'C':'D';
  const label  = capped>=80?'Sangat Sehat':capped>=60?'Sehat':capped>=40?'Perlu Perhatian':'Kritis';
  const color  = capped>=80?'#34c759':capped>=60?'#0071e3':capped>=40?'#ff9500':'#ff3b30';
  return { score:capped, grade, label, color };
}
export const ALL_BUSINESS_TYPES = Object.values(BUSINESS_TYPE_CONFIGS);

// Lucide icon names for each business type — used by UI components instead of emoji
export const BUSINESS_ICON_NAMES: Record<BusinessTypeId, string> = {
  fashion:          'Shirt',
  coffee:           'Coffee',
  restaurant:       'UtensilsCrossed',
  retail:           'Store',
  agency:           'Briefcase',
  service:          'Wrench',
  property:         'Building2',
  personal_finance: 'Wallet',
  investment:       'TrendingUp',
  holding:          'Building',
  custom:           'Zap',
};
