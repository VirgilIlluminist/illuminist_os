import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppNavigation } from './useAppNavigation';
import { useBusiness } from '../store/BusinessContext';
import { getNavGroupsForType } from '../../core/constants/businessConstants';
import {
  LayoutDashboard, Layers, Compass, Factory, Shirt, Boxes,
  DollarSign, Receipt, Megaphone, Users, ClipboardList, Truck,
  Smile, Cpu, Activity, BarChart3, Database, Bell, Sliders, Bot, ShoppingBag,
  Plus, LogOut,
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

const TYPE_ICONS: Record<string, string> = {
  fashion: '👗', coffee: '☕', restaurant: '🍽', retail: '🏪',
  agency: '💼', manufacturing: '🏭', service: '🛠', property: '🏠',
  personal_finance: '💰', investment: '📈', holding: '🏢', custom: '⚡',
};

const WORKSPACE_IDS = ['Dashboard'];

interface AppSidebarProps {
  onSignOut?: () => void;
  userEmail?: string;
  onCreateBusiness?: () => void;
}

export function AppSidebar({ onSignOut, userEmail, onCreateBusiness }: AppSidebarProps) {
  const { navigateTo, activePage } = useAppNavigation();
  const { activeBusiness, businesses, switchBusiness } = useBusiness();
  const bizType = activeBusiness?.business_type ?? 'fashion';
  const navGroups = getNavGroupsForType(bizType);

  const initials = userEmail ? userEmail[0].toUpperCase() : 'V';

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
      background: 'var(--bg-sidebar)',
    }}>

      {/* ── Brand header ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 20px 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', flexShrink: 0,
            background: 'linear-gradient(135deg, #8b5cf6, #5b21b6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
            boxShadow: '0 4px 14px rgba(124,58,237,0.40)',
          }}>◆</div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{
              fontSize: '17px', fontWeight: 600, color: 'rgba(255,255,255,0.95)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>
              {activeBusiness?.name ?? 'ILLUMINIST'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', letterSpacing: '-0.01em' }}>
              {TYPE_ICONS[bizType] ?? '🏢'} {bizType.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        {onCreateBusiness && (
          <button onClick={onCreateBusiness} title="Add Business" style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.50)',
            padding: '6px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; }}
          >
            <Plus size={14}/>
          </button>
        )}
      </div>

      {/* Business switcher (if multiple) */}
      {businesses.length > 1 && (
        <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {businesses.slice(0, 4).map(biz => (
              <button
                key={biz.id}
                onClick={() => switchBusiness(biz.id)}
                title={biz.name}
                style={{
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 500,
                  cursor: 'pointer',
                  background: biz.id === activeBusiness?.id ? 'rgba(124,58,237,0.20)' : 'rgba(255,255,255,0.05)',
                  border: biz.id === activeBusiness?.id ? '1px solid rgba(124,58,237,0.30)' : '1px solid rgba(255,255,255,0.07)',
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

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0, marginBottom: '4px' }} />

      {/* ── Nav ─── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 10px' }}>

        {/* Workspace */}
        {WORKSPACE_IDS.map(id => {
          const IconComp = ICON_MAP[ICON_KEYS[id] ?? 'Database'] ?? Database;
          return (
            <NavItem
              key={id}
              id={id}
              IconComp={IconComp}
              isActive={activePage === id}
              onNavigate={navigateTo}
            />
          );
        })}

        {/* Business-specific groups */}
        {Object.entries(navGroups).map(([group, pages]) => {
          const items = (pages as string[]).filter(p => !WORKSPACE_IDS.includes(p) && p.trim());
          if (!items.length) return null;
          return (
            <div key={group} style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.09em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.22)',
                padding: '0 10px 6px',
                userSelect: 'none',
              }}>
                {group}
              </div>
              {items.map(id => {
                const IconComp = ICON_MAP[ICON_KEYS[id] ?? 'Database'] ?? Database;
                return (
                  <NavItem
                    key={id}
                    id={id}
                    IconComp={IconComp}
                    isActive={activePage === id}
                    onNavigate={navigateTo}
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
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #8b5cf6, #5b21b6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: 'white',
          boxShadow: '0 2px 10px rgba(124,58,237,0.30)',
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <div style={{
            fontSize: '13px', fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            letterSpacing: '-0.02em',
          }}>
            {userEmail ?? 'Owner'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.30)', marginTop: '1px', letterSpacing: '-0.01em' }}>
            {activeBusiness?.name ?? 'ILLUMINIST OS'}
          </div>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.25)', padding: '6px', borderRadius: '8px',
              display: 'flex', alignItems: 'center',
              transition: 'color 0.12s ease',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.80)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
          >
            <LogOut size={15}/>
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── NavItem — matches template: 15px font, 20px icon, px-4 py-3, rounded-xl ──

function NavItem({ id, IconComp, isActive, onNavigate }: {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  IconComp: React.ComponentType<any>;
  isActive: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onNavigate(id)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'color 0.12s ease',
        marginBottom: '1px',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
    >
      {/* Active background with spring animation */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="nav-active-pill"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '12px',
              background: 'rgba(124,58,237,0.18)',
              border: '1px solid rgba(124,58,237,0.28)',
            }}
          />
        )}
      </AnimatePresence>

      <span style={{ position: 'relative', flexShrink: 0, opacity: isActive ? 1 : 0.65, display: 'flex', alignItems: 'center' }}>
        <IconComp size={17} />
      </span>
      <span style={{
        position: 'relative', flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {id}
      </span>
    </button>
  );
}
