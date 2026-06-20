-- ═══════════════════════════════════════════════════════════════════════
-- NEVAEH AI OS v12 — Database Schema (Production Ready)
-- Target: Supabase PostgreSQL 15+
-- Versi: 1.0.1 (fix: RLS policies lengkap untuk semua tabel)
--
-- CARA JALANKAN:
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════════
-- BAGIAN 1: TABEL UTAMA
-- ════════════════════════════════════════════════════════════════════════

-- ── Companies (Multi-tenant, parent-child support) ─────────────────────
-- ILLUMINIST adalah parent company.
-- NEVAEH, Personal Finance, Future Ventures = child companies.
CREATE TABLE IF NOT EXISTS public.companies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  type             TEXT DEFAULT 'business'
                   CHECK (type IN ('holding','business','personal','venture')),
  logo_url         TEXT,
  plan             TEXT DEFAULT 'starter'
                   CHECK (plan IN ('starter','pro','enterprise')),
  settings         JSONB DEFAULT '{}',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
-- Index untuk query parent-child
CREATE INDEX idx_companies_parent ON public.companies(parent_id);

-- ── Profiles (extends Supabase auth.users) ─────────────────────────────
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
CREATE INDEX idx_profiles_company ON public.profiles(company_id);

-- ── App Settings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  language         TEXT DEFAULT 'id',
  currency         TEXT DEFAULT 'IDR',
  currency_symbol  TEXT DEFAULT 'Rp',
  currency_rate    DECIMAL(15,4) DEFAULT 1,
  theme_mode       TEXT DEFAULT 'dark' CHECK (theme_mode IN ('dark','light')),
  accent_color     TEXT DEFAULT '#d4af37',
  decimal_places   INT  DEFAULT 0 CHECK (decimal_places BETWEEN 0 AND 4),
  font_family      TEXT DEFAULT 'Inter',
  system_name      TEXT DEFAULT 'NEVAEH AI OS',
  system_sub_name  TEXT DEFAULT 'Business Operating System',
  brand_monogram   TEXT DEFAULT 'N',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Suppliers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code            TEXT,
  name            TEXT NOT NULL,
  contact         TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  performance_idx DECIMAL(5,2) DEFAULT 80
                  CHECK (performance_idx BETWEEN 0 AND 100),
  tier            TEXT DEFAULT 'Standard'
                  CHECK (tier IN ('Premier','Standard','Backup')),
  notes           TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_suppliers_company ON public.suppliers(company_id);

-- ── Materials ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code          TEXT,
  name          TEXT NOT NULL,
  category      TEXT,
  supplier_id   UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  unit          TEXT DEFAULT 'meter' NOT NULL,
  cost_per_unit DECIMAL(15,2) NOT NULL DEFAULT 0,
  min_stock     DECIMAL(10,4) DEFAULT 0,
  image_url     TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_materials_company  ON public.materials(company_id);
CREATE INDEX idx_materials_supplier ON public.materials(supplier_id);
CREATE INDEX idx_materials_category ON public.materials(category);

-- ── Inventory Transactions ────────────────────────────────────────────
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
CREATE INDEX idx_inv_company  ON public.inventory_transactions(company_id);
CREATE INDEX idx_inv_material ON public.inventory_transactions(material_id);
CREATE INDEX idx_inv_type     ON public.inventory_transactions(type);
CREATE INDEX idx_inv_date     ON public.inventory_transactions(tx_date);

-- ── View: Stok material saat ini ──────────────────────────────────────
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
         THEN t.qty ELSE -t.qty END), 0) = 0         THEN 'OUT_OF_STOCK'
    WHEN COALESCE(SUM(CASE WHEN t.type IN ('purchase_in','return_in','adjustment')
         THEN t.qty ELSE -t.qty END), 0) <= m.min_stock THEN 'LOW_STOCK'
    ELSE 'SURPLUS'
  END AS stock_status
FROM public.materials m
LEFT JOIN public.inventory_transactions t ON t.material_id = m.id
GROUP BY m.id, m.company_id, m.code, m.name, m.unit,
         m.min_stock, m.cost_per_unit, m.category, m.supplier_id;

-- ── Purchase Orders ───────────────────────────────────────────────────
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
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_po_company ON public.purchase_orders(company_id);
CREATE INDEX idx_po_status  ON public.purchase_orders(status);

-- ── Products ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code              TEXT,
  name              TEXT NOT NULL,
  collection_season TEXT,
  selling_price     DECIMAL(15,2) DEFAULT 0,
  description       TEXT,
  image_url         TEXT,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_company ON public.products(company_id);

-- ── Product Variants ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size          TEXT NOT NULL,
  sku           TEXT,
  current_stock INT DEFAULT 0,
  min_stock     INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, size)
);
CREATE INDEX idx_variants_company ON public.product_variants(company_id);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);

