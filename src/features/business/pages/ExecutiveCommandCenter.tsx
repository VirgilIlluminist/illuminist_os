/**
 * ExecutiveCommandCenter.tsx — CEO Dashboard V5
 * Satu layar: semua bisnis, KPI konsolidasi, perbandingan revenue,
 * health score per bisnis, AI executive summary, quick actions.
 * Data dari ERP context nyata — bukan angka hardcoded.
 */
import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, AlertTriangle, ChevronRight, Sparkles, Loader, RefreshCw, Building2 } from 'lucide-react';
import { useBusiness }                    from '../../../app/store/BusinessContext';
import { useERP }                         from '../../../app/store/ERPContext';
import { getBusinessConfig, calcHealthScore, getColorForType } from '../../../core/constants/businessConstants';
import { aiService }                      from '../../../infra/api';
import { getRepo, BaseRecord }            from '../../../core/repositories';
import { toast }                          from '../../../shared/ui/Toast';

interface Props {
  onNavigate:       (page: string)  => void;
  onSwitchBusiness: (id: string)    => void;
}

interface BizKPI {
  id: string; name: string; type: string; icon: string; color: string;
  revenue: number; profit: number; expenses: number;
  healthScore: ReturnType<typeof calcHealthScore>;
}

export default function ExecutiveCommandCenter({ onNavigate, onSwitchBusiness }: Props) {
  const { businesses, activeBusiness, switchBusiness } = useBusiness();
  const { computedSales, computedCashflow, config, formatMoney } = useERP();
  const accent = config?.customAccentColor || '#0071e3';

  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Data bulan ini dari ERP aktif
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  })();

  const getRevOf = (s: any) => s.netRevenue || s.grossRevenue || (s.pricePerPcs||0)*(s.qtySold||0) || 0;

  const thisRevenue = useMemo(() =>
    (computedSales||[]).filter((s:any)=>(s.date||'').startsWith(thisMonth)).reduce((sum:number,s:any)=>sum+getRevOf(s),0),
    [computedSales, thisMonth]);

  const lastRevenue = useMemo(() =>
    (computedSales||[]).filter((s:any)=>(s.date||'').startsWith(lastMonth)).reduce((sum:number,s:any)=>sum+getRevOf(s),0),
    [computedSales, lastMonth]);

  const thisExpenses = useMemo(() =>
    (computedCashflow||[]).filter((c:any)=>(c.date||'').startsWith(thisMonth)&&String(c.type).toLowerCase().includes('out')).reduce((sum:number,c:any)=>sum+(c.amount||0),0),
    [computedCashflow, thisMonth]);

  const cashPosition = useMemo(() =>
    (computedCashflow||[]).reduce((s:number,c:any)=>
      String(c.type).toLowerCase().includes('in') ? s+(c.amount||0) : s-(c.amount||0), 0),
    [computedCashflow]);

  const thisProfit = thisRevenue - thisExpenses;
  const growthPct  = lastRevenue > 0 ? Math.round((thisRevenue-lastRevenue)/lastRevenue*100) : 0;

  // Build per-bisnis KPIs
  const childBizzes = businesses.filter((b:any) => b.parent_id);

  // Load summary per bisnis dari repository transactions
  const [bizDataMap, setBizDataMap] = React.useState<Record<string, { rev:number; exp:number }>>({});

  React.useEffect(() => {
    const loadBizData = async () => {
      const map: Record<string, { rev:number; exp:number }> = {};
      for (const biz of childBizzes) {
        if (biz.id === activeBusiness?.id) {
          map[biz.id] = { rev: thisRevenue, exp: thisExpenses };
          continue;
        }
        try {
          const txRepo = getRepo<any>('transactions');
          const { data: txs } = await txRepo.findAll(biz.id, { limit: 200 });
          const rev = txs.filter((t:any) => t.type === 'sale' || t.type === 'rent_in')
            .reduce((s:number, t:any) => s + (Number(t.amount)||0), 0);
          const exp = txs.filter((t:any) => ['expense','payroll','purchase'].includes(t.type))
            .reduce((s:number, t:any) => s + (Number(t.amount)||0), 0);
          map[biz.id] = { rev, exp };
        } catch {
          map[biz.id] = { rev: 0, exp: 0 };
        }
      }
      setBizDataMap(map);
    };
    if (childBizzes.length > 0) loadBizData();
  }, [childBizzes.map((b:any)=>b.id).join(','), thisRevenue, thisExpenses]);

  const bizKPIs: BizKPI[] = useMemo(() => childBizzes.map((biz:any) => {
    const cfg = getBusinessConfig(biz.business_type);
    const data = bizDataMap[biz.id] || { rev: 0, exp: 0 };
    const rev  = biz.id === activeBusiness?.id ? thisRevenue  : data.rev;
    const exp  = biz.id === activeBusiness?.id ? thisExpenses : data.exp;
    const pft  = rev - exp;
    const hs   = calcHealthScore({
      hasRevenue:       rev > 0,
      isProfitable:     pft > 0,
      positiveCashflow: biz.id === activeBusiness?.id ? cashPosition > 0 : pft > 0,
      hasPaidEmployees: true,
      lowDebt:          true,
      growthPositive:   biz.id === activeBusiness?.id ? growthPct >= 0 : pft >= 0,
    });
    return { id:biz.id, name:biz.name, type:biz.business_type, icon:cfg.icon, color:cfg.colorHex, revenue:rev, profit:pft, expenses:exp, healthScore:hs };
  }), [childBizzes, bizDataMap, thisRevenue, thisExpenses, cashPosition, growthPct, activeBusiness]);

  const totalRevenue  = bizKPIs.reduce((s,b)=>s+b.revenue, 0) || thisRevenue;
  const totalProfit   = bizKPIs.reduce((s,b)=>s+b.profit,  0) || thisProfit;
  const avgHealth     = bizKPIs.length
    ? Math.round(bizKPIs.reduce((s,b)=>s+b.healthScore.score,0) / bizKPIs.length)
    : calcHealthScore({ hasRevenue:thisRevenue>0, isProfitable:thisProfit>0, positiveCashflow:cashPosition>0, hasPaidEmployees:true, lowDebt:true, growthPositive:growthPct>=0 }).score;

  // AI Executive Summary
  const fetchAISummary = async () => {
    setAiLoading(true);
    try {
      const prompt = `Kamu Chief of Staff. Berikan executive summary 4–5 bullet singkat dari data berikut. Bahasa Indonesia, langsung ke poin.

BULAN INI:
- Total Revenue: ${formatMoney(totalRevenue)}
- Total Profit: ${formatMoney(totalProfit)} (margin ${totalRevenue>0?Math.round(totalProfit/totalRevenue*100):0}%)
- Cash Position: ${formatMoney(cashPosition)}
- Growth vs bulan lalu: ${growthPct >= 0 ? '+':'' }${growthPct}%
- Rata-rata Health Score: ${avgHealth}/100

PER BISNIS:
${bizKPIs.map(b=>`- ${b.name} (${b.type}): Revenue ${formatMoney(b.revenue)}, Profit ${formatMoney(b.profit)}, Health ${b.healthScore.score}/100 (${b.healthScore.grade})`).join('\n')}

Insight: apa yang baik, apa yang perlu diperhatikan, 1–2 rekomendasi.`;
      const res = await aiService.chat({ message:prompt, sessionId:`exec-${Date.now()}` });
      setAiSummary(res.text || 'Tidak ada AI summary tersedia.');
    } catch { toast.error('AI tidak tersedia. Set API key di Settings.'); }
    finally  { setAiLoading(false); }
  };

  const card = 'bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl';

  const KPICards = [
    { label:'Total Revenue',  value:formatMoney(totalRevenue),  icon:<DollarSign size={16}/>,  color:'#0071e3', sub:`${growthPct>=0?'+':''}${growthPct}% vs bulan lalu` },
    { label:'Total Profit',   value:formatMoney(totalProfit),   icon:<TrendingUp size={16}/>,  color:totalProfit>=0?'#34c759':'#ff3b30', sub:`Margin ${totalRevenue>0?Math.round(totalProfit/totalRevenue*100):0}%` },
    { label:'Cash Position',  value:formatMoney(cashPosition),  icon:<BarChart3 size={16}/>,   color:'#ff9500', sub:'Saldo kas bersih' },
    { label:'Avg Health',     value:`${avgHealth}/100`,         icon:<Users size={16}/>,       color:avgHealth>=80?'#34c759':avgHealth>=60?'#0071e3':avgHealth>=40?'#ff9500':'#ff3b30', sub:`${childBizzes.length} bisnis aktif` },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">Executive Command Center</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {businesses.find((b:any)=>!b.parent_id)?.name || 'ILLUMINIST'} · {childBizzes.length} bisnis · {now.toLocaleDateString('id-ID',{month:'long',year:'numeric'})}
          </p>
        </div>
        <button onClick={fetchAISummary} disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-white cursor-pointer disabled:opacity-60" style={{ background:accent }}>
          {aiLoading ? <Loader size={14} className="animate-spin"/> : <Sparkles size={14}/>}
          AI Executive Summary
        </button>
      </div>

      {/* AI Summary */}
      {(aiSummary || aiLoading) && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} className={`${card} p-5`}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color:accent }}/>
            <p className="text-xs font-semibold text-[var(--color-text-main)]">AI Executive Summary</p>
            {aiSummary && <button onClick={fetchAISummary} className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer"><RefreshCw size={12}/></button>}
          </div>
          {aiLoading
            ? <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]"><div className="w-4 h-4 rounded-full border-2 border-[var(--color-border-line)] border-t-[var(--color-accent-highlight)] animate-spin"/> Menganalisa semua bisnis...</div>
            : <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
          }
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPICards.map((kpi,i) => (
          <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:`${kpi.color}15`, color:kpi.color }}>{kpi.icon}</div>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-main)] tracking-tight tabular-nums">{kpi.value}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Business Comparison */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold text-[var(--color-text-main)]">Perbandingan Bisnis</p>
          <span className="text-[10px] text-[var(--color-text-muted)]">Bulan ini · klik untuk switch</span>
        </div>
        {bizKPIs.length === 0 ? (
          <div className="text-center py-8">
            <Building2 size={32} className="text-[var(--color-text-muted)] opacity-30 mx-auto mb-3"/>
            <p className="text-sm text-[var(--color-text-muted)]">Belum ada anak bisnis.</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Buat bisnis baru untuk melihat perbandingan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bizKPIs.map((biz,i) => {
              const share = totalRevenue > 0 ? (biz.revenue/totalRevenue)*100 : 0;
              return (
                <motion.div key={biz.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                  className="p-4 rounded-xl border border-[var(--color-border-line)] hover:border-[var(--color-text-muted)] transition-all cursor-pointer group"
                  onClick={() => { switchBusiness(biz.id); onNavigate('Dashboard'); }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background:`${biz.color}15` }}>{biz.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-text-main)] truncate">{biz.name}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                          style={{ background:biz.healthScore.color }}>{biz.healthScore.grade} · {biz.healthScore.score}</span>
                        {biz.id === activeBusiness?.id && <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--color-border-line)] text-[var(--color-text-muted)] shrink-0">Aktif</span>}
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{biz.type.replace('_',' ')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[var(--color-text-main)] tabular-nums">{formatMoney(biz.revenue)}</p>
                      <p className="text-[10px] tabular-nums" style={{ color:biz.profit>=0?'#34c759':'#ff3b30' }}>
                        {biz.profit>=0?'+':''}{formatMoney(biz.profit)}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"/>
                  </div>
                  <div className="h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${share}%` }} transition={{ delay:i*0.06+0.3, duration:0.7 }}
                      className="h-full rounded-full" style={{ background:biz.color }}/>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-[var(--color-text-muted)]">{share.toFixed(1)}% revenue</span>
                    <span className="text-[9px] text-[var(--color-text-muted)]">{biz.healthScore.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Portfolio Health + Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${card} p-5`}>
          <p className="text-sm font-semibold text-[var(--color-text-main)] mb-4">Portfolio Health Score</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="var(--color-border-line)" strokeWidth="6"/>
                <motion.circle cx="32" cy="32" r="26" fill="none"
                  stroke={avgHealth>=80?'#34c759':avgHealth>=60?'#0071e3':avgHealth>=40?'#ff9500':'#ff3b30'}
                  strokeWidth="6" strokeLinecap="round"
                  initial={{ strokeDasharray:'0 163.36' }}
                  animate={{ strokeDasharray:`${(avgHealth/100)*163.36} 163.36` }}
                  transition={{ duration:0.8 }}/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--color-text-main)]">{avgHealth}</span>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold text-[var(--color-text-main)]">
                {avgHealth>=80?'Sangat Sehat':avgHealth>=60?'Sehat':avgHealth>=40?'Perlu Perhatian':'Kritis'}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">Rata-rata {bizKPIs.length || 1} bisnis</p>
            </div>
          </div>
          {bizKPIs.map(b => (
            <div key={b.id} className="flex items-center gap-2 mb-2">
              <span className="text-sm shrink-0">{b.icon}</span>
              <span className="text-xs text-[var(--color-text-main)] flex-1 truncate">{b.name}</span>
              <div className="w-24 h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width:`${b.healthScore.score}%`, background:b.healthScore.color }}/>
              </div>
              <span className="text-[10px] font-bold w-6 text-right" style={{ color:b.healthScore.color }}>{b.healthScore.grade}</span>
            </div>
          ))}
        </div>

        <div className={`${card} p-5`}>
          <p className="text-sm font-semibold text-[var(--color-text-main)] mb-4">Aksi Cepat</p>
          <div className="space-y-1">
            {[
              { label:'Laporan Konsolidasi',  icon:'📊', page:'Reports & Analytics' },
              { label:'Cashflow Semua Bisnis',icon:'💸', page:'Cashflow' },
              { label:'HR & Payroll',         icon:'👥', page:'HR System' },
              { label:'AI Chief of Staff',    icon:'🤖', page:'Analisa Bisnis AI' },
              { label:'Aset & Equipment',     icon:'🏗',  page:'Assets & Equipment' },
              { label:'Chart of Accounts',   icon:'📋', page:'Chart of Accounts' },
            ].map(a => (
              <button key={a.page} onClick={()=>onNavigate(a.page)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-background)] transition-all cursor-pointer text-left group">
                <span className="text-base">{a.icon}</span>
                <span className="text-sm text-[var(--color-text-main)] flex-1">{a.label}</span>
                <ChevronRight size={13} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"/>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)] text-center">
        Data per bisnis diambil dari Transaction Engine · Sync real-time saat ada transaksi baru
      </p>
    </div>
  );
}
