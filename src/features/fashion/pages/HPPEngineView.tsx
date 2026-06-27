import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useERP } from '../../../app/store/ERPContext';
import SmartTable, { ColumnDef } from '../../../shared/table/SmartTable';
import {
  Layers, Compass, Factory, Receipt, Megaphone,
  TrendingUp, Activity, ArrowRight, Percent, Package,
  Cpu, ChevronRight, Bug,
} from 'lucide-react';
import type {
  MaterialCostNode, LaborCostNode, PackagingCostNode, OverheadCostNode,
} from '../../../core/graph/types';

// ─── Inline editable number cell ─────────────────────────────────────────────
function EditCell({
  value, onCommit, disabled = false, prefix = 'Rp', suffix = '',
}: {
  value: number;
  onCommit: (v: number) => void;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));

  const commit = () => {
    const n = parseFloat(raw.replace(/[^0-9.-]/g, ''));
    if (!isNaN(n) && n !== value) onCommit(n);
    setEditing(false);
  };

  if (disabled) {
    return (
      <span className="font-mono text-xs text-[var(--color-text-muted)] tabular-nums">
        {prefix}{value.toLocaleString('id-ID')}{suffix}
      </span>
    );
  }

  return editing ? (
    <input
      autoFocus
      type="number"
      value={raw}
      onChange={e => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className="w-full bg-black/30 border border-[var(--color-border-line)] rounded px-1.5 py-0.5 text-xs font-mono text-[var(--color-text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
    />
  ) : (
    <button
      onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="text-xs font-mono text-[var(--color-text-main)] hover:underline cursor-text tabular-nums text-left"
      title="Click to edit"
    >
      {prefix}{value.toLocaleString('id-ID')}{suffix}
    </button>
  );
}

