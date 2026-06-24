/**
 * moduleEngine.ts — V5.1 Module Engine + Semua Deep Module Definitions
 * Engine deklaratif: satu schema → CRUD + KPI + search + filter + export + audit.
 * 20 modul: Fashion(4), Coffee(4), Retail(3), Agency(3), Property(3), PersonalFinance(3).
 */

import { getRepo, getSeedableRepo, BaseRecord } from '../repositories';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldType = 'text'|'textarea'|'number'|'currency'|'percent'|'date'|'select'|'badge'|'boolean'|'computed';

export interface FieldDef {
  key: string; label: string; type: FieldType;
  required?: boolean;
  options?: string[];
  badgeColors?: Record<string, string>;
  placeholder?: string;
  defaultValue?: any;
  compute?: (row: Record<string,any>) => number;
  align?: 'left'|'right'|'center';
  hideInTable?: boolean;
  searchable?: boolean;
}

export interface ModuleKPI {
  key: string; label: string; icon: string; color: string;
  format?: 'currency'|'number'|'percent'|'text';
  compute: (rows: Record<string,any>[]) => number | string;
}

export interface ModuleDef {
  id: string;
  businessType: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  fields: FieldDef[];
  kpis?: ModuleKPI[];
  defaultSort?: { key:string; dir:'asc'|'desc' };
  seedData?: Record<string,any>[];
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportToCSV(records: Record<string,any>[], fields: FieldDef[], filename: string): void {
  const cols = fields.filter(f => !f.hideInTable);
  const header = cols.map(f => `"${f.label}"`).join(',');
  const rows = records.map(r =>
    cols.map(f => {
      let v = f.type === 'computed' && f.compute ? f.compute(r) : r[f.key];
      return `"${String(v ?? '').replace(/"/g,'""')}"`;
    }).join(',')
  );
  const csv = '\ufeff' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditEntry { ts:string; action:'create'|'update'|'delete'; moduleId:string; recordId:string }

export function logAudit(companyId:string, moduleId:string, action:AuditEntry['action'], recordId:string): void {
  try {
    const key = `illum_audit_${companyId}`;
    const log: AuditEntry[] = JSON.parse(localStorage.getItem(key)||'[]');
    log.unshift({ ts:new Date().toISOString(), action, moduleId, recordId });
    localStorage.setItem(key, JSON.stringify(log.slice(0,300)));
  } catch {}
}

export function getAuditLog(companyId:string, moduleId?:string): AuditEntry[] {
  try {
    const log: AuditEntry[] = JSON.parse(localStorage.getItem(`illum_audit_${companyId}`)||'[]');
    return moduleId ? log.filter(e => e.moduleId === moduleId) : log;
  } catch { return []; }
}

// ─── CRUD via Repository ──────────────────────────────────────────────────────

export async function moduleCreate(companyId:string, moduleId:string, data:Record<string,any>): Promise<Record<string,any>|null> {
  const result = await getRepo<BaseRecord>(moduleId).create(companyId, data as any);
  if (result) logAudit(companyId, moduleId, 'create', result.id);
  return result;
}

export async function moduleUpdate(companyId:string, moduleId:string, id:string, data:Record<string,any>): Promise<Record<string,any>|null> {
  const result = await getRepo<BaseRecord>(moduleId).update(companyId, id, data as any);
  if (result) logAudit(companyId, moduleId, 'update', id);
  return result;
}

export async function moduleDelete(companyId:string, moduleId:string, id:string): Promise<boolean> {
  const ok = await getRepo<BaseRecord>(moduleId).remove(companyId, id);
  if (ok) logAudit(companyId, moduleId, 'delete', id);
  return ok;
}

export async function moduleLoad(companyId:string, mod:ModuleDef): Promise<Record<string,any>[]> {
  const repo = getSeedableRepo<BaseRecord>(mod.id);
  const { data } = await repo.findAll(companyId, { limit:500 });
  if (data.length === 0 && mod.seedData && mod.seedData.length > 0) {
    repo.seed(companyId, mod.seedData as any);
    const { data:seeded } = await repo.findAll(companyId, { limit:500 });
    return seeded as Record<string,any>[];
  }
  return data as Record<string,any>[];
}

// ─── FASHION MODULES ──────────────────────────────────────────────────────────

export const FASHION_BOM: ModuleDef = {
  id:'fashion_bom', businessType:'fashion', title:'Bill of Materials (BOM)',
  subtitle:'Komposisi material per produk', icon:'📋', color:'#7c3aed',
  defaultSort:{ key:'product', dir:'asc' },
  fields:[
    { key:'product',    label:'Produk',      type:'text',     required:true, searchable:true },
    { key:'material',   label:'Material',    type:'text',     required:true, searchable:true },
    { key:'consumption',label:'Konsumsi/pcs',type:'number',   align:'right' },
    { key:'unit',       label:'Satuan',      type:'select',   options:['meter','yard','pcs','kg','gram'], defaultValue:'meter' },
    { key:'wastePct',   label:'Waste %',     type:'percent',  defaultValue:5, align:'right' },
    { key:'unitCost',   label:'Harga/satuan',type:'currency', align:'right' },
    { key:'totalCost',  label:'Total Cost',  type:'computed', align:'right',
      compute: r => (Number(r.consumption)||0)*(1+(Number(r.wastePct)||0)/100)*(Number(r.unitCost)||0) },
  ],
  kpis:[
    { key:'products',  label:'Produk',       icon:'👕', color:'#7c3aed', format:'number',
      compute: rows => new Set(rows.map(r=>r.product)).size },
    { key:'avgcost',   label:'Avg Cost',     icon:'💰', color:'#0071e3', format:'currency',
      compute: rows => {
        const by:Record<string,number>={};
        rows.forEach(r=>{const c=(Number(r.consumption)||0)*(1+(Number(r.wastePct)||0)/100)*(Number(r.unitCost)||0);by[r.product]=(by[r.product]||0)+c;});
        const v=Object.values(by); return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
      } },
    { key:'materials', label:'Material Unik',icon:'🧵', color:'#ff9500', format:'number',
      compute: rows => new Set(rows.map(r=>r.material)).size },
  ],
  seedData:[
    { product:'Hoodie Oversize', material:'Fleece Cotton', consumption:1.8, unit:'meter', wastePct:8, unitCost:65000 },
    { product:'Hoodie Oversize', material:'Rib Knit',      consumption:0.3, unit:'meter', wastePct:5, unitCost:40000 },
    { product:'Kaos Basic',      material:'Cotton Combed', consumption:1.2, unit:'meter', wastePct:6, unitCost:45000 },
  ],
};

export const FASHION_PRODUCTION_ORDER: ModuleDef = {
  id:'fashion_production_order', businessType:'fashion', title:'Production Order',
  subtitle:'Order produksi & status workflow', icon:'🏭', color:'#7c3aed',
  defaultSort:{ key:'created_at', dir:'desc' },
  fields:[
    { key:'orderNo',  label:'No. Order',    type:'text',   required:true, searchable:true },
    { key:'product',  label:'Produk',       type:'text',   required:true, searchable:true },
    { key:'qty',      label:'Qty',          type:'number', align:'right' },
    { key:'status',   label:'Status',       type:'badge',  defaultValue:'Draft',
      options:['Draft','Planned','Cutting','Sewing','QC','Finished','Cancelled'],
      badgeColors:{ Draft:'#8e8e93',Planned:'#0071e3',Cutting:'#ff9500',Sewing:'#af52de',QC:'#5ac8fa',Finished:'#34c759',Cancelled:'#ff3b30' } },
    { key:'startDate',label:'Mulai',        type:'date' },
    { key:'dueDate',  label:'Target',       type:'date' },
    { key:'cost',     label:'Est. Biaya',   type:'currency', align:'right' },
    { key:'notes',    label:'Catatan',      type:'textarea', hideInTable:true },
  ],
  kpis:[
    { key:'active',    label:'Order Aktif', icon:'⚙️', color:'#7c3aed', format:'number',
      compute: rows => rows.filter(r=>!['Finished','Cancelled'].includes(r.status)).length },
    { key:'finished',  label:'Selesai',     icon:'✅', color:'#34c759', format:'number',
      compute: rows => rows.filter(r=>r.status==='Finished').length },
    { key:'totalqty',  label:'Total Qty',   icon:'📦', color:'#ff9500', format:'number',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.qty)||0),0) },
    { key:'totalcost', label:'Total Biaya', icon:'💰', color:'#0071e3', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.cost)||0),0) },
  ],
  seedData:[
    { orderNo:'PO-001', product:'Hoodie Oversize', qty:50, status:'Sewing', startDate:'2026-06-10', dueDate:'2026-06-20', cost:11250000 },
    { orderNo:'PO-002', product:'Kaos Basic',      qty:100,status:'QC',     startDate:'2026-06-08', dueDate:'2026-06-15', cost:6000000 },
  ],
};

