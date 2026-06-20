import React, { useState, useMemo } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import SmartTable, { ColumnDef } from '../../../shared/table/SmartTable';
import {
  Layers, Compass, Factory, Receipt, Megaphone,
  TrendingUp, Activity, Sliders, ArrowRight, Percent
} from 'lucide-react';
import { motion } from 'motion/react';

export default function HPPEngineView() {
  const {
    computedMaterials, computedProducts, computedSamples,
    computedProduction, config, formatMoney, t
  } = useERP();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    computedProducts[0]?.id || 'PROD-001'
  );
  const [materialCostTweak, setMaterialCostTweak]           = useState(0);
  const [wasteRateOverride, setWasteRateOverride]           = useState(12);
  const [laborCostTweak, setLaborCostTweak]                 = useState(0);
  const [packagingTweak, setPackagingTweak]                 = useState(0);
  const [campaignBudgetMultiplier, setCampaignBudgetMultiplier] = useState(1.0);
  const [simulatedRetailPrice, setSimulatedRetailPrice]     = useState(0);

  const accentHex = config?.customAccentColor || '#d4af37';

  const activeProduct = useMemo(() => {
    const prod = computedProducts.find(p => p.id === selectedProductId);
    if (prod && simulatedRetailPrice === 0) setSimulatedRetailPrice(prod.sellingPrice);
    return prod;
  }, [selectedProductId, computedProducts]);

  const resetTweaks = () => {
    setMaterialCostTweak(0);
    setWasteRateOverride(12);
    setLaborCostTweak(0);
    setPackagingTweak(0);
    setCampaignBudgetMultiplier(1.0);
    if (activeProduct) setSimulatedRetailPrice(activeProduct.sellingPrice);
  };

  const sim = useMemo(() => {
    if (!activeProduct) return null;
    const matchedSample = computedSamples.find(s => s.productId === activeProduct.id);
    const matchedBatch  = computedProduction.find(p => p.productId === activeProduct.id);

    const baseMaterialCost = matchedSample?.materialCost ?? matchedBatch?.materialCost ?? 225000;
    const appliedMat  = Math.max(1000, baseMaterialCost + materialCostTweak);
    const directMat   = appliedMat * (1 + wasteRateOverride / 100);
    const directLabor = Math.max(0, (matchedSample?.laborCost ?? 250000) + laborCostTweak);
    const appliedPkg  = Math.max(0, (matchedBatch?.packagingCost ?? 45000) + packagingTweak);
    const opsAlloc    = activeProduct.operationalCost || 120000;
    const marketing   = ((activeProduct.adsAllocation || 85000) + (activeProduct.kolAllocation || 50000)) * campaignBudgetMultiplier;

    const finalHPP    = directMat + directLabor + appliedPkg + opsAlloc + marketing;
    const sellP       = simulatedRetailPrice || activeProduct.sellingPrice;
    const grossP      = sellP - (directMat + directLabor + appliedPkg);
    const netP        = sellP - finalHPP;

    return {
      directMat, directLabor, appliedPkg, opsAlloc, marketing,
      finalHPP, grossP, netP,
      grossMargin: (grossP / sellP) * 100,
      netMargin:   (netP / sellP) * 100,
      originalHPP: activeProduct.finalHPP,
    };
  }, [activeProduct, materialCostTweak, wasteRateOverride, laborCostTweak,
      packagingTweak, campaignBudgetMultiplier, simulatedRetailPrice,
      computedSamples, computedProduction]);

  /* ── Scenario table ─────────────────────────────────────────────────── */
  const scenarioCols: ColumnDef[] = [
    { key: 'tier',          label: t('hpp_scenario_col_tier'),   type: 'text',       isEditable: false },
    { key: 'scenarioPrice', label: t('hpp_scenario_col_price'),  type: 'currency',   align: 'right', isEditable: false },
    { key: 'simulatedHpp',  label: t('hpp_scenario_col_hpp'),    type: 'currency',   align: 'right', isEditable: false },
    { key: 'netMargin',     label: t('hpp_scenario_col_margin'), type: 'percentage', align: 'right', isEditable: false },
    { key: 'status',        label: t('hpp_scenario_col_status'), type: 'status',
      selectOptions: [t('hpp_status_pristine'), t('hpp_status_marginal'), t('hpp_status_deficit')],
      align: 'center', isEditable: false },
  ];

  const scenarioRows = useMemo(() => {
    if (!activeProduct || !sim) return [];
    return [
      { tier: t('hpp_scenario_20off'),  multiplier: 0.8  },
      { tier: t('hpp_scenario_std'),    multiplier: 1.0  },
      { tier: t('hpp_scenario_premium'),multiplier: 1.15 },
      { tier: t('hpp_scenario_supreme'),multiplier: 1.4  },
    ].map((sc, idx) => {
      const sp      = Math.round(activeProduct.sellingPrice * sc.multiplier);
      const net     = sp - sim.finalHPP;
      const margin  = sp > 0 ? (net / sp) * 100 : 0;
      const status  = margin > 50
        ? t('hpp_status_pristine')
        : margin > 10 ? t('hpp_status_marginal') : t('hpp_status_deficit');
      return { id: `sc_${idx}`, tier: sc.tier, scenarioPrice: sp,
               simulatedHpp: sim.finalHPP, netMargin: margin, status };
    });
  }, [activeProduct, sim]);

  /* ── Cascade step helper ────────────────────────────────────────────── */
  const CascadeStep = ({ label, title, value, note, icon }: {
    label: string; title: string; value: number; note: string; icon: React.ReactNode;
  }) => (
    <div className="flex-1 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] p-3 rounded flex flex-col justify-between hover:border-white/10 transition-colors duration-200">
      <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] uppercase">
        <span>{label}</span>{icon}
      </div>
      <div className="py-2">
        <p className="text-[var(--color-text-muted)] text-xs">{title}</p>
        <p className="text-base text-[var(--color-text-main)] mt-1 font-mono font-semibold">
          {formatMoney(value)}
        </p>
      </div>
      <span className="text-[9px]" style={{ color: accentHex }}>{note}</span>
    </div>
  );

  /* ── Slider row helper ──────────────────────────────────────────────── */
  const SliderRow = ({ label, value, min, max, step, onChange, display }: {
    label: string; value: number; min: number; max: number;
    step: number; onChange: (v: number) => void; display: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-[var(--color-text-muted)] uppercase">{label}</span>
        <span className="text-[var(--color-text-main)]">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full"
        style={{ accentColor: accentHex }}
      />
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-4">
        <div>
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: accentHex }}>
            {t('hpp_page_label')}
          </span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
            {t('hpp_page_title')}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
            {t('hpp_page_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] p-2 rounded-lg">
          <span className="text-[10px] uppercase font-mono text-[var(--color-text-muted)] mr-1">
            {t('hpp_target_product')}
          </span>
          <select
            value={selectedProductId}
            onChange={e => { setSelectedProductId(e.target.value); setSimulatedRetailPrice(0); }}
            className="bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-xs font-mono uppercase text-[var(--color-text-main)] px-2.5 py-1.5 focus:outline-none rounded"
          >
            {computedProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
            ))}
          </select>
        </div>
      </div>

      {sim && activeProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Simulation Knobs ──────────────────────────────────── */}
          <div className="glass-panel p-5 rounded-lg space-y-5 lg:col-span-1">
            <div className="flex justify-between items-center border-b border-[var(--color-border-line)] pb-3">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-1.5"
                  style={{ color: accentHex }}>
                <Sliders size={14} /> {t('hpp_sim_knobs')}
              </h3>
              <button onClick={resetTweaks}
                className="text-[10px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] border border-[var(--color-border-line)] px-2 py-0.5 rounded cursor-pointer transition-colors">
                {t('hpp_reset_tweaks')}
              </button>
            </div>

            <div className="space-y-4">
              <SliderRow
                label={t('hpp_material_delta')}
                value={materialCostTweak} min={-150000} max={450000} step={5000}
                onChange={setMaterialCostTweak}
                display={`${materialCostTweak >= 0 ? '+' : ''}${formatMoney(materialCostTweak)}`}
              />
              <SliderRow
                label={t('hpp_waste_margin')}
                value={wasteRateOverride} min={2} max={40} step={1}
                onChange={setWasteRateOverride}
                display={`${wasteRateOverride}%`}
              />
              <SliderRow
                label={t('hpp_labor_premium')}
                value={laborCostTweak} min={-150000} max={500000} step={5000}
                onChange={setLaborCostTweak}
                display={`${laborCostTweak >= 0 ? '+' : ''}${formatMoney(laborCostTweak)}`}
              />
              <SliderRow
                label={t('hpp_packaging_fee')}
                value={packagingTweak} min={-40000} max={150000} step={2000}
                onChange={setPackagingTweak}
                display={`${packagingTweak >= 0 ? '+' : ''}${formatMoney(packagingTweak)}`}
              />
              <SliderRow
                label={t('hpp_ads_multiplier')}
                value={campaignBudgetMultiplier} min={0.2} max={3.0} step={0.1}
                onChange={setCampaignBudgetMultiplier}
                display={`${campaignBudgetMultiplier.toFixed(1)} ${t('hpp_x_spend')}`}
              />

              {/* Target price slider */}
              <div className="space-y-2 pt-3 border-t border-[var(--color-border-line)]">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[var(--color-text-muted)] uppercase">{t('hpp_target_price')}</span>
                  <span className="text-base font-bold" style={{ color: accentHex }}>
                    {formatMoney(simulatedRetailPrice)}
                  </span>
                </div>
                <input type="range"
                  min={Math.max(1, Math.ceil(sim.finalHPP))}
                  max={Math.max(Math.ceil(sim.finalHPP) * 5, (activeProduct.sellingPrice || sim.finalHPP * 3) * 2.5)}
                  step={config?.activeCurrency === 'IDR' || config?.currencySymbol === 'Rp' ? 1000 : 1}
                  value={simulatedRetailPrice}
                  onChange={e => setSimulatedRetailPrice(parseInt(e.target.value))}
                  className="w-full"
                  style={{ accentColor: accentHex }}
                />
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                  <span>{t('hpp_floor_hpp')} {formatMoney(Math.ceil(sim.finalHPP))}</span>
                  <span>{t('hpp_ceiling')} {formatMoney(Math.max(Math.ceil(sim.finalHPP) * 5, (activeProduct.sellingPrice || sim.finalHPP * 3) * 2.5))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Cascade + Profit Cards ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Supply-chain cascade */}
            <div className="glass-panel p-5 rounded-lg space-y-4">
              <h4 className="text-sm font-display uppercase tracking-wider text-[var(--color-text-main)] flex items-center gap-1.5">
                <Activity size={16} style={{ color: accentHex }} /> {t('hpp_cascade_title')}
              </h4>

              <div className="flex flex-col md:flex-row items-stretch justify-between gap-2 text-xs font-mono">
                <CascadeStep label={t('hpp_step1_label')} title={t('hpp_step1_title')} value={sim.directMat}   note={t('hpp_step1_note')} icon={<Layers size={10}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={13} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step2_label')} title={t('hpp_step2_title')} value={sim.directLabor} note={t('hpp_step2_note')} icon={<Compass size={10}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={13} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step3_label')} title={t('hpp_step3_title')} value={sim.appliedPkg}  note={t('hpp_step3_note')} icon={<Factory size={10}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={13} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step4_label')} title={t('hpp_step4_title')} value={sim.opsAlloc}    note={t('hpp_step4_note')} icon={<Receipt size={10}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={13} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step5_label')} title={t('hpp_step5_title')} value={sim.marketing}   note={t('hpp_step5_note')} icon={<Megaphone size={10}/>} />
              </div>

              {/* Aggregate HPP total */}
              <div className="p-4 bg-[var(--color-card-bg)] rounded border border-[var(--color-border-line)] flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h5 className="text-xs font-mono font-medium text-[var(--color-text-main)] uppercase tracking-widest">
                    {t('hpp_aggregate_title')}
                  </h5>
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono mt-1">
                    {t('hpp_aggregate_desc')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[var(--color-text-muted)] font-mono text-xs line-through mr-2">
                    {t('hpp_core_label')} {formatMoney(sim.originalHPP)}
                  </span>
                  <span className="text-2xl font-mono font-bold" style={{ color: accentHex }}>
                    {formatMoney(sim.finalHPP)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profit cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gross Profit */}
              <div className="glass-panel p-5 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono font-semibold tracking-wider text-[var(--color-text-main)] uppercase flex items-center gap-1">
                    <Percent size={13} className="text-emerald-400" /> {t('hpp_gross_title')}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                    sim.grossMargin > 60 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-500'
                  }`}>
                    {sim.grossMargin.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-mono text-[var(--color-text-main)] font-semibold">
                  {formatMoney(sim.grossP)}
                </p>
                <p className="pt-2 border-t border-[var(--color-border-line)] text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                  {t('hpp_gross_desc').replace('{margin}', sim.grossMargin.toFixed(1))}
                </p>
              </div>

              {/* Net Profit */}
              <div className={`glass-panel p-5 rounded-lg space-y-3 border-l-2 ${
                sim.netP > 0 ? 'border-emerald-500' : 'border-red-500'
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono font-semibold tracking-wider text-[var(--color-text-main)] uppercase flex items-center gap-1">
                    <TrendingUp size={13} className="text-emerald-400" /> {t('hpp_net_title')}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                    sim.netP > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-500'
                  }`}>
                    {sim.netMargin.toFixed(1)}% NET
                  </span>
                </div>
                <p className="text-2xl font-mono text-[var(--color-text-main)] font-semibold">
                  {formatMoney(sim.netP)}
                </p>
                <p className="pt-2 border-t border-[var(--color-border-line)] text-[10px] leading-relaxed">
                  {sim.netP > 0 ? (
                    <span className="text-[var(--color-text-muted)]">{t('hpp_net_positive')}</span>
                  ) : (
                    <span className="text-red-400">{t('hpp_net_negative')}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Scenario table */}
            <SmartTable
              tableId="hpp_scenarios"
              title={t('hpp_scenario_table_title')}
              columns={scenarioCols}
              data={scenarioRows}
              frozenColumns={1}
              allowAddColumn={false}
              allowAddRow={false}
              allowImport={false}
              allowExport={true}
              readOnly={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
