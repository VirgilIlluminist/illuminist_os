/**
 * BusinessInsightView.tsx — AI Analisa Bisnis V5.2
 * AI membaca data nyata via AI Query Layer — bukan hanya chatbot kosong.
 * Context otomatis dibangun dari ERP data sebelum dikirim ke AI.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader, RefreshCw, TrendingUp, Package, DollarSign, Users } from 'lucide-react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP }      from '../../../app/store/ERPContext';
import { aiService }   from '../../../infra/api';

interface Message { role: 'user' | 'assistant'; text: string; ts: string }

const QUICK_PROMPTS = [
  { icon:'📈', label:'Analisa Revenue',   text:'Analisa pendapatan bulan ini. Apa tren yang terlihat dan rekomendasi untuk meningkatkannya?' },
  { icon:'💸', label:'Cashflow Check',    text:'Bagaimana kondisi arus kas saat ini? Adakah risiko yang perlu diwaspadai dalam 30 hari ke depan?' },
  { icon:'📦', label:'Stok & Produksi',  text:'Review stok bahan baku dan produksi. Material apa yang perlu segera diorder?' },
  { icon:'👥', label:'Analisa Pelanggan', text:'Siapa pelanggan terbaik? Bagaimana strategi retensi dan upsell yang tepat?' },
  { icon:'🎯', label:'Prioritas Minggu Ini', text:'Apa 3 hal paling penting yang harus difokuskan minggu ini untuk pertumbuhan bisnis?' },
  { icon:'⚠️', label:'Identifikasi Risiko', text:'Apa risiko utama bisnis saat ini berdasarkan data yang ada? Bagaimana mitigasinya?' },
];

function buildContext(
  companyName: string,
  computedSales: any[],
  computedCashflow: any[],
  computedMaterials: any[],
  customers: any[],
  formatMoney: (n:number) => string
): string {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  })();

  const getRevOf = (s:any) => s.netRevenue || s.grossRevenue || (s.pricePerPcs||0)*(s.qtySold||0) || 0;

  const thisRev  = computedSales.filter(s=>(s.date||'').startsWith(thisMonth)).reduce((sum,s)=>sum+getRevOf(s),0);
  const lastRev  = computedSales.filter(s=>(s.date||'').startsWith(lastMonth)).reduce((sum,s)=>sum+getRevOf(s),0);
  const thisExp  = computedCashflow.filter(c=>(c.date||'').startsWith(thisMonth)&&String(c.type).toLowerCase().includes('out')).reduce((sum,c)=>sum+(c.amount||0),0);
  const cashPos  = computedCashflow.reduce((s,c)=>String(c.type).toLowerCase().includes('in')?s+(c.amount||0):s-(c.amount||0),0);
  const growth   = lastRev > 0 ? Math.round((thisRev-lastRev)/lastRev*100) : 0;

  const topProds: Record<string,number> = {};
  computedSales.forEach(s => {
    const k = s.productName || s.product || 'Unknown';
    topProds[k] = (topProds[k]||0) + getRevOf(s);
  });
  const sortedProds = Object.entries(topProds).sort(([,a],[,b])=>b-a).slice(0,3);

  const lowStock = computedMaterials.filter(m => (m.computedStock||m.baseQty||0) <= (m.minStock||0));
  const totalInv = computedMaterials.reduce((s,m)=>(m.computedStock||m.baseQty||0)*(m.costPerUnit||0)+s,0);

  return `# Data Bisnis: ${companyName}
Periode: ${now.toLocaleDateString('id-ID',{month:'long',year:'numeric'})}

## Keuangan Bulan Ini
- Revenue: ${formatMoney(thisRev)} (${growth>=0?'+':''}${growth}% vs bulan lalu)
- Pengeluaran: ${formatMoney(thisExp)}
- Profit: ${formatMoney(thisRev-thisExp)} (margin ${thisRev>0?Math.round((thisRev-thisExp)/thisRev*100):0}%)
- Cash Position: ${formatMoney(cashPos)}

## Produk Terlaris
${sortedProds.map(([name,rev],i)=>`${i+1}. ${name}: ${formatMoney(rev)}`).join('\n') || '- Belum ada data penjualan'}

## Inventori
- Total bahan baku: ${computedMaterials.length} item (nilai: ${formatMoney(totalInv)})
- Stok menipis/habis: ${lowStock.length} item${lowStock.length>0?' ('+lowStock.map(m=>m.name).slice(0,3).join(', ')+')':''}

## Pelanggan
- Total pelanggan: ${customers.length}
- Order bulan ini: ${computedSales.filter(s=>(s.date||'').startsWith(thisMonth)).length} order`;
}

export default function BusinessInsightView() {
  const { activeBusiness, currentColor } = useBusiness();
  const { config, computedSales, computedCashflow, computedMaterials, customers, formatMoney } = useERP();
  const accent = currentColor || config?.customAccentColor || '#7c3aed';

  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  // Greet saat pertama buka
  useEffect(() => {
    if (messages.length === 0 && activeBusiness) {
      const ctx = buildContext(activeBusiness.name, computedSales||[], computedCashflow||[], computedMaterials||[], customers||[], formatMoney);
      const rev = (computedSales||[]).reduce((s:number,x:any)=>s+(x.netRevenue||x.grossRevenue||(x.pricePerPcs||0)*(x.qtySold||0)||0),0);
      setMessages([{
        role: 'assistant',
        text: `Halo! Saya AI Chief of Staff untuk **${activeBusiness.name}**. 

Saya sudah membaca data bisnis Anda:
- Revenue total: ${formatMoney(rev)}
- ${(computedMaterials||[]).length} material, ${(customers||[]).length} pelanggan
- ${(computedSales||[]).length} transaksi penjualan

Tanyakan apa saja tentang bisnis Anda — saya akan menjawab berdasarkan data nyata.`,
        ts: new Date().toISOString(),
      }]);
      setContextReady(true);
    }
  }, [activeBusiness?.id]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const ctx = buildContext(
      activeBusiness?.name || 'Bisnis',
      computedSales||[], computedCashflow||[],
      computedMaterials||[], customers||[], formatMoney
    );

    const userMsg: Message = { role:'user', text:msg, ts:new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role:m.role, content:m.text }));
      const prompt  = `${ctx}\n\n---\nPertanyaan: ${msg}\n\nJawab dalam Bahasa Indonesia. Langsung ke poin, konkret, sertakan angka dari data di atas.`;

      const res = await aiService.chat({
        message:   prompt,
        sessionId: `business-insight-${activeBusiness?.id || 'default'}`,
      });

      setMessages(prev => [...prev, { role:'assistant', text: res.text || 'Maaf, tidak ada respons dari AI.', ts: new Date().toISOString() }]);
    } catch {
      setMessages(prev => [...prev, { role:'assistant', text:'❌ AI tidak tersedia. Periksa API key di Settings → AI Configuration.', ts: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => setMessages([]);

  const card = 'bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl';

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:`${accent}18` }}>🤖</div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">AI Chief of Staff</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Tanya apapun — dijawab dari data bisnis nyata Anda</p>
          </div>
        </div>
        <button onClick={resetChat} className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
          <RefreshCw size={12}/> Reset
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {QUICK_PROMPTS.map(qp => (
          <button key={qp.label} onClick={() => send(qp.text)} disabled={loading}
            className={`${card} p-3 text-left cursor-pointer hover:border-[var(--color-text-muted)] transition-all group disabled:opacity-50`}>
            <span className="text-base">{qp.icon}</span>
            <p className="text-xs font-semibold text-[var(--color-text-main)] mt-1">{qp.label}</p>
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className={`${card} flex flex-col overflow-hidden`} style={{ height:'480px' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Sparkles size={32} style={{ color:accent }} className="opacity-40"/>
              <p className="text-sm text-[var(--color-text-muted)]">Pilih pertanyaan di atas atau ketik pertanyaan Anda</p>
            </div>
          ) : messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role==='user'?'flex-row-reverse':''}`}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ background:msg.role==='user'?accent:`${accent}18` }}>
                {msg.role==='user' ? '👤' : '🤖'}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role==='user'
                  ? 'text-white rounded-tr-sm'
                  : 'bg-[var(--color-background)] text-[var(--color-text-main)] rounded-tl-sm'
              }`}
                style={msg.role==='user'?{ background:accent }:{}}
              >
                {msg.text.split('\n').map((line, j) => (
                  <p key={j} className={line.startsWith('**')&&line.endsWith('**')?'font-semibold':line.startsWith('- ')?'ml-2':''}>{
                    line.replace(/\*\*(.*?)\*\*/g, '$1')
                  }</p>
                ))}
                <p className="text-[10px] mt-1 opacity-50">
                  {new Date(msg.ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background:`${accent}18` }}>🤖</div>
              <div className="bg-[var(--color-background)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader size={14} className="animate-spin" style={{ color:accent }}/>
                <span className="text-sm text-[var(--color-text-muted)]">Menganalisa data bisnis Anda...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="border-t border-[var(--color-border-line)] p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); }}}
            placeholder="Tanya tentang revenue, stok, pelanggan, strategi..."
            className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] focus:outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <button onClick={() => send()} disabled={!input.trim()||loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-40 transition-opacity"
            style={{ background:accent }}>
            <Send size={14} className="text-white"/>
          </button>
        </div>
      </div>
    </div>
  );
}