export const FASHION_QC: ModuleDef = {
  id:'fashion_qc', businessType:'fashion', title:'Quality Control',
  subtitle:'Inspeksi & reject tracking', icon:'🔍', color:'#5ac8fa',
  defaultSort:{ key:'created_at', dir:'desc' },
  fields:[
    { key:'orderNo',   label:'No. Order', type:'text',    required:true, searchable:true },
    { key:'product',   label:'Produk',    type:'text',    searchable:true },
    { key:'inspected', label:'Diperiksa', type:'number',  align:'right' },
    { key:'passed',    label:'Lolos',     type:'number',  align:'right' },
    { key:'rejected',  label:'Reject',    type:'number',  align:'right' },
    { key:'passRate',  label:'Pass Rate', type:'computed',align:'right',
      compute: r => { const i=Number(r.inspected)||0; return i>0?Math.round((Number(r.passed)||0)/i*100):0; } },
    { key:'defect',    label:'Defect',    type:'text',    hideInTable:true },
  ],
  kpis:[
    { key:'avgpass',    label:'Avg Pass Rate', icon:'✅', color:'#34c759', format:'percent',
      compute: rows => { const t=rows.reduce((s,r)=>s+(Number(r.inspected)||0),0); const p=rows.reduce((s,r)=>s+(Number(r.passed)||0),0); return t>0?Math.round(p/t*100):0; } },
    { key:'totalreject',label:'Total Reject',  icon:'❌', color:'#ff3b30', format:'number',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.rejected)||0),0) },
  ],
  seedData:[{ orderNo:'PO-002', product:'Kaos Basic', inspected:100, passed:94, rejected:6, defect:'Jahitan tidak rapi' }],
};

