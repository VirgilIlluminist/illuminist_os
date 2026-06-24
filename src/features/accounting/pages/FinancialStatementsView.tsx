/**
 * FinancialStatementsView.tsx — Laporan Keuangan V5.2
 * Trial Balance, P&L, Balance Sheet dari journal_lines nyata.
 * Semua angka berasal dari TransactionEngine journal entries.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Download, RefreshCw, TrendingUp, TrendingDown, Scale, BookOpen } from 'lucide-react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP }      from '../../../app/store/ERPContext';
import { getRepo, BaseRecord } from '../../../core/repositories';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalLine extends BaseRecord {
  journal_id:   string;
  account_code: string;
  debit:        number;
  credit:       number;
  description?: string;
}

interface Transaction extends BaseRecord {
  type:        string;
  amount:      number;
  date:        string;
  description: string;
  status:      string;
}

interface AccountBalance {
  code:    string;
  name:    string;
  type:    'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit:   number;
  credit:  number;
  balance: number;
}

// ─── COA Labels ──────────────────────────────────────────────────────────────

const COA_LABELS: Record<string, { name: string; type: AccountBalance['type'] }> = {
  '1100': { name: 'Kas & Bank',              type: 'asset' },
  '1200': { name: 'Piutang Usaha',           type: 'asset' },
  '1300': { name: 'Persediaan',              type: 'asset' },
  '1500': { name: 'Aset Tetap',              type: 'asset' },
  '2100': { name: 'Hutang Usaha',            type: 'liability' },
  '2200': { name: 'Hutang Bank',             type: 'liability' },
  '3100': { name: 'Modal Disetor',           type: 'equity' },
  '3200': { name: 'Laba Ditahan',            type: 'equity' },
  '4100': { name: 'Pendapatan Penjualan',    type: 'revenue' },
  '4200': { name: 'Pendapatan Lainnya',      type: 'revenue' },
  '5100': { name: 'HPP',                     type: 'expense' },
  '5200': { name: 'Biaya Gaji',              type: 'expense' },
  '5300': { name: 'Biaya Pemasaran',         type: 'expense' },
  '5400': { name: 'Biaya Operasional',       type: 'expense' },
  '5500': { name: 'Biaya Penyusutan',        type: 'expense' },
  '5600': { name: 'Biaya Lainnya',           type: 'expense' },
  '9999': { name: 'Tidak Terklasifikasi',    type: 'expense' },
};

const TABS = [
  { id: 'trial',   label: 'Trial Balance',   icon: <Scale size={14}/> },
  { id: 'pl',      label: 'Laba Rugi',       icon: <TrendingUp size={14}/> },
  { id: 'cashflow',label: 'Arus Kas',        icon: <BookOpen size={14}/> },
];

export default function FinancialStatementsView() {
  const { activeBusiness, currentColor } = useBusiness();
  const { computedSales, computedCashflow, formatMoney, config } = useERP();
  const accent   = currentColor || config?.customAccentColor || '#7c3aed';
  const bizId    = activeBusiness?.id || 'default';

  const [tab,       setTab]       = useState<'trial' | 'pl' | 'cashflow'>('trial');
  const [balances,  setBalances]  = useState<AccountBalance[]>([]);
  const [txCount,   setTxCount]   = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [period,    setPeriod]    = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  });

  // ─── Load dari Repository ──────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const jlRepo = getRepo<JournalLine>('journal_lines');
      const txRepo = getRepo<Transaction>('transactions');

      const { data: lines, total } = await jlRepo.findAll(bizId, { limit: 5000 });
      const { total: txTotal }     = await txRepo.findAll(bizId, { limit: 1 });
      setTxCount(txTotal);

      // Build trial balance dari journal lines
      const acc: Record<string, { debit: number; credit: number }> = {};
      lines.forEach(l => {
        const code = l.account_code || '9999';
        if (!acc[code]) acc[code] = { debit: 0, credit: 0 };
        acc[code].debit  += Number(l.debit)  || 0;
        acc[code].credit += Number(l.credit) || 0;
      });

      const result: AccountBalance[] = Object.entries(acc).map(([code, { debit, credit }]) => {
        const meta    = COA_LABELS[code] || { name: `Akun ${code}`, type: 'expense' as const };
        const balance = debit - credit;
        return { code, name: meta.name, type: meta.type, debit, credit, balance };
      }).sort((a, b) => a.code.localeCompare(b.code));

      setBalances(result);
    } catch (err) {
      console.error('Financial statements load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [bizId]);

  // ─── Computed P&L ────────────────────────────────────────────────────────

  const now   = new Date();
  const month = period;

  const getRevOf = (s: any) => s.netRevenue || s.grossRevenue || (s.pricePerPcs||0)*(s.qtySold||0) || 0;

  const erpRevenue  = useMemo(() =>
    (computedSales||[]).filter((s:any)=>(s.date||'').startsWith(month)).reduce((sum:number,s:any)=>sum+getRevOf(s),0),
    [computedSales, month]);

  const erpExpenses = useMemo(() =>
    (computedCashflow||[]).filter((c:any)=>(c.date||'').startsWith(month) && String(c.type).toLowerCase().includes('out')).reduce((sum:number,c:any)=>sum+(c.amount||0),0),
    [computedCashflow, month]);

  // Dari journal lines (lebih akurat — dari TxEngine)
  const journalRevenue  = balances.filter(a=>a.type==='revenue').reduce((s,a)=>s+Math.abs(a.credit-a.debit),0);
  const journalExpenses = balances.filter(a=>a.type==='expense').reduce((s,a)=>s+Math.abs(a.debit-a.credit),0);
  const journalAssets   = balances.filter(a=>a.type==='asset').reduce((s,a)=>s+Math.abs(a.debit-a.credit),0);
  const journalLiab     = balances.filter(a=>a.type==='liability').reduce((s,a)=>s+Math.abs(a.credit-a.debit),0);
  const journalEquity   = balances.filter(a=>a.type==='equity').reduce((s,a)=>s+Math.abs(a.credit-a.debit),0);

  // Pilih sumber terbaik: journal (dari TxEngine) jika ada, fallback ke ERP
  const hasJournalData  = txCount > 0;
  const revenue  = hasJournalData ? journalRevenue  : erpRevenue;
  const expenses = hasJournalData ? journalExpenses : erpExpenses;
  const profit   = revenue - expenses;
  const margin   = revenue > 0 ? Math.round(profit / revenue * 100) : 0;

  // Cashflow dari ERP (lebih detail daripada journal)
  const cfInflow  = (computedCashflow||[]).filter((c:any)=> String(c.type).toLowerCase().includes('in')).reduce((s:number,c:any)=>s+(c.amount||0),0);
  const cfOutflow = (computedCashflow||[]).filter((c:any)=>String(c.type).toLowerCase().includes('out')).reduce((s:number,c:any)=>s+(c.amount||0),0);
  const cfNet     = cfInflow - cfOutflow;

  // Trial balance totals
  const tbDebit  = balances.reduce((s,a)=>s+a.debit,  0);
  const tbCredit = balances.reduce((s,a)=>s+a.credit, 0);
  const tbBalanced = Math.abs(tbDebit - tbCredit) < 1;

  const card = 'bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl';

  const exportCSV = () => {
    const rows = balances.map(a => `"${a.code}","${a.name}","${a.type}",${a.debit},${a.credit},${a.balance}`);
    const csv  = '\ufeff' + ['Kode,Nama,Tipe,Debit,Kredit,Saldo', ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `trial_balance_${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {hasJournalData ? `${txCount} transaksi dari Transaction Engine` : 'Data dari ERP — belum ada transaksi di journal'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={period} onChange={e=>setPeriod(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] cursor-pointer"/>
          <button onClick={load} className="p-2.5 rounded-xl border border-[var(--color-border-line)] cursor-pointer hover:bg-[var(--color-background)]">
            <RefreshCw size={14} className="text-[var(--color-text-muted)]"/>
          </button>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
            <Download size={13}/> Export
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Revenue',      value:formatMoney(revenue),   icon:<TrendingUp size={15}/>,   color:'#34c759' },
          { label:'Expenses',     value:formatMoney(expenses),  icon:<TrendingDown size={15}/>, color:'#ff3b30' },
          { label:'Net Profit',   value:formatMoney(profit),    icon:<Scale size={15}/>,        color:profit>=0?'#0071e3':'#ff3b30' },
          { label:'Margin',       value:`${margin}%`,           icon:<BookOpen size={15}/>,     color:margin>=20?'#34c759':margin>=0?'#ff9500':'#ff3b30' },
        ].map((kpi,i) => (
          <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className={`${card} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`${kpi.color}15`,color:kpi.color}}>{kpi.icon}</div>
            </div>
            <p className="text-xl font-bold tabular-nums" style={{color:kpi.color}}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border-line)]">
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all cursor-pointer border-b-2 -mb-px ${
              tab===t.id ? 'border-current' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
            style={tab===t.id?{color:accent,borderColor:accent}:{}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border-line)] border-t-[var(--color-accent-highlight)] animate-spin"/>
        </div>
      ) : (
        <>
          {/* ── TRIAL BALANCE ────────────────────────────────────────────────── */}
          {tab === 'trial' && (
            <div className={card}>
              <div className="px-5 py-3 border-b border-[var(--color-border-line)] flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--color-text-main)]">Trial Balance</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tbBalanced ? 'text-[#34c759]' : 'text-[#ff3b30]'}`}
                  style={{background: tbBalanced ? '#34c75918' : '#ff3b3018'}}>
                  {tbBalanced ? '✓ Balanced' : '✗ Tidak Balance'}
                </span>
              </div>
              {balances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Scale size={32} className="text-[var(--color-text-muted)] opacity-30"/>
                  <p className="text-sm font-medium text-[var(--color-text-main)]">Belum ada journal entries</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Catat penjualan atau pengeluaran untuk membuat journal otomatis</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-[var(--color-border-line)]">
                      {['Kode','Nama Akun','Tipe','Debit','Kredit','Saldo'].map((h,i) => (
                        <th key={h} className={`px-4 py-3 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide ${i>2?'text-right':'text-left'}`}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {['asset','liability','equity','revenue','expense'].map(type => {
                        const rows = balances.filter(a=>a.type===type);
                        if (!rows.length) return null;
                        const typeLabel = {asset:'Aset',liability:'Kewajiban',equity:'Modal',revenue:'Pendapatan',expense:'Beban'}[type];
                        const typeColor = {asset:'#0071e3',liability:'#ff3b30',equity:'#af52de',revenue:'#34c759',expense:'#ff9500'}[type];
                        return (
                          <React.Fragment key={type}>
                            <tr className="bg-[var(--color-background)]">
                              <td colSpan={6} className="px-4 py-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{color:typeColor}}>{typeLabel}</span>
                              </td>
                            </tr>
                            {rows.map(acc => (
                              <tr key={acc.code} className="border-b border-[var(--color-border-line)] last:border-0 hover:bg-[var(--color-background)]">
                                <td className="px-4 py-2.5 font-mono text-xs text-[var(--color-text-muted)]">{acc.code}</td>
                                <td className="px-4 py-2.5 text-[var(--color-text-main)]">{acc.name}</td>
                                <td className="px-4 py-2.5">
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:`${typeColor}15`,color:typeColor}}>{typeLabel}</span>
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-main)]">{acc.debit > 0 ? formatMoney(acc.debit) : '—'}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-main)]">{acc.credit > 0 ? formatMoney(acc.credit) : '—'}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-semibold" style={{color: acc.balance >= 0 ? 'var(--color-text-main)' : '#ff3b30'}}>
                                  {formatMoney(Math.abs(acc.balance))}{acc.balance < 0 ? ' (K)' : ''}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-[var(--color-background)]">
                              <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-[var(--color-text-muted)] text-right">Subtotal {typeLabel}</td>
                              <td className="px-4 py-2 text-right tabular-nums text-xs font-bold text-[var(--color-text-main)]">{formatMoney(rows.reduce((s,a)=>s+a.debit,0))}</td>
                              <td className="px-4 py-2 text-right tabular-nums text-xs font-bold text-[var(--color-text-main)]">{formatMoney(rows.reduce((s,a)=>s+a.credit,0))}</td>
                              <td/>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[var(--color-border-line)]">
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-[var(--color-text-main)]">TOTAL</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-[var(--color-text-main)]">{formatMoney(tbDebit)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-[var(--color-text-main)]">{formatMoney(tbCredit)}</td>
                        <td className="px-4 py-3 text-right text-xs font-semibold" style={{color:tbBalanced?'#34c759':'#ff3b30'}}>
                          {tbBalanced ? '✓ Balance' : `Selisih: ${formatMoney(Math.abs(tbDebit-tbCredit))}`}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── LABA RUGI ────────────────────────────────────────────────────── */}
          {tab === 'pl' && (
            <div className={`${card} overflow-hidden`}>
              <div className="px-5 py-3 border-b border-[var(--color-border-line)]">
                <p className="text-sm font-semibold text-[var(--color-text-main)]">Laporan Laba Rugi</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {hasJournalData ? 'Dari journal entries (Transaction Engine)' : 'Dari ERP data (Sales & Cashflow)'}
                </p>
              </div>
              <div className="p-5 space-y-5 max-w-lg">
                {/* Revenue section */}
                <div>
                  <p className="text-xs font-semibold text-[#34c759] uppercase tracking-wider mb-2">Pendapatan</p>
                  {hasJournalData ? balances.filter(a=>a.type==='revenue').map(a => (
                    <div key={a.code} className="flex justify-between py-1.5 border-b border-[var(--color-border-line)]">
                      <span className="text-sm text-[var(--color-text-main)]">{a.name}</span>
                      <span className="text-sm tabular-nums text-[var(--color-text-main)]">{formatMoney(Math.abs(a.credit-a.debit))}</span>
                    </div>
                  )) : (
                    <div className="flex justify-between py-1.5 border-b border-[var(--color-border-line)]">
                      <span className="text-sm text-[var(--color-text-main)]">Pendapatan Penjualan</span>
                      <span className="text-sm tabular-nums text-[var(--color-text-main)]">{formatMoney(erpRevenue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 font-bold">
                    <span className="text-sm text-[var(--color-text-main)]">Total Pendapatan</span>
                    <span className="text-sm tabular-nums" style={{color:'#34c759'}}>{formatMoney(revenue)}</span>
                  </div>
                </div>

                {/* Expenses section */}
                <div>
                  <p className="text-xs font-semibold text-[#ff9500] uppercase tracking-wider mb-2">Beban</p>
                  {hasJournalData ? balances.filter(a=>a.type==='expense' && a.debit>0).map(a => (
                    <div key={a.code} className="flex justify-between py-1.5 border-b border-[var(--color-border-line)]">
                      <span className="text-sm text-[var(--color-text-main)]">{a.name}</span>
                      <span className="text-sm tabular-nums text-[var(--color-text-main)]">{formatMoney(a.debit-a.credit)}</span>
                    </div>
                  )) : (
                    <div className="flex justify-between py-1.5 border-b border-[var(--color-border-line)]">
                      <span className="text-sm text-[var(--color-text-main)]">Beban Operasional</span>
                      <span className="text-sm tabular-nums text-[var(--color-text-main)]">{formatMoney(erpExpenses)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 font-bold">
                    <span className="text-sm text-[var(--color-text-main)]">Total Beban</span>
                    <span className="text-sm tabular-nums" style={{color:'#ff9500'}}>{formatMoney(expenses)}</span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="rounded-xl p-4 border-2" style={{borderColor:profit>=0?'#34c759':'#ff3b30',background:profit>=0?'#34c75908':'#ff3b3008'}}>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-[var(--color-text-main)]">Laba Bersih</span>
                    <span className="text-xl font-bold tabular-nums" style={{color:profit>=0?'#34c759':'#ff3b30'}}>
                      {profit < 0 && '(−)'}{formatMoney(Math.abs(profit))}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Net margin: {margin}% · {profit >= 0 ? 'Bisnis profitable bulan ini ✓' : 'Pengeluaran melebihi pendapatan'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── ARUS KAS ──────────────────────────────────────────────────────── */}
          {tab === 'cashflow' && (
            <div className={`${card} overflow-hidden`}>
              <div className="px-5 py-3 border-b border-[var(--color-border-line)]">
                <p className="text-sm font-semibold text-[var(--color-text-main)]">Laporan Arus Kas</p>
                <p className="text-xs text-[var(--color-text-muted)]">Dari ERP Cashflow data</p>
              </div>
              <div className="p-5 space-y-4 max-w-lg">
                {[
                  { label:'Arus Kas Masuk',  value: cfInflow,  color:'#34c759', items:
                    (computedCashflow||[]).filter((c:any)=>String(c.type).toLowerCase().includes('in')).slice(0,5)
                  },
                  { label:'Arus Kas Keluar', value: cfOutflow, color:'#ff3b30', items:
                    (computedCashflow||[]).filter((c:any)=>String(c.type).toLowerCase().includes('out')).slice(0,5)
                  },
                ].map(section => (
                  <div key={section.label}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:section.color}}>{section.label}</p>
                    {section.items.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-muted)] py-2">Belum ada data</p>
                    ) : section.items.map((c:any, i:number) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-[var(--color-border-line)]">
                        <span className="text-sm text-[var(--color-text-main)] truncate flex-1">{c.category || c.type || 'Transaksi'}</span>
                        <span className="text-sm tabular-nums text-[var(--color-text-main)] shrink-0 ml-4">{formatMoney(c.amount||0)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold">
                      <span className="text-sm text-[var(--color-text-main)]">Total</span>
                      <span className="text-sm tabular-nums" style={{color:section.color}}>{formatMoney(section.value)}</span>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl p-4 border-2" style={{borderColor:cfNet>=0?'#0071e3':'#ff3b30',background:'var(--color-background)'}}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-main)]">Net Cash Flow</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Posisi kas bersih</p>
                    </div>
                    <p className="text-xl font-bold tabular-nums" style={{color:cfNet>=0?'#0071e3':'#ff3b30'}}>
                      {cfNet<0&&'(−)'}{formatMoney(Math.abs(cfNet))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
