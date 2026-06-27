/**
 * resetAndSeed.ts — Reset semua data di Supabase & seed dataset NEVAEH coherent
 *
 * Jalankan: npx tsx src/scripts/resetAndSeed.ts
 *
 * Dataset ini SENGAJA memakai product codes PROD-001..004 + material codes
 * MAT-001..006 yang IDENTIK dengan initial* arrays di ERPContext, supaya:
 *   - Supabase products (computedProducts) cocok dengan graph node ids
 *     (HPP-NODE-PROD-001 dst) → HPP Engine connect, tidak menampilkan Rp 0.
 *   - Production batches mengisi material/labor/packaging untuk graph.
 *
 * Urutan hapus: child tables dulu, parent tables terakhir (FK safety)
 * Kolom disesuaikan dengan master_schema.sql + 007_sync_missing_columns.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Prefer the service-role key: it bypasses RLS, which the anon key cannot do
// (RLS denies anon INSERT/DELETE → "permission denied for table ..."). Set
// SUPABASE_SERVICE_ROLE_KEY in .env (Supabase Dashboard → Settings → API).
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseKey = serviceKey || anonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  VITE_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY atau VITE_SUPABASE_ANON_KEY) wajib ada di .env');
  process.exit(1);
}

if (!serviceKey) {
  console.warn('⚠  SUPABASE_SERVICE_ROLE_KEY tidak ada — memakai anon key.');
  console.warn('   RLS kemungkinan menolak operasi ini ("permission denied").');
  console.warn('   Isi SUPABASE_SERVICE_ROLE_KEY di .env agar seed berhasil.\n');
} else {
  console.log('🔑  Memakai service-role key (bypass RLS).\n');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function clearTable(table: string) {
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) console.warn(`  ⚠  ${table}: ${error.message}`);
  else console.log(`  ✓ cleared: ${table}`);
}

const today = new Date().toISOString().split('T')[0];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ILLUMINIST OS — Reset & Seed (NEVAEH)  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ── Step 1: Clear ──────────────────────────────────────────────────────────
  console.log('🗑  Menghapus semua data lama (child tables first)...');

  const tablesToClear = [
    'product_tags', 'product_descriptions', 'product_timeline_events',
    'product_pricing_history', 'product_journals', 'product_assets', 'product_batches',
    'product_variants', 'inventory_transactions',
    'sales_orders', 'purchase_orders',
    'production_materials', 'production_orders',
    'sample_materials', 'samples',
    'cashflow_transactions', 'hpp_records', 'operational_costs',
    'ads_campaigns', 'kol_records',
    'ai_usage', 'audit_logs',
    'assets', 'customers', 'products', 'materials', 'suppliers',
  ];
  for (const table of tablesToClear) await clearTable(table);

  // ── Step 2: Upsert companies (CANONICAL fixed UUIDs) ───────────────────────
  // Must match BusinessContext.DEFAULT_BUSINESSES so the app hydrates by id.
  console.log('\n🏢  Upsert companies (canonical ids)...');

  const HOLDING_ID = '00000000-0000-0000-0000-000000000001';
  const NEVAEH_ID  = '00000000-0000-0000-0000-000000000002';

  const { error: holdErr } = await supabase.from('companies').upsert({
    id: HOLDING_ID, parent_id: null,
    name: 'ILLUMINIST', slug: 'illuminist', type: 'holding', plan: 'enterprise', is_active: true,
  }, { onConflict: 'id' });
  if (holdErr) console.warn('  ⚠  holding:', holdErr.message);
  else console.log('  ✓ ILLUMINIST (holding)');

  const { error: nevErr } = await supabase.from('companies').upsert({
    id: NEVAEH_ID, parent_id: HOLDING_ID,
    name: 'NEVAEH', slug: 'nevaeh', type: 'business', plan: 'pro', is_active: true,
  }, { onConflict: 'id' });
  if (nevErr) { console.error('❌  NEVAEH upsert gagal:', nevErr.message); process.exit(1); }
  console.log('  ✓ NEVAEH (business)');

  const cid = NEVAEH_ID;

  // ── Step 3: Seed ───────────────────────────────────────────────────────────
  console.log('\n🌱  Inserting seed data (parka dataset)...');

  // Generic bulk insert that returns a code→id map for FK resolution.
  async function insertMany(table: string, rows: Record<string, unknown>[]): Promise<Record<string, string>> {
    const { data, error } = await supabase.from(table).insert(rows).select('id, code');
    if (error) { console.warn(`  ⚠  ${table}: ${error.message}`); return {}; }
    console.log(`  ✓ ${table}: ${data?.length ?? 0} rows`);
    const map: Record<string, string> = {};
    for (const r of (data ?? []) as { id: string; code: string }[]) if (r.code) map[r.code] = r.id;
    return map;
  }

  // 1. SUPPLIERS
  const supMap = await insertMany('suppliers', [
    { company_id: cid, code: 'SUP-001', name: 'Obsidian Textiles Tokyo', contact: 'tokyo@obsidian.com', email: 'tokyo@obsidian.com', performance_idx: 98, tier: 'Premier', is_active: true },
    { company_id: cid, code: 'SUP-002', name: 'Atropos Metal Hardware', contact: 'craft@atropos.it', email: 'craft@atropos.it', performance_idx: 94, tier: 'Premier', is_active: true },
    { company_id: cid, code: 'SUP-003', name: 'Phronesis Eco Packaging', contact: 'packaging@phronesis.co', email: 'packaging@phronesis.co', performance_idx: 89, tier: 'Standard', is_active: true },
  ]);

  // 2. MATERIALS
  const matMap = await insertMany('materials', [
    { company_id: cid, code: 'MAT-001', name: 'Tech Avant-Garde Nylon', category: 'Fabric', unit: 'meter', cost_per_unit: 220000, min_stock: 250, supplier_id: supMap['SUP-001'] ?? null, is_active: true, notes: 'Waterproof, matte finish, heavy drape' },
    { company_id: cid, code: 'MAT-002', name: 'Deadstock Merino Terry', category: 'Rib', unit: 'meter', cost_per_unit: 300000, min_stock: 100, supplier_id: supMap['SUP-001'] ?? null, is_active: true, notes: 'Ultra-warm, premium heavy-weight weave' },
    { company_id: cid, code: 'MAT-003', name: 'Gunmetal Cobalt Zipper 20cm', category: 'Zipper', unit: 'pcs', cost_per_unit: 75000, min_stock: 150, supplier_id: supMap['SUP-002'] ?? null, is_active: true, notes: 'Dual-opening asymmetrical laser cut' },
    { company_id: cid, code: 'MAT-004', name: 'Stitch Satin Back-Neck Label', category: 'Label', unit: 'pcs', cost_per_unit: 12000, min_stock: 300, supplier_id: supMap['SUP-001'] ?? null, is_active: true, notes: 'Premium woven charcoal labeling' },
    { company_id: cid, code: 'MAT-005', name: 'Bespoke Recycled Polybag', category: 'Polybag', unit: 'pcs', cost_per_unit: 7500, min_stock: 200, supplier_id: supMap['SUP-003'] ?? null, is_active: true, notes: 'Frosted matte black compostable bags' },
    { company_id: cid, code: 'MAT-006', name: 'Tactical Aluminum Hook Buckle', category: 'Hardware', unit: 'pcs', cost_per_unit: 95000, min_stock: 100, supplier_id: supMap['SUP-002'] ?? null, is_active: true, notes: 'Custom dark gray clasp for helix cargos' },
  ]);

  // 3. PRODUCTS
  const prodMap = await insertMany('products', [
    { company_id: cid, code: 'PROD-001', name: 'Aura Tech Parka', collection: 'NEBULAE-26', collection_season: 'NEBULAE-26', selling_price: 4650000, status: 'active', is_active: true, description: 'Flagship techwear parka — waterproof nylon shell' },
    { company_id: cid, code: 'PROD-002', name: 'Obsidian Shroud Hoodie', collection: 'NEBULAE-26', collection_season: 'NEBULAE-26', selling_price: 2625000, status: 'active', is_active: true, description: 'Heavy merino terry hoodie' },
    { company_id: cid, code: 'PROD-003', name: 'Helix Tactical Cargo', collection: 'CHRONOS', collection_season: 'CHRONOS', selling_price: 3225000, status: 'active', is_active: true, description: 'Tactical cargo with aluminum buckles' },
    { company_id: cid, code: 'PROD-004', name: 'Zenith Zero-G Boot', collection: 'CHRONOS', collection_season: 'CHRONOS', selling_price: 5925000, status: 'active', is_active: true, description: 'Triple-midnight performance boot' },
  ]);

  // 4. PRODUCT VARIANTS
  const mkVar = (code: string, sku: string, size: string, color: string, stock: number) => ({
    company_id: cid, product_id: prodMap[code] ?? null, name: `${size} / ${color}`,
    size, sku, sku_suffix: sku.replace(`${code}-`, '-'),
    stock, current_stock: stock, min_stock: 10,
  });
  // product_variants has no `code` column (keyed by sku) → plain insert.
  {
    const { error } = await supabase.from('product_variants').insert([
      mkVar('PROD-001', 'PROD-001-BLK-S', 'S', 'Obsidian Black', 40),
      mkVar('PROD-001', 'PROD-001-BLK-M', 'M', 'Obsidian Black', 40),
      mkVar('PROD-001', 'PROD-001-BLK-L', 'L', 'Obsidian Black', 40),
      mkVar('PROD-003', 'PROD-003-SLT-S', 'S', 'Slate Gray', 50),
      mkVar('PROD-003', 'PROD-003-SLT-M', 'M', 'Slate Gray', 50),
      mkVar('PROD-003', 'PROD-003-SLT-L', 'L', 'Slate Gray', 50),
      mkVar('PROD-002', 'PROD-002-BLK-M', 'M', 'Charcoal Noir', 60),
      mkVar('PROD-002', 'PROD-002-BLK-L', 'L', 'Charcoal Noir', 40),
      mkVar('PROD-004', 'PROD-004-BLK-42', '42', 'Triple Midnight', 30),
      mkVar('PROD-004', 'PROD-004-BLK-43', '43', 'Triple Midnight', 30),
    ]);
    if (error) console.warn(`  ⚠  product_variants: ${error.message}`);
    else console.log('  ✓ product_variants: 10 rows');
  }

  // 5. PRODUCTION ORDERS (+ production_materials) — feeds HPP cost components
  const prodOrders: { code: string; product: string; material: string; usage: number; factory: string; qty: number; labor: number; pkg: number; qc: string; status: string; date: string }[] = [
    { code: 'PRD-001', product: 'PROD-001', material: 'MAT-001', usage: 2.2, factory: 'Saitama Craft Lab', qty: 120, labor: 360000, pkg: 78000, qc: 'Passed', status: 'Completed', date: '2026-05-20' },
    { code: 'PRD-002', product: 'PROD-003', material: 'MAT-001', usage: 1.7, factory: 'Kyoto Outerwear Co', qty: 150, labor: 270000, pkg: 67500, qc: 'Passed', status: 'Completed', date: '2026-05-22' },
    { code: 'PRD-003', product: 'PROD-002', material: 'MAT-002', usage: 1.45, factory: 'Saitama Craft Lab', qty: 100, labor: 225000, pkg: 52500, qc: 'Pending', status: 'In Progress', date: '2026-05-26' },
  ];
  for (const po of prodOrders) {
    const { data: row, error } = await supabase.from('production_orders').insert({
      company_id: cid, code: po.code, product_id: prodMap[po.product] ?? null,
      product_name: po.product, factory: po.factory, qty: po.qty,
      labor_cost: po.labor, packaging_cost: po.pkg, qc_status: po.qc,
      production_status: po.status, production_date: po.date,
    }).select('id').single();
    if (error) { console.warn(`  ⚠  production_orders ${po.code}: ${error.message}`); continue; }
    const { error: pmErr } = await supabase.from('production_materials').insert({
      company_id: cid, production_id: (row as { id: string }).id,
      material_id: matMap[po.material] ?? null, material_name: po.material,
      usage_per_pcs: po.usage, unit_cost: 0,
    });
    if (pmErr) console.warn(`  ⚠  production_materials ${po.code}: ${pmErr.message}`);
  }
  console.log(`  ✓ production_orders: ${prodOrders.length} rows (+materials)`);

  // 6. CUSTOMERS (tier → segment)
  const custMap = await insertMany('customers', [
    { company_id: cid, code: 'CUST-001', name: 'Hiroshi Tanaka', email: 'tanaka@syndicate.jp', segment: 'VIP' },
    { company_id: cid, code: 'CUST-002', name: 'Evelyn Vane', email: 'evelyn@veil.tech', segment: 'Wholesale' },
    { company_id: cid, code: 'CUST-003', name: 'Lucas Kane', email: 'kane@helix.net', segment: 'Wholesale' },
    { company_id: cid, code: 'CUST-004', name: 'Yuki Sato', email: 'yuki@saitama.co', segment: 'Reseller' },
    { company_id: cid, code: 'CUST-005', name: 'Zane Croft', email: 'zane@voidwear.io', segment: 'Regular' },
  ]);

  // 7. SALES ORDERS
  const net = (qty: number, price: number, pf: number, ship: number, disc: number) => qty * price - pf - ship - disc;
  await insertMany('sales_orders', [
    { company_id: cid, code: 'ORD-1001', customer_id: custMap['CUST-001'] ?? null, product_id: prodMap['PROD-001'] ?? null, product_name: 'Aura Tech Parka', qty_sold: 2, unit_price: 4650000, platform_fee: 139500, discount: 225000, net_revenue: net(2, 4650000, 139500, 180000, 225000), channel: 'Website', fulfillment: 'Completed', sale_date: '2026-05-24' },
    { company_id: cid, code: 'ORD-1002', customer_id: custMap['CUST-002'] ?? null, product_id: prodMap['PROD-001'] ?? null, product_name: 'Aura Tech Parka', qty_sold: 1, unit_price: 4650000, platform_fee: 93000, discount: 0, net_revenue: net(1, 4650000, 93000, 150000, 0), channel: 'Instagram', fulfillment: 'Completed', sale_date: '2026-05-25' },
    { company_id: cid, code: 'ORD-1003', customer_id: custMap['CUST-003'] ?? null, product_id: prodMap['PROD-003'] ?? null, product_name: 'Helix Tactical Cargo', qty_sold: 3, unit_price: 3225000, platform_fee: 483750, discount: 300000, net_revenue: net(3, 3225000, 483750, 225000, 300000), channel: 'TikTok Shop', fulfillment: 'Completed', sale_date: '2026-05-25' },
    { company_id: cid, code: 'ORD-1004', customer_id: custMap['CUST-004'] ?? null, product_id: prodMap['PROD-002'] ?? null, product_name: 'Obsidian Shroud Hoodie', qty_sold: 4, unit_price: 2625000, platform_fee: 630000, discount: 450000, net_revenue: net(4, 2625000, 630000, 270000, 450000), channel: 'Shopee', fulfillment: 'Shipped', sale_date: '2026-05-26' },
    { company_id: cid, code: 'ORD-1005', customer_id: custMap['CUST-005'] ?? null, product_id: prodMap['PROD-004'] ?? null, product_name: 'Zenith Zero-G Boot', qty_sold: 1, unit_price: 5925000, platform_fee: 177750, discount: 150000, net_revenue: net(1, 5925000, 177750, 0, 150000), channel: 'Website', fulfillment: 'Pending', sale_date: '2026-05-27' },
  ]);

  // 8. CASHFLOW
  await insertMany('cashflow_transactions', [
    { company_id: cid, code: 'CSH-001', description: 'Studio kickstart reserves', amount: 750000000, type: 'income', category: 'Capital Injection', tx_date: '2026-05-01' },
    { company_id: cid, code: 'CSH-002', description: 'CLO 3D development rig', amount: 5250000, type: 'expense', category: 'Software Subscription', tx_date: '2026-05-05' },
    { company_id: cid, code: 'CSH-003', description: 'Meta Prospecting Launch', amount: 22500000, type: 'expense', category: 'Ads spend', tx_date: '2026-05-15' },
  ]);

  // 9. OPERATIONAL COSTS
  await insertMany('operational_costs', [
    { company_id: cid, code: 'EXP-001', name: 'Meta Ads', amount: 22500000, type: 'Variable', period: 'Monthly', notes: 'Aura Tech Parka Launch', cost_date: '2026-05-15' },
    { company_id: cid, code: 'EXP-002', name: 'TikTok Ads', amount: 12000000, type: 'Variable', period: 'Monthly', notes: 'Helix Cargo Feed Drive', cost_date: '2026-05-18' },
    { company_id: cid, code: 'EXP-003', name: 'KOL', amount: 18000000, type: 'Variable', period: 'OneTime', notes: '@hyper_avant story loops', cost_date: '2026-05-20' },
    { company_id: cid, code: 'EXP-004', name: 'Salary', amount: 90000000, type: 'Fixed', period: 'Monthly', notes: 'Creative + production team', cost_date: '2026-05-25' },
    { company_id: cid, code: 'EXP-005', name: 'Software', amount: 5250000, type: 'Fixed', period: 'Monthly', notes: 'CLO 3D license', cost_date: '2026-05-26' },
  ]);

  // 10. ADS CAMPAIGNS
  await insertMany('ads_campaigns', [
    { company_id: cid, code: 'CAM-001', name: 'Nebulae Core Parka Prospecting', platform: 'Meta Ads', spend: 22500000, revenue: 78000000, status: 'active', start_date: '2026-05-15', end_date: today },
    { company_id: cid, code: 'CAM-002', name: 'Chronos Cargo Feed Conversions', platform: 'TikTok Ads', spend: 12000000, revenue: 36000000, status: 'active', start_date: '2026-05-18', end_date: today },
    { company_id: cid, code: 'CAM-003', name: 'Zero-G Boots Display Push', platform: 'Google Ads', spend: 9000000, revenue: 16500000, status: 'active', start_date: '2026-05-20', end_date: today },
  ]);

  // 11. KOL RECORDS
  await insertMany('kol_records', [
    { company_id: cid, code: 'KOL-001', name: 'Akihiro Kuroda (@hyper_avant)', platform: 'Instagram', followers: 185000, fee: 18000000, sales_result: 72000000, campaign: 'CAM-001', status: 'Completed' },
    { company_id: cid, code: 'KOL-002', name: 'Zoe Techwear (@zo_cyber)', platform: 'TikTok', followers: 240000, fee: 22500000, sales_result: 93000000, campaign: 'CAM-001', status: 'Content Posted' },
    { company_id: cid, code: 'KOL-003', name: 'Valerie Void (@void_wear)', platform: 'YouTube', followers: 95000, fee: 12000000, sales_result: 27000000, campaign: 'CAM-002', status: 'Contracted' },
  ]);

  // 12. PURCHASE ORDERS
  await insertMany('purchase_orders', [
    { company_id: cid, code: 'PO-001', supplier_id: supMap['SUP-001'] ?? null, material_id: matMap['MAT-001'] ?? null, qty: 200, unit_cost: 220000, status: 'Received', order_date: '2026-05-14' },
    { company_id: cid, code: 'PO-002', supplier_id: supMap['SUP-002'] ?? null, material_id: matMap['MAT-003'] ?? null, qty: 300, unit_cost: 75000, status: 'Sent', order_date: '2026-05-24' },
    { company_id: cid, code: 'PO-003', supplier_id: supMap['SUP-001'] ?? null, material_id: matMap['MAT-002'] ?? null, qty: 100, unit_cost: 300000, status: 'Draft', order_date: '2026-05-26' },
  ]);

  // 13. ASSETS (status → condition map: Operational→Good, Maintenance→Fair)
  await insertMany('assets', [
    { company_id: cid, code: 'AST-001', name: 'StitchMaster Laser Sealer XL', qty: 2, purchase_value: 180000000, depreciation_pct: 10, operational_status: 'Operational', condition: 'Good' },
    { company_id: cid, code: 'AST-002', name: 'CLO Workstation Render Rig', qty: 3, purchase_value: 67500000, depreciation_pct: 20, operational_status: 'Operational', condition: 'Good' },
    { company_id: cid, code: 'AST-003', name: 'Ultra-sonic Seam Welder v2', qty: 1, purchase_value: 127500000, depreciation_pct: 12, operational_status: 'Maintenance', condition: 'Fair' },
    { company_id: cid, code: 'AST-004', name: 'Matrix Heavy Leather Stitcher', qty: 1, purchase_value: 82500000, depreciation_pct: 15, operational_status: 'Operational', condition: 'Good' },
  ]);

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ✅  Seed selesai!                      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`
Company   : NEVAEH (${cid})
Suppliers : 3 · Materials: 6 · Products: 4 (PROD-001..004)
Variants  : 10 · Production: 3 batches (+materials)
Customers : 5 · Sales: 5 orders
Cashflow  : 3 · Ops Cost: 5 · Ads: 3 · KOL: 3 · PO: 3 · Assets: 4

HPP check : products PROD-001..004 cocok dengan graph node ids →
            HPP Engine akan connect (bukan Rp 0).
`);
}

main().catch(err => {
  console.error('\n❌  Script error:', err);
  process.exit(1);
});
