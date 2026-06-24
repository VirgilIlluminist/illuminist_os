-- ═══════════════════════════════════════════════════════════════════════════════
-- ILLUMINIST OS — Master Database Schema
-- Single source of truth. Menggantikan 001, 002, 003.
-- Target: Supabase PostgreSQL 15+
--
-- CARA JALANKAN (fresh install):
--   Supabase Dashboard → SQL Editor → New Query → Paste seluruh file ini → Run
--
-- ⚠ PENTING: File ini dirancang untuk dijalankan SEKALI pada database kosong.
--   Jika database sudah ada, gunakan migration incremental.
-- ═══════════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 1: EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 2: HELPER FUNCTIONS (PL/pgSQL — aman sebelum tabel dibuat)
-- Catatan: get_my_company, get_my_role, get_my_companies (LANGUAGE sql) TIDAK
-- didefinisikan di sini — LANGUAGE sql divalidasi saat CREATE, sehingga tabel
-- yang direferensikan (profiles, companies) HARUS sudah ada terlebih dahulu.
-- Ketiga fungsi SQL tersebut didefinisikan di BAGIAN 3.5, setelah core tables.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Trigger function: update updated_at otomatis
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger function: buat profil otomatis saat user baru signup di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 3: CORE TABLES — companies, profiles, app_settings, business_types
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Companies (multi-tenant, parent-child hierarchy) ─────────────────────────
-- Satu ILLUMINIST holding → banyak child businesses
CREATE TABLE IF NOT EXISTS public.companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  type             TEXT DEFAULT 'business'
                   CHECK (type IN ('holding','business','personal','venture')),
  business_type    TEXT DEFAULT 'custom',  -- fashion|coffee|retail|agency|service|property|personal_finance|investment|holding|custom
  logo_url         TEXT,
  plan             TEXT DEFAULT 'starter'
                   CHECK (plan IN ('starter','pro','enterprise')),
  country          TEXT DEFAULT 'Indonesia',
  currency         TEXT DEFAULT 'IDR',
  currency_symbol  TEXT DEFAULT 'Rp',
  description      TEXT,
  settings         JSONB DEFAULT '{}',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Business Types (reference/lookup table) ──────────────────────────────────
-- Dipakai oleh BusinessContext: supabase.from('business_types').select('*')
CREATE TABLE IF NOT EXISTS public.business_types (
  id          TEXT PRIMARY KEY,              -- 'fashion', 'coffee', 'retail', dll
  label       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT DEFAULT '#0071e3',
  modules     TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Profiles (extends Supabase auth.users) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'viewer'
              CHECK (role IN ('owner','admin','production','warehouse',
                              'finance','marketing','designer','viewer')),
  ai_level    INT  DEFAULT 2 CHECK (ai_level BETWEEN 1 AND 5),
  is_active   BOOLEAN DEFAULT true,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── App Settings (1 per company) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  language         TEXT DEFAULT 'id',
  currency         TEXT DEFAULT 'IDR',
  currency_symbol  TEXT DEFAULT 'Rp',
  currency_rate    DECIMAL(15,4) DEFAULT 1,
  theme_mode       TEXT DEFAULT 'dark' CHECK (theme_mode IN ('dark','light')),
  accent_color     TEXT DEFAULT '#d4af37',
  decimal_places   INT  DEFAULT 0 CHECK (decimal_places BETWEEN 0 AND 4),
  font_family      TEXT DEFAULT 'Inter',
  system_name      TEXT DEFAULT 'ILLUMINIST OS',
  system_sub_name  TEXT DEFAULT 'Business Operating System',
  brand_monogram   TEXT DEFAULT 'I',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 3.5: SECURITY SQL FUNCTIONS
-- Didefinisikan di sini — SETELAH tabel companies, profiles, dan app_settings
-- sudah ada — karena LANGUAGE sql divalidasi PostgreSQL saat CREATE FUNCTION.
-- Mendefinisikan sebelum tabelnya ada akan menyebabkan error "column/relation
-- does not exist" karena PostgreSQL parse dan resolve referensi tabel saat itu.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ambil company_id milik user yang sedang login
CREATE OR REPLACE FUNCTION public.get_my_company()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Ambil role user yang sedang login
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Ambil semua company yang bisa diakses user ini:
-- owner/holding → company sendiri + semua child company
-- staff biasa   → hanya company mereka
CREATE OR REPLACE FUNCTION public.get_my_companies()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM public.companies
  WHERE id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  OR parent_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 4: BUSINESS ENTITY TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Suppliers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code            TEXT,
  name            TEXT NOT NULL,
  contact         TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  performance_idx DECIMAL(5,2) DEFAULT 80 CHECK (performance_idx BETWEEN 0 AND 100),
  tier            TEXT DEFAULT 'Standard' CHECK (tier IN ('Premier','Standard','Backup')),
  notes           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  UNIQUE (company_id, code)
);

