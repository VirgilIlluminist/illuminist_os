import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary }  from '../../shared/components/ErrorBoundary';
import { ToastProvider }  from '../../shared/ui/Toast';
import { AuthProvider }   from '../providers/AuthProvider';
import ProtectedRoute     from './ProtectedRoute';
import AppLayout          from './AppLayout';
import LoginPage          from '../../features/auth/pages/LoginPage';
import { DashboardRoute, ExecutiveRoute, AIChatRoute, DeepModuleRoute } from './pageWrappers';

// Page imports — existing components, untouched
import MaterialsView          from '../../features/fashion/pages/MaterialsView';
import ProductsView           from '../../features/fashion/pages/ProductsView';
import HPPEngineView          from '../../features/fashion/pages/HPPEngineView';
import SalesAndCostsView      from '../../features/finance/pages/SalesAndCostsView';
import FinanceDashboardView   from '../../features/finance/pages/FinanceDashboardView';
import FinancesAndAssetsView  from '../../features/finance/pages/FinancesAndAssetsView';
import FinancialStatementsView from '../../features/accounting/pages/FinancialStatementsView';
import ChartOfAccountsView    from '../../features/accounting/pages/ChartOfAccountsView';
import SmartTablesView        from '../../features/workspace/pages/SmartTablesView';
import NotificationCenterView from '../../features/notifications/pages/NotificationCenterView';
import SettingsView           from '../../features/settings/pages/SettingsView';
import TeamPage               from '../../features/settings/pages/TeamPage';
import PayrollPage            from '../../features/hr/pages/PayrollPage';
import AttendancePage         from '../../features/hr/pages/AttendancePage';
import BusinessInsightView    from '../../features/insights/pages/BusinessInsightView';
import PersonalFinanceView    from '../../features/personal/pages/PersonalFinanceView';
import OwnerFinanceView       from '../../features/personal/pages/OwnerFinanceView';
import ShopeeChannelView      from '../../features/shopee/pages/ShopeeChannelView';
import TaxSettingsPage        from '../../features/tax/pages/TaxSettingsPage';
import ProductListView        from '../../components/products/ProductListView';
import ProductBlackboxView    from '../../components/products/ProductBlackboxView';
import CustomersView          from '../../features/customers/pages/CustomersView';
import ComingSoonView         from '../../features/stub/ComingSoonView';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — persistent sidebar layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>

                  {/* ── CORE ─────────────────────────────────────── */}
                  <Route path="/app/dashboard"            element={<DashboardRoute />} />
                  <Route path="/app/executive"            element={<ExecutiveRoute />} />
                  <Route path="/app/notifications"        element={<NotificationCenterView />} />
                  <Route path="/app/settings"             element={<SettingsView />} />
                  <Route path="/app/tasks"                element={<NotificationCenterView />} />
                  <Route path="/app/activity"             element={<NotificationCenterView />} />

                  {/* ── FASHION / MATERIALS ──────────────────────── */}
                  <Route path="/app/materials"            element={<MaterialsView initialSubTab="library"    key="library"    />} />
                  <Route path="/app/purchase-orders"      element={<MaterialsView initialSubTab="purchase"   key="purchase"   />} />
                  <Route path="/app/suppliers"            element={<MaterialsView initialSubTab="suppliers"  key="suppliers"  />} />
                  <Route path="/app/sample-dev"           element={<ProductsView  initialSubTab="sample"     key="sample"     />} />
                  <Route path="/app/production"           element={<ProductsView  initialSubTab="production" key="production" />} />
                  <Route path="/app/products"             element={<ProductsView  initialSubTab="master"     key="master"     />} />
                  <Route path="/app/inventory"            element={<ProductsView  initialSubTab="variants"   key="variants"   />} />
                  <Route path="/app/hpp"                  element={<HPPEngineView />} />
                  <Route path="/app/hpp-variants"         element={<HPPEngineView />} />
                  <Route path="/app/bom"                  element={<ComingSoonView title="Bill of Materials" description="Manajemen Bill of Materials untuk setiap produk" />} />
                  <Route path="/app/qc"                   element={<ComingSoonView title="Quality Control" description="Inspeksi dan kontrol kualitas produk" />} />

                  {/* ── FINANCE ──────────────────────────────────── */}
                  <Route path="/app/sales"                element={<SalesAndCostsView initialSubTab="sales" key="sales" />} />
                  <Route path="/app/costs"                element={<SalesAndCostsView initialSubTab="ops"   key="ops"   />} />
                  <Route path="/app/ads"                  element={<SalesAndCostsView initialSubTab="ads"   key="ads"   />} />
                  <Route path="/app/kol"                  element={<SalesAndCostsView initialSubTab="kol"   key="kol"   />} />
                  <Route path="/app/receivables"          element={<SalesAndCostsView initialSubTab="sales" />} />
                  <Route path="/app/customer-analytics"   element={<SalesAndCostsView initialSubTab="sales" />} />
                  <Route path="/app/roi"                  element={<SalesAndCostsView initialSubTab="ads"   />} />
                  <Route path="/app/finance"              element={<FinanceDashboardView />} />
                  <Route path="/app/customers"            element={<CustomersView />} />
                  <Route path="/app/assets"               element={<FinancesAndAssetsView initialSubTab="assets"    key="assets"    />} />
                  <Route path="/app/cashflow"             element={<FinancesAndAssetsView initialSubTab="cashflow"  key="cashflow"  />} />
                  <Route path="/app/reports"              element={<FinancesAndAssetsView initialSubTab="reports"   key="reports"   />} />

                  {/* ── ACCOUNTING ───────────────────────────────── */}
                  <Route path="/app/accounting"           element={<FinancialStatementsView />} />
                  <Route path="/app/profit-loss"          element={<FinancialStatementsView />} />
                  <Route path="/app/cash-flow"            element={<FinancialStatementsView />} />
                  <Route path="/app/monthly-reports"      element={<FinancialStatementsView />} />
                  <Route path="/app/chart-of-accounts"    element={<ChartOfAccountsView />} />

                  {/* ── HR & TEAM ────────────────────────────────── */}
                  <Route path="/app/team"                 element={<TeamPage />} />
                  <Route path="/app/hr"                   element={<TeamPage />} />
                  <Route path="/app/payroll"              element={<PayrollPage />} />
                  <Route path="/app/salary-sim"           element={<PayrollPage />} />
                  <Route path="/app/employees"            element={<TeamPage />} />
                  <Route path="/app/attendance"           element={<AttendancePage />} />

                  {/* ── WORKSPACE ────────────────────────────────── */}
                  <Route path="/app/smart-tables"         element={<SmartTablesView />} />
                  <Route path="/app/stores"               element={<SmartTablesView />} />
                  <Route path="/app/media"                element={<SmartTablesView />} />
                  <Route path="/app/files"                element={<SmartTablesView />} />

                  {/* ── SETTINGS / MISC ──────────────────────────── */}
                  <Route path="/app/email"                element={<SettingsView />} />
                  <Route path="/app/subscription"         element={<SettingsView />} />

                  {/* ── AI ───────────────────────────────────────── */}
                  <Route path="/app/ai"                   element={<AIChatRoute />} />
                  <Route path="/app/ai-insights"          element={<BusinessInsightView />} />
                  <Route path="/app/ai-center"            element={<BusinessInsightView />} />

                  {/* ── PERSONAL ─────────────────────────────────── */}
                  <Route path="/app/personal-finance"     element={<PersonalFinanceView />} />
                  <Route path="/app/owner-finance"        element={<OwnerFinanceView />} />

                  {/* ── TAX ──────────────────────────────────────── */}
                  <Route path="/app/tax"                  element={<TaxSettingsPage />} />

                  {/* ── PRODUCT BLACKBOX ─────────────────────────── */}
                  <Route path="/app/product-list"         element={<ProductListView />} />
                  <Route path="/app/product-list/:productId" element={<ProductBlackboxView />} />

                  {/* ── INVOICES ─────────────────────────────────── */}
                  <Route path="/app/invoices"             element={<SalesAndCostsView initialSubTab="sales" key="invoices" />} />

                  {/* ── SALES CHANNELS ───────────────────────────── */}
                  <Route path="/app/shopee"               element={<ShopeeChannelView />} />

                  {/* ── DEEP MODULES (moduleEngine catch-all) ────── */}
                  <Route path="/app/*"                    element={<DeepModuleRoute />} />
                </Route>
              </Route>

              {/* Root redirect */}
              <Route path="/"  element={<Navigate to="/app/dashboard" replace />} />
              <Route path="*"  element={<Navigate to="/app/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
