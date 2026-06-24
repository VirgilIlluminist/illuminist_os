/**
 * erpSupabase.ts — Supabase data access for ERPContext's core entities.
 *
 * Bridges the UI's camelCase models (src/types.ts) and the snake_case Supabase
 * schema (server/db/migrations/master_schema.sql). Covers the 5 entities that
 * exist as real Supabase tables AND have migration mappings:
 *   suppliers · materials · products · customers · sales_orders
 *
 * Reads resolve UUID foreign keys back to human-readable `code`s so the UI keeps
 * using "MTL-001"-style ids. Writes target rows by (company_id, code), so the UI
 * never needs to know the UUID.
 *
 * Other ERP entities (samples, production, variants, ads, kol, ops, assets,
 * cashflow, purchase orders) have no Supabase table in this schema and remain
 * localStorage-backed in ERPContext.
 */
import { supabase } from '../../infra/supabase/client';
import type {
  Material, MasterProduct, Supplier, Customer, SalesRecord,
  SampleDevelopment, ProductionBatch, SizeVariantInventory,
  AdsCampaign, KolTracking, PurchaseOrder,
  AssetEquipment, CashTransaction, OperationalCost,
} from '../../types';

// ─── Enum mapping (UI ↔ DB) ────────────────────────────────────────────────────

const SUPPLIER_TIER_TO_DB: Record<Supplier['tier'], string> = {
  Preferred: 'Premier', Secondary: 'Standard', Backup: 'Backup',
};
const SUPPLIER_TIER_FROM_DB: Record<string, Supplier['tier']> = {
  Premier: 'Preferred', Standard: 'Secondary', Backup: 'Backup',
};

const CUSTOMER_TIER_TO_SEGMENT: Record<Customer['tier'], string> = {
  Platinum: 'VIP', Gold: 'Wholesale', Silver: 'Reseller', Standard: 'Regular',
};
const CUSTOMER_SEGMENT_TO_TIER: Record<string, Customer['tier']> = {
  VIP: 'Platinum', Wholesale: 'Gold', Reseller: 'Silver', Regular: 'Standard',
};

const PRODUCT_STATUS_TO_DB: Record<MasterProduct['status'], string> = {
  Active: 'active', Draft: 'draft', Archived: 'archived',
};
const PRODUCT_STATUS_FROM_DB: Record<string, MasterProduct['status']> = {
  active: 'Active', draft: 'Draft', archived: 'Archived', discontinued: 'Archived',
};

// ─── Row shapes (loose — only the columns we touch) ─────────────────────────────

interface Row { [k: string]: unknown }
const str = (v: unknown, d = '') => (v == null ? d : String(v));
const num = (v: unknown, d = 0) => (v == null || v === '' ? d : Number(v) || 0);

// ─── Hydration result ───────────────────────────────────────────────────────────

export interface HydratedERP {
  suppliers: Supplier[];
  materials: Material[];
  products: MasterProduct[];
  customers: Customer[];
  sales: SalesRecord[];
  samples: SampleDevelopment[];
  production: ProductionBatch[];
  variants: SizeVariantInventory[];
  adsCampaigns: AdsCampaign[];
  kols: KolTracking[];
  purchaseOrders: PurchaseOrder[];
  assets: AssetEquipment[];
  cashflow: CashTransaction[];
  operationalCosts: OperationalCost[];
}

/**
 * Load all 5 core entities for a company and map them into UI models.
 * Resolves FK UUIDs → codes and folds inventory_transactions into material stock.
 */