export const FASHION_FINISHED_GOODS: ModuleDef = {
  id:'fashion_finished_goods', businessType:'fashion', title:'Finished Goods Inventory',
  subtitle:'Stok produk jadi siap jual', icon:'📦', color:'#34c759',
  defaultSort:{ key:'product', dir:'asc' },
  fields:[
    { key:'product', label:'Produk',        type:'text',    required:true, searchable:true },
    { key:'variant', label:'Varian/SKU',    type:'text',    searchable:true },
    { key:'stock',   label:'Stok',          type:'number',  align:'right' },
    { key:'hpp',     label:'HPP/pcs',       type:'currency',align:'right' },
    { key:'price',   label:'Harga Jual',    type:'currency',align:'right' },
    { key:'margin',  label:'Margin',        type:'computed',align:'right',
      compute: r => { const p=Number(r.price)||0; return p>0?Math.round((p-(Number(r.hpp)||0))/p*100):0; } },
    { key:'value',   label:'Nilai Stok',    type:'computed',align:'right',
      compute: r => (Number(r.stock)||0)*(Number(r.hpp)||0) },
  ],
  kpis:[
    { key:'totalstock',label:'Total Stok',      icon:'📦', color:'#34c759', format:'number',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.stock)||0),0) },
    { key:'invvalue',  label:'Nilai Inventory', icon:'💰', color:'#0071e3', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.stock)||0)*(Number(r.hpp)||0),0) },
    { key:'skus',      label:'SKU Aktif',       icon:'🏷', color:'#ff9500', format:'number',
      compute: rows => rows.length },
  ],
  seedData:[
    { product:'Hoodie Oversize', variant:'HOD-BLK-L', stock:24, hpp:225000, price:399000 },
    { product:'Kaos Basic',      variant:'KAO-WHT-M', stock:80, hpp:60000,  price:129000 },
  ],
};

// ─── COFFEE MODULES ───────────────────────────────────────────────────────────

export const COFFEE_RECIPE: ModuleDef = {
  id:'coffee_recipe', businessType:'coffee', title:'Recipe Management',
  subtitle:'Resep menu & komposisi bahan', icon:'📖', color:'#d97706',
  defaultSort:{ key:'menu', dir:'asc' },
  fields:[
    { key:'menu',       label:'Menu',       type:'text',   required:true, searchable:true },
    { key:'ingredient', label:'Bahan',      type:'text',   required:true, searchable:true },
    { key:'qty',        label:'Jumlah',     type:'number', align:'right' },
    { key:'unit',       label:'Satuan',     type:'select', options:['gram','ml','pcs','shot','scoop'], defaultValue:'gram' },
    { key:'cost',       label:'Biaya Bahan',type:'currency',align:'right' },
  ],
  kpis:[
    { key:'menus',       label:'Menu',        icon:'☕', color:'#d97706', format:'number',
      compute: rows => new Set(rows.map(r=>r.menu)).size },
    { key:'ingredients', label:'Bahan Unik', icon:'🥛', color:'#ff9500', format:'number',
      compute: rows => new Set(rows.map(r=>r.ingredient)).size },
  ],
  seedData:[
    { menu:'Caffe Latte', ingredient:'Espresso Beans', qty:18, unit:'gram', cost:3500 },
    { menu:'Caffe Latte', ingredient:'Fresh Milk',     qty:150,unit:'ml',   cost:2800 },
    { menu:'Americano',   ingredient:'Espresso Beans', qty:18, unit:'gram', cost:3500 },
  ],
};

export const COFFEE_MENU_COSTING: ModuleDef = {
  id:'coffee_menu_costing', businessType:'coffee', title:'Menu Costing',
  subtitle:'Food cost % & profitabilitas menu', icon:'🧮', color:'#d97706',
  defaultSort:{ key:'menu', dir:'asc' },
  fields:[
    { key:'menu',     label:'Menu',        type:'text',    required:true, searchable:true },
    { key:'category', label:'Kategori',    type:'select',  options:['Coffee','Non-Coffee','Food','Dessert'], defaultValue:'Coffee' },
    { key:'cogs',     label:'COGS',        type:'currency',align:'right' },
    { key:'price',    label:'Harga Jual',  type:'currency',align:'right' },
    { key:'foodcost', label:'Food Cost %', type:'computed',align:'right',
      compute: r => { const p=Number(r.price)||0; return p>0?Math.round((Number(r.cogs)||0)/p*100):0; } },
    { key:'profit',   label:'Profit/cup',  type:'computed',align:'right',
      compute: r => (Number(r.price)||0)-(Number(r.cogs)||0) },
  ],
  kpis:[
    { key:'avgfoodcost',label:'Avg Food Cost',  icon:'🍽', color:'#ff9500', format:'percent',
      compute: rows => { const tc=rows.reduce((s,r)=>s+(Number(r.cogs)||0),0); const tp=rows.reduce((s,r)=>s+(Number(r.price)||0),0); return tp>0?Math.round(tc/tp*100):0; } },
    { key:'avgprofit',  label:'Avg Profit/cup', icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.length ? rows.reduce((s,r)=>s+((Number(r.price)||0)-(Number(r.cogs)||0)),0)/rows.length : 0 },
    { key:'menus',      label:'Menu Aktif',     icon:'☕', color:'#d97706', format:'number',
      compute: rows => rows.length },
  ],
  seedData:[
    { menu:'Caffe Latte', category:'Coffee', cogs:8500,  price:28000 },
    { menu:'Americano',   category:'Coffee', cogs:5500,  price:22000 },
    { menu:'Croissant',   category:'Food',   cogs:7000,  price:18000 },
  ],
};

export const COFFEE_WASTE: ModuleDef = {
  id:'coffee_waste', businessType:'coffee', title:'Daily Waste Tracking',
  subtitle:'Pencatatan waste harian', icon:'🗑', color:'#ff3b30',
  defaultSort:{ key:'date', dir:'desc' },
  fields:[
    { key:'date',   label:'Tanggal',    type:'date',   required:true },
    { key:'item',   label:'Item',       type:'text',   required:true, searchable:true },
    { key:'qty',    label:'Jumlah',     type:'number', align:'right' },
    { key:'unit',   label:'Satuan',     type:'select', options:['gram','ml','pcs','cup'], defaultValue:'pcs' },
    { key:'cost',   label:'Nilai Rugi', type:'currency',align:'right' },
    { key:'reason', label:'Alasan',     type:'select', options:['Expired','Spill','Salah Buat','Komplain','Lainnya'], defaultValue:'Spill' },
  ],
  kpis:[
    { key:'totalwaste',label:'Total Waste Cost', icon:'🗑', color:'#ff3b30', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.cost)||0),0) },
    { key:'incidents', label:'Insiden',          icon:'⚠️', color:'#ff9500', format:'number',
      compute: rows => rows.length },
  ],
  seedData:[{ date:'2026-06-15', item:'Fresh Milk', qty:500, unit:'ml', cost:9000, reason:'Expired' }],
};

