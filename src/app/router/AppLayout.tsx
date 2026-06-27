import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppNavigation } from './useAppNavigation';
import { ERPProvider, useERP } from '../store/ERPContext';
import { BusinessProvider, useBusiness } from '../store/BusinessContext';
import { initHapticGlobal, initSwipeGesture } from '../../core/utils/soundEffects';
import GlobalSearch from '../../shared/components/GlobalSearch';
import BusinessWizard from '../../features/business/components/BusinessWizard';
import ExecutiveDashboard from '../../features/business/pages/ExecutiveDashboard';
import { Bell, Settings, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { isSupabaseEnabled } from '../../infra/supabase/client';
import migrationService from '../../infra/database/migration.service';
import { AppSidebar } from './AppSidebar';
import { useTheme } from '../../shared/hooks/useTheme';
import { applyAccent } from '../../shared/theme/accent';
import { BackgroundStage } from '../../shared/components/BackgroundStage';

// ─── Inner layout ─────────────────────────────────────────────────────────────

function AppLayoutInner({ onSignOut, userEmail }: { onSignOut: () => void; userEmail?: string }) {
  const { config, notifications } = useERP();
  const accent = config?.customAccentColor || '#7c3aed';
  const { activeBusiness, isHolding } = useBusiness();
  const { navigateTo, activePage } = useAppNavigation();

  // Apply the wallpaper/glass/accent theme (data-theme + CSS-var overrides).
  useTheme();

  // Single source of truth for the accent: sync customAccentColor → every accent
  // CSS variable (both the token system and the legacy --color-* system) so the
  // entire UI — inline-styled AND var-based components — follows one chosen colour.
  React.useEffect(() => { applyAccent(accent); }, [accent]);

  const [showCreateBiz, setShowCreateBiz] = useState(false);
  const [showSearch,    setShowSearch]    = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  // Theme sync
  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('is-light', 'glass', 'is-dark');
    if (config?.themeMode === 'light')      html.classList.add('is-light');
    else if (config?.themeMode === 'glass') html.classList.add('glass');
    else                                    html.classList.add('is-dark');
  }, [config?.themeMode]);

  // Tab title sync — reflect the workspace name, never the legacy product name
  React.useEffect(() => {
    const name = config?.systemName;
    document.title = (!name || name === 'NEVAEH AI OS') ? 'ILLUMINIST OS' : name;
  }, [config?.systemName]);

  React.useEffect(() => {
    initHapticGlobal();
    return initSwipeGesture({ onSwipeRight: () => {}, onSwipeLeft: () => {} });
  }, []);

  // Auto Supabase migration per business
  React.useEffect(() => {
    if (!activeBusiness?.id || !isSupabaseEnabled) return;
    const key = `illum_migrated_${activeBusiness.id}`;
    if (localStorage.getItem(key)) return;
    migrationService.migrateAll(activeBusiness.id).then(r => {
      if (r.success) localStorage.setItem(key, '1');
    }).catch(() => {});
  }, [activeBusiness?.id]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(v => !v); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); navigateTo('Dashboard'); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigateTo]);

  return (
    <BackgroundStage>
      {/* Bezel frame → glass shell → app layout */}
      <div style={{ padding: '10px', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div className="bezel-frame" style={{ borderRadius: 32, padding: 3, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
          <div className="glass-shell app-container" style={{ borderRadius: 30, flex: 1, height: '100%' }}>

        {/* Sidebar */}
        <AppSidebar
          onSignOut={onSignOut}
          userEmail={userEmail}
          onCreateBusiness={() => setShowCreateBiz(true)}
        />

        {/* Main content */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'transparent',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
        }}>

          {/* Topbar */}
          <div style={{
            height: '60px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'var(--bg-topbar)',
            flexShrink: 0,
          }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', letterSpacing: '-0.01em' }}>
              <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>{activeBusiness?.name ?? 'ILLUMINIST'}</span>
              <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.20)' }}/>
              <span style={{ color: 'rgba(255,255,255,0.80)', fontWeight: 600, letterSpacing: '-0.02em' }}>{activePage}</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Search */}
              <TopbarBtn onClick={() => setShowSearch(true)} title="Search (⌘K)">
                <Search size={15}/>
              </TopbarBtn>

              {/* Notifications */}
              <TopbarBtn onClick={() => navigateTo('Notification Center')} title="Notifications">
                <Bell size={15}/>
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: '6px', right: '6px',
                    width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444',
                    boxShadow: '0 0 0 1.5px rgba(0,0,0,0.4)',
                  }}/>
                )}
              </TopbarBtn>

              {/* Settings */}
              <TopbarBtn onClick={() => navigateTo('Settings')} title="Settings">
                <Settings size={15}/>
              </TopbarBtn>

              {/* Avatar */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, marginLeft: '6px',
                background: accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 700, color: 'white', cursor: 'pointer',
                boxShadow: `0 2px 10px ${accent}59`,
                letterSpacing: '-0.02em',
              }}>
                {userEmail ? userEmail[0].toUpperCase() : 'V'}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ padding: '28px 32px', maxWidth: '1440px' }}>
              {isHolding ? <ExecutiveDashboard /> : <Outlet />}
            </div>
          </div>
        </main>

          </div>{/* glass-shell */}
        </div>{/* bezel-frame */}
      </div>{/* padding wrapper */}

      {/* Global Search */}
      <GlobalSearch
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={p => { navigateTo(p); setShowSearch(false); }}
      />

      {/* Business Wizard */}
      <BusinessWizard open={showCreateBiz} onClose={() => setShowCreateBiz(false)} />
    </BackgroundStage>
  );
}

// ─── Topbar button helper ─────────────────────────────────────────────────────

function TopbarBtn({ onClick, title, children }: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        background: hov ? 'rgba(255,255,255,0.08)' : 'none',
        border: 'none', cursor: 'pointer',
        color: hov ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.38)',
        padding: '9px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.12s ease',
      }}
    >
      {children}
    </button>
  );
}

// ─── Providers wrapper ────────────────────────────────────────────────────────

export default function AppLayout() {
  const { user, signOut } = useAuth();
  return (
    <BusinessProvider>
      <ERPProvider>
        <AppLayoutInner onSignOut={signOut} userEmail={user?.email} />
      </ERPProvider>
    </BusinessProvider>
  );
}
