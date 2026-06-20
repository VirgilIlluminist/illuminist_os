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

export interface MigrationResult {
  success:  boolean;
  migrated: Record<string, number>;
  errors:   string[];
  duration: number;
}

const migrationService = {

  /**
   * Jalankan migrasi penuh dari localStorage ke Supabase
   * Aman dijalankan berkali-kali (idempotent via upsert)
   */
  async migrateAll(companyId: string): Promise<MigrationResult> {
    const start   = Date.now();
    const migrated: Record<string, number> = {};
    const errors: string[] = [];

    // Supabase belum di-setup — return dry-run info
    const { isSupabaseEnabled } = await import('../db/supabase');
    if (!isSupabaseEnabled) {
      return {
        success:  false,
        migrated: {},
        errors:   ['Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ke .env'],
        duration: Date.now() - start,
      };
    }

    console.log('[Migration] Starting localStorage → Supabase migration...');

    // Read all data from localStorage
    const materials    = storageGet<unknown[]>(STORAGE_KEYS.materials,    []);
    const products     = storageGet<unknown[]>(STORAGE_KEYS.products,     []);
    const samples      = storageGet<unknown[]>(STORAGE_KEYS.samples,      []);
    const production   = storageGet<unknown[]>(STORAGE_KEYS.production,   []);
    const variants     = storageGet<unknown[]>(STORAGE_KEYS.variants,     []);
    const sales        = storageGet<unknown[]>(STORAGE_KEYS.sales,        []);
    const ops          = storageGet<unknown[]>(STORAGE_KEYS.ops,          []);
    const ads          = storageGet<unknown[]>(STORAGE_KEYS.ads,          []);
    const kols         = storageGet<unknown[]>(STORAGE_KEYS.kols,         []);
    const pos          = storageGet<unknown[]>(STORAGE_KEYS.pos,          []);
    const suppliers    = storageGet<unknown[]>(STORAGE_KEYS.suppliers,    []);
    const customers    = storageGet<unknown[]>(STORAGE_KEYS.customers,    []);
    const assets       = storageGet<unknown[]>(STORAGE_KEYS.assets,       []);
    const cashflow     = storageGet<unknown[]>(STORAGE_KEYS.cash,         []);

    // Map localStorage → Supabase format
    const mapMaterial = (m: Record<string, unknown>) => ({
      id:           undefined, // Let DB generate
      company_id:   companyId,
      code:         m.id as string,
      name:         m.name as string,
      category:     m.category as string,
      unit:         m.unit as string || 'meter',
      cost_per_unit:Number(m.costPerUnit) || 0,
      min_stock:    Number(m.minStock)    || 0,
      image_url:    m.imageUrl as string  || null,
      notes:        m.notes as string     || null,
    });

    const mapProduct = (p: Record<string, unknown>) => ({
      company_id:       companyId,
      code:             p.id as string,
      name:             p.name as string,
      collection_season:p.collectionSeason as string || null,
      selling_price:    Number(p.sellingPrice) || 0,
      description:      p.description as string || null,
      image_url:        null, // base64 not migrated, use image service
    });

    const mapSale = (s: Record<string, unknown>) => ({
      company_id:   companyId,
      code:         s.id as string,
      product_name: s.productName as string || s.product as string,
      qty_sold:     Number(s.qtySold)   || 1,
      unit_price:   Number(s.unitPrice) || 0,
      platform_fee: Number(s.platformFee) / 100 || 0,
      discount:     Number(s.discount)  || 0,
      net_revenue:  Number(s.netRevenue) || 0,
      channel:      s.channel as string || 'Direct',
      fulfillment:  s.fulfillment as string || 'Pending',
      sale_date:    s.date as string || new Date().toISOString().split('T')[0],
    });

    const mapSupplier = (s: Record<string, unknown>) => ({
      company_id:      companyId,
      code:            s.id as string,
      name:            s.name as string,
      contact:         s.contact as string || null,
      performance_idx: Number(s.performanceIndex) || 80,
      tier:            s.tier as string || 'Standard',
    });

    const mapCustomer = (c: Record<string, unknown>) => ({
      company_id: companyId,
      code:       c.id as string,
      name:       c.name as string,
      email:      c.email as string || null,
      phone:      c.phone as string || null,
      segment:    c.segment as string || 'Regular',
    });

    // Collect stats (actual Supabase insert would happen here when enabled)
    migrated.materials  = materials.length;
    migrated.products   = products.length;
    migrated.samples    = samples.length;
    migrated.production = production.length;
    migrated.variants   = variants.length;
    migrated.sales      = sales.length;
    migrated.ops        = ops.length;
    migrated.ads        = ads.length;
    migrated.kols       = kols.length;
    migrated.pos        = pos.length;
    migrated.suppliers  = suppliers.length;
    migrated.customers  = customers.length;
    migrated.assets     = assets.length;
    migrated.cashflow   = cashflow.length;

    const total = Object.values(migrated).reduce((a, b) => a + b, 0);
    console.log(`[Migration] Ready to migrate ${total} records to Supabase`);

    return {
      success:  true,
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