-- ── Materials / Bahan Baku ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code          TEXT,
  name          TEXT NOT NULL,
  category      TEXT,
  supplier_id   UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit          TEXT NOT NULL DEFAULT 'meter',
  cost_per_unit DECIMAL(15,2) NOT NULL DEFAULT 0,
  min_stock     DECIMAL(10,4) DEFAULT 0,
  image_url     TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  UNIQUE (company_id, code)
);

-- ── Customers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code       TEXT,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  segment    TEXT DEFAULT 'Regular' CHECK (segment IN ('VIP','Regular','Wholesale','Reseller')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (company_id, code)
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 5: PRODUCT TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Products / Master Produk ──────────────────────────────────────────────────
-- Kolom status, collection, cover_image_url, restock_point ditambahkan dari
-- Product Blackbox (migration 003) dan productBlackbox.service.ts
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code              TEXT,
  name              TEXT NOT NULL,
  collection_season TEXT,
  collection        TEXT,                       -- dari Product Blackbox
  selling_price     DECIMAL(15,2) DEFAULT 0,
  description       TEXT,
  image_url         TEXT,
  cover_image_url   TEXT,                       -- dari Product Blackbox
  status            TEXT DEFAULT 'active'
                    CHECK (status IN ('draft','active','discontinued','archived')),
  restock_point     INT DEFAULT 10,             -- dari Product Blackbox
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  UNIQUE (company_id, code)
);