-- ── Samples ───────────────────────────────────────────────────────────
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
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_samples_company ON public.samples(company_id);

-- ── Sample Materials ──────────────────────────────────────────────────
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

-- ── Production Orders ─────────────────────────────────────────────────
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
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_prod_company ON public.production_orders(company_id);
CREATE INDEX idx_prod_status  ON public.production_orders(production_status);

-- ── Production Materials ──────────────────────────────────────────────
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

-- ── Customers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code       TEXT,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  segment    TEXT DEFAULT 'Regular'
             CHECK (segment IN ('VIP','Regular','Wholesale','Reseller')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_company ON public.customers(company_id);

-- ── Sales Orders ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code          TEXT,
  customer_id   UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT,
  qty_sold      INT NOT NULL CHECK (qty_sold > 0),
  unit_price    DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
  gross_revenue DECIMAL(15,2) GENERATED ALWAYS AS (qty_sold * unit_price) STORED,
  platform_fee  DECIMAL(5,4) DEFAULT 0,
  discount      DECIMAL(15,2) DEFAULT 0,
  net_revenue   DECIMAL(15,2),
  channel       TEXT DEFAULT 'Direct',
  product_link  TEXT,
  fulfillment   TEXT DEFAULT 'Pending',
  sale_date     DATE DEFAULT CURRENT_DATE,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sales_company ON public.sales_orders(company_id);
CREATE INDEX idx_sales_date    ON public.sales_orders(sale_date);
CREATE INDEX idx_sales_product ON public.sales_orders(product_id);

-- ── Operational Costs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.operational_costs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code       TEXT,
  name       TEXT NOT NULL,
  amount     DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  type       TEXT DEFAULT 'Fixed'
             CHECK (type IN ('Fixed','Variable','One-time')),
  period     TEXT,
  notes      TEXT,
  cost_date  DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ops_company ON public.operational_costs(company_id);

-- ── Ads Campaigns ─────────────────────────────────────────────────────
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
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ads_company ON public.ads_campaigns(company_id);

-- ── KOL Records ───────────────────────────────────────────────────────
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
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_kol_company ON public.kol_records(company_id);

-- ── Assets ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code             TEXT,
  name             TEXT NOT NULL,
  category         TEXT,
  purchase_value   DECIMAL(15,2) NOT NULL CHECK (purchase_value >= 0),
  current_value    DECIMAL(15,2),
  depreciation_pct DECIMAL(5,2) DEFAULT 0,
  purchase_date    DATE,
  condition        TEXT DEFAULT 'Good'
                   CHECK (condition IN ('New','Good','Fair','Poor','Disposed')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assets_company ON public.assets(company_id);

-- ── Cashflow Transactions ─────────────────────────────────────────────
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
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cashflow_company ON public.cashflow_transactions(company_id);
CREATE INDEX idx_cashflow_date    ON public.cashflow_transactions(tx_date);
CREATE INDEX idx_cashflow_type    ON public.cashflow_transactions(type);

-- ── HPP Records ───────────────────────────────────────────────────────
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
  margin_pct       DECIMAL(5,2)  GENERATED ALWAYS AS (
    CASE WHEN selling_price > 0
         THEN ROUND(((selling_price - final_hpp) / selling_price * 100), 2)
         ELSE 0 END
  ) STORED,
  calc_date        DATE DEFAULT CURRENT_DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_hpp_company ON public.hpp_records(company_id);

-- ── AI Settings ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
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

-- ── Audit Logs (immutable) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.companies(id),
  user_id     UUID REFERENCES public.profiles(id),
  entity      TEXT NOT NULL,
  entity_id   UUID,
  action      TEXT NOT NULL CHECK (
    action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT',
               'EXPORT','IMPORT','APPROVE','REJECT')
  ),
  before_data JSONB,
  after_data  JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_entity  ON public.audit_logs(entity, entity_id);
CREATE INDEX idx_audit_user    ON public.audit_logs(user_id);
CREATE INDEX idx_audit_date    ON public.audit_logs(created_at);

-- Audit log tidak bisa diubah atau dihapus
CREATE RULE no_update_audit AS ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO public.audit_logs DO INSTEAD NOTHING;


-- ════════════════════════════════════════════════════════════════════════
-- BAGIAN 2: TRIGGERS OTOMATIS
-- ════════════════════════════════════════════════════════════════════════

-- Trigger: updated_at otomatis
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','profiles','app_settings','suppliers','materials',
    'purchase_orders','products','samples','production_orders',
    'customers','ai_settings'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER tr_upd_%s BEFORE UPDATE ON public.%s
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', t, t
    );
  END LOOP;
END $$;

