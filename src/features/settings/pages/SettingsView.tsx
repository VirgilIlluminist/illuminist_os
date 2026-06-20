import React, { useState } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import { Sliders, ShieldCheck, Database, Globe, Bot } from 'lucide-react';
import AISettingsPanel from '../../../shared/ai/AISettingsPanel';

export default function SettingsView() {
  const erpState = useERP();
  const { config, updateConfig, t } = erpState;
  const [activeTab, setActiveTab] = useState<'workspace'|'localization'|'rules'|'ai'|'maintenance'>('workspace');

  const activeColor = config?.customAccentColor || '#d4af37';

  const handleReset = async () => {
    const ok = await toast.confirm(t('settings_reset_confirm'));
    if (ok) {
      localStorage.clear();
      toast.success(t('settings_reset_done'));
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // Currency presets — IDR default, dapat ditambah
  const currenciesList = [
    { code: 'IDR', symbol: 'Rp',  rate: 1,     name: 'Rupiah (Rp)'  },
    { code: 'USD', symbol: '$',   rate: 15400,  name: 'US Dollar ($)' },
    { code: 'SGD', symbol: 'S$',  rate: 11500,  name: 'Singapore Dollar' },
    { code: 'EUR', symbol: '€',   rate: 16800,  name: 'Euro (€)'     },
    { code: 'GBP', symbol: '£',   rate: 19500,  name: 'British Pound' },
    { code: 'JPY', symbol: '¥',   rate: 103,    name: 'Japanese Yen' },
  ];

  const handleCurrencyPreset = (code: string, symbol: string, rate: number) => {
    updateConfig({ activeCurrency: code, currencySymbol: symbol, currencyRate: rate });
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono text-xs">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-5">
        <div>
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: activeColor }}>
            {t('settings_page_label')}
          </span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
            {t('settings_page_title')}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
            {t('settings_page_desc')}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[var(--color-border-line)]">
        {([
          { id: 'workspace',    icon: <Sliders size={12}/>,     label: t('settings_identity') },
          { id: 'localization', icon: <Globe size={12}/>,       label: t('settings_localization') },
          { id: 'rules',        icon: <ShieldCheck size={12}/>, label: t('settings_rules') },
          { id: 'ai',           icon: <Bot size={12}/>,         label: 'AI Settings' },
          { id: 'maintenance',  icon: <Database size={12}/>,    label: t('settings_maintenance') },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[10.5px] font-mono uppercase tracking-wider whitespace-nowrap rounded-t transition-all cursor-pointer"
            style={activeTab === tab.id
              ? { color: activeColor, borderBottom: `2px solid ${activeColor}`, fontWeight: 700 }
              : { color: 'var(--color-text-muted)' }
            }
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Tab: AI Settings */}
      {activeTab === 'ai' && (
        <AISettingsPanel />
      )}

      {/* Tab: Workspace */}
      {activeTab === 'workspace' && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Identity & Branding ──────────────────────────────────────── */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-display uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3 flex items-center gap-2">
            <Sliders size={16} style={{ color: activeColor }} />
            {t('settings_identity')}
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {/* Workspace Title */}
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] uppercase">{t('settings_brand_name')}</label>
              <input
                type="text"
                value={config?.systemName || 'NEVAEH AI OS'}
                onChange={(e) => updateConfig({ systemName: e.target.value })}
                className="w-full text-xs font-mono px-3 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Slogan */}
            <div className="space-y-1">
              <label className="text-[var(--color-text-muted)] uppercase">{t('settings_brand_slogan')}</label>
              <input
                type="text"
                value={config?.systemSubName || ''}
                onChange={(e) => updateConfig({ systemSubName: e.target.value })}
                className="w-full text-xs font-sans px-3 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Badge + Accent Color */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase">{t('settings_brand_badge')}</label>
                <input
                  type="text"
                  maxLength={3}
                  value={config?.brandMonogram || 'N'}
                  onChange={(e) => updateConfig({ brandMonogram: e.target.value })}
                  className="w-full text-xs font-mono px-3 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[var(--color-text-muted)] uppercase font-bold" style={{ color: activeColor }}>
                  {t('settings_accent_color')}
                </label>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => updateConfig({ customAccentColor: e.target.value, accentColor: 'platinum' })}
                  className="w-full h-8 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded cursor-pointer p-0.5"
                />
              </div>
            </div>

            {/* Theme Mode */}
            <div className="space-y-1 mt-2">
              <label className="text-[var(--color-text-muted)] uppercase font-bold">
                {t('settings_theme_mode')}
              </label>
              <select
                value={config?.themeMode || 'dark'}
                onChange={(e) => updateConfig({ themeMode: e.target.value as 'light' | 'dark' })}
                className="w-full text-xs font-mono px-3 py-2 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none cursor-pointer hover:border-white/20 transition-all font-bold"
              >
                <option value="dark">{t('settings_theme_dark')}</option>
                <option value="light">{t('settings_theme_light')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Localization & Currency ──────────────────────────────────── */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-display uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3 flex items-center gap-2">
            <Globe size={16} style={{ color: activeColor }} />
            {t('settings_localization')}
          </h3>

          <div className="space-y-4">
            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-[var(--color-text-main)] font-bold block">
                {t('settings_active_lang')}
              </label>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mb-2">
                {t('settings_lang_desc')}
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono">
                {[
                  { code: 'en', label: '🇬🇧 ENGLISH (EN)' },
                  { code: 'id', label: '🇮🇩 INDONESIA (ID)' },
                ].map(({ code, label }) => {
                  const isActive = (config?.language || 'id') === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => updateConfig({ language: code as 'en' | 'id' })}
                      className="py-2 px-3 border rounded text-center cursor-pointer transition-all text-[10.5px]"
                      style={isActive
                        ? { borderColor: activeColor, background: 'var(--color-card-bg)', color: 'var(--color-text-main)', fontWeight: 700 }
                        : { borderColor: 'var(--color-border-line)', color: 'var(--color-text-muted)' }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency Presets */}
            <div className="space-y-1.5 pt-3 border-t border-[var(--color-border-line)]">
              <label className="text-[var(--color-text-main)] font-bold block">
                {t('settings_select_currency')}
              </label>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-tight mb-2">
                {t('settings_currency_desc')}
              </p>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {currenciesList.map((curr) => {
                  const isActive = (config?.activeCurrency || 'IDR') === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyPreset(curr.code, curr.symbol, curr.rate)}
                      className="py-2 px-2 border rounded text-center cursor-pointer transition-all text-[10px] truncate"
                      style={isActive
                        ? { borderColor: activeColor, background: 'var(--color-card-bg)', color: 'var(--color-text-main)', fontWeight: 700 }
                        : { borderColor: 'var(--color-border-line)', color: 'var(--color-text-muted)' }
                      }
                    >
                      <span className="font-bold mr-1">{curr.symbol}</span>{curr.code}
                    </button>
                  );
                })}
              </div>

              {/* Manual overrides */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="space-y-1">
                  <span className="text-[var(--color-text-muted)] text-[9.5px] uppercase block">
                    {t('settings_rate_factor')}
                  </span>
                  <input
                    type="number"
                    value={config?.currencyRate || 1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateConfig({ currencyRate: isNaN(val) ? 1 : val });
                    }}
                    className="w-full px-2.5 py-1.5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none text-xs font-mono"
                    placeholder="mis. 15400"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[var(--color-text-muted)] text-[9.5px] uppercase block">
                    {t('settings_custom_symbol')}
                  </span>
                  <input
                    type="text"
                    value={config?.currencySymbol || ''}
                    onChange={(e) => updateConfig({ currencySymbol: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none text-xs"
                    placeholder="mis. $"
                  />
                </div>
              </div>

              {/* Decimal Precision */}
              <div className="space-y-1 mt-3.5 pt-3 border-t border-[var(--color-border-line)]">
                <span className="text-[var(--color-text-main)] font-bold block text-xs">
                  {t('settings_decimal_precision')}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] block leading-tight">
                  {t('settings_decimal_desc')}
                </span>
                <select
                  value={config?.decimalPrecision !== undefined ? config.decimalPrecision : 0}
                  onChange={(e) => updateConfig({ decimalPrecision: parseInt(e.target.value, 10) })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded focus:outline-none text-xs font-mono"
                >
                  <option value="0">{t('settings_decimal_0')}</option>
                  <option value="1">{t('settings_decimal_1')}</option>
                  <option value="2">{t('settings_decimal_2')}</option>
                  <option value="3">{t('settings_decimal_3')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Rules & Safeguards ────────────────────────────────────────── */}
        <div className="glass-panel p-5 rounded-lg space-y-4">
          <h3 className="text-sm font-display uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3 flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: activeColor }} />
            {t('settings_rules')}
          </h3>

          <div className="space-y-4 text-xs font-mono text-[var(--color-text-muted)]">
            <div className="flex justify-between items-center bg-[var(--color-card-bg)] p-3 rounded border border-[var(--color-border-line)]">
              <div>
                <span className="text-[var(--color-text-main)] block font-sans font-medium text-sm">
                  {t('settings_auto_warning')}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {t('settings_auto_warning_desc')}
                </span>
              </div>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                {t('settings_active')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-[var(--color-card-bg)] p-3 rounded border border-[var(--color-border-line)]">
              <div>
                <span className="text-[var(--color-text-main)] block font-sans font-medium text-sm">
                  {t('settings_dynamic_hpp')}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {t('settings_dynamic_hpp_desc')}
                </span>
              </div>
              <span className="font-bold px-2 py-0.5 rounded text-[10px]"
                style={{ color: activeColor, backgroundColor: activeColor + '20' }}>
                {t('settings_automatic')}
              </span>
            </div>

            <div className="flex justify-between items-center bg-[var(--color-card-bg)] p-3 rounded border border-[var(--color-border-line)]">
              <div>
                <span className="text-[var(--color-text-main)] block font-sans font-medium text-sm">
                  {t('settings_api_agent')}
                </span>
                <span className="text-[10px] text-sky-400">gemini-2.5-flash</span>
              </div>
              <span className="text-[var(--color-text-main)] font-bold bg-white/[0.05] px-2 py-0.5 rounded text-[10px]">
                {t('settings_integrated')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Database Maintenance ──────────────────────────────────────── */}
        <div className="glass-panel p-5 rounded-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-display uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3 flex items-center gap-2">
              <Database size={16} className="text-red-400" />
              {t('settings_maintenance')}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {t('settings_maintenance_desc')}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all text-xs uppercase font-mono tracking-wider font-semibold rounded cursor-pointer"
          >
            {t('settings_purge_btn')}
          </button>
        </div>
      </div>

      {/* ── JSON Database Export ───────────────────────────────────────────── */}
      <div className="glass-panel p-5 rounded-lg space-y-4">
        <h3 className="text-sm font-display uppercase tracking-wider text-[var(--color-text-main)] border-b border-[var(--color-border-line)] pb-3 flex items-center gap-2">
          <Database size={16} className="text-indigo-400" />
          {t('settings_json_title')}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          {t('settings_json_desc')}
        </p>
        <div className="bg-[var(--color-card-bg)] p-4 border border-[var(--color-border-line)] rounded overflow-hidden max-h-72 overflow-y-auto">
          <pre className="text-[10px] font-mono text-[var(--color-text-muted)] leading-normal whitespace-pre-wrap select-all">
            {JSON.stringify({
              materials:  erpState.computedMaterials,
              products:   erpState.computedProducts,
              variants:   erpState.computedVariants,
              samples:    erpState.computedSamples,
              production: erpState.computedProduction,
              sales:      erpState.computedSales,
              ads:        erpState.computedAds,
              kols:       erpState.computedKols,
              suppliers:  erpState.suppliers,
              assets:     erpState.assets,
              cashflow:   erpState.cashflow,
            }, null, 2)}
          </pre>
        </div>
      </div>

      {/* Close workspace tab wrapper */}
      </>
      )} {/* end activeTab === 'workspace' */}

    </div>
  );
}