export const COFFEE_DAILY_CLOSING: ModuleDef = {
  id:'coffee_daily_closing', businessType:'coffee', title:'Daily Closing',
  subtitle:'Tutup kasir harian', icon:'🧾', color:'#34c759',
  defaultSort:{ key:'date', dir:'desc' },
  fields:[
    { key:'date',     label:'Tanggal',     type:'date',    required:true },
    { key:'orders',   label:'Total Order', type:'number',  align:'right' },
    { key:'revenue',  label:'Revenue',     type:'currency',align:'right' },
    { key:'cash',     label:'Tunai',       type:'currency',align:'right' },
    { key:'cashless', label:'Non-Tunai',   type:'currency',align:'right' },
    { key:'avgticket',label:'Avg Ticket',  type:'computed',align:'right',
      compute: r => { const o=Number(r.orders)||0; return o>0?Math.round((Number(r.revenue)||0)/o):0; } },
  ],
  kpis:[
    { key:'totalrev',   label:'Total Revenue', icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.revenue)||0),0) },
    { key:'totalorders',label:'Total Order',   icon:'☕', color:'#d97706', format:'number',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.orders)||0),0) },
    { key:'avgticket',  label:'Avg Ticket',    icon:'🎫', color:'#0071e3', format:'currency',
      compute: rows => { const o=rows.reduce((s,r)=>s+(Number(r.orders)||0),0); const rv=rows.reduce((s,r)=>s+(Number(r.revenue)||0),0); return o>0?Math.round(rv/o):0; } },
  ],
  seedData:[{ date:'2026-06-15', orders:87, revenue:2436000, cash:980000, cashless:1456000 }],
};

// ─── RETAIL, AGENCY, PROPERTY, PERSONAL FINANCE ──────────────────────────────

export const RETAIL_GOODS_RECEIVING: ModuleDef = {
  id:'retail_goods_receiving', businessType:'retail', title:'Goods Receiving',
  subtitle:'Penerimaan barang dari supplier', icon:'📥', color:'#2563eb',
  defaultSort:{ key:'date', dir:'desc' },
  fields:[
    { key:'grnNo',    label:'No. GRN',     type:'text',    required:true, searchable:true },
    { key:'supplier', label:'Supplier',    type:'text',    searchable:true },
    { key:'product',  label:'Produk',      type:'text',    required:true, searchable:true },
    { key:'qty',      label:'Qty',         type:'number',  align:'right' },
    { key:'unitCost', label:'Harga/unit',  type:'currency',align:'right' },
    { key:'total',    label:'Total',       type:'computed',align:'right',
      compute: r => (Number(r.qty)||0)*(Number(r.unitCost)||0) },
    { key:'date',     label:'Tanggal',     type:'date' },
    { key:'status',   label:'Status',      type:'badge',   defaultValue:'Received',
      options:['Pending','Partial','Received'], badgeColors:{ Pending:'#ff9500',Partial:'#5ac8fa',Received:'#34c759' } },
  ],
  kpis:[
    { key:'totalvalue',label:'Nilai Penerimaan', icon:'💰', color:'#2563eb', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.qty)||0)*(Number(r.unitCost)||0),0) },
    { key:'receipts',  label:'Penerimaan',       icon:'📥', color:'#ff9500', format:'number',
      compute: rows => rows.length },
  ],
  seedData:[{ grnNo:'GRN-001', supplier:'PT Distributor', product:'Sepatu Sneakers', qty:50, unitCost:180000, date:'2026-06-12', status:'Received' }],
};

export const RETAIL_REORDER: ModuleDef = {
  id:'retail_reorder', businessType:'retail', title:'Reorder Point & Stock Aging',
  subtitle:'Titik pemesanan ulang & umur stok', icon:'🔄', color:'#ff9500',
  defaultSort:{ key:'product', dir:'asc' },
  fields:[
    { key:'product',      label:'Produk',         type:'text',   required:true, searchable:true },
    { key:'currentStock', label:'Stok Saat Ini',  type:'number', align:'right' },
    { key:'reorderPoint', label:'Reorder Point',  type:'number', align:'right' },
    { key:'avgDailySales',label:'Penjualan/hari', type:'number', align:'right' },
    { key:'daysInStock',  label:'Umur Stok',      type:'number', align:'right' },
    { key:'movement',     label:'Movement',       type:'badge',  defaultValue:'Normal',
      options:['Fast','Normal','Slow','Dead'], badgeColors:{ Fast:'#34c759',Normal:'#0071e3',Slow:'#ff9500',Dead:'#ff3b30' } },
  ],
  kpis:[
    { key:'needreorder',label:'Perlu Reorder',   icon:'🔄', color:'#ff3b30', format:'number',
      compute: rows => rows.filter(r=>(Number(r.currentStock)||0)<=(Number(r.reorderPoint)||0)).length },
    { key:'fastmoving', label:'Fast Moving',     icon:'🚀', color:'#34c759', format:'number',
      compute: rows => rows.filter(r=>r.movement==='Fast').length },
    { key:'deadstock',  label:'Dead/Slow Stock', icon:'🐌', color:'#ff9500', format:'number',
      compute: rows => rows.filter(r=>['Slow','Dead'].includes(r.movement)).length },
  ],
  seedData:[
    { product:'Sepatu Sneakers', currentStock:48, reorderPoint:20, avgDailySales:3, daysInStock:16, movement:'Fast' },
    { product:'Tas Kanvas',      currentStock:5,  reorderPoint:15, avgDailySales:1, daysInStock:90, movement:'Slow' },
  ],
};

