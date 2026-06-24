/**
 * resetAndSeed.ts — Reset semua data di Supabase & seed 1 data per modul
 *
 * Jalankan: npx tsx src/scripts/resetAndSeed.ts
 *
 * Urutan hapus: child tables dulu, parent tables terakhir (FK safety)
 * Kolom disesuaikan dengan master_schema.sql v1.0.1
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
  if (error) {
    console.warn(`  ⚠  ${table}: ${error.message}`);
  } else {
    console.log(`  ✓ cleared: ${table}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ILLUMINIST OS — Reset & Seed Script    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // ── Step 1: Clear ──────────────────────────────────────────────────────────

  console.log('🗑  Menghapus semua data lama (child tables first)...');

  const tablesToClear = [
    // deep children
    'product_tags',
    'product_descriptions',
    'product_timeline_events',
    'product_pricing_history',
    'product_journals',
    'product_assets',
    'product_batches',
    // variants & stock
    'product_variants',
    'inventory_transactions',
    // orders & transactions
    'sales_orders',
    'purchase_orders',
    'production_materials',
    'production_orders',
    'sample_materials',
    'samples',
    'cashflow_transactions',
    'hpp_records',
    'operational_costs',
    'ads_campaigns',
    'kol_records',
    // monitoring
    'ai_usage',
    'audit_logs',
    // masters
    'assets',
    'customers',
    'products',
    'materials',
    'suppliers',
  ];

  for (const table of tablesToClear) {
    await clearTable(table);
  }

  // ── Step 2: Upsert companies with CANONICAL fixed UUIDs ───────────────────
  // These ids MUST match BusinessContext.DEFAULT_BUSINESSES so the app hydrates
  // the seeded rows by activeBusiness.id (ILLUMINIST 0001 / NEVAEH 0002).

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
  console.log(`\n✅  NEVAEH company_id: ${cid}`);

  // ── Step 3: Seed ──────────────────────────────────────────────────────────

  console.log('\n🌱  Inserting seed data...');

  // 1. SUPPLIER
  const { data: supplier, error: supErr } = await supabase
    .from('suppliers')
    .insert({
      company_id: cid,
      code: 'SUP-001',
      name: 'CV Tekstil Nusantara',
      contact: 'Budi Santoso — 08123456789',
      email: 'budi@tekstilnusantara.co.id',
      phone: '08123456789',
      address: 'Jl. Tekstil No. 12, Bandung',
      performance_idx: 92,
      tier: 'Premier',
      is_active: true,
    })
    .select()
    .single();

  if (supErr) { console.warn('  ⚠  supplier:', supErr.message); }
  else { console.log(`  ✓ Supplier: ${supplier?.name}`); }

  // 2. MATERIAL
  const { data: material, error: matErr } = await supabase
    .from('materials')
    .insert({
      company_id: cid,
      supplier_id: supplier?.id ?? null,
      code: 'MTL-001',
      name: 'Kain Cotton Combed 30s',
      category: 'Fabric',
      unit: 'meter',
      cost_per_unit: 45000,
      min_stock: 50,
      is_active: true,
      notes: 'Grade A, lebar 160cm, GSM 180',
    })
    .select()
    .single();

  if (matErr) { console.warn('  ⚠  material:', matErr.message); }
  else { console.log(`  ✓ Material: ${material?.name}`); }

  // Stock awal via inventory_transactions (kolom: notes, bukan note)
  if (material?.id) {
    const { error: invErr } = await supabase.from('inventory_transactions').insert({
      company_id: cid,
      material_id: material.id,
      type: 'purchase_in',
      qty: 250,
      unit_cost: 45000,
      notes: 'Stok awal — seed',
      tx_date: new Date().toISOString().split('T')[0],
    });
    if (invErr) console.warn('  ⚠  inventory_transaction:', invErr.message);
    else console.log('  ✓ Inventory: +250 meter (stok awal)');
  }

  // 3. PRODUCT
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .insert({
      company_id: cid,
      code: 'NVH-OTC-001',
      name: 'Oversize Tee Classic White',
      collection: 'Essential Series 2025',
      collection_season: '2025',
      selling_price: 185000,
      status: 'active',
      restock_point: 30,
      is_active: true,
      description: 'Premium oversize t-shirt dari cotton combed 30s. Fit boxy, drop shoulder.',
    })
    .select()
    .single();

  if (prodErr) { console.warn('  ⚠  product:', prodErr.message); }
  else { console.log(`  ✓ Product: ${product?.name}`); }

  // 4. PRODUCT VARIANTS
  if (product?.id) {
    const mkVariant = (size: string, suffix: string, stock: number) => ({
      company_id: cid,
      product_id: product.id,
      name: `${size} / White`,
      size,
      sku: `NVH-OTC-001${suffix}`,
      sku_suffix: suffix,
      stock,
      current_stock: stock,
      min_stock: 10,
      hpp: 75000,
      selling_price: 185000,
    });
    const { error: varErr } = await supabase.from('product_variants').insert([
      mkVariant('S', '-S-WHT', 45),
      mkVariant('M', '-M-WHT', 62),
      mkVariant('L', '-L-WHT', 35),
    ]);
    if (varErr) { console.warn('  ⚠  variants:', varErr.message); }
    else { console.log('  ✓ Variants: S, M, L'); }
  }

  // 5. CUSTOMER
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .insert({
      company_id: cid,
      code: 'CST-001',
      name: 'Rina Marlina',
      email: 'rina@gmail.com',
      phone: '081298765432',
      address: 'Jl. Kemang Raya No. 5, Jakarta Selatan',
      segment: 'VIP',
      notes: 'Repeat buyer, sering beli bundle',
    })
    .select()
    .single();

  if (custErr) { console.warn('  ⚠  customer:', custErr.message); }
  else { console.log(`  ✓ Customer: ${customer?.name}`); }

  // 6. SALES ORDER
  const { data: salesOrder, error: soErr } = await supabase
    .from('sales_orders')
    .insert({
      company_id: cid,
      code: 'ORD-2025-001',
      customer_id: customer?.id ?? null,
      product_id: product?.id ?? null,
      product_name: 'Oversize Tee Classic White',
      qty_sold: 2,
      unit_price: 185000,
      platform_fee: 18500,
      discount: 0,
      net_revenue: 351500,
      channel: 'Direct',
      fulfillment: 'Delivered',
      sale_date: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (soErr) { console.warn('  ⚠  sales_order:', soErr.message); }
  else { console.log(`  ✓ Sales Order: ${salesOrder?.code}`); }

  // 7. CASHFLOW
  const { error: cfErr } = await supabase.from('cashflow_transactions').insert({
    company_id: cid,
    description: 'Penjualan Oversize Tee x2 — ORD-2025-001',
    amount: 351500,
    type: 'income',
    category: 'Penjualan Produk',
    reference: 'ORD-2025-001',
    tx_date: new Date().toISOString().split('T')[0],
  });

  if (cfErr) { console.warn('  ⚠  cashflow:', cfErr.message); }
  else { console.log('  ✓ Cashflow transaction'); }

  // 8. OPERATIONAL COST
  const { error: opsErr } = await supabase.from('operational_costs').insert({
    company_id: cid,
    code: 'OPS-001',
    name: 'Sewa Studio',
    amount: 5000000,
    type: 'Fixed',
    period: 'Monthly',
    notes: 'Sewa studio foto & produksi, dibayar tanggal 1 tiap bulan',
    cost_date: new Date().toISOString().split('T')[0],
  });

  if (opsErr) { console.warn('  ⚠  operational_cost:', opsErr.message); }
  else { console.log('  ✓ Operational cost: Sewa Studio'); }

  // 9. ADS CAMPAIGN
  const { error: adsErr } = await supabase.from('ads_campaigns').insert({
    company_id: cid,
    code: 'ADS-001',
    name: 'Essential Summer Drop 2025',
    platform: 'Instagram',
    spend: 2100000,
    revenue: 8700000,
    impressions: 185000,
    clicks: 3420,
    status: 'active',
    start_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  if (adsErr) { console.warn('  ⚠  ads_campaign:', adsErr.message); }
  else { console.log('  ✓ Ads Campaign: Essential Summer Drop'); }

  // ── Done ──────────────────────────────────────────────────────────────────

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   ✅  Seed selesai!                      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`
Summary data yang sudah masuk:
  Company   : NEVAEH (${cid})
  Supplier  : CV Tekstil Nusantara
  Material  : Kain Cotton Combed 30s (stok: 250 meter)
  Product   : Oversize Tee Classic White + 3 variants (S/M/L)
  Customer  : Rina Marlina (VIP)
  Sales     : ORD-2025-001 (2 pcs × Rp 185.000 = Rp 370.000)
  Cashflow  : +Rp 351.500 income
  Ops Cost  : Sewa Studio Rp 5.000.000/bulan
  Ads       : Instagram Essential Summer Drop (ROI ~4x)
`);
}

main().catch(err => {
  console.error('\n❌  Script error:', err);
  process.exit(1);
});
