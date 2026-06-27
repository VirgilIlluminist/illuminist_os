import React, { useState } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import { toast } from '../../../shared/ui/Toast';
import {
  Sliders, Globe, Bot, Bell, Wallet,
  Monitor, Database, AlertCircle,
  CheckCircle, Calendar, Hash, Percent, Package,
  Clock, TrendingUp, LayoutDashboard,
} from 'lucide-react';
import AISettingsPanel from '../../../shared/ai/AISettingsPanel';
import NumberInput from '../../../shared/ui/NumberInput';
import ThemeTab from './ThemeTab';

type TabId = 'workspace' | 'localization' | 'notifikasi' | 'keuangan' | 'tampilan' | 'ai' | 'data';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  accent?: string;
}
function Toggle({ checked, onChange, accent = '#7c3aed' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0"
      style={{ background: checked ? accent : 'rgba(255,255,255,0.1)' }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  );
}

interface SettingRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
}
function SettingRow({ icon, label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--color-border-line)] last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="mt-0.5 shrink-0 text-[var(--color-text-muted)]">{icon}</div>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-main)]">{label}</p>
          {description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}
function Section({ title, icon, children, accent = '#7c3aed' }: SectionProps) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border-line)] flex items-center gap-2.5">
        {icon && <span style={{ color: accent }}>{icon}</span>}
        <h3 className="text-sm font-semibold tracking-tight text-[var(--color-text-main)]">{title}</h3>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

