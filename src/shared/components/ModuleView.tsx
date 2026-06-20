/**
 * ModuleView.tsx — V5.1 Generic Module Renderer
 * Merender modul bisnis dari ModuleDef: KPI cards, CRUD, search, filter,
 * sort, pagination, export CSV, audit log.
 * Menggunakan Repository pattern — tidak menyentuh localStorage langsung.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Download, X, Edit2, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useBusiness } from '../../app/store/BusinessContext';
import { useERP } from '../../app/store/ERPContext';
import { toast } from '../ui/Toast';
import {
  ModuleDef, FieldDef, moduleCreate, moduleUpdate, moduleDelete, moduleLoad,
  exportToCSV, getAuditLog, AuditEntry,
} from '../../core/utils/moduleEngine';

interface Props { module: ModuleDef }

const PER_PAGE = 12;

export default function ModuleView({ module }: Props) {
  const { activeBusiness } = useBusiness();
  const { config, formatMoney } = useERP();
  const accent = module.color || config?.customAccentColor || '#0071e3';
  const bizId  = activeBusiness?.id || 'default';

  const [records, setRecords]   = useState<Record<string,any>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [query,   setQuery]     = useState('');
  const [filters, setFilters]   = useState<Record<string,string>>({});
  const [sortKey, setSortKey]   = useState(module.defaultSort?.key || module.fields[0]?.key || 'created_at');
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>(module.defaultSort?.dir || 'desc');
  const [page,    setPage]      = useState(1);
  const [showForm,setShowForm]  = useState(false);
  const [editing, setEditing]   = useState<Record<string,any>|null>(null);
  const [formData,setFormData]  = useState<Record<string,any>>({});
  const [showAudit,setShowAudit]= useState(false);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await moduleLoad(bizId, module);
    setRecords(data);
    setLoading(false);
  }, [bizId, module.id]);

  useEffect(() => { load(); setPage(1); }, [bizId, module.id]);

  // Pipeline
  const processed = useMemo(() => {
    let r = records;
    if (query) {
      const q = query.toLowerCase();
      const keys = module.fields.filter(f=>f.searchable!==false && f.type!=='computed').map(f=>f.key);
      r = r.filter(rec => keys.some(k => String(rec[k]??'').toLowerCase().includes(q)));
    }
    Object.entries(filters).forEach(([k,v]) => { if (v) r = r.filter(rec => String(rec[k]??'') === v); });
    r = [...r].sort((a,b) => {
      const av=(a)[sortKey], bv=(b)[sortKey];
      const an=Number(av), bn=Number(bv);
      const cmp = !isNaN(an)&&!isNaN(bn) ? an-bn : String(av??'').localeCompare(String(bv??''));
      return sortDir==='asc'?cmp:-cmp;
    });
    return r;
  }, [records, query, filters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PER_PAGE));
  const pageRecords = processed.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const visibleFields = module.fields.filter(f => !f.hideInTable);
  const filterableFields = module.fields.filter(f => f.type==='select'||f.type==='badge');

  const kpiResults = useMemo(() =>
    module.kpis?.map(kpi => ({ kpi, value: kpi.compute(records) })) ?? [],
    [records]);

  const openCreate = () => {
    const init: Record<string,any> = {};
    module.fields.forEach(f => { if (f.defaultValue !== undefined) init[f.key] = f.defaultValue; });
    setFormData(init); setEditing(null); setShowForm(true);
  };

  const openEdit = (rec: Record<string,any>) => {
    setFormData({...rec}); setEditing(rec); setShowForm(true);
  };

  const handleSave = async () => {
    const missing = module.fields.filter(f=>f.required && !formData[f.key]);
    if (missing.length > 0) { toast.error(`Wajib diisi: ${missing.map(f=>f.label).join(', ')}`); return; }
    if (editing) {
      await moduleUpdate(bizId, module.id, editing.id, formData);
      toast.success('Data diperbarui');
    } else {
      await moduleCreate(bizId, module.id, formData);
      toast.success('Data ditambahkan');
    }
    setShowForm(false);
    await load();
  };

  const handleDelete = async (rec: Record<string,any>) => {
    const ok = await toast.confirm('Hapus data ini?');
    if (!ok) return;
    await moduleDelete(bizId, module.id, rec.id);
    toast.success('Data dihapus');
    await load();
  };

  const handleExport = () => {
    exportToCSV(processed, module.fields, `${module.id}_${new Date().toISOString().slice(0,10)}`);
    toast.success(`${processed.length} baris diexport ke CSV`);
  };

  const openAudit = () => {
    setAuditLog(getAuditLog(bizId, module.id));
    setShowAudit(true);
  };

  const fmtCell = (f: FieldDef, rec: Record<string,any>) => {
    const raw = f.type === 'computed' && f.compute ? f.compute(rec) : rec[f.key];
    if (raw === undefined || raw === null || raw === '') return <span className="text-[var(--color-text-muted)]">—</span>;
    if (f.type === 'currency') return <span className="tabular-nums">{formatMoney(Number(raw)||0)}</span>;
    if (f.type === 'percent'  || (f.type==='computed' && ['margin','roi','passRate','progress','foodcost','avgpass'].includes(f.key)))
      return <span className="tabular-nums">{Number(raw)||0}%</span>;
    if (f.type === 'boolean') return <span>{raw ? '✓' : '—'}</span>;
    if (f.type === 'badge') {
      const color = f.badgeColors?.[raw] || '#8e8e93';
      return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ background:`${color}20`, color }}>{String(raw)}</span>;
    }
    return <span>{String(raw)}</span>;
  };

  const card = 'bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl';

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background:`${accent}18` }}>
            {module.icon}
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-[var(--color-text-main)] tracking-tight">{module.title}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{module.subtitle} · {records.length} record</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={openAudit} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
            <Clock size={13}/> Audit
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
            <Download size={13}/> Export CSV
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-white cursor-pointer" style={{ background:accent }}>
            <Plus size={15}/> Tambah
          </button>
        </div>
      </div>

      {/* KPIs */}
      {kpiResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiResults.map(({ kpi, value }) => (
            <div key={kpi.key} className={`${card} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium">{kpi.label}</span>
                <span className="text-base">{kpi.icon}</span>
              </div>
              <p className="text-xl font-bold tracking-tight tabular-nums" style={{ color:kpi.color }}>
                {kpi.format==='currency' ? formatMoney(Number(value)||0)
                 : kpi.format==='percent' ? `${value}%`
                 : String(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className={`${card} p-3 flex items-center gap-2 flex-wrap`}>
        <Search size={15} className="text-[var(--color-text-muted)] shrink-0"/>
        <input value={query} onChange={e=>{ setQuery(e.target.value); setPage(1); }}
          placeholder={`Cari ${module.title.toLowerCase()}...`}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-[var(--color-text-main)] focus:outline-none"/>
        {filterableFields.map(f => (
          <select key={f.key} value={filters[f.key]||''} onChange={e=>{ setFilters(p=>({...p,[f.key]:e.target.value})); setPage(1); }}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] cursor-pointer">
            <option value="">{f.label}: Semua</option>
            {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <span className="text-xs text-[var(--color-text-muted)] shrink-0">{processed.length} data</span>
      </div>

      {/* Table */}
      <div className={`${card} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--color-border-line)] border-t-[var(--color-accent-highlight)] animate-spin"/>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-line)]">
                  {visibleFields.map(f => (
                    <th key={f.key} onClick={()=>{ if(f.type!=='computed'){ if(sortKey===f.key) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortKey(f.key);setSortDir('asc');} }}}
                      className={`px-4 py-3 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide whitespace-nowrap ${f.align==='right'?'text-right':'text-left'} ${f.type!=='computed'?'cursor-pointer hover:text-[var(--color-text-main)]':''}`}>
                      <span className="inline-flex items-center gap-1">
                        {f.label}{sortKey===f.key && <ArrowUpDown size={9}/>}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 w-16"/>
                </tr>
              </thead>
              <tbody>
                {pageRecords.length === 0 ? (
                  <tr><td colSpan={visibleFields.length+1}>
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <span className="text-3xl opacity-30">{module.icon}</span>
                      <p className="text-sm font-medium text-[var(--color-text-main)]">Belum ada data</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {query||Object.values(filters).some(Boolean) ? 'Tidak ada yang cocok dengan pencarian.' : 'Klik "Tambah" untuk mulai.'}
                      </p>
                    </div>
                  </td></tr>
                ) : pageRecords.map(rec => (
                  <tr key={rec.id} className="border-b border-[var(--color-border-line)] last:border-0 hover:bg-[var(--color-background)] transition-colors group">
                    {visibleFields.map(f => (
                      <td key={f.key} className={`px-4 py-3 text-[var(--color-text-main)] ${f.align==='right'?'text-right':''}`}>
                        {fmtCell(f, rec)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button onClick={()=>openEdit(rec)} className="p-1.5 rounded-lg hover:bg-[var(--color-card-bg)] cursor-pointer"><Edit2 size={13} className="text-[var(--color-text-muted)]"/></button>
                        <button onClick={()=>handleDelete(rec)} className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"><Trash2 size={13} className="text-red-500"/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-line)]">
            <span className="text-xs text-[var(--color-text-muted)]">Hal. {page} dari {totalPages} · {processed.length} total</span>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="p-1.5 rounded-lg border border-[var(--color-border-line)] disabled:opacity-30 cursor-pointer"><ChevronLeft size={14}/></button>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="p-1.5 rounded-lg border border-[var(--color-border-line)] disabled:opacity-30 cursor-pointer"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={()=>setShowForm(false)}>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96}}
              transition={{type:'spring',stiffness:400,damping:36}}
              className={`${card} w-full max-w-lg shadow-2xl`} style={{maxHeight:'90vh',display:'flex',flexDirection:'column'}}
              onClick={e=>e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-[var(--color-border-line)] flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-[var(--color-text-main)]">{editing?'Edit':'Tambah'} {module.title}</p>
                <button onClick={()=>setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[var(--color-background)] cursor-pointer"><X size={15}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {module.fields.filter(f=>f.type!=='computed').map(f=>(
                  <div key={f.key}>
                    <label className="text-xs font-medium text-[var(--color-text-main)] mb-1.5 block">
                      {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {f.type==='textarea' ? (
                      <textarea value={formData[f.key]||''} onChange={e=>setFormData(p=>({...p,[f.key]:e.target.value}))}
                        rows={2} placeholder={f.placeholder}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] focus:outline-none resize-none"/>
                    ) : f.type==='select'||f.type==='badge' ? (
                      <select value={formData[f.key]||f.defaultValue||''} onChange={e=>setFormData(p=>({...p,[f.key]:e.target.value}))}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] cursor-pointer">
                        {f.options?.map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type==='boolean' ? (
                      <button onClick={()=>setFormData(p=>({...p,[f.key]:!p[f.key]}))}
                        className="w-11 h-6 rounded-full relative transition-all cursor-pointer"
                        style={{ background:formData[f.key]?accent:'var(--color-border-line)' }}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData[f.key]?'left-[22px]':'left-0.5'}`}/>
                      </button>
                    ) : (
                      <input
                        type={['number','currency','percent'].includes(f.type)?'number':f.type==='date'?'date':'text'}
                        value={formData[f.key]??''}
                        onChange={e=>setFormData(p=>({...p,[f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--color-border-line)] bg-[var(--color-background)] text-[var(--color-text-main)] focus:outline-none"/>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-[var(--color-border-line)] flex justify-end gap-2 shrink-0">
                <button onClick={()=>setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border-line)] text-[var(--color-text-muted)] cursor-pointer">Batal</button>
                <button onClick={handleSave} className="px-5 py-2 text-sm font-medium rounded-xl text-white cursor-pointer" style={{ background:accent }}>
                  {editing?'Simpan':'Tambah'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Modal */}
      <AnimatePresence>
        {showAudit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={()=>setShowAudit(false)}>
            <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.96}}
              className={`${card} w-full max-w-sm shadow-2xl`} style={{maxHeight:'80vh',display:'flex',flexDirection:'column'}}
              onClick={e=>e.stopPropagation()}>
              <div className="px-5 py-4 border-b border-[var(--color-border-line)] flex items-center justify-between shrink-0">
                <p className="text-sm font-semibold text-[var(--color-text-main)]">Audit Log — {module.title}</p>
                <button onClick={()=>setShowAudit(false)} className="p-1 rounded-lg hover:bg-[var(--color-background)] cursor-pointer"><X size={15}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {auditLog.length===0 ? (
                  <p className="text-sm text-[var(--color-text-muted)] text-center py-8">Belum ada aktivitas.</p>
                ) : auditLog.slice(0,50).map((e,i)=>(
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--color-border-line)] last:border-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      background: e.action==='create'?'#34c75918':e.action==='update'?'#0071e318':'#ff3b3018',
                      color: e.action==='create'?'#34c759':e.action==='update'?'#0071e3':'#ff3b30',
                    }}>{e.action}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{new Date(e.ts).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