export const AGENCY_CLIENTS: ModuleDef = {
  id:'agency_clients', businessType:'agency', title:'Client Management',
  subtitle:'Database klien & kontrak', icon:'🤝', color:'#4f46e5',
  defaultSort:{ key:'name', dir:'asc' },
  fields:[
    { key:'name',   label:'Nama Klien', type:'text',    required:true, searchable:true },
    { key:'contact',label:'PIC',        type:'text',    searchable:true },
    { key:'type',   label:'Tipe',       type:'select',  options:['Retainer','Project','One-time'], defaultValue:'Project' },
    { key:'mrr',    label:'Nilai/bulan',type:'currency',align:'right' },
    { key:'status', label:'Status',     type:'badge',   defaultValue:'Active',
      options:['Lead','Active','Paused','Churned'], badgeColors:{ Lead:'#ff9500',Active:'#34c759',Paused:'#5ac8fa',Churned:'#ff3b30' } },
  ],
  kpis:[
    { key:'active',    label:'Klien Aktif', icon:'🤝', color:'#4f46e5', format:'number',
      compute: rows => rows.filter(r=>r.status==='Active').length },
    { key:'mrr',       label:'Total MRR',   icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.filter(r=>r.status==='Active').reduce((s,r)=>s+(Number(r.mrr)||0),0) },
    { key:'retainers', label:'Retainer',    icon:'📑', color:'#ff9500', format:'number',
      compute: rows => rows.filter(r=>r.type==='Retainer'&&r.status==='Active').length },
  ],
  seedData:[
    { name:'PT Maju Digital', contact:'Budi', type:'Retainer', mrr:15000000, status:'Active' },
    { name:'Toko Online X',   contact:'Sari', type:'Project',  mrr:8000000,  status:'Active' },
  ],
};

export const AGENCY_PROJECTS: ModuleDef = {
  id:'agency_projects', businessType:'agency', title:'Project Management',
  subtitle:'Proyek, costing, profitabilitas', icon:'📋', color:'#4f46e5',
  defaultSort:{ key:'created_at', dir:'desc' },
  fields:[
    { key:'project',  label:'Proyek',       type:'text',    required:true, searchable:true },
    { key:'client',   label:'Klien',        type:'text',    searchable:true },
    { key:'budget',   label:'Budget',       type:'currency',align:'right' },
    { key:'cost',     label:'Biaya Aktual', type:'currency',align:'right' },
    { key:'margin',   label:'Margin',       type:'computed',align:'right',
      compute: r => { const b=Number(r.budget)||0; return b>0?Math.round((b-(Number(r.cost)||0))/b*100):0; } },
    { key:'status',   label:'Status',       type:'badge',   defaultValue:'Planning',
      options:['Planning','In Progress','Review','Delivered','On Hold'],
      badgeColors:{ Planning:'#8e8e93','In Progress':'#0071e3',Review:'#af52de',Delivered:'#34c759','On Hold':'#ff9500' } },
    { key:'deadline', label:'Deadline',     type:'date' },
  ],
  kpis:[
    { key:'active',    label:'Proyek Aktif', icon:'📋', color:'#4f46e5', format:'number',
      compute: rows => rows.filter(r=>r.status!=='Delivered').length },
    { key:'revenue',   label:'Total Budget', icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.budget)||0),0) },
    { key:'avgmargin', label:'Avg Margin',   icon:'📈', color:'#ff9500', format:'percent',
      compute: rows => { const valid=rows.filter(r=>Number(r.budget)>0); return valid.length?Math.round(valid.reduce((s,r)=>{const b=Number(r.budget)||0;return s+(b>0?(b-(Number(r.cost)||0))/b*100:0);},0)/valid.length):0; } },
  ],
  seedData:[{ project:'Rebranding Logo', client:'PT Maju Digital', budget:25000000, cost:14000000, status:'In Progress', deadline:'2026-07-01' }],
};

export const PROPERTY_UNITS: ModuleDef = {
  id:'property_units', businessType:'property', title:'Unit & Tenant Management',
  subtitle:'Unit properti & penyewa', icon:'🏢', color:'#16a34a',
  defaultSort:{ key:'unit', dir:'asc' },
  fields:[
    { key:'unit',     label:'Unit',        type:'text',    required:true, searchable:true },
    { key:'property', label:'Properti',    type:'text',    searchable:true },
    { key:'tenant',   label:'Penyewa',     type:'text',    searchable:true },
    { key:'rent',     label:'Sewa/bulan',  type:'currency',align:'right' },
    { key:'status',   label:'Status',      type:'badge',   defaultValue:'Occupied',
      options:['Occupied','Vacant','Maintenance'], badgeColors:{ Occupied:'#34c759',Vacant:'#ff9500',Maintenance:'#5ac8fa' } },
    { key:'leaseEnd', label:'Berakhir',    type:'date' },
  ],
  kpis:[
    { key:'occupancy',   label:'Occupancy Rate', icon:'🏠', color:'#16a34a', format:'percent',
      compute: rows => { const t=rows.length; const o=rows.filter(r=>r.status==='Occupied').length; return t>0?Math.round(o/t*100):0; } },
    { key:'monthlyrent', label:'Rental Income',  icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.filter(r=>r.status==='Occupied').reduce((s,r)=>s+(Number(r.rent)||0),0) },
    { key:'vacant',      label:'Unit Kosong',    icon:'🔑', color:'#ff9500', format:'number',
      compute: rows => rows.filter(r=>r.status==='Vacant').length },
  ],
  seedData:[
    { unit:'A-101', property:'Kos Melati', tenant:'Andi', rent:1500000, status:'Occupied', leaseEnd:'2026-12-31' },
    { unit:'A-102', property:'Kos Melati', tenant:'',     rent:1500000, status:'Vacant' },
  ],
};

