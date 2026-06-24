import { useNavigate, useLocation } from 'react-router-dom';

// ─── Module ID → URL slug mapping ────────────────────────────────────────────

export const MODULE_PATH_MAP: Record<string, string> = {
  'Dashboard':                      'dashboard',
  'Material Library':               'materials',
  'Sample Development':             'sample-dev',
  'Production':                     'production',
  'HPP Engine':                     'hpp',
  'Dynamic HPP':                    'hpp',
  'Produksi':                       'production',
  'Customers':                      'customers',
  'Finance':                        'finance',
  'Ads & KOL':                      'ads',
  'Ads & Analytics':                'ads',
  'AI Chief of Staff':              'ai',
  'Master Products':                'products',
  'Size Variant Inventory':         'inventory',
  'Sales Tracking':                 'sales',
  'Operational Cost':               'costs',
  'Ads Analytics':                  'ads',
  'KOL Tracking':                   'kol',
  'Purchase Orders':                'purchase-orders',
  'Supplier Database':              'suppliers',
  'Customer Database':              'customers',
  'Assets & Equipment':             'assets',
  'Cashflow':                       'cashflow',
  'Reports & Analytics':            'reports',
  'Dynamic HPP Engine':             'hpp',
  'Smart Databases':                'smart-tables',
  'AI Assistant':                   'ai',
  'Notification Center':            'notifications',
  'Team Management':                'team',
  'Settings':                       'settings',
  'Executive Command Center':       'executive',
  'Personal Finance':               'personal-finance',
  'Gaji Owner':                     'owner-finance',
  'Chart of Accounts':              'chart-of-accounts',
  'Analisa Bisnis AI':              'ai-insights',
  'Accounting':                     'accounting',
  'Laba Rugi':                      'profit-loss',
  'Arus Kas':                       'cash-flow',
  'Piutang':                        'receivables',
  'Laporan Bulanan':                'monthly-reports',
  'Analitik Pelanggan':             'customer-analytics',
  'ROI Iklan':                      'roi',
  'Broadcast Email':                'email',
  'HR System':                      'hr',
  'Payroll':                        'payroll',
  'Simulasi Gaji':                  'salary-sim',
  'Employees':                      'employees',
  'Attendance':                     'attendance',
  'HPP Produk Turunan':             'hpp-variants',
  'Tugas & Pengingat':              'tasks',
  'Riwayat Aktivitas':              'activity',
  'Store Management':               'stores',
  'Galeri Media':                   'media',
  'Kelola File':                    'files',
  'Langganan':                      'subscription',
  'AI Center':                      'ai-center',
  'Invoice & Nota':                 'invoices',
  'Bill of Materials (BOM)':        'bom',
  'Bill of Materials':              'bom',
  'Size Variants':                  'inventory',
  'Karyawan':                       'employees',
  'Absensi':                        'attendance',
  'Production Order':               'production-orders',
  'Quality Control':                'qc',
  'Finished Goods Inventory':       'finished-goods',
  'Recipe Management':              'recipes',
  'Menu Costing':                   'menu-costing',
  'Daily Waste Tracking':           'waste',
  'Daily Closing':                  'closing',
  'Goods Receiving':                'goods-receiving',
  'Stock Adjustment':               'stock-adj',
  'Reorder Point & Stock Aging':    'reorder-point',
  'Client Management':              'clients',
  'Project Management':             'projects',
  'Timesheets & Utilization':       'timesheets',
  'Unit & Tenant Management':       'units',
  'Rent Collection':                'rent',
  'Maintenance Tickets':            'maintenance',
  'Savings Goals':                  'savings',
  'Debt Tracking':                  'debt',
  'Investment Portfolio':           'investments',
  'Shopee':                         'shopee',
  'Pajak':                          'tax',
  'Tax Settings':                   'tax',
  'Product Intelligence':           'product-list',
  'Products':                       'products',
};

// Reverse map: URL slug → module ID
const PATH_MODULE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_PATH_MAP).map(([id, slug]) => [slug, id])
);

export function moduleIdToPath(moduleId: string): string {
  const slug = MODULE_PATH_MAP[moduleId]
    ?? moduleId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `/app/${slug}`;
}

export function pathToModuleId(pathname: string): string {
  const slug = pathname.replace(/^\/app\/?/, '');
  return PATH_MODULE_MAP[slug] ?? slug;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppNavigation() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const activePage = pathToModuleId(location.pathname);

  const navigateTo = (moduleId: string) => {
    navigate(moduleIdToPath(moduleId));
  };

  return { activePage, navigateTo };
}