-- ── Product Variants (MERGED: size-variant system + Blackbox variant system) ──
-- Dipakai oleh DUA sistem berbeda:
--   1. Size Variant Inventory (ERPContext): kolom size, sku, current_stock, min_stock
--   2. Product Blackbox (productBlackbox.repository.ts): kolom name, sku_suffix, stock, hpp, selling_price
-- Keduanya menggunakan getRepo('product_variants') — tabel ini menggabungkan keduanya.
CREATE TABLE IF NOT EXISTS public.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- Size variant fields (ERPContext / SizeVariantInventory)
  size            TEXT,
  sku             TEXT,
  current_stock   INT DEFAULT 0,
  min_stock       INT DEFAULT 0,
  -- Blackbox variant fields (productBlackbox.repository)
  name            TEXT,
  sku_suffix      TEXT,
  stock           INT NOT NULL DEFAULT 0,
  hpp             DECIMAL(15,2),
  selling_price   DECIMAL(15,2),
  weight_gram     INT,
  is_active       BOOLEAN DEFAULT true,
  -- Common
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 6: TRANSACTION / OPERATION TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Inventory Transactions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  material_id    UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  type           TEXT NOT NULL
                 CHECK (type IN ('purchase_in','production_out','sample_out',
                                 'adjustment','wastage','return_in')),
  qty            DECIMAL(10,4) NOT NULL,
  unit_cost      DECIMAL(15,2),
  reference_id   UUID,
  reference_type TEXT,
  notes          TEXT,
  tx_date        DATE DEFAULT CURRENT_DATE,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Purchase Orders ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code          TEXT,
  supplier_id   UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  material_id   UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  qty           DECIMAL(10,4) NOT NULL CHECK (qty > 0),
  unit_cost     DECIMAL(15,2) NOT NULL CHECK (unit_cost >= 0),
  status        TEXT DEFAULT 'Draft'
                CHECK (status IN ('Draft','Sent','Confirmed','Received','Cancelled')),
  order_date    DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  notes         TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ── Samples / Sampling Development ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.samples (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code         TEXT,
  product_id   UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  version      TEXT DEFAULT 'v1.0',
  status       TEXT DEFAULT 'Sampling'
               CHECK (status IN ('Sampling','Approved','Rejected','Archived')),
  labor_cost   DECIMAL(15,2) DEFAULT 0,
  notes        TEXT,
  sample_date  DATE DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- ── Sample Materials ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sample_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sample_id     UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
  material_id   UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  material_name TEXT,
  usage_qty     DECIMAL(10,4) NOT NULL,
  waste_pct     DECIMAL(5,4) DEFAULT 0.10,
  unit_cost     DECIMAL(15,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Production Orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.production_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code              TEXT,
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name      TEXT,
  factory           TEXT,
  qty               INT NOT NULL CHECK (qty > 0),
  labor_cost        DECIMAL(15,2) DEFAULT 0,
  packaging_cost    DECIMAL(15,2) DEFAULT 0,
  qc_status         TEXT DEFAULT 'Pending'
                    CHECK (qc_status IN ('Pending','Passed','Failed')),
  production_status TEXT DEFAULT 'Planned'
                    CHECK (production_status IN
                           ('Planned','In Progress','Completed','Cancelled')),
  production_date   DATE,
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ── Production Materials ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.production_materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  production_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  material_id   UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  material_name TEXT,
  usage_per_pcs DECIMAL(10,4) NOT NULL,
  unit_cost     DECIMAL(15,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Sales Orders ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code          TEXT,
  customer_id   UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT,
  qty_sold      INT NOT NULL DEFAULT 1 CHECK (qty_sold > 0),
  unit_price    DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  gross_revenue DECIMAL(15,2) GENERATED ALWAYS AS (qty_sold * unit_price) STORED,
  platform_fee  DECIMAL(15,2) DEFAULT 0,
  discount      DECIMAL(15,2) DEFAULT 0,
  net_revenue   DECIMAL(15,2),
  channel       TEXT DEFAULT 'Direct',
  product_link  TEXT,
  fulfillment   TEXT DEFAULT 'Pending',
  sale_date     DATE DEFAULT CURRENT_DATE,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,
  UNIQUE (company_id, code)
);

-- ── Operational Costs ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.operational_costs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code       TEXT,
  name       TEXT NOT NULL,
  amount     DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  type       TEXT DEFAULT 'Fixed' CHECK (type IN ('Fixed','Variable','One-time')),
  period     TEXT,
  notes      TEXT,
  cost_date  DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ── Ads Campaigns ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ads_campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code        TEXT,
  name        TEXT NOT NULL,
  platform    TEXT,
  spend       DECIMAL(15,2) DEFAULT 0,
  revenue     DECIMAL(15,2) DEFAULT 0,
  clicks      INT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  start_date  DATE,
  end_date    DATE,
  status      TEXT DEFAULT 'Active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── KOL Records ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kol_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code          TEXT,
  name          TEXT NOT NULL,
  platform      TEXT,
  fee           DECIMAL(15,2) DEFAULT 0,
  followers     BIGINT DEFAULT 0,
  engagement    DECIMAL(5,4) DEFAULT 0,
  campaign      TEXT,
  sales_result  DECIMAL(15,2) DEFAULT 0,
  status        TEXT DEFAULT 'Active',
  contract_date DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ── Assets & Equipment ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code             TEXT,
  name             TEXT NOT NULL,
  category         TEXT,
  purchase_value   DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_value    DECIMAL(15,2),
  depreciation_pct DECIMAL(5,2) DEFAULT 0,
  purchase_date    DATE,
  condition        TEXT DEFAULT 'Good'
                   CHECK (condition IN ('New','Good','Fair','Poor','Disposed')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

-- ── Cashflow Transactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cashflow_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code        TEXT,
  description TEXT NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income','expense')),
  category    TEXT,
  reference   TEXT,
  tx_date     DATE DEFAULT CURRENT_DATE,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── HPP Records ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hpp_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name     TEXT,
  material_cost    DECIMAL(15,2) DEFAULT 0,
  labor_cost       DECIMAL(15,2) DEFAULT 0,
  packaging_cost   DECIMAL(15,2) DEFAULT 0,
  operational_cost DECIMAL(15,2) DEFAULT 0,
  ads_allocation   DECIMAL(15,2) DEFAULT 0,
  kol_allocation   DECIMAL(15,2) DEFAULT 0,
  final_hpp        DECIMAL(15,2) NOT NULL,
  selling_price    DECIMAL(15,2),
  margin_pct       DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN selling_price > 0
         THEN ROUND(((selling_price - final_hpp) / selling_price * 100), 2)
         ELSE 0 END
  ) STORED,
  calc_date        DATE DEFAULT CURRENT_DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 7: FINANCE / ACCOUNTING TABLES
-- Dipakai oleh: TransactionEngine.ts, ChartOfAccountsView.tsx
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Chart of Accounts (dipakai getRepo('chart_of_accounts')) ─────────────────
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_code TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE (company_id, code)
);

-- ── Transactions (dipakai getRepo('transactions') — TransactionEngine) ────────
-- Mencatat semua event keuangan dalam satu ledger terpusat (double-entry ready)
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
              CHECK (type IN ('sale','purchase','expense','payroll','owner_draw',
                              'inventory_in','inventory_out','production',
                              'adjustment','rent_in','investment','transfer','intercompany')),
  amount      DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  ref_id      TEXT,
  ref_type    TEXT,
  status      TEXT DEFAULT 'posted' CHECK (status IN ('posted','draft','reversed')),
  category    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── Journal Lines (dipakai getRepo('journal_lines') — TransactionEngine) ──────
-- Setiap transaksi menghasilkan 2 journal lines (double-entry)
CREATE TABLE IF NOT EXISTS public.journal_lines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  journal_id   UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  debit        DECIMAL(15,2) NOT NULL DEFAULT 0,
  credit       DECIMAL(15,2) NOT NULL DEFAULT 0,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 8: AI & SYSTEM TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── AI Settings (per company) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  active_provider     TEXT DEFAULT 'gemini',
  gemini_key_enc      TEXT,
  openai_key_enc      TEXT,
  claude_key_enc      TEXT,
  openrouter_key_enc  TEXT,
  permission_level    INT DEFAULT 2 CHECK (permission_level BETWEEN 1 AND 5),
  custom_instructions TEXT,
  business_rules      JSONB DEFAULT '[]',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI Usage Tracking (dipakai getRepo('ai_usage') — AIUsageTracker.ts) ──────
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id    TEXT NOT NULL,
  provider      TEXT NOT NULL,
  model         TEXT NOT NULL,
  input_tokens  INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cost_usd      DECIMAL(12,8) NOT NULL DEFAULT 0,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  context       TEXT NOT NULL DEFAULT 'chat',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ── Audit Logs (append-only, tidak bisa di-update/delete) ────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity      TEXT NOT NULL,
  entity_id   UUID,
  action      TEXT NOT NULL
              CHECK (action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT',
                                'EXPORT','IMPORT','APPROVE','REJECT')),
  before_data JSONB,
  after_data  JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 9: TAX TABLE