export const PROPERTY_RENT: ModuleDef = {
  id:'property_rent', businessType:'property', title:'Rent Collection',
  subtitle:'Penagihan & pembayaran sewa', icon:'💵', color:'#16a34a',
  defaultSort:{ key:'dueDate', dir:'desc' },
  fields:[
    { key:'unit',    label:'Unit',        type:'text',    required:true, searchable:true },
    { key:'tenant',  label:'Penyewa',     type:'text',    searchable:true },
    { key:'period',  label:'Periode',     type:'text' },
    { key:'amount',  label:'Jumlah',      type:'currency',align:'right' },
    { key:'dueDate', label:'Jatuh Tempo', type:'date' },
    { key:'status',  label:'Status',      type:'badge',   defaultValue:'Unpaid',
      options:['Paid','Unpaid','Late','Partial'], badgeColors:{ Paid:'#34c759',Unpaid:'#8e8e93',Late:'#ff3b30',Partial:'#ff9500' } },
  ],
  kpis:[
    { key:'collected',   label:'Terkumpul',    icon:'💵', color:'#34c759', format:'currency',
      compute: rows => rows.filter(r=>r.status==='Paid').reduce((s,r)=>s+(Number(r.amount)||0),0) },
    { key:'outstanding', label:'Belum Bayar',  icon:'⏳', color:'#ff9500', format:'currency',
      compute: rows => rows.filter(r=>['Unpaid','Late','Partial'].includes(r.status)).reduce((s,r)=>s+(Number(r.amount)||0),0) },
    { key:'late',        label:'Terlambat',    icon:'⚠️', color:'#ff3b30', format:'number',
      compute: rows => rows.filter(r=>r.status==='Late').length },
  ],
  seedData:[{ unit:'A-101', tenant:'Andi', period:'Juni 2026', amount:1500000, dueDate:'2026-06-05', status:'Paid' }],
};

export const PF_SAVINGS: ModuleDef = {
  id:'pf_savings', businessType:'personal_finance', title:'Savings Goals',
  subtitle:'Target tabungan & progress', icon:'🎯', color:'#7c3aed',
  defaultSort:{ key:'deadline', dir:'asc' },
  fields:[
    { key:'goal',     label:'Tujuan',      type:'text',    required:true, searchable:true },
    { key:'target',   label:'Target',      type:'currency',align:'right' },
    { key:'saved',    label:'Terkumpul',   type:'currency',align:'right' },
    { key:'progress', label:'Progress',    type:'computed',align:'right',
      compute: r => { const t=Number(r.target)||0; return t>0?Math.round((Number(r.saved)||0)/t*100):0; } },
    { key:'deadline', label:'Target Waktu',type:'date' },
    { key:'priority', label:'Prioritas',   type:'badge',   defaultValue:'Medium',
      options:['Low','Medium','High'], badgeColors:{ Low:'#8e8e93',Medium:'#0071e3',High:'#ff3b30' } },
  ],
  kpis:[
    { key:'totaltarget',label:'Total Target',    icon:'🎯', color:'#7c3aed', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.target)||0),0) },
    { key:'totalsaved', label:'Terkumpul',       icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.saved)||0),0) },
    { key:'avgprogress',label:'Avg Progress',    icon:'📊', color:'#0071e3', format:'percent',
      compute: rows => { const v=rows.filter(r=>Number(r.target)>0); return v.length?Math.round(v.reduce((s,r)=>{const t=Number(r.target)||0;return s+(t>0?(Number(r.saved)||0)/t*100:0);},0)/v.length):0; } },
  ],
  seedData:[
    { goal:'Dana Darurat',  target:50000000, saved:32000000, deadline:'2026-12-31', priority:'High' },
    { goal:'Liburan Jepang',target:25000000, saved:8000000,  deadline:'2027-03-01', priority:'Medium' },
  ],
};

export const PF_INVESTMENT: ModuleDef = {
  id:'pf_investment', businessType:'personal_finance', title:'Investment Portfolio',
  subtitle:'Portofolio investasi', icon:'📈', color:'#059669',
  defaultSort:{ key:'value', dir:'desc' },
  fields:[
    { key:'asset',    label:'Aset',         type:'text',    required:true, searchable:true },
    { key:'type',     label:'Jenis',        type:'select',  options:['Saham','Reksa Dana','Crypto','Emas','Properti','Obligasi'], defaultValue:'Saham' },
    { key:'buyValue', label:'Modal',        type:'currency',align:'right' },
    { key:'value',    label:'Nilai Sekarang',type:'currency',align:'right' },
    { key:'gain',     label:'Gain/Loss',    type:'computed',align:'right',
      compute: r => (Number(r.value)||0)-(Number(r.buyValue)||0) },
    { key:'roi',      label:'ROI %',        type:'computed',align:'right',
      compute: r => { const b=Number(r.buyValue)||0; return b>0?Math.round(((Number(r.value)||0)-b)/b*100):0; } },
  ],
  kpis:[
    { key:'totalvalue',label:'Nilai Portfolio', icon:'📈', color:'#059669', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.value)||0),0) },
    { key:'totalgain', label:'Total Gain',      icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+((Number(r.value)||0)-(Number(r.buyValue)||0)),0) },
    { key:'avgroi',    label:'Avg ROI',         icon:'🎯', color:'#0071e3', format:'percent',
      compute: rows => { const b=rows.reduce((s,r)=>s+(Number(r.buyValue)||0),0); const v=rows.reduce((s,r)=>s+(Number(r.value)||0),0); return b>0?Math.round((v-b)/b*100):0; } },
  ],
  seedData:[
    { asset:'BBCA',                   type:'Saham',     buyValue:10000000, value:12500000 },
    { asset:'Reksa Dana Pasar Uang',  type:'Reksa Dana',buyValue:20000000, value:21200000 },
  ],
};

