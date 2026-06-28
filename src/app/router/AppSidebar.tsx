import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppNavigation } from './useAppNavigation';
import { useBusiness } from '../store/BusinessContext';
import { useERP } from '../store/ERPContext';
import { getNavGroupsForType } from '../../core/constants/businessConstants';
import {
  LayoutDashboard, Layers, Compass, Factory, Shirt, Boxes,
  DollarSign, Receipt, Megaphone, Users, ClipboardList, Truck,
  Smile, Cpu, Activity, BarChart3, Database, Bell, Sliders, Bot, ShoppingBag,
  Plus, LogOut, ChevronLeft, ChevronRight,
  Coffee, UtensilsCrossed, Store, Briefcase, Wrench, Building2, Wallet, TrendingUp, Building, Zap,
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Layers, Compass, Factory, Shirt, Boxes,
  DollarSign, Receipt, Megaphone, Users, ClipboardList, Truck,
  Smile, Cpu, Activity, BarChart3, Database, Bell, Sliders, Bot, ShoppingBag,
};

const ICON_KEYS: Record<string, string> = {
  'Dashboard': 'LayoutDashboard',
  'Notification Center': 'Bell',
  'Tugas & Pengingat': 'ClipboardList',
  'Riwayat Aktivitas': 'Activity',
  'Settings': 'Sliders',
  'Material Library': 'Layers',
  'Sample Development': 'Compass',
  'Production': 'Factory',
  'Produksi': 'Factory',
  'Dynamic HPP': 'Cpu',
  'Customers': 'Smile',
  'Finance': 'DollarSign',
  'Ads & Analytics': 'Megaphone',
  'AI Chief of Staff': 'Bot',
  'Master Products': 'Shirt',
  'Size Variant Inventory': 'Boxes',
  'Dynamic HPP Engine': 'Cpu',
  'HPP Produk Turunan': 'Layers',
  'Bill of Materials (BOM)': 'ClipboardList',
  'Bill of Materials': 'ClipboardList',
  'Size Variants': 'Boxes',
  'Karyawan': 'Users',
  'Absensi': 'Activity',
  'Production Order': 'Factory',
  'Quality Control': 'Sliders',
  'Finished Goods Inventory': 'Boxes',
  'Sales Tracking': 'DollarSign',
  'Invoice & Nota': 'Receipt',
  'Piutang': 'Activity',
  'Analitik Pelanggan': 'BarChart3',
  'ROI Iklan': 'Megaphone',
  'Kalkulator Marketplace': 'DollarSign',
  'Ads Analytics': 'Megaphone',
  'KOL Tracking': 'Users',
  'Broadcast Email': 'Megaphone',
  'Shopee': 'ShoppingBag',
  'Purchase Orders': 'ClipboardList',
  'Supplier Database': 'Truck',
  'Customer Database': 'Smile',
  'Cashflow': 'Activity',
  'Laba Rugi': 'BarChart3',
  'Arus Kas': 'Activity',
  'Accounting': 'BarChart3',
  'Chart of Accounts': 'Database',
  'Gaji Owner': 'DollarSign',
  'Laporan Bulanan': 'BarChart3',
  'Reports & Analytics': 'BarChart3',
  'HR System': 'Users',
  'Payroll': 'DollarSign',
  'Simulasi Gaji': 'DollarSign',
  'Executive Command Center': 'BarChart3',
  'Analisa Bisnis AI': 'Bot',
  'Smart Databases': 'Database',
  'Store Management': 'Boxes',
  'Assets & Equipment': 'Cpu',
  'Operational Cost': 'Receipt',
  'Team Management': 'Users',
  'Personal Finance': 'DollarSign',
  'Savings Goals': 'DollarSign',
  'Debt Tracking': 'Activity',
  'Investment Portfolio': 'BarChart3',
  'Client Management': 'Smile',
  'Project Management': 'ClipboardList',
  'Timesheets & Utilization': 'Activity',
  'Unit & Tenant Management': 'Boxes',
  'Rent Collection': 'DollarSign',
  'Maintenance Tickets': 'Sliders',
  'Recipe Management': 'ClipboardList',
  'Menu Costing': 'DollarSign',
  'Daily Waste Tracking': 'Database',
  'Daily Closing': 'Receipt',
  'Goods Receiving': 'Truck',
  'Stock Adjustment': 'Sliders',
  'Reorder Point & Stock Aging': 'Activity',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BIZ_TYPE_ICONS: Record<string, React.ComponentType<any>> = {
  fashion: Shirt, coffee: Coffee, restaurant: UtensilsCrossed, retail: Store,
  agency: Briefcase, manufacturing: Building, service: Wrench, property: Building2,
  personal_finance: Wallet, investment: TrendingUp, holding: Building, custom: Zap,
};

const WORKSPACE_IDS = ['Dashboard'];
const COLLAPSED_KEY = 'illuminist-sidebar-collapsed';

interface AppSidebarProps {
  onSignOut?: () => void;
  userEmail?: string;
  onCreateBusiness?: () => void;
}

export function AppSidebar({ onSignOut, userEmail, onCreateBusiness }: AppSidebarProps) {
  const { navigateTo, activePage } = useAppNavigation();
  const { activeBusiness, businesses, switchBusiness } = useBusiness();
  const { config } = useERP();
  const accent = config?.customAccentColor || '#7c3aed';
  const bizType = activeBusiness?.business_type ?? 'fashion';
  const navGroups = getNavGroupsForType(bizType);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, String(collapsed)); } catch { /* noop */ }
  }, [collapsed]);

  const initials = userEmail ? userEmail[0].toUpperCase() : 'V';
  const w = collapsed ? 56 : 220;

  return (
    <aside style={{
      width: `${w}px`,
      minWidth: `${w}px`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
      background: 'var(--bg-sidebar)',
      transition: 'width 0.22s cubic-bezier(0.16,1,0.3,1), min-width 0.22s cubic-bezier(0.16,1,0.3,1)',
      overflow: 'hidden',
    }}>

      {/* ── Brand header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '16px 0' : '16px 12px 12px',
        flexShrink: 0,
        gap: '8px',
      }}>
        {/* Logo mark */}
        <div style={{
          width: '32px', height: '32px', flexShrink: 0,
          background: accent,
          borderRadius: '9px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: '14px',
          boxShadow: `0 4px 12px ${accent}55`,
          cursor: 'pointer',
        }} onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand sidebar' : undefined}>
          ◆
        </div>

        {/* Name + collapse toggle — hidden when collapsed */}
        {!collapsed && (
          <>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <div style={{
                fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.92)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: '-0.03em', lineHeight: 1.2,
              }}>
                {activeBusiness?.name ?? 'ILLUMINIST'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)', marginTop: '1px', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {React.createElement(BIZ_TYPE_ICONS[bizType] ?? Building, { size: 10 })}
                {bizType.replace(/_/g, ' ')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {/* Collapse button */}
              <button onClick={() => setCollapsed(true)} title="Collapse sidebar" style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: 'rgba(255,255,255,0.40)',
                padding: '5px', borderRadius: '7px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
              >
                <ChevronLeft size={13}/>
              </button>

              {/* Add business button */}
              {onCreateBusiness && (
                <button onClick={onCreateBusiness} title="Tambah Bisnis" style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.40)',
                  padding: '5px', borderRadius: '7px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
                >
                  <Plus size={13}/>
                </button>
              )}
            </div>
          </>
        )}

        {/* Expand button — shown when collapsed, below logo */}
      </div>

      {/* Expand chevron — centered below logo when collapsed */}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px', flexShrink: 0 }}>
          <button onClick={() => setCollapsed(false)} title="Expand sidebar" style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', color: 'rgba(255,255,255,0.40)',
            padding: '4px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
          >
            <ChevronRight size={12}/>
          </button>
        </div>
      )}

      {/* Business switcher (if multiple, only in expanded) */}
      {!collapsed && businesses.length > 1 && (
        <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {businesses.slice(0, 4).map(biz => (
              <button
                key={biz.id}
                onClick={() => switchBusiness(biz.id)}
                title={biz.name}
                style={{
                  padding: '3px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 500,
                  cursor: 'pointer',
                  background: biz.id === activeBusiness?.id ? `${accent}33` : 'rgba(255,255,255,0.05)',
                  border: biz.id === activeBusiness?.id ? `1px solid ${accent}4d` : '1px solid rgba(255,255,255,0.07)',
                  color: biz.id === activeBusiness?.id ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.40)',
                  whiteSpace: 'nowrap', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}
              >
                {biz.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Business icon switcher — collapsed mode only */}
      {collapsed && businesses.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '0 0 8px', flexShrink: 0 }}>
          {businesses.slice(0, 4).map(biz => {
            const BizIcon = BIZ_TYPE_ICONS[biz.business_type] ?? Building;
            const isActive = biz.id === activeBusiness?.id;
            return (
              <button key={biz.id} onClick={() => switchBusiness(biz.id)} title={biz.name} style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: isActive ? `${accent}33` : 'rgba(255,255,255,0.05)',
                border: isActive ? `1px solid ${accent}4d` : '1px solid rgba(255,255,255,0.07)',
                color: isActive ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.40)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}>
                <BizIcon size={13}/>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0, marginBottom: '4px' }} />

      {/* ── Nav ─── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '6px 0' : '6px 8px',
      }}>
        {/* Workspace */}
        {WORKSPACE_IDS.map(id => {
          const IconComp = ICON_MAP[ICON_KEYS[id] ?? 'Database'] ?? Database;
          return (
            <NavItem key={id} id={id} IconComp={IconComp}
              isActive={activePage === id} onNavigate={navigateTo}
              accent={accent} collapsed={collapsed}
            />
          );
        })}

        {/* Business-specific groups */}
        {Object.entries(navGroups).map(([group, pages]) => {
          const items = (pages as string[]).filter(p => !WORKSPACE_IDS.includes(p) && p.trim());
          if (!items.length) return null;
          return (
            <div key={group} style={{ marginTop: '12px' }}>
              {/* Group label — hidden when collapsed */}
              {!collapsed && (
                <div style={{
                  fontSize: '9px', fontWeight: 700,
                  letterSpacing: '0.09em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.20)',
                  padding: '0 10px 5px',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}>
                  {group}
                </div>
              )}
              {/* Divider dot when collapsed */}
              {collapsed && (
                <div style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  margin: '4px auto 6px',
                }}/>
              )}
              {items.map(id => {
                const IconComp = ICON_MAP[ICON_KEYS[id] ?? 'Database'] ?? Database;
                return (
                  <NavItem key={id} id={id} IconComp={IconComp}
                    isActive={activePage === id} onNavigate={navigateTo}
                    accent={accent} collapsed={collapsed}
                  />
                );
              })}
            </div>
          );
        })}
      </nav>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

      {/* ── User footer ─── */}
      <div style={{
        padding: collapsed ? '10px 0' : '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '10px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: 'white',
          boxShadow: `0 2px 10px ${accent}4d`,
        }} title={userEmail ?? 'Owner'}>
          {initials}
        </div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <div style={{
                fontSize: '12px', fontWeight: 600,
                color: 'rgba(255,255,255,0.80)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                letterSpacing: '-0.02em',
              }}>
                {userEmail ?? 'Owner'}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', marginTop: '1px', letterSpacing: '-0.01em' }}>
                {activeBusiness?.name ?? 'ILLUMINIST OS'}
              </div>
            </div>
            {onSignOut && (
              <button onClick={onSignOut} title="Sign out" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.25)', padding: '5px', borderRadius: '7px',
                display: 'flex', alignItems: 'center',
                transition: 'color 0.12s ease', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.80)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}>
                <LogOut size={14}/>
              </button>
            )}
          </>
        )}
        {/* Sign out in collapsed mode */}
        {collapsed && onSignOut && (
          <div /> /* sign out accessible via expand */
        )}
      </div>
    </aside>
  );
}

// ─── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({ id, IconComp, isActive, onNavigate, accent, collapsed }: {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IconComp: React.ComponentType<any>;
  isActive: boolean;
  onNavigate: (id: string) => void;
  accent: string;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={() => onNavigate(id)}
      title={id}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '10px',
        padding: collapsed ? '9px 0' : '9px 10px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.42)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'color 0.12s ease',
        marginBottom: '1px',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.42)'; }}
    >
      {/* Active pill */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="nav-active-pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '10px',
              background: `${accent}2e`,
              border: `1px solid ${accent}47`,
            }}
          />
        )}
      </AnimatePresence>

      <span style={{ position: 'relative', flexShrink: 0, opacity: isActive ? 1 : 0.65, display: 'flex', alignItems: 'center' }}>
        <IconComp size={16} />
      </span>

      {!collapsed && (
        <span style={{
          position: 'relative', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {id}
        </span>
      )}
    </button>
  );
}
