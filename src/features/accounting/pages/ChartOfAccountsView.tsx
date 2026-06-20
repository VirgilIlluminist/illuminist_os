/**
 * ChartOfAccountsView.tsx — Chart of Accounts V5.2
 * 16 akun default di-seed otomatis. CRUD penuh. Filter per tipe.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useBusiness } from '../../../app/store/BusinessContext';
import { useERP }      from '../../../app/store/ERPContext';
import { getRepo, BaseRecord } from '../../../core/repositories';
import { toast } from '../../../shared/ui/Toast';

interface Account extends BaseRecord {
  code: string; name: string;
  type: 'asset'|'liability'|'equity'|'revenue'|'expense';
  parent_code?: string; is_active: boolean;
}

const TYPES = [
  { id:'asset',    label:'Aset',       color:'#0071e3' },
  { id:'liability',label:'Kewajiban',  color:'#ff3b30' },
  { id:'equity',   label:'Modal',      color:'#af52de' },
  { id:'revenue',  label:'Pendapatan', color:'#34c759' },
  { id:'expense',  label:'Beban',      color:'#ff9500' },
];

const DEFAULT_ACCOUNTS = [
  { code:'1100',name:'Kas & Bank',             type:'asset'   },
  { code:'1200',name:'Piutang Usaha',          type:'asset'   },
  { code:'1300',name:'Persediaan',             type:'asset'   },
  { code:'1500',name:'Aset Tetap',             type:'asset'   },
  { code:'2100',name:'Hutang Usaha',           type:'liability'},
  { code:'2200',name:'Hutang Bank',            type:'liability'},
  { code:'3100',name:'Modal Disetor',          type:'equity'  },
  { code:'3200',name:'Laba Ditahan',           type:'equity'  },
  { code:'4100',name:'Pendapatan Penjualan',   type:'revenue' },
  { code:'4200',name:'Pendapatan Lainnya',     type:'revenue' },
  { code:'5100',name:'HPP',                    type:'expense' },
  { code:'5200',name:'Biaya Gaji',             type:'expense' },
  { code:'5300',name:'Biaya Pemasaran',        type:'expense' },
  { code:'5400',name:'Biaya Operasional',      type:'expense' },
  { code:'5500',name:'Biaya Penyusutan',       type:'expense' },
  { code:'5600',name:'Biaya Lainnya',          type:'expense' },
];

export default function ChartOfAccountsView() {
  const { activeBusiness, currentColor } = useBusiness();
  const { config } = useERP();
  const accent  = currentColor || config?.customAccentColor || '#0071e3';
  const bizId   = activeBusiness?.id || 'default';
  const repo    = getRepo<Account>('chart_of_accounts');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [filter,   setFilter]   = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Account|null>(null);
  const [form,     setForm]     = useState({ code:'', name:'', type:'expense' as Account['type'], parent_code:'', is_active:true });

  const load = async () => {
    setLoading(true);
    const { data } = await repo.findAll(bizId, { orderBy:{ column:'code', direction:'asc' }, limit:200 });
    if (data.length === 0) {
      // Seed default
      for (const acc of DEFAULT_ACCOUNTS) {
        await repo.create(bizId, { ...acc, is_active: true } as any);
      }
      const { data:seeded } = await repo.findAll(bizId, { orderBy:{ column:'code', direction:'asc' }, limit:200 });
      setAccounts(seeded);
    } else setAccounts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [bizId]);

  const filtered = useMemo(() => accounts.filter(a => {
    const q = query.toLowerCase();
    const matchQ = !q || a.code.includes(q) || a.name.toLowerCase().includes(q);
    return matchQ && (!filter || a.type === filter);
  }), [accounts, query, filter]);

  const grouped = useMemo(() => {
    const g: Record<string, Account[]> = {};
    TYPES.forEach(t => { g[t.id] = filtered.filter(a => a.type === t.id); });
    return g;
  }, [filtered]);

  const handleSave = async () => {
    if (!form.code || !form.name) { toast.error('Kode dan nama wajib diisi'); return; }
    if (editing) {
      await repo.update(bizId, editing.id, form as any);
      toast.success('Akun diperbarui');
    } else {
      await repo.create(bizId, form as any);
      toast.success('Akun ditambahkan');
    }
    setShowForm(false); load();
  };

  const handleDelete = async (acc: Account) => {
    const ok = await toast.confirm(`Hapus akun ${acc.code} — ${acc.name}?`);
    if (!ok) return;
    await repo.remove(bizId, acc.id);
    toast.success('Akun dihapus'); load();
  };

  const card = 'bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl';

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{accounts.length} akun · Sistem double-entry</p>
        </div>
        <button onClick={() => { setForm({code:'',name:'',type:'expense',parent_code:'',is_active:true}); setEditing(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-white cursor-pointer" style={{background:accent}}>
          <Plus size={15}/> Tambah Akun
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-2">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setFilter(filter===t.id?'':t.id)}
            className={`${card} p-3 text-left cursor-pointer transition-all ${filter===t.id?'ring-2':'hover:border-[var(--color-text-muted)]'}`}
            style={filter===t.id?{ outline:`2px solid ${t.color}`, outlineOffset:'2px' } as React.CSSProperties :{}}>
            <p className="text-[9px] font-semibold mb-1" style={{color:t.color}}>{t.label.toUpperCase()}</p>
            <p className="text-xl font-bold text-[var(--color-text-main)]">{accounts.filter(a=>a.type===t.id).length}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={`${card} px-4 py-2.5 flex items-center gap-2`}>
        <Search size={14} className="text-[var(--color-text-muted)]"/>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari kode atau nama akun..."
          className="flex-1 bg-transparent text-sm text-[var(--color-text-main)] focus:outline-none"/>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-border-line)] border-t-[var(--color-accent-highlight)] animate-spin"/>
        </div>
      )}

      {/* Grouped */}
      {TYPES.filter(t => !filter || t.id === filter).map(t => {
        const rows = grouped[t.id] || [];
        if (rows.length === 0) return null;
        return (
          <div key={t.id} className={card}>
            <div className="px-5 py-3 border-b border-[var(--color-border-line)]">
              <span className="text-xs font-semibold" style={{color:t.color}}>{t.label} ({rows.length})</span>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--color-border-line)]">
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[var(--color-text-muted)] text-left">KODE</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[var(--color-text-muted)] text-left">NAMA AKUN</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[var(--color-text-muted)] text-left">PARENT</th>
                <th className="px-4 py-2.5 w-16"/>
              </tr></thead>
              <tbody>
                {rows.map(acc => (
                  <tr key={acc.id} className="border-b border-[var(--color-border-line)] last:border-0 hover:bg-[var(--color-background)] group">
                    <td className="px-4 py-2.5 font-medium text-[var(--color-text-main)] tabular-nums">{acc.code}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-main)]">{acc.name}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)] text-xs">{acc.parent_code||'—'}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 justify-end">
                        <button onClick={() => { setForm({code:acc.code,name:acc.name,type:acc.type,parent_code:acc.parent_code||'',is_active:acc.is_active}); setEditing(acc); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-card-bg)] cursor-pointer"><Edit2 size={12} className="text-[var(--color-text-muted)]"/></button>
                        <button onClick={() => handleDelete(acc)} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"><Trash2 size={12} className="text-red-500"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={()=>setShowForm(false)}>
          <div className={`${card} w-full max-w-sm shadow-2xl`} onClick={e=>e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-[var(--color-border-line)] flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-text-main)]">{editing?'Edit':'Tambah'} Akun</p>
              <button onClick={()=>setShowForm(false)} className="p-1 rounded-lg hover:bg-[var(--color-background)] cursor-pointer"><X size={14}/></button>
            </div>
            <div className="p-5 space-y-3">
              {[{key:'code',label:'Kode *',ph:'1100'},{key:'name',label:'Nama *',ph:'Kas & Bank'}].map(f=>(
                <div key={f.key}>
                  <label className="text-xs font-medium text-[var(--color-text-main)] mb-1.5 block">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] focus:outline-none"/>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-main)] mb-1.5 block">Tipe</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value as Account['type']}))}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] cursor-pointer">
                  {TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] cursor-pointer">Batal</button>
              <button onClick={handleSave} className="px-5 py-2 text-sm font-medium rounded-xl text-white cursor-pointer" style={{background:accent}}>
                {editing?'Simpan':'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