// ─── MODUL TAMBAHAN (matching navGroups yang belum ada) ────────────────────────

export const RETAIL_STOCK_ADJUSTMENT: ModuleDef = {
  id:'retail_stock_adjustment', businessType:'retail', title:'Stock Adjustment',
  subtitle:'Koreksi stok fisik vs sistem', icon:'⚖️', color:'#af52de',
  defaultSort:{ key:'date', dir:'desc' },
  fields:[
    { key:'product',   label:'Produk',      type:'text',   required:true, searchable:true },
    { key:'systemQty', label:'Stok Sistem', type:'number', align:'right' },
    { key:'actualQty', label:'Stok Fisik',  type:'number', align:'right' },
    { key:'variance',  label:'Selisih',     type:'computed', align:'right',
      compute: r => (Number(r.actualQty)||0)-(Number(r.systemQty)||0) },
    { key:'reason',    label:'Alasan',      type:'select',
      options:['Opname','Rusak','Hilang','Retur','Koreksi'], defaultValue:'Opname' },
    { key:'date',      label:'Tanggal',     type:'date' },
  ],
  kpis:[
    { key:'adjustments', label:'Penyesuaian',    icon:'⚖️', color:'#af52de', format:'number',
      compute: rows => rows.length },
    { key:'shrinkage',   label:'Total Shrinkage', icon:'📉', color:'#ff3b30', format:'number',
      compute: rows => rows.reduce((s,r)=>{ const v=(Number(r.actualQty)||0)-(Number(r.systemQty)||0); return s+(v<0?Math.abs(v):0); },0) },
  ],
  seedData:[{ product:'Sepatu Sneakers', systemQty:50, actualQty:48, reason:'Opname', date:'2026-06-14' }],
};

export const AGENCY_TIMESHEETS: ModuleDef = {
  id:'agency_timesheets', businessType:'agency', title:'Timesheets & Utilization',
  subtitle:'Jam kerja & utilisasi tim', icon:'⏱', color:'#5ac8fa',
  defaultSort:{ key:'date', dir:'desc' },
  fields:[
    { key:'member',   label:'Anggota Tim', type:'text',    required:true, searchable:true },
    { key:'project',  label:'Proyek',      type:'text',    searchable:true },
    { key:'date',     label:'Tanggal',     type:'date' },
    { key:'hours',    label:'Jam',         type:'number',  align:'right' },
    { key:'billable', label:'Billable',    type:'boolean', defaultValue:true },
    { key:'rate',     label:'Rate/jam',    type:'currency',align:'right' },
    { key:'value',    label:'Nilai',       type:'computed',align:'right',
      compute: r => (Number(r.hours)||0)*(Number(r.rate)||0) },
  ],
  kpis:[
    { key:'totalhours',   label:'Total Jam',      icon:'⏱', color:'#5ac8fa', format:'number',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.hours)||0),0) },
    { key:'billablevalue',label:'Nilai Billable', icon:'💰', color:'#34c759', format:'currency',
      compute: rows => rows.filter(r=>r.billable).reduce((s,r)=>s+(Number(r.hours)||0)*(Number(r.rate)||0),0) },
    { key:'utilization',  label:'Utilization %',  icon:'📊', color:'#4f46e5', format:'percent',
      compute: rows => { const t=rows.reduce((s,r)=>s+(Number(r.hours)||0),0); const b=rows.filter(r=>r.billable).reduce((s,r)=>s+(Number(r.hours)||0),0); return t>0?Math.round(b/t*100):0; } },
  ],
  seedData:[{ member:'Designer A', project:'Rebranding Logo', date:'2026-06-14', hours:8, billable:true, rate:200000 }],
};

export const PROPERTY_MAINTENANCE: ModuleDef = {
  id:'property_maintenance', businessType:'property', title:'Maintenance Tickets',
  subtitle:'Permintaan perbaikan & vendor', icon:'🔧', color:'#5ac8fa',
  defaultSort:{ key:'created_at', dir:'desc' },
  fields:[
    { key:'unit',     label:'Unit',      type:'text',   required:true, searchable:true },
    { key:'issue',    label:'Masalah',   type:'text',   required:true, searchable:true },
    { key:'priority', label:'Prioritas', type:'badge',  defaultValue:'Medium',
      options:['Low','Medium','High','Urgent'],
      badgeColors:{ Low:'#8e8e93',Medium:'#0071e3',High:'#ff9500',Urgent:'#ff3b30' } },
    { key:'vendor',   label:'Vendor',    type:'text' },
    { key:'cost',     label:'Biaya',     type:'currency',align:'right' },
    { key:'status',   label:'Status',    type:'badge',  defaultValue:'Open',
      options:['Open','In Progress','Done'],
      badgeColors:{ Open:'#ff9500','In Progress':'#0071e3',Done:'#34c759' } },
  ],
  kpis:[
    { key:'open',   label:'Tiket Terbuka', icon:'🔧', color:'#ff9500', format:'number',
      compute: rows => rows.filter(r=>r.status!=='Done').length },
    { key:'cost',   label:'Total Biaya',   icon:'💰', color:'#ff3b30', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.cost)||0),0) },
    { key:'urgent', label:'Urgent',        icon:'🚨', color:'#ff3b30', format:'number',
      compute: rows => rows.filter(r=>r.priority==='Urgent'&&r.status!=='Done').length },
  ],
  seedData:[{ unit:'A-101', issue:'AC bocor', priority:'High', vendor:'Tukang AC', cost:350000, status:'Done' }],
};

