import React, { useState, useEffect } from 'react';
import { useAI } from '../../../core/hooks/useAI';
import type { BlackboxOverview } from '../../../types/product-blackbox.types';
import type { SalesRecord } from '../../../types';
import { getSalesByChannel, calculateMargin, predictRestock } from '../../../services/productBlackbox.service';
import { RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  overview:  BlackboxOverview;
  sales:     SalesRecord[];
  companyId: string;
  currency:  string;
  accent:    string;
}

interface InsightCard {
  title:   string;
  content: string;
  type:    'info' | 'warning' | 'success' | 'tip';
}

function parseInsights(text: string): InsightCard[] {
  const sections = text.split(/\n(?=#{1,3} |\*\*[A-Z])/);
  if (sections.length < 2) {
    return [{ title: 'AI Analysis', content: text, type: 'info' }];
  }
  return sections.map(s => {
    const lines   = s.trim().split('\n').filter(Boolean);
    const heading = lines[0].replace(/^[#*\s]+/, '').trim();
    const body    = lines.slice(1).join('\n').replace(/^[#*\s]+/gm, '').trim();
    const lower   = heading.toLowerCase();
    const type: InsightCard['type'] =
      lower.includes('warning') || lower.includes('risk') || lower.includes('stok') ? 'warning' :
      lower.includes('success') || lower.includes('top') || lower.includes('best')  ? 'success' :
      lower.includes('rekomendasi') || lower.includes('tip')                        ? 'tip'     : 'info';
    return { title: heading || 'Insight', content: body || s, type };
  }).filter(c => c.content);
}

const TYPE_STYLE: Record<InsightCard['type'], string> = {
  info:    'border-[var(--color-border-line)] bg-white/[0.02]',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  success: 'border-green-500/30 bg-green-500/5',
  tip:     'border-blue-500/30 bg-blue-500/5',
};
const TYPE_DOT: Record<InsightCard['type'], string> = {
  info: 'bg-white/30', warning: 'bg-yellow-400', success: 'bg-green-400', tip: 'bg-blue-400',
};

export default function AIInsightsTab({ overview, sales, companyId, currency, accent }: Props) {
  const { product, currentBatch, totalUnitsSold, totalRevenue, totalStock, currentMargin } = overview;

  const { sendMessage, messages, loading, clearHistory } = useAI({
    companyId,
    context: 'insight',
    sessionId: `product-insights-${product.id}`,
  });

  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [generated, setGenerated] = useState(false);

  const channels = getSalesByChannel(sales, product.id);
  const restock  = predictRestock(totalStock, sales, product.id);

  const buildPrompt = () => {
    const channelSummary = channels.map(c =>
      `${c.channel}: ${c.unitsSold} unit, gross Rp${Math.round(c.grossRevenue / 1000)}k, net Rp${Math.round(c.netRevenue / 1000)}k`
    ).join('; ');

    return `Kamu adalah AI business analyst untuk ${product.name} (SKU: ${product.id}).

DATA PRODUK:
- HPP saat ini: Rp${currentBatch?.hpp?.toLocaleString('id') ?? 'N/A'}
- Harga jual: Rp${product.sellingPrice.toLocaleString('id')}
- Margin: ${currentMargin.toFixed(1)}%
- Total terjual: ${totalUnitsSold} pcs
- Total revenue: Rp${Math.round(totalRevenue / 1_000_000)}jt
- Stok saat ini: ${totalStock} pcs
- Prediksi stok habis: ${restock.daysUntilStockout !== null ? `${restock.daysUntilStockout} hari` : 'tidak diketahui'}
- Avg penjualan harian: ${restock.avgDailySales.toFixed(1)} pcs/hari
- Channel: ${channelSummary || 'belum ada penjualan'}

Berikan 4 insight terstruktur dengan judul masing-masing:
## Pricing Analysis
## Channel Analysis
## Stock Recommendation
## Performance Summary

Gunakan data real di atas. Singkat, actionable, dalam bahasa Indonesia.`;
  };

  const generate = async () => {
    clearHistory();
    setInsights([]);
    setGenerated(false);
    await sendMessage(buildPrompt());
    setGenerated(true);
  };

  useEffect(() => {
    const last = messages.filter(m => m.role === 'assistant').pop();
    if (last) setInsights(parseInsights(last.content));
  }, [messages]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: accent }}/>
          <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
            AI Product Intelligence
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-mono font-bold text-black disabled:opacity-50 cursor-pointer"
          style={{ background: accent }}
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''}/>
          {loading ? 'Menganalisis...' : generated ? 'Refresh Insights' : 'Generate Insights'}
        </button>
      </div>

      {!generated && !loading && (
        <div className="text-center py-12">
          <Sparkles size={24} className="mx-auto text-[var(--color-text-muted)] mb-3"/>
          <p className="text-xs font-mono text-[var(--color-text-muted)]">
            Klik "Generate Insights" untuk analisis AI produk ini.
          </p>
          <p className="text-[9px] font-mono text-[var(--color-text-muted)]/60 mt-1">
            AI akan menganalisis pricing, channel, stok, dan performance.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-1/3 mb-2"/>
              <div className="h-2 bg-white/5 rounded w-full mb-1"/>
              <div className="h-2 bg-white/5 rounded w-4/5"/>
            </div>
          ))}
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="grid gap-3">
          {insights.map((card, i) => (
            <div key={i} className={`rounded-xl border p-4 ${TYPE_STYLE[card.type]}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${TYPE_DOT[card.type]}`}/>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-text-main)]">{card.title}</p>
              </div>
              <p className="text-xs font-mono text-[var(--color-text-muted)] whitespace-pre-wrap leading-relaxed">{card.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