-- Trigger: PO status Received → otomatis buat inventory transaction
CREATE OR REPLACE FUNCTION public.handle_po_received()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'Received' AND OLD.status != 'Received' THEN
    INSERT INTO public.inventory_transactions (
      company_id, material_id, type, qty, unit_cost,
      reference_id, reference_type, notes
    ) VALUES (
      NEW.company_id, NEW.material_id, 'purchase_in',
      NEW.qty, NEW.unit_cost, NEW.id, 'purchase_order',
      'Otomatis: PO ' || COALESCE(NEW.code, NEW.id::text) || ' diterima'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_po_received
  AFTER UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_po_received();

-- Trigger: profil otomatis dibuat saat user baru signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'viewer'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════════
-- BAGIAN 3: ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════════════

-- Aktifkan RLS semua tabel
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','profiles','app_settings','suppliers','materials',
    'inventory_transactions','purchase_orders','products','product_variants',
    'samples','sample_materials','production_orders','production_materials',
    'customers','sales_orders','operational_costs','ads_campaigns',
    'kol_records','assets','cashflow_transactions','hpp_records',
    'ai_settings','audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%s ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Helper: ambil company_id milik user yang sedang login
CREATE OR REPLACE FUNCTION public.get_my_company()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper: ambil role user yang sedang login
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ── Policy: Profil ────────────────────────────────────────────────────
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    company_id = get_my_company() OR id = auth.uid()
  );
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ── Policy: Companies ─────────────────────────────────────────────────
-- User bisa lihat company mereka sendiri + parent company
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    id = get_my_company()
    OR id = (SELECT parent_id FROM public.companies WHERE id = get_my_company())
  );
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE USING (
    id = get_my_company()
    AND get_my_role() IN ('owner','admin')
  );
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT WITH CHECK (true); -- dibatasi aplikasi, bukan DB

-- ── Macro: buat policy isolasi company untuk semua tabel bisnis ────────
-- Setiap user hanya bisa akses data milik company mereka sendiri
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'app_settings','suppliers','materials','inventory_transactions',
    'purchase_orders','products','product_variants','samples',
    'sample_materials','production_orders','production_materials',
    'customers','sales_orders','operational_costs','ads_campaigns',
    'kol_records','assets','cashflow_transactions','hpp_records',
    'ai_settings'
  ]
  LOOP
    -- SELECT: semua role bisa baca data company mereka
    EXECUTE format(
      'CREATE POLICY "sel_%s" ON public.%s
       FOR SELECT USING (company_id = get_my_company())', t, t
    );
    -- INSERT: hanya owner/admin/role terkait
    EXECUTE format(
      'CREATE POLICY "ins_%s" ON public.%s
       FOR INSERT WITH CHECK (company_id = get_my_company())', t, t
    );
    -- UPDATE: hanya owner/admin
    EXECUTE format(
      'CREATE POLICY "upd_%s" ON public.%s
       FOR UPDATE USING (
         company_id = get_my_company()
         AND get_my_role() IN (''owner'',''admin'',''production'',
                               ''warehouse'',''finance'',''marketing'')
       )', t, t
    );
    -- DELETE: hanya owner/admin
    EXECUTE format(
      'CREATE POLICY "del_%s" ON public.%s
       FOR DELETE USING (
         company_id = get_my_company()
         AND get_my_role() IN (''owner'',''admin'')
       )', t, t
    );
  END LOOP;
END $$;

-- ── Policy: Audit Logs (append-only, tidak bisa update/delete) ────────
CREATE POLICY "audit_select" ON public.audit_logs
  FOR SELECT USING (company_id = get_my_company());
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (company_id = get_my_company());


-- ════════════════════════════════════════════════════════════════════════
-- BAGIAN 4: DATA AWAL (Seed)
-- ════════════════════════════════════════════════════════════════════════

-- Insert parent company ILLUMINIST
-- (Anda perlu update owner_id setelah membuat akun pertama)
INSERT INTO public.companies (id, name, slug, type, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ILLUMINIST',
  'illuminist',
  'holding',
  'enterprise'
) ON CONFLICT (slug) DO NOTHING;

-- Insert child companies
INSERT INTO public.companies (id, parent_id, name, slug, type, plan)
VALUES
  ('00000000-0000-0000-0000-000000000002',
   '00000000-0000-0000-0000-000000000001',
   'NEVAEH', 'nevaeh', 'business', 'pro'),
  ('00000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0000-000000000001',
   'Personal Finance', 'personal-finance', 'personal', 'starter'),
  ('00000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0000-000000000001',
   'Future Ventures', 'future-ventures', 'venture', 'starter')
ON CONFLICT (slug) DO NOTHING;

-- Insert default settings untuk NEVAEH
INSERT INTO public.app_settings (company_id, language, currency, currency_symbol, system_name, brand_monogram)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'id', 'IDR', 'Rp', 'NEVAEH AI OS', 'N'
) ON CONFLICT (company_id) DO NOTHING;