export async function hydrateFromSupabase(companyId: string): Promise<HydratedERP> {
  const empty: HydratedERP = {
    suppliers: [], materials: [], products: [], customers: [], sales: [],
    samples: [], production: [], variants: [], adsCampaigns: [], kols: [],
    purchaseOrders: [], assets: [], cashflow: [], operationalCosts: [],
  };
  if (!supabase || !companyId) return empty;

  const fetchTable = async (table: string): Promise<Row[]> => {
    try {
      const res = await (supabase as any)
        .from(table)
        .select('*')
        .eq('company_id', companyId);
      if (res.error) return [];
      return (res.data ?? []) as Row[];
    } catch {
      return [];
    }
  };

  const [
    supRows, matRows, prodRows, custRows, saleRows, invRows,
    smpRows, smpMatRows, prdRows, prdMatRows, varRows,
    adsRows, kolRows, poRows, astRows, cashRows, opsRows,
  ] = await Promise.all([
    fetchTable('suppliers'),
    fetchTable('materials'),
    fetchTable('products'),
    fetchTable('customers'),
    fetchTable('sales_orders'),
    fetchTable('inventory_transactions'),
    fetchTable('samples'),
    fetchTable('sample_materials'),
    fetchTable('production_orders'),
    fetchTable('production_materials'),
    fetchTable('product_variants'),
    fetchTable('ads_campaigns'),
    fetchTable('kol_records'),
    fetchTable('purchase_orders'),
    fetchTable('assets'),
    fetchTable('cashflow_transactions'),
    fetchTable('operational_costs'),
  ]);

  // Skip soft-deleted rows
  const live = (rows: Row[]) => rows.filter(r => !r.deleted_at);

  // FK resolution maps (uuid → code / name)
  const supCodeByUuid = new Map<string, string>();
  const prodCodeByUuid = new Map<string, string>();
  const custNameByUuid = new Map<string, string>();

  live(supRows).forEach(r => supCodeByUuid.set(str(r.id), str(r.code, str(r.id))));
  live(prodRows).forEach(r => prodCodeByUuid.set(str(r.id), str(r.code, str(r.id))));
  live(custRows).forEach(r => custNameByUuid.set(str(r.id), str(r.name)));

  // Material stock from inventory_transactions. Inbound types add, outbound
  // subtract (matches the schema CHECK on inventory_transactions.type).
  const INBOUND = new Set(['purchase_in', 'return_in', 'adjustment']);
  const stockByMaterialUuid = new Map<string, number>();
  live(invRows).forEach(r => {
    const mid = str(r.material_id);
    if (!mid) return;
    const qty = num(r.qty);
    const signed = INBOUND.has(str(r.type)) ? qty : -qty;
    stockByMaterialUuid.set(mid, (stockByMaterialUuid.get(mid) ?? 0) + signed);
  });

  const suppliers: Supplier[] = live(supRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    contact: str(r.contact),
    performanceIndex: num(r.performance_idx, 80),
    tier: SUPPLIER_TIER_FROM_DB[str(r.tier)] ?? 'Secondary',
  }));

  const materials: Material[] = live(matRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    category: str(r.category),
    supplierId: supCodeByUuid.get(str(r.supplier_id)) ?? '',
    unit: str(r.unit, 'meter'),
    baseQty: stockByMaterialUuid.get(str(r.id)) ?? 0,
    notes: str(r.notes),
    costPerUnit: num(r.cost_per_unit),
    minStock: num(r.min_stock),
    image: r.image_url ? str(r.image_url) : undefined,
  }));

  const products: MasterProduct[] = live(prodRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    collection: str(r.collection, str(r.collection_season)),
    category: str(r.category),
    sellingPrice: num(r.selling_price),
    status: PRODUCT_STATUS_FROM_DB[str(r.status)] ?? 'Active',
    image: r.image_url ? str(r.image_url) : (r.cover_image_url ? str(r.cover_image_url) : undefined),
  }));

  const customers: Customer[] = live(custRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    email: str(r.email),
    tier: CUSTOMER_SEGMENT_TO_TIER[str(r.segment)] ?? 'Standard',
  }));

  const sales: SalesRecord[] = live(saleRows).map(r => ({
    id: str(r.code, str(r.id)),
    date: str(r.sale_date, new Date().toISOString().split('T')[0]),
    productId: prodCodeByUuid.get(str(r.product_id)) ?? '',
    variantSku: '',
    customerName: custNameByUuid.get(str(r.customer_id)) ?? str(r.product_name),
    channel: str(r.channel, 'Direct'),
    qtySold: num(r.qty_sold, 1),
    pricePerPcs: num(r.unit_price),
    platformFee: num(r.platform_fee),
    shippingFee: 0,
    discount: num(r.discount),
    status: (str(r.fulfillment, 'Completed') as SalesRecord['status']),
  }));

  // ── Samples ───────────────────────────────────────────────────────────────
  // Join sample_materials to restore single-material model of SampleDevelopment
  const smpMatBySampleUuid = new Map<string, Row>();
  live(smpMatRows).forEach(r => {
    const sid = str(r.sample_id);
    if (sid && !smpMatBySampleUuid.has(sid)) smpMatBySampleUuid.set(sid, r);
  });

  const SAMPLE_STATUS_FROM_DB: Record<string, SampleDevelopment['status']> = {
    Sampling: 'Sampling', Approved: 'Approved', Rejected: 'Rejected', Archived: 'Rejected',
  };

  const samples: SampleDevelopment[] = live(smpRows).map(r => {
    const sm = smpMatBySampleUuid.get(str(r.id));
    const matCode = sm ? (supCodeByUuid.get(str(sm.material_id)) || str(sm.material_id)) : '';
    const matUuid = sm ? str(sm.material_id) : '';
    // Resolve material code from materials map
    const matCodeResolved = live(matRows).find(m => str(m.id) === matUuid) ?
      str(live(matRows).find(m => str(m.id) === matUuid)!.code, matUuid) : matCode;
    return {
      id: str(r.code, str(r.id)),
      productId: prodCodeByUuid.get(str(r.product_id)) ?? '',
      productName: str(r.product_name),
      version: str(r.version, 'v1.0'),
      materialId: matCodeResolved,
      usageQty: sm ? num(sm.usage_qty) : 0,
      wastePercentage: sm ? num(sm.waste_pct) : 0,
      laborCost: num(r.labor_cost),
      status: SAMPLE_STATUS_FROM_DB[str(r.status)] ?? 'Sampling',
      createdDate: str(r.sample_date, new Date().toISOString().split('T')[0]),
      notes: str(r.notes),
    };
  });

  // ── Production ────────────────────────────────────────────────────────────
  const prdMatByPrdUuid = new Map<string, Row>();
  live(prdMatRows).forEach(r => {
    const pid = str(r.production_id);
    if (pid && !prdMatByPrdUuid.has(pid)) prdMatByPrdUuid.set(pid, r);
  });

  const PROD_STATUS_FROM_DB: Record<string, ProductionBatch['productionStatus']> = {
    Planned: 'Scheduled', 'In Progress': 'In Progress', Completed: 'Completed', Cancelled: 'Completed',
  };
  const QC_STATUS_FROM_DB: Record<string, ProductionBatch['qcStatus']> = {
    Pending: 'Pending', Passed: 'Passed', Failed: 'Failed',
  };

  const matCodeByUuid = new Map<string, string>();
  live(matRows).forEach(r => matCodeByUuid.set(str(r.id), str(r.code, str(r.id))));

  const production: ProductionBatch[] = live(prdRows).map(r => {
    const pm = prdMatByPrdUuid.get(str(r.id));
    return {
      id: str(r.code, str(r.id)),
      productId: prodCodeByUuid.get(str(r.product_id)) ?? '',
      productName: str(r.product_name),
      factory: str(r.factory),
      qty: num(r.qty),
      materialId: pm ? (matCodeByUuid.get(str(pm.material_id)) ?? '') : '',
      usagePerPcs: pm ? num(pm.usage_per_pcs) : 0,
      laborCost: num(r.labor_cost),
      packagingCost: num(r.packaging_cost),
      qcStatus: QC_STATUS_FROM_DB[str(r.qc_status)] ?? 'Pending',
      productionStatus: PROD_STATUS_FROM_DB[str(r.production_status)] ?? 'Scheduled',
      productionDate: str(r.production_date, new Date().toISOString().split('T')[0]),
      notes: str(r.notes),
    };
  });

  // ── Variants ──────────────────────────────────────────────────────────────
  const variants: SizeVariantInventory[] = live(varRows)
    .filter(r => str(r.sku))
    .map(r => {
      const prodCode = prodCodeByUuid.get(str(r.product_id)) ?? '';
      return {
        sku: str(r.sku),
        productId: prodCode,
        productName: str(r.product_name),
        color: str(r.color),
        size: str(r.size),
        currentStock: num(r.current_stock),
        minStock: num(r.min_stock),
      };
    });

  // ── Ads Campaigns ─────────────────────────────────────────────────────────
  const adsCampaigns: AdsCampaign[] = live(adsRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    platform: (str(r.platform) as AdsCampaign['platform']) || 'Meta Ads',
    productId: str(r.product_code),
    spend: num(r.spend),
    revenue: num(r.revenue),
    cpc: num(r.cpc),
    cpm: num(r.cpm),
    ctr: num(r.ctr),
    conversionRate: num(r.conversion_rate),
  }));

  // ── KOL Records ───────────────────────────────────────────────────────────
  const KOL_STATUS_FROM_DB: Record<string, KolTracking['status']> = {
    Negotiation: 'Negotiation', Contracted: 'Contracted',
    'Content Posted': 'Content Posted', Completed: 'Completed', Active: 'Contracted',
  };
  const kols: KolTracking[] = live(kolRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    platform: (str(r.platform) as KolTracking['platform']) || 'Instagram',
    followers: num(r.followers),
    cost: num(r.fee),
    revenueGenerated: num(r.revenue_generated) || num(r.sales_result),
    campaignId: str(r.campaign_code),
    status: KOL_STATUS_FROM_DB[str(r.kol_status)] ?? KOL_STATUS_FROM_DB[str(r.status)] ?? 'Contracted',
  }));

  // ── Purchase Orders ───────────────────────────────────────────────────────
  const PO_STATUS_FROM_DB: Record<string, PurchaseOrder['status']> = {
    Draft: 'Draft', Sent: 'Sent', Confirmed: 'Sent', Received: 'Received', Cancelled: 'Cancelled',
  };
  const purchaseOrders: PurchaseOrder[] = live(poRows).map(r => ({
    id: str(r.code, str(r.id)),
    supplierId: supCodeByUuid.get(str(r.supplier_id)) ?? '',
    materialId: matCodeByUuid.get(str(r.material_id)) ?? '',
    qty: num(r.qty),
    unitCost: num(r.unit_cost),
    date: str(r.order_date, new Date().toISOString().split('T')[0]),
    status: PO_STATUS_FROM_DB[str(r.status)] ?? 'Draft',
  }));

  // ── Assets ────────────────────────────────────────────────────────────────
  const ASSET_STATUS_FROM_DB: Record<string, AssetEquipment['status']> = {
    Operational: 'Operational', Maintenance: 'Maintenance', Offline: 'Offline',
    New: 'Operational', Good: 'Operational', Fair: 'Maintenance', Poor: 'Maintenance', Disposed: 'Offline',
  };
  const assets: AssetEquipment[] = live(astRows).map(r => ({
    id: str(r.code, str(r.id)),
    name: str(r.name),
    qty: num(r.qty, 1),
    purchaseValue: num(r.purchase_value),
    depreciation: num(r.depreciation_pct),
    status: ASSET_STATUS_FROM_DB[str(r.operational_status)] ?? ASSET_STATUS_FROM_DB[str(r.condition)] ?? 'Operational',
    category: r.category ? str(r.category) : undefined,
  }));

  // ── Cashflow Transactions ─────────────────────────────────────────────────
  const cashflow: CashTransaction[] = live(cashRows).map(r => ({
    id: str(r.code, str(r.id)),
    date: str(r.tx_date, new Date().toISOString().split('T')[0]),
    type: str(r.type) === 'income' ? 'Inflow' : 'Outflow',
    category: str(r.category),
    amount: num(r.amount),
    notes: str(r.description),
  }));

  // ── Operational Costs ─────────────────────────────────────────────────────
  const operationalCosts: OperationalCost[] = live(opsRows).map(r => ({
    id: str(r.code, str(r.id)),
    category: str(r.category) || str(r.name),
    campaignId: str(r.campaign_code),
    productId: str(r.product_code),
    amount: num(r.amount),
    date: str(r.cost_date, new Date().toISOString().split('T')[0]),
    platform: str(r.platform),
    notes: str(r.notes),
  }));

  return {
    suppliers, materials, products, customers, sales,
    samples, production, variants, adsCampaigns, kols,
    purchaseOrders, assets, cashflow, operationalCosts,
  };
}

