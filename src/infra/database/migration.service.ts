/**
 * migration.service.ts — localStorage → Supabase Migration
 *
 * Dijalankan SEKALI saat user pertama kali setup Supabase.
 * Membaca semua data dari localStorage dan INSERT ke Supabase.
 *
 * Cara pakai:
 *   import migrationService from './migration.service';
 *   const result = await migrationService.migrateAll(companyId);
 */
import { STORAGE_KEYS, storageGet } from '../../core/utils/storage';
import { supabase, isSupabaseEnabled } from '../supabase/client';

export interface MigrationResult {
  success:  boolean;
  migrated: Record<string, number>;
  errors:   string[];
  duration: number;
}

const migrationService = {

  /**
   * Jalankan migrasi penuh dari localStorage ke Supabase
   * Aman dijalankan berkali-kali (idempotent via upsert dengan ignoreDuplicates)
   */
  async migrateAll(companyId: string): Promise<MigrationResult> {
    const start   = Date.now();
    const migrated: Record<string, number> = {};
    const errors: string[] = [];

    if (!isSupabaseEnabled || !supabase) {
      return {
        success:  false,
        migrated: {},
        errors:   ['Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ke .env'],
        duration: Date.now() - start,
      };
    }

    // Read all data from localStorage
    const materials  = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.materials,  []);
    const products   = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.products,   []);
    const samples    = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.samples,    []);
    const production = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.production, []);
    const variants   = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.variants,   []);
    const sales      = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.sales,      []);
    const ops        = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.ops,        []);
    const ads        = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.ads,        []);
    const kols       = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.kols,       []);
    const pos        = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.pos,        []);
    const suppliers  = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.suppliers,  []);
    const customers  = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.customers,  []);
    const assets     = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.assets,     []);
    const cashflow   = storageGet<Record<string, unknown>[]>(STORAGE_KEYS.cash,       []);

    // ── Map helpers ─────────────────────────────────────────────────────────────

    const mapMaterial = (m: Record<string, unknown>) => ({
      company_id:    companyId,
      code:          m.id as string,
      name:          m.name as string,
      category:      (m.category as string) || null,
      unit:          (m.unit as string) || 'meter',
      cost_per_unit: Number(m.costPerUnit) || 0,
      min_stock:     Number(m.minStock)    || 0,
      image_url:     (m.imageUrl as string) || null,
      notes:         (m.notes as string)   || null,
    });

    const mapProduct = (p: Record<string, unknown>) => ({
      company_id:       companyId,
      code:             p.id as string,
      name:             p.name as string,
      collection_season:(p.collectionSeason as string) || null,
      selling_price:    Number(p.sellingPrice) || 0,
      description:      (p.description as string) || null,
      image_url:        null,
    });

    const mapSale = (s: Record<string, unknown>) => ({
      company_id:   companyId,
      code:         s.id as string,
      product_name: (s.productName as string) || (s.product as string) || '',
      qty_sold:     Number(s.qtySold)   || 1,
      unit_price:   Number(s.pricePerPcs || s.unitPrice) || 0,
      platform_fee: Number(s.platformFee) || 0,
      discount:     Number(s.discount)  || 0,
      net_revenue:  Number(s.netRevenue) || 0,
      channel:      (s.channel as string) || 'Direct',
      fulfillment:  (s.status as string) || 'Pending',
      sale_date:    (s.date as string) || new Date().toISOString().split('T')[0],
    });

    const mapSupplier = (s: Record<string, unknown>) => ({
      company_id:      companyId,
      code:            s.id as string,
      name:            s.name as string,
      contact:         (s.contact as string) || null,
      performance_idx: Number(s.performanceIndex) || 80,
      tier:            (s.tier as string) || 'Standard',
    });

    const mapCustomer = (c: Record<string, unknown>) => ({
      company_id: companyId,
      code:       c.id as string,
      name:       c.name as string,
      email:      (c.email as string) || null,
      phone:      (c.phone as string) || null,
      segment:    (c.segment as string) || 'Regular',
    });

    // ── Upsert to Supabase (idempotent) ─────────────────────────────────────────

    const upsertBatch = async (
      table: string,
      rows: Record<string, unknown>[],
      onConflict: string,
    ): Promise<number> => {
      if (rows.length === 0) return 0;
      const { data, error } = await (supabase as any)
        .from(table)
        .upsert(rows, { onConflict, ignoreDuplicates: true })
        .select('id');
      if (error) errors.push(`${table}: ${error.message}`);
      return (data?.length ?? 0) as number;
    };

    migrated.materials = await upsertBatch('materials',   materials.map(mapMaterial), 'company_id,code');
    migrated.products  = await upsertBatch('products',    products.map(mapProduct),   'company_id,code');
    migrated.sales     = await upsertBatch('sales_orders', sales.map(mapSale),        'company_id,code');
    migrated.suppliers = await upsertBatch('suppliers',   suppliers.map(mapSupplier), 'company_id,code');
    migrated.customers = await upsertBatch('customers',   customers.map(mapCustomer), 'company_id,code');

    // Tables not yet migrated — count only
    migrated.samples    = samples.length;
    migrated.production = production.length;
    migrated.variants   = variants.length;
    migrated.ops        = ops.length;
    migrated.ads        = ads.length;
    migrated.kols       = kols.length;
    migrated.pos        = pos.length;
    migrated.assets     = assets.length;
    migrated.cashflow   = cashflow.length;

    return {
      success:  errors.length === 0,
      migrated,
      errors,
      duration: Date.now() - start,
    };
  },

  /** Preview migration — hitung jumlah record tanpa memindahkan */
  previewMigration() {
    const tables = [
      ['materials',  STORAGE_KEYS.materials],
      ['products',   STORAGE_KEYS.products],
      ['sales',      STORAGE_KEYS.sales],
      ['suppliers',  STORAGE_KEYS.suppliers],
      ['customers',  STORAGE_KEYS.customers],
      ['cashflow',   STORAGE_KEYS.cash],
    ] as const;

    const counts: Record<string, number> = {};
    for (const [name, key] of tables) {
      counts[name] = storageGet<unknown[]>(key, []).length;
    }
    return counts;
  },
};

export default migrationService;