export default function SettingsView() {
  const erpState = useERP();
  const { config, updateConfig, t } = erpState;
  const [activeTab, setActiveTab] = useState<TabId>('workspace');

  const [notifLowStock,   setNotifLowStock]   = useState(true);
  const [notifPayroll,    setNotifPayroll]     = useState(true);
  const [notifSalesGoal,  setNotifSalesGoal]   = useState(true);
  const [notifDueDate,    setNotifDueDate]     = useState(true);
  const [autoVAT,         setAutoVAT]          = useState(false);
  const [showPL,          setShowPL]           = useState(true);
  const [thousandSep,     setThousandSep]      = useState(true);

  const accent = config?.customAccentColor || '#7c3aed';

  const handleReset = async () => {
    const ok = await toast.confirm(t('settings_reset_confirm'));
    if (ok) {
      localStorage.clear();
      toast.success(t('settings_reset_done'));
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const currenciesList = [
    { code: 'IDR', symbol: 'Rp',  rate: 1      },
    { code: 'USD', symbol: '$',   rate: 15400   },
    { code: 'SGD', symbol: 'S$',  rate: 11500   },
    { code: 'EUR', symbol: '€',   rate: 16800   },
    { code: 'GBP', symbol: '£',   rate: 19500   },
    { code: 'JPY', symbol: '¥',   rate: 103     },
  ];

  const TABS: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: 'workspace',    icon: <Sliders size={15}/>,   label: 'Workspace' },
    { id: 'localization', icon: <Globe size={15}/>,     label: 'Bahasa & Mata Uang' },
    { id: 'notifikasi',   icon: <Bell size={15}/>,      label: 'Notifikasi' },
    { id: 'keuangan',     icon: <Wallet size={15}/>,    label: 'Keuangan' },
    { id: 'tampilan',     icon: <Monitor size={15}/>,   label: 'Tampilan' },
    { id: 'ai',           icon: <Bot size={15}/>,       label: 'AI' },
    { id: 'data',         icon: <Database size={15}/>,  label: 'Data' },
  ];

  const inputCls = 'w-full px-4 py-2.5 bg-white/[0.06] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-xl focus:outline-none focus:border-white/25 text-sm transition-colors';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <span className="text-xs tracking-widest uppercase" style={{ color: accent }}>
          {t('settings_page_label')}
        </span>
        <h2 className="text-[26px] font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1" style={{ letterSpacing: '-0.04em' }}>
          {t('settings_page_title')}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {t('settings_page_desc')}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-0.5 overflow-x-auto pb-1 border-b border-[var(--color-border-line)]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap rounded-t transition-all cursor-pointer"
            style={{
              fontSize: '13px',
              letterSpacing: '-0.01em',
              fontWeight: activeTab === tab.id ? 600 : 400,
              ...(activeTab === tab.id
                ? { color: accent, borderBottom: `2px solid ${accent}` }
                : { color: 'var(--color-text-muted)' })
            }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Tampilan ─────────────────────────────────────────────────── */}
      {activeTab === 'tampilan' && <ThemeTab />}

      {/* ── TAB: AI ──────────────────────────────────────────────────────── */}
      {activeTab === 'ai' && <AISettingsPanel />}

      {/* ── TAB: Workspace ───────────────────────────────────────────────── */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Identitas Workspace" icon={<Sliders size={16}/>} accent={accent}>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('settings_brand_name')}</label>
                <input
                  type="text"
                  value={config?.systemName || 'ILLUMINIST OS'}
                  onChange={(e) => updateConfig({ systemName: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('settings_brand_slogan')}</label>
                <input
                  type="text"
                  value={config?.systemSubName || ''}
                  onChange={(e) => updateConfig({ systemSubName: e.target.value })}
                  className={inputCls}
                  placeholder="Tagline atau deskripsi singkat"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('settings_brand_badge')}</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={config?.brandMonogram || 'N'}
                    onChange={(e) => updateConfig({ brandMonogram: e.target.value })}
                    className={inputCls}
                    placeholder="mis. IOS"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: accent }}>
                    {t('settings_accent_color')}
                  </label>
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => updateConfig({ customAccentColor: e.target.value, accentColor: 'platinum' })}
                    className="w-full h-10 bg-white/[0.06] border border-[var(--color-border-line)] rounded-xl cursor-pointer p-0.5"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">
                  {t('settings_theme_mode')}
                </label>
                <select
                  value={config?.themeMode || 'dark'}
                  onChange={(e) => updateConfig({ themeMode: e.target.value as 'light' | 'dark' })}
                  className={selectCls}
                >
                  <option value="dark">{t('settings_theme_dark')}</option>
                  <option value="light">{t('settings_theme_light')}</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="System Status" icon={<CheckCircle size={16}/>} accent={accent}>
            <div className="py-2">
              <SettingRow
                icon={<AlertCircle size={16}/>}
                label={t('settings_auto_warning')}
                description={t('settings_auto_warning_desc')}
              >
                <span className="text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-3 py-1 rounded-full">
                  {t('settings_active')}
                </span>
              </SettingRow>
              <SettingRow
                icon={<TrendingUp size={16}/>}
                label={t('settings_dynamic_hpp')}
                description={t('settings_dynamic_hpp_desc')}
              >
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: accent, backgroundColor: accent + '20' }}>
                  {t('settings_automatic')}
                </span>
              </SettingRow>
              <SettingRow
                icon={<Bot size={16}/>}
                label={t('settings_api_agent')}
                description="gemini-2.5-flash"
              >
                <span className="text-xs font-medium text-[var(--color-text-muted)] bg-white/[0.05] px-3 py-1 rounded-full">
                  {t('settings_integrated')}
                </span>
              </SettingRow>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: Localization ────────────────────────────────────────────── */}
      {activeTab === 'localization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Bahasa" icon={<Globe size={16}/>} accent={accent}>
            <div className="py-4 space-y-4">
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {t('settings_lang_desc')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'en', label: '🇬🇧 English' },
                  { code: 'id', label: '🇮🇩 Indonesia' },
                ].map(({ code, label }) => {
                  const isActive = (config?.language || 'id') === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => updateConfig({ language: code as 'en' | 'id' })}
                      className="py-3 px-4 border rounded-xl text-center cursor-pointer transition-all text-sm"
                      style={isActive
                        ? { borderColor: accent, background: accent + '15', color: 'var(--color-text-main)', fontWeight: 600 }
                        : { borderColor: 'var(--color-border-line)', color: 'var(--color-text-muted)' }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="Mata Uang" icon={<Wallet size={16}/>} accent={accent}>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {currenciesList.map((curr) => {
                  const isActive = (config?.activeCurrency || 'IDR') === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => updateConfig({ activeCurrency: curr.code, currencySymbol: curr.symbol, currencyRate: curr.rate })}
                      className="py-3 px-2 border rounded-xl text-center cursor-pointer transition-all truncate text-sm"
                      style={isActive
                        ? { borderColor: accent, background: accent + '15', color: 'var(--color-text-main)', fontWeight: 700 }
                        : { borderColor: 'var(--color-border-line)', color: 'var(--color-text-muted)' }
                      }
                    >
                      <span className="font-bold mr-1">{curr.symbol}</span>{curr.code}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border-line)]">
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('settings_rate_factor')}</label>
                  <NumberInput
                    value={config?.currencyRate || 1}
                    onChange={(n) => updateConfig({ currencyRate: n || 1 })}
                    className={inputCls}
                    placeholder="mis. 15400"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('settings_custom_symbol')}</label>
                  <input
                    type="text"
                    value={config?.currencySymbol || ''}
                    onChange={(e) => updateConfig({ currencySymbol: e.target.value })}
                    className={inputCls}
                    placeholder="mis. $"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--color-border-line)]">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">{t('settings_decimal_precision')}</label>
                <select
                  value={config?.decimalPrecision !== undefined ? config.decimalPrecision : 0}
                  onChange={(e) => updateConfig({ decimalPrecision: parseInt(e.target.value, 10) })}
                  className={selectCls}
                >
                  <option value="0">{t('settings_decimal_0')}</option>
                  <option value="1">{t('settings_decimal_1')}</option>
                  <option value="2">{t('settings_decimal_2')}</option>
                  <option value="3">{t('settings_decimal_3')}</option>
                </select>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: Notifikasi ──────────────────────────────────────────────── */}
      {activeTab === 'notifikasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Alert Stok & Inventori" icon={<Package size={16}/>} accent={accent}>
            <div className="py-2">
              <SettingRow
                icon={<Package size={16}/>}
                label="Alert Stok Menipis"
                description="Notifikasi saat stok bahan baku di bawah minimum"
              >
                <Toggle
                  checked={config?.autoReorderEnabled ?? notifLowStock}
                  onChange={(v) => { setNotifLowStock(v); updateConfig({ autoReorderEnabled: v }); }}
                  accent={accent}
                />
              </SettingRow>
              <SettingRow
                icon={<AlertCircle size={16}/>}
                label="Batas Stok Minimum"
                description="Tampilkan alert saat stok di bawah nilai ini"
              >
                <div className="w-28">
                  <NumberInput
                    value={config?.lowStockThreshold ?? 150}
                    onChange={(n) => updateConfig({ lowStockThreshold: n || 1 })}
                    className="w-full px-3 py-2 bg-white/[0.06] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-xl focus:outline-none text-sm text-right"
                  />
                </div>
              </SettingRow>
            </div>
          </Section>

          <Section title="Pengingat Keuangan" icon={<Clock size={16}/>} accent={accent}>
            <div className="py-2">
              <SettingRow
                icon={<Clock size={16}/>}
                label="Reminder Payroll"
                description="Ingatkan H-3 sebelum tanggal gajian"
              >
                <Toggle checked={notifPayroll} onChange={setNotifPayroll} accent={accent} />
              </SettingRow>
              <SettingRow
                icon={<TrendingUp size={16}/>}
                label="Alert Target Penjualan"
                description="Notifikasi progress menuju target penjualan bulanan"
              >
                <Toggle checked={notifSalesGoal} onChange={setNotifSalesGoal} accent={accent} />
              </SettingRow>
              <SettingRow
                icon={<Calendar size={16}/>}
                label="Reminder Jatuh Tempo Invoice"
                description="Ingatkan H-7 sebelum invoice jatuh tempo"
              >
                <Toggle checked={notifDueDate} onChange={setNotifDueDate} accent={accent} />
              </SettingRow>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: Keuangan ────────────────────────────────────────────────── */}
      {activeTab === 'keuangan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Pajak & Fiskal" icon={<Percent size={16}/>} accent={accent}>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Default Tax Rate (%)</label>
                <NumberInput
                  value={config?.defaultTaxRate ?? 10}
                  onChange={(n) => updateConfig({ defaultTaxRate: n ?? 10 })}
                  className={inputCls}
                  placeholder="mis. 11"
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                  Digunakan sebagai default saat membuat invoice baru. Bisa dioverride per transaksi.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border-line)]">
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Bulan Awal Tahun Fiskal</label>
                <select className={selectCls} defaultValue="1">
                  {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
                <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                  Mempengaruhi laporan keuangan tahunan dan periode fiskal.
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--color-border-line)]">
                <SettingRow
                  icon={<Percent size={16}/>}
                  label="Hitung PPN Otomatis"
                  description="Tambahkan PPN secara otomatis pada setiap invoice baru"
                >
                  <Toggle checked={autoVAT} onChange={setAutoVAT} accent={accent} />
                </SettingRow>
              </div>
            </div>
          </Section>

          <Section title="Format Invoice & Laporan" icon={<Hash size={16}/>} accent={accent}>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Invoice Prefix</label>
                <input
                  type="text"
                  defaultValue="INV"
                  className={inputCls}
                  placeholder="mis. INV, BILL, atau nama bisnis"
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                  Nomor invoice akan diformat: INV-2024-0001
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-muted)] mb-2 block">Jatuh Tempo Default (hari)</label>
                <NumberInput
                  value={14}
                  onChange={() => {}}
                  className={inputCls}
                  placeholder="14"
                />
              </div>
              <div className="pt-2 border-t border-[var(--color-border-line)]">
                <SettingRow
                  icon={<TrendingUp size={16}/>}
                  label="Tampilkan Grafik P&L"
                  description="Grafik profit & loss di halaman laporan keuangan"
                >
                  <Toggle checked={showPL} onChange={setShowPL} accent={accent} />
                </SettingRow>
                <SettingRow
                  icon={<LayoutDashboard size={16}/>}
                  label="Format Angka Ribuan"
                  description="Gunakan titik sebagai pemisah ribuan (Rp 1.000.000)"
                >
                  <Toggle checked={thousandSep} onChange={setThousandSep} accent={accent} />
                </SettingRow>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: Data ────────────────────────────────────────────────────── */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Export & Backup" icon={<Database size={16}/>} accent={accent}>
              <div className="py-4 space-y-3">
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {t('settings_json_desc')}
                </p>
                <button
                  onClick={() => {
                    const data = JSON.stringify({
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
                    }, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement('a');
                    a.href     = url;
                    a.download = `illuminist-backup-${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success('Data berhasil diexport');
                  }}
                  className="w-full py-3 rounded-xl border border-[var(--color-border-line)] text-sm font-medium text-[var(--color-text-main)] hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  Export JSON Backup
                </button>
              </div>
            </Section>

            <Section title="Reset Data" icon={<Database size={16}/>} accent={accent}>
              <div className="py-4 space-y-3">
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {t('settings_maintenance_desc')}
                </p>
                <div className="p-4 rounded-xl bg-red-500/[0.06] border border-red-500/20">
                  <p className="text-sm text-red-400 font-medium mb-1">Peringatan</p>
                  <p className="text-xs text-red-400/70 leading-relaxed">
                    Aksi ini tidak dapat diundur. Semua data akan dihapus permanen dari localStorage.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition-all text-sm font-semibold rounded-xl cursor-pointer"
                >
                  {t('settings_purge_btn')}
                </button>
              </div>
            </Section>
          </div>

          <Section title="Database Preview (JSON)" icon={<Database size={16}/>} accent={accent}>
            <div className="py-4">
              <div className="bg-black/20 p-4 border border-[var(--color-border-line)] rounded-xl max-h-72 overflow-y-auto">
                <pre className="text-xs font-mono text-[var(--color-text-muted)] leading-normal whitespace-pre-wrap select-all">
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
          </Section>
        </div>
      )}
    </div>
  );
}
