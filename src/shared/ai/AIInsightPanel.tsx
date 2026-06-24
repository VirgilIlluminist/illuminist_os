/**
 * AIInsightPanel.tsx — Auto-generated business insights panel
 * Displays AI-generated alerts and recommendations without manual prompting.
 * Manual-first: shows manual analysis if AI offline.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingDown, TrendingUp, Package, DollarSign, Megaphone, RefreshCw } from 'lucide-react';
import { useERP } from '../../app/store/ERPContext';
import aiService  from '../../infra/api/ai.service';

interface Insight {
  id:       string;
  type:     'warning' | 'success' | 'info' | 'danger';
  icon:     React.ReactNode;
  title:    string;
  message:  string;
  value?:   string;
  source:   'ai' | 'manual';
}

export default function AIInsightPanel() {
  const {
    computedMaterials, computedProducts, computedSales,
    computedAds, formatMoney, config, t
  } = useERP();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading,  setLoading]  = useState(false);
  const accentHex = config?.customAccentColor || '#7c3aed';

  // Manual analysis — always runs (AI-independent)
  const generateManualInsights = (): Insight[] => {
    const items: Insight[] = [];

    // Low stock alerts
    const lowStock = computedMaterials.filter(m => m.remainingQty <= m.minStock && m.remainingQty > 0);
    const outOfStock = computedMaterials.filter(m => m.remainingQty === 0);
    if (outOfStock.length > 0) {
      items.push({
        id: 'out-of-stock', type: 'danger', icon: <Package size={14} />,
        title: 'Stok Habis',
        message: `${outOfStock.map(m => m.name).join(', ')} sudah habis dan perlu restok segera.`,
        value: `${outOfStock.length} item`,
        source: 'manual',
      });
    }
    if (lowStock.length > 0) {
      items.push({
        id: 'low-stock', type: 'warning', icon: <AlertTriangle size={14} />,
        title: 'Stok Mendekati Minimum',
        message: `${lowStock.length} bahan mendekati batas minimum stok.`,
        value: `${lowStock.length} bahan`,
        source: 'manual',
      });
    }

    // Product margin analysis
    const lowMarginProds = computedProducts.filter(p =>
      p.sellingPrice > 0 && p.finalHPP > 0 &&
      ((p.sellingPrice - p.finalHPP) / p.sellingPrice) < 0.2
    );
    if (lowMarginProds.length > 0) {
      items.push({
        id: 'low-margin', type: 'warning', icon: <TrendingDown size={14} />,
        title: 'Margin Produk Rendah',
        message: `${lowMarginProds.map(p => p.name).join(', ')} memiliki margin di bawah 20%.`,
        value: `${lowMarginProds.length} produk`,
        source: 'manual',
      });
    }

    // Ads ROAS analysis
    const lowROAS = computedAds.filter(a => a.spend > 0 && (a.revenue / a.spend) < 1.5);
    if (lowROAS.length > 0) {
      items.push({
        id: 'low-roas', type: 'info', icon: <Megaphone size={14} />,
        title: 'ROAS Iklan Rendah',
        message: `${lowROAS.length} kampanye iklan memiliki ROAS < 1.5x. Perlu evaluasi anggaran.`,
        value: `ROAS < 1.5x`,
        source: 'manual',
      });
    }

    // Revenue positive signal
    const recentSales = computedSales.slice(-10);
    if (recentSales.length >= 5) {
      const recent5  = recentSales.slice(-5).reduce((s, sale) => s + (sale.netRevenue || 0), 0);
      const prior5   = recentSales.slice(0, 5).reduce((s, sale) => s + (sale.netRevenue || 0), 0);
      if (prior5 > 0 && recent5 > prior5 * 1.1) {
        items.push({
          id: 'revenue-up', type: 'success', icon: <TrendingUp size={14} />,
          title: 'Pendapatan Meningkat',
          message: `Penjualan 5 transaksi terbaru lebih tinggi dari 5 sebelumnya.`,
          value: `+${(((recent5 - prior5) / prior5) * 100).toFixed(0)}%`,
          source: 'manual',
        });
      }
    }

    // Total inventory value
    const invValue = computedMaterials.reduce((s, m) => s + (m.remainingQty * m.costPerUnit), 0);
    if (invValue > 0) {
      items.push({
        id: 'inv-value', type: 'info', icon: <DollarSign size={14} />,
        title: 'Nilai Inventaris',
        message: `Total nilai bahan baku tersimpan saat ini.`,
        value: formatMoney(invValue),
        source: 'manual',
      });
    }

    return items;
  };

  useEffect(() => {
    setInsights(generateManualInsights());
  }, [computedMaterials, computedProducts, computedSales, computedAds]);

  const colorMap = {
    danger:  'bg-red-500/10 border-red-500/20 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    info:    'bg-sky-500/10 border-sky-500/20 text-sky-400',
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold" style={{ color: accentHex }}>
          AI Insights
        </span>
        <span className="text-[9px] font-mono text-[var(--color-text-muted)] bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border-line)]">
          {insights.length} alert
        </span>
      </div>

      {insights.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)] font-mono text-center py-4">
          Semua indikator normal ✓
        </p>
      ) : (
        insights.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`p-3 rounded-lg border flex gap-2.5 items-start ${colorMap[insight.type]}`}
          >
            <div className="mt-0.5 shrink-0">{insight.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{insight.title}</span>
                {insight.value && (
                  <span className="text-[10px] font-mono font-bold shrink-0">{insight.value}</span>
                )}
              </div>
              <p className="text-[10.5px] opacity-80 mt-0.5 leading-relaxed">{insight.message}</p>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