// ─── Write-through helpers (target rows by company_id + code) ───────────────────
// Fire-and-forget from the UI's perspective; errors are returned, not thrown.

async function upsertByCode(table: string, companyId: string, code: string, row: Row): Promise<void> {
  if (!supabase) return;
  try {
    await (supabase as any).from(table).upsert(
      { ...row, company_id: companyId, code },
      { onConflict: 'company_id,code' },
    );
  } catch { /* best-effort; UI already updated optimistically */ }
}

async function upsertByCodeReturning(table: string, companyId: string, code: string, row: Row): Promise<Row | null> {
  if (!supabase) return null;
  try {
    const { data } = await (supabase as any).from(table).upsert(
      { ...row, company_id: companyId, code },
      { onConflict: 'company_id,code' },
    ).select('id').single();
    return data as Row ?? null;
  } catch { return null; }
}

async function softDeleteByCode(table: string, companyId: string, code: string): Promise<void> {
  if (!supabase) return;
  try {
    await (supabase as any).from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('company_id', companyId).eq('code', code);
  } catch { /* best-effort */ }
}

// Resolve a code → uuid for FK columns (one extra lookup; cached per call)
async function uuidForCode(table: string, companyId: string, code: string): Promise<string | null> {
  if (!supabase || !code) return null;
  try {
    const { data } = await (supabase as any).from(table)
      .select('id').eq('company_id', companyId).eq('code', code).limit(1).maybeSingle();
    return data?.id ?? null;
  } catch { return null; }
}