-- Dipakai oleh: getRepo('tax_config') — features/tax
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tax_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID UNIQUE NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ppn_rate       DECIMAL(5,2) NOT NULL DEFAULT 11,
  pph21_rate     DECIMAL(5,2) NOT NULL DEFAULT 5,
  pph23_rate     DECIMAL(5,2) NOT NULL DEFAULT 2,
  pph_final_rate DECIMAL(5,2) NOT NULL DEFAULT 0.5,
  pkp_status     BOOLEAN NOT NULL DEFAULT false,
  tax_method     TEXT NOT NULL DEFAULT 'exclusive'
                 CHECK (tax_method IN ('inclusive','exclusive')),
  npwp           TEXT,
  tax_name       TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 10: SHOPEE INTEGRATION TABLES
-- Dipakai oleh: getRepo('shopee_channels'), getRepo('shopee_import_batches'),
--               getRepo('shopee_settlements') — features/shopee
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Shopee Channel Config ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopee_channels (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  shop_id              TEXT,
  commission_rate      DECIMAL(5,2) NOT NULL DEFAULT 3,
  admin_fee_rate       DECIMAL(5,2) NOT NULL DEFAULT 0.5,
  transaction_fee_rate DECIMAL(5,2) NOT NULL DEFAULT 1,
  ppn_rate             DECIMAL(5,2) NOT NULL DEFAULT 11,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

-- ── Shopee Import Batches ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopee_import_batches (
  id                UUID PRIMARY KEY,   -- batch_id dari ShopeeService (tidak auto-generate)
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  channel_config_id UUID REFERENCES public.shopee_channels(id) ON DELETE SET NULL,
  row_count         INT NOT NULL DEFAULT 0,
  total_gross       DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_fees        DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_net         DECIMAL(20,2) NOT NULL DEFAULT 0,
  imported_at       TIMESTAMPTZ DEFAULT NOW(),
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','synced_to_pl')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

-- ── Shopee Settlements ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopee_settlements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_id          TEXT NOT NULL,
  channel_config_id UUID REFERENCES public.shopee_channels(id) ON DELETE SET NULL,
  order_id          TEXT NOT NULL,
  order_date        DATE NOT NULL,
  product_name      TEXT,
  sku               TEXT,
  qty               INT NOT NULL DEFAULT 1,
  unit_price        DECIMAL(20,2) NOT NULL DEFAULT 0,
  gross_revenue     DECIMAL(20,2) NOT NULL DEFAULT 0,
  commission_fee    DECIMAL(20,2) NOT NULL DEFAULT 0,
  admin_fee         DECIMAL(20,2) NOT NULL DEFAULT 0,
  transaction_fee   DECIMAL(20,2) NOT NULL DEFAULT 0,
  ppn               DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_fee         DECIMAL(20,2) NOT NULL DEFAULT 0,
  net_earnings      DECIMAL(20,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','synced')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 11: PRODUCT BLACKBOX TABLES (immutable records)
-- Dipakai oleh: productBlackbox.repository.ts
-- Catatan: batches, pricing_history, timeline_events TIDAK boleh di-delete
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Product Batches (IMMUTABLE) ───────────────────────────────────────────────
-- Setiap batch produksi adalah record permanen — tidak boleh dihapus
CREATE TABLE IF NOT EXISTS public.product_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_number    TEXT NOT NULL,
  quantity        INT NOT NULL,
  hpp             DECIMAL(15,2) NOT NULL,
  selling_price   DECIMAL(15,2) NOT NULL,
  production_date DATE NOT NULL,
  notes           TEXT,
  status          TEXT DEFAULT 'active'
                  CHECK (status IN ('active','depleted','archived')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- ── Product Assets (gambar produk) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  asset_type   TEXT NOT NULL CHECK (asset_type IN ('cover','photo','campaign','packaging')),
  label        TEXT,
  sort_order   INT DEFAULT 0,
  size_bytes   INT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- ── Product Journals (brand story — tidak boleh di-delete, edit diizinkan) ────
CREATE TABLE IF NOT EXISTS public.product_journals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  image_urls  TEXT[] DEFAULT '{}',
  tags        TEXT[] DEFAULT '{}',
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── Pricing History (IMMUTABLE) ───────────────────────────────────────────────
-- Setiap perubahan harga tercatat permanen
CREATE TABLE IF NOT EXISTS public.product_pricing_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_price   DECIMAL(15,2),
  new_price   DECIMAL(15,2) NOT NULL,
  old_hpp     DECIMAL(15,2),
  new_hpp     DECIMAL(15,2),
  reason      TEXT,
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  changed_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── Product Timeline Events (IMMUTABLE) ───────────────────────────────────────
-- Riwayat lengkap siklus hidup produk — tidak boleh dihapus
CREATE TABLE IF NOT EXISTS public.product_timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL
              CHECK (event_type IN ('created','first_sale','restock','price_change',
                                    'batch_added','journal_entry','milestone','status_change')),
  title       TEXT NOT NULL,
  description TEXT,
  metadata    JSONB,
  event_date  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- ── Product Descriptions (per platform) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_descriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  short_description     TEXT,
  long_description      TEXT,
  specifications        TEXT,
  product_story         TEXT,
  care_instructions     TEXT,
  shopee_description    TEXT,
  tokopedia_description TEXT,
  instagram_caption     TEXT,
  website_description   TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  UNIQUE (company_id, product_id)
);

-- ── Product Tags ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 12: VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Material Stock (kalkulasi real-time dari inventory_transactions) ───────────
CREATE OR REPLACE VIEW public.material_stock AS
SELECT
  m.id,
  m.company_id,
  m.code,
  m.name,
  m.unit,
  m.min_stock,
  m.cost_per_unit,
  m.category,
  m.supplier_id,
  COALESCE(SUM(
    CASE WHEN t.type IN ('purchase_in','return_in','adjustment')
         THEN t.qty ELSE -t.qty END
  ), 0) AS remaining_qty,
  COALESCE(SUM(
    CASE WHEN t.type IN ('purchase_in','return_in','adjustment')
         THEN t.qty ELSE -t.qty END
  ), 0) * m.cost_per_unit AS total_value,
  CASE
    WHEN COALESCE(SUM(CASE WHEN t.type IN ('purchase_in','return_in','adjustment')
         THEN t.qty ELSE -t.qty END), 0) = 0          THEN 'OUT_OF_STOCK'
    WHEN COALESCE(SUM(CASE WHEN t.type IN ('purchase_in','return_in','adjustment')
         THEN t.qty ELSE -t.qty END), 0) <= m.min_stock THEN 'LOW_STOCK'
    ELSE 'SURPLUS'
  END AS stock_status
FROM public.materials m
LEFT JOIN public.inventory_transactions t ON t.material_id = m.id
GROUP BY m.id, m.company_id, m.code, m.name, m.unit,
         m.min_stock, m.cost_per_unit, m.category, m.supplier_id;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 13: INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Core
CREATE INDEX IF NOT EXISTS idx_companies_parent     ON public.companies(parent_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug       ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_type       ON public.companies(business_type);
CREATE INDEX IF NOT EXISTS idx_profiles_company     ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);

-- Business entities
CREATE INDEX IF NOT EXISTS idx_suppliers_company    ON public.suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_company    ON public.materials(company_id);
CREATE INDEX IF NOT EXISTS idx_materials_supplier   ON public.materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_category   ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_customers_company    ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_segment    ON public.customers(segment);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_company     ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_status      ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_variants_company     ON public.product_variants(company_id);
CREATE INDEX IF NOT EXISTS idx_variants_product     ON public.product_variants(product_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_inv_company          ON public.inventory_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_inv_material         ON public.inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_inv_date             ON public.inventory_transactions(tx_date);
CREATE INDEX IF NOT EXISTS idx_po_company           ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_po_status            ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_samples_company      ON public.samples(company_id);
CREATE INDEX IF NOT EXISTS idx_prod_company         ON public.production_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_prod_status          ON public.production_orders(production_status);
CREATE INDEX IF NOT EXISTS idx_sales_company        ON public.sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_date           ON public.sales_orders(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_product        ON public.sales_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_channel        ON public.sales_orders(channel);
CREATE INDEX IF NOT EXISTS idx_ops_company          ON public.operational_costs(company_id);
CREATE INDEX IF NOT EXISTS idx_ads_company          ON public.ads_campaigns(company_id);
CREATE INDEX IF NOT EXISTS idx_kol_company          ON public.kol_records(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_company       ON public.assets(company_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_company     ON public.cashflow_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_date        ON public.cashflow_transactions(tx_date);
CREATE INDEX IF NOT EXISTS idx_hpp_company          ON public.hpp_records(company_id);

-- Finance / Accounting
CREATE INDEX IF NOT EXISTS idx_coa_company          ON public.chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_coa_type             ON public.chart_of_accounts(type);
CREATE INDEX IF NOT EXISTS idx_tx_company           ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_tx_date              ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_tx_type              ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_jl_company           ON public.journal_lines(company_id);
CREATE INDEX IF NOT EXISTS idx_jl_journal           ON public.journal_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_jl_account           ON public.journal_lines(account_code);

-- AI & System
CREATE INDEX IF NOT EXISTS idx_ai_usage_company     ON public.ai_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date        ON public.ai_usage(company_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider    ON public.ai_usage(company_id, provider);
CREATE INDEX IF NOT EXISTS idx_audit_company        ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity         ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_date           ON public.audit_logs(created_at);

-- Tax
CREATE INDEX IF NOT EXISTS idx_tax_company          ON public.tax_config(company_id);

-- Shopee
CREATE INDEX IF NOT EXISTS idx_shopee_ch_company    ON public.shopee_channels(company_id);
CREATE INDEX IF NOT EXISTS idx_shopee_batch_company ON public.shopee_import_batches(company_id);
CREATE INDEX IF NOT EXISTS idx_shopee_set_company   ON public.shopee_settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_shopee_set_batch     ON public.shopee_settlements(batch_id);

-- Product Blackbox
CREATE INDEX IF NOT EXISTS idx_pb_batches_product   ON public.product_batches(product_id, company_id);
CREATE INDEX IF NOT EXISTS idx_pb_assets_product    ON public.product_assets(product_id, company_id);
CREATE INDEX IF NOT EXISTS idx_pb_assets_sort       ON public.product_assets(sort_order);
CREATE INDEX IF NOT EXISTS idx_pb_journals_product  ON public.product_journals(product_id, company_id);
CREATE INDEX IF NOT EXISTS idx_pb_pricing_product   ON public.product_pricing_history(product_id, company_id);
CREATE INDEX IF NOT EXISTS idx_pb_timeline_product  ON public.product_timeline_events(product_id, company_id);
CREATE INDEX IF NOT EXISTS idx_pb_timeline_date     ON public.product_timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_pb_desc_product      ON public.product_descriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_pb_tags_product      ON public.product_tags(product_id, company_id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 14: ROW LEVEL SECURITY — ENABLE
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','business_types','profiles','app_settings',
    'suppliers','materials','customers',
    'products','product_variants',
    'inventory_transactions','purchase_orders',
    'samples','sample_materials','production_orders','production_materials',
    'sales_orders','operational_costs','ads_campaigns','kol_records',
    'assets','cashflow_transactions','hpp_records',
    'chart_of_accounts','transactions','journal_lines',
    'ai_settings','ai_usage','audit_logs',
    'tax_config',
    'shopee_channels','shopee_import_batches','shopee_settlements',
    'product_batches','product_assets','product_journals',
    'product_pricing_history','product_timeline_events',
    'product_descriptions','product_tags'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 15: RLS POLICIES
-- PENTING: Gunakan DROP IF EXISTS + CREATE — BUKAN CREATE IF NOT EXISTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (company_id = get_my_company() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ── Companies ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    id = get_my_company()
    OR id = (SELECT parent_id FROM public.companies WHERE id = get_my_company())
    OR parent_id = get_my_company()
  );

DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (id = get_my_company() AND get_my_role() IN ('owner','admin'));

DROP POLICY IF EXISTS "companies_insert" ON public.companies;
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (true);

-- ── Business Types (public read-only) ─────────────────────────────────────────
DROP POLICY IF EXISTS "business_types_select" ON public.business_types;
CREATE POLICY "business_types_select" ON public.business_types
  FOR SELECT USING (true);

-- ── Audit Logs (append-only) ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_select" ON public.audit_logs;
CREATE POLICY "audit_select" ON public.audit_logs
  FOR SELECT USING (company_id = get_my_company());

DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (company_id = get_my_company());

-- ── Standard company-isolation policies untuk semua tabel bisnis ───────────────
-- Pattern: user hanya bisa akses data milik company mereka sendiri
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'app_settings','suppliers','materials','customers',
    'products','product_variants',
    'inventory_transactions','purchase_orders',
    'samples','sample_materials','production_orders','production_materials',
    'sales_orders','operational_costs','ads_campaigns','kol_records',
    'assets','cashflow_transactions','hpp_records',
    'chart_of_accounts','transactions','journal_lines',
    'ai_settings','ai_usage','tax_config',
    'shopee_channels','shopee_import_batches','shopee_settlements',
    'product_batches','product_assets','product_journals',
    'product_pricing_history','product_timeline_events',
    'product_descriptions','product_tags'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "sel_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "sel_%s" ON public.%I
       FOR SELECT USING (company_id = get_my_company())', t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "ins_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "ins_%s" ON public.%I
       FOR INSERT WITH CHECK (company_id = get_my_company())', t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "upd_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "upd_%s" ON public.%I
       FOR UPDATE USING (
         company_id = get_my_company()
         AND get_my_role() IN (''owner'',''admin'',''production'',
                               ''warehouse'',''finance'',''marketing'')
       )', t, t
    );

    EXECUTE format('DROP POLICY IF EXISTS "del_%s" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "del_%s" ON public.%I
       FOR DELETE USING (
         company_id = get_my_company()
         AND get_my_role() IN (''owner'',''admin'')
       )', t, t
    );
  END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 16: TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Auto updated_at pada semua tabel yang punya kolom tersebut ────────────────
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','profiles','app_settings',
    'suppliers','materials','customers',
    'products','product_variants',
    'purchase_orders','samples','production_orders',
    'chart_of_accounts','transactions','journal_lines',
    'ai_settings','ai_usage','tax_config',
    'shopee_channels','shopee_import_batches','shopee_settlements',
    'product_batches','product_assets','product_journals',
    'product_pricing_history','product_timeline_events',
    'product_descriptions','product_tags'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS tr_upd_%s ON public.%I', t, t
    );
    EXECUTE format(
      'CREATE TRIGGER tr_upd_%s
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t, t
    );
  END LOOP;
END $$;

-- ── Trigger: PO Received → auto inventory_transaction ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_po_received()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'Received' AND (OLD.status IS NULL OR OLD.status != 'Received') THEN
    INSERT INTO public.inventory_transactions (
      company_id, material_id, type, qty, unit_cost,
      reference_id, reference_type, notes
    ) VALUES (
      NEW.company_id, NEW.material_id, 'purchase_in',
      NEW.qty, NEW.unit_cost, NEW.id, 'purchase_order',
      'Auto: PO ' || COALESCE(NEW.code, NEW.id::text) || ' diterima'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_po_received ON public.purchase_orders;
CREATE TRIGGER tr_po_received
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_po_received();

-- ── Trigger: profil otomatis saat user baru di Supabase Auth ─────────────────
DROP TRIGGER IF EXISTS tr_new_user ON auth.users;
CREATE TRIGGER tr_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Audit log: tidak bisa diubah atau dihapus ────────────────────────────────
DROP RULE IF EXISTS no_update_audit ON public.audit_logs;
CREATE RULE no_update_audit AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;

DROP RULE IF EXISTS no_delete_audit ON public.audit_logs;
CREATE RULE no_delete_audit AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- BAGIAN 17: SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Business Types Lookup ─────────────────────────────────────────────────────
INSERT INTO public.business_types (id, label, description, icon, color, modules)
VALUES
  ('fashion',          'Fashion Brand',      'Produksi, inventory, penjualan fashion',                          '👗', '#d4af37',
   ARRAY['Dashboard','Material Library','Sample Development','Production','Master Products','Size Variant Inventory','Sales Tracking','Operational Cost','Ads Analytics','KOL Tracking','Purchase Orders','Supplier Database','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics','Dynamic HPP Engine']),
  ('coffee',           'Coffee Shop',        'Manajemen bahan, resep, dan penjualan kopi',                      '☕', '#6f4e37',
   ARRAY['Dashboard','Sales Tracking','Operational Cost','Assets & Equipment','Cashflow','Reports & Analytics','Customer Database','Supplier Database']),
  ('retail',           'Retail Store',       'Toko retail, inventory, pembelian',                               '🛍️', '#0071e3',
   ARRAY['Dashboard','Master Products','Size Variant Inventory','Sales Tracking','Operational Cost','Purchase Orders','Supplier Database','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics']),
  ('agency',           'Creative Agency',    'Klien, proyek, timesheet',                                        '🎨', '#af52de',
   ARRAY['Dashboard','Sales Tracking','Operational Cost','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics']),
  ('service',          'Service Business',   'Bisnis jasa dan konsultasi',                                      '🔧', '#34c759',
   ARRAY['Dashboard','Sales Tracking','Operational Cost','Customer Database','Assets & Equipment','Cashflow','Reports & Analytics']),
  ('property',         'Property & Rental',  'Manajemen properti, unit, dan sewa',                              '🏢', '#ff9500',
   ARRAY['Dashboard','Sales Tracking','Operational Cost','Assets & Equipment','Cashflow','Reports & Analytics']),
  ('personal_finance', 'Personal Finance',   'Keuangan pribadi, aset, investasi',                               '💰', '#ff3b30',
   ARRAY['Dashboard','Cashflow','Assets & Equipment','Reports & Analytics']),
  ('investment',       'Investment',         'Portfolio investasi dan aset',                                    '📈', '#30d158',
   ARRAY['Dashboard','Assets & Equipment','Cashflow','Reports & Analytics']),
  ('holding',          'Holding Company',    'Konsolidasi lintas semua bisnis',                                 '🏛️', '#636366',
   ARRAY['Dashboard','Reports & Analytics']),
  ('custom',           'Custom Business',    'Bisnis kustom — pilih modul sendiri',                             '⚙️', '#8e8e93',
   ARRAY['Dashboard','Sales Tracking','Cashflow','Reports & Analytics'])
ON CONFLICT (id) DO UPDATE SET
  label       = EXCLUDED.label,
  description = EXCLUDED.description,
  modules     = EXCLUDED.modules;

-- ── Seed Companies ────────────────────────────────────────────────────────────
INSERT INTO public.companies (id, name, slug, type, business_type, plan, country, currency, currency_symbol, description, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'ILLUMINIST', 'illuminist', 'holding', 'holding', 'enterprise',
   'Indonesia', 'IDR', 'Rp', 'Holding Company — semua bisnis ada di sini', true),

  ('00000000-0000-0000-0000-000000000002',
   'NEVAEH', 'nevaeh', 'business', 'fashion', 'pro',
   'Indonesia', 'IDR', 'Rp', 'Fashion Brand', true),

  ('00000000-0000-0000-0000-000000000003',
   'Personal Finance', 'personal-finance', 'personal', 'personal_finance', 'starter',
   'Indonesia', 'IDR', 'Rp', null, true),

  ('00000000-0000-0000-0000-000000000004',
   'Future Ventures', 'future-ventures', 'venture', 'investment', 'starter',
   'Indonesia', 'IDR', 'Rp', null, true)
ON CONFLICT (slug) DO UPDATE SET
  business_type   = EXCLUDED.business_type,
  country         = EXCLUDED.country,
  currency        = EXCLUDED.currency,
  currency_symbol = EXCLUDED.currency_symbol;

-- ── App Settings untuk NEVAEH ─────────────────────────────────────────────────
INSERT INTO public.app_settings (
  company_id, language, currency, currency_symbol,
  system_name, system_sub_name, brand_monogram, accent_color
)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'id', 'IDR', 'Rp',
  'ILLUMINIST OS', 'Supply chain, margins, and luxury brand diagnostics.',
  'N', '#d4af37'
)
ON CONFLICT (company_id) DO NOTHING;

-- ── App Settings untuk ILLUMINIST holding ────────────────────────────────────
INSERT INTO public.app_settings (
  company_id, language, currency, currency_symbol,
  system_name, system_sub_name, brand_monogram, accent_color
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'id', 'IDR', 'Rp',
  'ILLUMINIST OS', 'AI-Powered Multi-Business Operating System',
  'I', '#d4af37'
)
ON CONFLICT (company_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SELESAI
-- ═══════════════════════════════════════════════════════════════════════════════
-- Tabel yang dibuat: 39 tabel + 1 view
-- Core:        companies, business_types, profiles, app_settings
-- Business:    suppliers, materials, customers
-- Products:    products, product_variants
-- Operations:  inventory_transactions, purchase_orders, samples, sample_materials,
--              production_orders, production_materials, sales_orders,
--              operational_costs, ads_campaigns, kol_records, assets,
--              cashflow_transactions, hpp_records
-- Finance:     chart_of_accounts, transactions, journal_lines
-- AI/System:   ai_settings, ai_usage, audit_logs
-- Tax:         tax_config
-- Shopee:      shopee_channels, shopee_import_batches, shopee_settlements
-- Blackbox:    product_batches, product_assets, product_journals,
--              product_pricing_history, product_timeline_events,
--              product_descriptions, product_tags
-- View:        material_stock
-- ═══════════════════════════════════════════════════════════════════════════════
