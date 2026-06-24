/**
 * Thin route wrappers for pages that need router hooks or business context
 * as props. These are the only new components — existing pages are untouched.
 */
import { useParams } from 'react-router-dom';
import { useAppNavigation, pathToModuleId } from './useAppNavigation';
import { useBusiness }  from '../store/BusinessContext';
import { findModuleByTitle } from '../../core/utils/moduleEngine';
import DashboardView          from '../../features/dashboard/pages/DashboardView';
import ExecutiveCommandCenter from '../../features/business/pages/ExecutiveCommandCenter';
import ModuleView             from '../../shared/components/ModuleView';
import AIChat                 from '../../shared/ai/AIChat';
import ComingSoonView         from '../../features/stub/ComingSoonView';

export function DashboardRoute() {
  const { navigateTo } = useAppNavigation();
  return <DashboardView onNavigate={navigateTo} />;
}

export function ExecutiveRoute() {
  const { navigateTo }    = useAppNavigation();
  const { switchBusiness } = useBusiness();
  return (
    <ExecutiveCommandCenter
      onNavigate={navigateTo}
      onSwitchBusiness={switchBusiness}
    />
  );
}

export function AIChatRoute() {
  const accent = 'var(--color-accent-highlight)';
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <div className="flex items-center gap-2">
          <span style={{ color: accent, fontSize: '16px' }}>✦</span>
          <span className="text-[11px] tracking-wide" style={{ color: accent }}>
            Chief of Staff
          </span>
        </div>
        <h2 className="text-2xl font-display tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
          ILLUMINIST AI
        </h2>
      </div>
      <AIChat className="min-h-[500px]" />
    </div>
  );
}

export function DeepModuleRoute() {
  const params   = useParams<{ '*': string }>();
  const slug     = params['*'] ?? '';
  const moduleId = pathToModuleId(`/app/${slug}`);

  const mod = findModuleByTitle(moduleId) ?? findModuleByTitle(slug);
  if (mod) return <ModuleView module={mod} />;

  // Modul belum punya halaman khusus — tampilkan stub, jangan redirect diam-diam.
  return <ComingSoonView title={moduleId || 'Halaman'} />;
}