export default function HPPEngineView() {
  const {
    computedProducts, graphNodes, updateGraphNode,
    config, formatMoney, t,
    getProductCostBreakdown,
  } = useERP();

  const [selectedProductId, setSelectedProductId] = useState<string>(
    computedProducts[0]?.id || 'PROD-001'
  );
  const [simulatedRetailPrice, setSimulatedRetailPrice] = useState(0);
  const [debugOpen, setDebugOpen] = useState(false);

  const accentHex = config?.customAccentColor || '#7c3aed';

  // Toggle debug panel with Ctrl+Shift+D
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') setDebugOpen(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Derive product list from computedProducts or fall back to graph margin nodes
  const productList = useMemo(() => {
    if (computedProducts.length > 0) return computedProducts.map(p => ({
      id: p.id, name: p.name, sellingPrice: p.sellingPrice,
      operationalCost: p.operationalCost, adsAllocation: p.adsAllocation,
      kolAllocation: p.kolAllocation, finalHPP: p.finalHPP,
    }));
    return graphNodes
      .filter(n => n.type === 'margin')
      .map(n => {
        const mn = n as import('../../../core/graph/types').MarginNode;
        return {
          id: mn.productId, name: mn.productId,
          sellingPrice: mn.sellingPrice, operationalCost: 0,
          adsAllocation: 0, kolAllocation: 0,
          finalHPP: mn.sellingPrice - mn.value,
        };
      });
  }, [computedProducts, graphNodes]);

  const activeProduct = useMemo(() => {
    const prod = productList.find(p => p.id === selectedProductId);
    if (prod && simulatedRetailPrice === 0) setSimulatedRetailPrice(prod.sellingPrice);
    return prod;
  }, [selectedProductId, productList]);

  // Cost breakdown — reads LIVE from graph nodes (re-runs whenever graphNodes changes)
  const bd = useMemo(() => {
    if (!activeProduct) return null;
    return getProductCostBreakdown(activeProduct.id);
  }, [activeProduct, graphNodes]);

  // Simulation — pure read from graph, no local tweak state
  const sim = useMemo(() => {
    if (!activeProduct || !bd) return null;
    const directMat   = bd.nodes.materials.reduce((s, n) => s + n.value, 0);
    const directLabor = bd.nodes.labor.reduce((s, n) => s + n.value, 0);
    const appliedPkg  = bd.nodes.packaging.reduce((s, n) => s + n.value, 0);
    const opsAlloc    = bd.nodes.overhead.reduce((s, n) => s + n.value, 0)
                        || activeProduct.operationalCost || 0;
    const marketing   = (activeProduct.adsAllocation || 0) + (activeProduct.kolAllocation || 0);
    const finalHPP    = bd.hpp?.value ?? (directMat + directLabor + appliedPkg + opsAlloc + marketing);
    const sellP       = simulatedRetailPrice || activeProduct.sellingPrice;
    const grossP      = sellP - (directMat + directLabor + appliedPkg);
    const netP        = sellP - finalHPP;

    return {
      directMat, directLabor, appliedPkg, opsAlloc, marketing,
      finalHPP, grossP, netP,
      grossMargin: sellP > 0 ? (grossP / sellP) * 100 : 0,
      netMargin:   sellP > 0 ? (netP / sellP) * 100 : 0,
      originalHPP: bd.hpp?.value ?? 0,
    };
  }, [activeProduct, simulatedRetailPrice, bd]);

  // ── Graph mutation handlers ────────────────────────────────────────────────
  const updateMaterialNode = useCallback((id: string, field: 'quantityPerUnit' | 'pricePerUnit', v: number) => {
    updateGraphNode(id, { [field]: v } as Partial<MaterialCostNode>);
  }, [updateGraphNode]);

  const updateLaborNode = useCallback((id: string, v: number) => {
    updateGraphNode(id, { costPerUnit: v } as Partial<LaborCostNode>);
  }, [updateGraphNode]);

  const updatePackagingNode = useCallback((id: string, v: number) => {
    updateGraphNode(id, { costPerUnit: v } as Partial<PackagingCostNode>);
  }, [updateGraphNode]);

  const updateOverheadNode = useCallback((id: string, field: 'monthlyTotal' | 'unitsPerMonth', v: number) => {
    updateGraphNode(id, { [field]: v } as Partial<OverheadCostNode>);
  }, [updateGraphNode]);

  /* ── Scenario table ─────────────────────────────────────────────────────── */
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
      { tier: t('hpp_scenario_20off'),   multiplier: 0.8  },
      { tier: t('hpp_scenario_std'),     multiplier: 1.0  },
      { tier: t('hpp_scenario_premium'), multiplier: 1.15 },
      { tier: t('hpp_scenario_supreme'), multiplier: 1.4  },
    ].map((sc, idx) => {
      const sp     = Math.round(activeProduct.sellingPrice * sc.multiplier);
      const net    = sp - sim.finalHPP;
      const margin = sp > 0 ? (net / sp) * 100 : 0;
      const status = margin > 50
        ? t('hpp_status_pristine')
        : margin > 10 ? t('hpp_status_marginal') : t('hpp_status_deficit');
      return { id: `sc_${idx}`, tier: sc.tier, scenarioPrice: sp,
               simulatedHpp: sim.finalHPP, netMargin: margin, status };
    });
  }, [activeProduct, sim]);

  /* ── CascadeStep card ───────────────────────────────────────────────────── */
  const CascadeStep = ({ label, title, value, note, icon }: {
    label: string; title: string; value: number; note: string; icon: React.ReactNode;
  }) => (
    <div className="flex-1 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] p-3 rounded-xl flex flex-col justify-between hover:border-white/10 transition-colors duration-200">
      <div className="flex justify-between text-xs text-[var(--color-text-muted)] uppercase">
        <span>{label}</span>{icon}
      </div>
      <div className="py-2">
        <p className="text-[var(--color-text-muted)] text-xs">{title}</p>
        <p className="text-base text-[var(--color-text-main)] mt-1 font-mono font-semibold">
          {formatMoney(value)}
        </p>
      </div>
      <span className="text-xs" style={{ color: accentHex }}>{note}</span>
    </div>
  );

  /* ── Cost node rows ─────────────────────────────────────────────────────── */
  const NodeTypeIcon = ({ type }: { type: string }) => {
    const icons: Record<string, React.ReactNode> = {
      material: <Package size={13} />,
      labor: <Compass size={13} />,
      packaging: <Factory size={13} />,
      overhead: <Receipt size={13} />,
      hpp: <Layers size={13} />,
      margin: <TrendingUp size={13} />,
    };
    return <span className="text-[var(--color-text-muted)]">{icons[type] ?? <Cpu size={13}/>}</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--color-border-line)] pb-4">
        <div>
          <span className="text-xs tracking-widest uppercase" style={{ color: accentHex }}>
            {t('hpp_page_label')}
          </span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
            {t('hpp_page_title')}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {t('hpp_page_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] p-2 rounded-lg">
            <span className="text-xs uppercase text-[var(--color-text-muted)] mr-1">
              {t('hpp_target_product')}
            </span>
            <select
              value={selectedProductId}
              onChange={e => { setSelectedProductId(e.target.value); setSimulatedRetailPrice(0); }}
              className="bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-xs uppercase text-[var(--color-text-main)] px-2.5 py-1.5 focus:outline-none rounded-xl"
            >
              {productList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setDebugOpen(v => !v)}
            title="Debug panel (Ctrl+Shift+D)"
            className={`p-2 rounded-lg border text-xs transition-colors ${
              debugOpen
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                : 'border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Bug size={14} />
          </button>
        </div>
      </div>

      {/* ── Debug panel ────────────────────────────────────────────────── */}
      {debugOpen && bd && (
        <div className="bg-black/60 border border-yellow-500/30 rounded-xl p-4 text-xs font-mono space-y-2">
          <p className="text-yellow-400 font-bold uppercase tracking-widest text-[10px] mb-2">
            Graph Debug — {activeProduct?.id} — {graphNodes.length} total nodes
          </p>
          {bd && [...bd.nodes.materials, ...bd.nodes.labor, ...bd.nodes.overhead, ...bd.nodes.packaging,
                  ...(bd.hpp ? [bd.hpp] : []), ...(bd.margin ? [bd.margin] : [])].map(n => (
            <div key={n.id} className="flex gap-3 items-center py-0.5 border-b border-white/5">
              <span className={`w-16 shrink-0 ${
                n.isComputed ? 'text-emerald-400' : 'text-sky-400'
              }`}>{n.type.toUpperCase()}</span>
              <span className="text-white/60 w-48 shrink-0 truncate">{n.id}</span>
              <span className="text-white/40 w-32 shrink-0 truncate">{n.label}</span>
              <span className="text-yellow-300 font-semibold">
                {n.isComputed ? '🟢' : '🔵'} Rp{n.value.toLocaleString('id-ID')}
              </span>
              <span className="text-white/30 text-[10px]">{n.updatedAt.slice(11, 19)}</span>
            </div>
          ))}
        </div>
      )}

      {sim && activeProduct && bd && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Cost Breakdown Table ──────────────────────────────── */}
          <div className="glass-panel p-5 rounded-lg space-y-4 lg:col-span-1">
            <div className="border-b border-[var(--color-border-line)] pb-3">
              <h3 className="text-xs font-bold tracking-widest uppercase flex items-center gap-1.5"
                  style={{ color: accentHex }}>
                <Layers size={14} /> Cost Breakdown
              </h3>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                Click any value to edit. Changes persist to graph immediately.
              </p>
            </div>

            {/* Node table */}
            <div className="space-y-1">
              {/* Header */}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-[10px] uppercase text-[var(--color-text-muted)] tracking-wider px-1 pb-1">
                <span>Component</span>
                <span className="text-right w-24">Input</span>
                <span className="text-right w-20">Total</span>
              </div>

              {/* Material nodes */}
              {bd.nodes.materials.map(n => (
                <div key={n.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NodeTypeIcon type="material" />
                    <span className="text-xs text-[var(--color-text-main)] truncate">{n.label}</span>
                    <ChevronRight size={10} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100"/>
                  </div>
                  <div className="w-24 text-right space-y-0.5">
                    <EditCell
                      value={n.quantityPerUnit} prefix="" suffix=" u"
                      onCommit={v => updateMaterialNode(n.id, 'quantityPerUnit', v)}
                    />
                    <span className="text-[10px] text-[var(--color-text-muted)] block">×</span>
                    <EditCell
                      value={n.pricePerUnit}
                      onCommit={v => updateMaterialNode(n.id, 'pricePerUnit', v)}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--color-text-main)] tabular-nums">
                      {formatMoney(n.value)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Labor nodes */}
              {bd.nodes.labor.map(n => (
                <div key={n.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NodeTypeIcon type="labor" />
                    <span className="text-xs text-[var(--color-text-main)] truncate">{n.label}</span>
                  </div>
                  <div className="w-24 text-right">
                    <EditCell
                      value={n.costPerUnit}
                      onCommit={v => updateLaborNode(n.id, v)}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--color-text-main)] tabular-nums">
                      {formatMoney(n.value)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Packaging nodes */}
              {bd.nodes.packaging.map(n => (
                <div key={n.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NodeTypeIcon type="packaging" />
                    <span className="text-xs text-[var(--color-text-main)] truncate">{n.label}</span>
                  </div>
                  <div className="w-24 text-right">
                    <EditCell
                      value={n.costPerUnit}
                      onCommit={v => updatePackagingNode(n.id, v)}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--color-text-main)] tabular-nums">
                      {formatMoney(n.value)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Overhead nodes */}
              {bd.nodes.overhead.map(n => (
                <div key={n.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NodeTypeIcon type="overhead" />
                    <span className="text-xs text-[var(--color-text-main)] truncate">{n.label}</span>
                  </div>
                  <div className="w-24 text-right space-y-0.5">
                    <EditCell
                      value={n.monthlyTotal} prefix="Rp" suffix="/mo"
                      onCommit={v => updateOverheadNode(n.id, 'monthlyTotal', v)}
                    />
                    <span className="text-[10px] text-[var(--color-text-muted)] block">÷</span>
                    <EditCell
                      value={n.unitsPerMonth} prefix="" suffix=" u/mo"
                      onCommit={v => updateOverheadNode(n.id, 'unitsPerMonth', v)}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs font-mono font-semibold text-[var(--color-text-main)] tabular-nums">
                      {formatMoney(n.value)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-[var(--color-border-line)] my-2" />

              {/* HPP — computed, read-only */}
              {bd.hpp && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg px-2 py-2"
                  style={{ background: `${accentHex}15`, border: `1px solid ${accentHex}30` }}>
                  <div className="flex items-center gap-1.5">
                    <NodeTypeIcon type="hpp" />
                    <span className="text-xs font-semibold" style={{ color: accentHex }}>HPP / Unit</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">computed</span>
                  </div>
                  <div className="w-24" />
                  <div className="w-20 text-right">
                    <span className="text-sm font-mono font-bold tabular-nums" style={{ color: accentHex }}>
                      {formatMoney(bd.hpp.value)}
                    </span>
                  </div>
                </div>
              )}

              {/* Margin — computed, read-only */}
              {bd.margin && (
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <NodeTypeIcon type="margin" />
                    <span className="text-xs text-emerald-400">Margin</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs font-mono text-emerald-400">
                      {bd.margin.marginPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
                      {formatMoney(bd.margin.value)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Retail price slider (simulation only — affects profit cards & scenario table) */}
            <div className="pt-3 border-t border-[var(--color-border-line)] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--color-text-muted)] uppercase">{t('hpp_target_price')}</span>
                <span className="font-mono font-bold" style={{ color: accentHex }}>
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
              <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                <span>Floor: {formatMoney(Math.ceil(sim.finalHPP))}</span>
                <span>Max: {formatMoney(Math.max(Math.ceil(sim.finalHPP) * 5, (activeProduct.sellingPrice || sim.finalHPP * 3) * 2.5))}</span>
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

              <div className="flex flex-col md:flex-row items-stretch justify-between gap-2 text-xs">
                <CascadeStep label={t('hpp_step1_label')} title={t('hpp_step1_title')} value={sim.directMat}   note={t('hpp_step1_note')} icon={<Layers size={14}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={14} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step2_label')} title={t('hpp_step2_title')} value={sim.directLabor} note={t('hpp_step2_note')} icon={<Compass size={14}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={14} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step3_label')} title={t('hpp_step3_title')} value={sim.appliedPkg}  note={t('hpp_step3_note')} icon={<Factory size={14}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={14} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step4_label')} title={t('hpp_step4_title')} value={sim.opsAlloc}    note={t('hpp_step4_note')} icon={<Receipt size={14}/>} />
                <div className="hidden md:flex items-center text-[var(--color-text-muted)]"><ArrowRight size={14} className="animate-pulse"/></div>
                <CascadeStep label={t('hpp_step5_label')} title={t('hpp_step5_title')} value={sim.marketing}   note={t('hpp_step5_note')} icon={<Megaphone size={14}/>} />
              </div>

              {/* Aggregate HPP total */}
              <div className="p-4 bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border-line)] flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-main)] uppercase tracking-widest">
                    {t('hpp_aggregate_title')}
                  </h5>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {t('hpp_aggregate_desc')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-mono font-bold" style={{ color: accentHex }}>
                    {formatMoney(sim.finalHPP)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profit cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold tracking-wider text-[var(--color-text-main)] uppercase flex items-center gap-1">
                    <Percent size={14} className="text-emerald-400" /> {t('hpp_gross_title')}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-xl font-mono font-semibold ${
                    sim.grossMargin > 60 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-yellow-500/15 text-yellow-500'
                  }`}>
                    {sim.grossMargin.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-mono text-[var(--color-text-main)] font-semibold">
                  {formatMoney(sim.grossP)}
                </p>
                <p className="pt-2 border-t border-[var(--color-border-line)] text-xs text-[var(--color-text-muted)] leading-relaxed">
                  {t('hpp_gross_desc').replace('{margin}', sim.grossMargin.toFixed(1))}
                </p>
              </div>

              <div className={`glass-panel p-5 rounded-lg space-y-3 border-l-2 ${
                sim.netP > 0 ? 'border-emerald-500' : 'border-red-500'
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-semibold tracking-wider text-[var(--color-text-main)] uppercase flex items-center gap-1">
                    <TrendingUp size={14} className="text-emerald-400" /> {t('hpp_net_title')}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-xl font-mono font-semibold ${
                    sim.netP > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-500'
                  }`}>
                    {sim.netMargin.toFixed(1)}% NET
                  </span>
                </div>
                <p className="text-2xl font-mono text-[var(--color-text-main)] font-semibold">
                  {formatMoney(sim.netP)}
                </p>
                <p className="pt-2 border-t border-[var(--color-border-line)] text-xs leading-relaxed">
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