export const PF_DEBT: ModuleDef = {
  id:'pf_debt', businessType:'personal_finance', title:'Debt Tracking',
  subtitle:'Utang, cicilan, & jadwal lunas', icon:'💳', color:'#ff3b30',
  defaultSort:{ key:'due_date', dir:'asc' },
  fields:[
    { key:'name',      label:'Nama Utang',   type:'text',    required:true, searchable:true },
    { key:'total',     label:'Total Utang',  type:'currency',align:'right' },
    { key:'paid',      label:'Dibayar',      type:'currency',align:'right' },
    { key:'remaining', label:'Sisa',         type:'computed',align:'right',
      compute: r => Math.max(0,(Number(r.total)||0)-(Number(r.paid)||0)) },
    { key:'monthly',   label:'Cicilan/bln',  type:'currency',align:'right' },
    { key:'interest',  label:'Bunga %',      type:'percent', align:'right' },
    { key:'due_date',  label:'Lunas Target', type:'date' },
  ],
  kpis:[
    { key:'totaldebt', label:'Total Utang',   icon:'💳', color:'#ff3b30', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+Math.max(0,(Number(r.total)||0)-(Number(r.paid)||0)),0) },
    { key:'monthly',   label:'Cicilan/bulan', icon:'📅', color:'#ff9500', format:'currency',
      compute: rows => rows.reduce((s,r)=>s+(Number(r.monthly)||0),0) },
    { key:'count',     label:'Jumlah Utang',  icon:'📋', color:'#0071e3', format:'number',
      compute: rows => rows.filter(r=>(Number(r.total)||0)>(Number(r.paid)||0)).length },
  ],
  seedData:[{ name:'KTA Bank', total:30000000, paid:12000000, monthly:2500000, interest:12, due_date:'2027-06-01' }],
};

export const RETAIL_MARKETPLACE_CALC: ModuleDef = {
  id:'retail_marketplace_calc', businessType:'retail', title:'Kalkulator Marketplace',
  subtitle:'Hitung biaya & profit Shopee/TikTok/Tokopedia', icon:'🛒', color:'#f97316',
  defaultSort:{ key:'product', dir:'asc' },
  fields:[
    { key:'product',      label:'Produk',          type:'text',    required:true, searchable:true },
    { key:'platform',     label:'Platform',        type:'select',  options:['Shopee','TikTok Shop','Tokopedia','Lazada','Blibli'], defaultValue:'Shopee' },
    { key:'hpp',          label:'HPP/pcs',         type:'currency',align:'right' },
    { key:'sellPrice',    label:'Harga Jual',      type:'currency',align:'right' },
    { key:'platformFee',  label:'Biaya Platform %',type:'percent', defaultValue:5, align:'right' },
    { key:'shippingDisc', label:'Diskon Ongkir',   type:'currency',align:'right', defaultValue:0 },
    { key:'grossProfit',  label:'Gross Profit',    type:'computed',align:'right',
      compute: r => {
        const sell=Number(r.sellPrice)||0; const hpp=Number(r.hpp)||0;
        const fee=sell*(Number(r.platformFee)||0)/100; const disc=Number(r.shippingDisc)||0;
        return sell-hpp-fee-disc;
      } },
    { key:'margin',       label:'Margin %',        type:'computed',align:'right',
      compute: r => {
        const sell=Number(r.sellPrice)||0;
        if(!sell) return 0;
        const hpp=Number(r.hpp)||0; const fee=sell*(Number(r.platformFee)||0)/100;
        return Math.round((sell-hpp-fee)/sell*100);
      } },
  ],
  kpis:[
    { key:'avgmargin',  label:'Avg Margin',    icon:'📈', color:'#f97316', format:'percent',
      compute: rows => { const v=rows.filter(r=>Number(r.sellPrice)>0); return v.length?Math.round(v.reduce((s,r)=>{ const sell=Number(r.sellPrice)||0; const hpp=Number(r.hpp)||0; const fee=sell*(Number(r.platformFee)||0)/100; return s+(sell>0?(sell-hpp-fee)/sell*100:0); },0)/v.length):0; } },
    { key:'products',   label:'Produk',        icon:'📦', color:'#2563eb', format:'number',
      compute: rows => rows.length },
    { key:'profitable', label:'Profitable',    icon:'✅', color:'#34c759', format:'number',
      compute: rows => rows.filter(r=>(Number(r.sellPrice)||0)-(Number(r.hpp)||0)-(((Number(r.sellPrice)||0)*(Number(r.platformFee)||0)/100))>0).length },
  ],
  seedData:[
    { product:'Hoodie Oversize', platform:'Shopee',     hpp:225000, sellPrice:399000, platformFee:5, shippingDisc:0 },
    { product:'Kaos Basic',      platform:'TikTok Shop',hpp:60000,  sellPrice:129000, platformFee:4, shippingDisc:10000 },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const ALL_DEEP_MODULES: ModuleDef[] = [
  FASHION_BOM, FASHION_PRODUCTION_ORDER, FASHION_QC, FASHION_FINISHED_GOODS,
  COFFEE_RECIPE, COFFEE_MENU_COSTING, COFFEE_WASTE, COFFEE_DAILY_CLOSING,
  RETAIL_GOODS_RECEIVING, RETAIL_REORDER, RETAIL_STOCK_ADJUSTMENT, RETAIL_MARKETPLACE_CALC,
  AGENCY_CLIENTS, AGENCY_PROJECTS, AGENCY_TIMESHEETS,
  PROPERTY_UNITS, PROPERTY_RENT, PROPERTY_MAINTENANCE,
  PF_SAVINGS, PF_INVESTMENT, PF_DEBT,
];

export function findModuleByTitle(title: string): ModuleDef | undefined {
  return ALL_DEEP_MODULES.find(m => m.title === title);
}

export function getModulesByBusinessType(type: string): ModuleDef[] {
  return ALL_DEEP_MODULES.filter(m => m.businessType === type);
}