// ── Suppliers ──
export const sbSupplier = {
  save: (companyId: string, s: Supplier) => upsertByCode('suppliers', companyId, s.id, {
    name: s.name, contact: s.contact,
    performance_idx: s.performanceIndex,
    tier: SUPPLIER_TIER_TO_DB[s.tier] ?? 'Standard',
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('suppliers', companyId, code),
};

// ── Materials ──
export const sbMaterial = {
  save: async (companyId: string, m: Material) => {
    const supplier_id = m.supplierId ? await uuidForCode('suppliers', companyId, m.supplierId) : null;
    await upsertByCode('materials', companyId, m.id, {
      name: m.name, category: m.category || null, unit: m.unit || 'meter',
      cost_per_unit: m.costPerUnit, min_stock: m.minStock,
      notes: m.notes || null, image_url: m.image || null, supplier_id,
    });
  },
  remove: (companyId: string, code: string) => softDeleteByCode('materials', companyId, code),
};

// ── Products ──
export const sbProduct = {
  save: (companyId: string, p: MasterProduct) => upsertByCode('products', companyId, p.id, {
    name: p.name, collection: p.collection || null, collection_season: p.collection || null,
    selling_price: p.sellingPrice,
    status: PRODUCT_STATUS_TO_DB[p.status] ?? 'active',
    image_url: p.image || null,
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('products', companyId, code),
};

// ── Customers ──
export const sbCustomer = {
  save: (companyId: string, c: Customer) => upsertByCode('customers', companyId, c.id, {
    name: c.name, email: c.email || null,
    segment: CUSTOMER_TIER_TO_SEGMENT[c.tier] ?? 'Regular',
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('customers', companyId, code),
};

// ── Samples ──
export const sbSample = {
  save: async (companyId: string, s: SampleDevelopment) => {
    if (!supabase) return;
    const product_id = s.productId ? await uuidForCode('products', companyId, s.productId) : null;
    const STATUS_TO_DB: Record<SampleDevelopment['status'], string> = {
      Design: 'Sampling', Sampling: 'Sampling', Approved: 'Approved', Rejected: 'Rejected',
    };
    const smpRow = await upsertByCodeReturning('samples', companyId, s.id, {
      product_id, product_name: s.productName,
      version: s.version, status: STATUS_TO_DB[s.status] ?? 'Sampling',
      labor_cost: s.laborCost, notes: s.notes || null,
      sample_date: s.createdDate || new Date().toISOString().split('T')[0],
    });
    if (!smpRow?.id || !s.materialId) return;
    const material_id = await uuidForCode('materials', companyId, s.materialId);
    try {
      await (supabase as any).from('sample_materials').upsert({
        company_id: companyId, sample_id: smpRow.id,
        material_id, material_name: s.materialId,
        usage_qty: s.usageQty, waste_pct: s.wastePercentage,
      }, { onConflict: 'sample_id' });
    } catch { /* best-effort */ }
  },
  remove: (companyId: string, code: string) => softDeleteByCode('samples', companyId, code),
};

// ── Production ──
export const sbProduction = {
  save: async (companyId: string, p: ProductionBatch) => {
    if (!supabase) return;
    const product_id = p.productId ? await uuidForCode('products', companyId, p.productId) : null;
    const STATUS_TO_DB: Record<ProductionBatch['productionStatus'], string> = {
      Scheduled: 'Planned', 'In Progress': 'In Progress', Completed: 'Completed', Delayed: 'In Progress',
    };
    const prdRow = await upsertByCodeReturning('production_orders', companyId, p.id, {
      product_id, product_name: p.productName, factory: p.factory,
      qty: p.qty, labor_cost: p.laborCost, packaging_cost: p.packagingCost,
      qc_status: p.qcStatus, production_status: STATUS_TO_DB[p.productionStatus] ?? 'Planned',
      production_date: p.productionDate || null, notes: p.notes || null,
    });
    if (!prdRow?.id || !p.materialId) return;
    const material_id = await uuidForCode('materials', companyId, p.materialId);
    try {
      await (supabase as any).from('production_materials').upsert({
        company_id: companyId, production_id: prdRow.id,
        material_id, material_name: p.materialId,
        usage_per_pcs: p.usagePerPcs,
      }, { onConflict: 'production_id' });
    } catch { /* best-effort */ }
  },
  remove: (companyId: string, code: string) => softDeleteByCode('production_orders', companyId, code),
};

// ── Variants ──
export const sbVariant = {
  save: async (companyId: string, v: SizeVariantInventory) => {
    if (!supabase) return;
    const product_id = v.productId ? await uuidForCode('products', companyId, v.productId) : null;
    try {
      await (supabase as any).from('product_variants').upsert({
        company_id: companyId, product_id, sku: v.sku,
        product_name: v.productName, color: v.color, size: v.size,
        current_stock: v.currentStock, min_stock: v.minStock,
      }, { onConflict: 'company_id,sku' });
    } catch { /* best-effort */ }
  },
  remove: async (companyId: string, sku: string) => {
    if (!supabase) return;
    try {
      await (supabase as any).from('product_variants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('company_id', companyId).eq('sku', sku);
    } catch { /* best-effort */ }
  },
};

// ── Ads Campaigns ──
export const sbAds = {
  save: (companyId: string, a: AdsCampaign) => upsertByCode('ads_campaigns', companyId, a.id, {
    name: a.name, platform: a.platform, product_code: a.productId,
    spend: a.spend, revenue: a.revenue, cpc: a.cpc, cpm: a.cpm,
    ctr: a.ctr, conversion_rate: a.conversionRate,
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('ads_campaigns', companyId, code),
};

// ── KOL Records ──
export const sbKol = {
  save: (companyId: string, k: KolTracking) => upsertByCode('kol_records', companyId, k.id, {
    name: k.name, platform: k.platform, followers: k.followers,
    fee: k.cost, revenue_generated: k.revenueGenerated, sales_result: k.revenueGenerated,
    campaign_code: k.campaignId, campaign: k.campaignId, kol_status: k.status,
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('kol_records', companyId, code),
};

// ── Purchase Orders ──
export const sbPurchaseOrder = {
  save: async (companyId: string, po: PurchaseOrder) => {
    const supplier_id = po.supplierId ? await uuidForCode('suppliers', companyId, po.supplierId) : null;
    const material_id = po.materialId ? await uuidForCode('materials', companyId, po.materialId) : null;
    await upsertByCode('purchase_orders', companyId, po.id, {
      supplier_id, material_id, qty: po.qty, unit_cost: po.unitCost,
      status: po.status, order_date: po.date,
    });
  },
  remove: (companyId: string, code: string) => softDeleteByCode('purchase_orders', companyId, code),
};

// ── Assets ──
export const sbAsset = {
  save: (companyId: string, a: AssetEquipment) => upsertByCode('assets', companyId, a.id, {
    name: a.name, qty: a.qty, purchase_value: a.purchaseValue,
    depreciation_pct: a.depreciation, operational_status: a.status,
    category: a.category || null,
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('assets', companyId, code),
};

// ── Cashflow Transactions ──
export const sbCashTransaction = {
  save: (companyId: string, c: CashTransaction) => upsertByCode('cashflow_transactions', companyId, c.id, {
    description: c.notes || c.category,
    amount: c.amount,
    type: c.type === 'Inflow' ? 'income' : 'expense',
    category: c.category,
    tx_date: c.date,
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('cashflow_transactions', companyId, code),
};

// ── Operational Costs ──
export const sbOpsCost = {
  save: (companyId: string, o: OperationalCost) => upsertByCode('operational_costs', companyId, o.id, {
    name: o.category, category: o.category, amount: o.amount,
    campaign_code: o.campaignId || null, product_code: o.productId || null,
    platform: o.platform || null, notes: o.notes || null, cost_date: o.date,
  }),
  remove: (companyId: string, code: string) => softDeleteByCode('operational_costs', companyId, code),
};

// ── Sales ──
export const sbSale = {
  save: async (companyId: string, s: SalesRecord) => {
    const product_id = s.productId ? await uuidForCode('products', companyId, s.productId) : null;
    await upsertByCode('sales_orders', companyId, s.id, {
      product_id, product_name: '',
      qty_sold: s.qtySold, unit_price: s.pricePerPcs,
      platform_fee: s.platformFee, discount: s.discount,
      net_revenue: (s.qtySold * s.pricePerPcs) - s.platformFee - s.shippingFee - s.discount,
      channel: s.channel, fulfillment: s.status, sale_date: s.date,
    });
  },
  remove: (companyId: string, code: string) => softDeleteByCode('sales_orders', companyId, code),
};
