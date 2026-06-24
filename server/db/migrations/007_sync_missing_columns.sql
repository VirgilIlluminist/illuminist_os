-- 007_sync_missing_columns.sql
-- Additive migration: add columns missing from the schema so all 9 remaining
-- ERP entities (samples, production, variants, ads, kols, purchase_orders,
-- assets, cashflow, operational_costs) can be fully synced to Supabase.
-- All statements use IF NOT EXISTS / IF NOT EXISTS patterns — safe to re-run.

-- ── ads_campaigns: UI fields missing from original schema ────────────────────
ALTER TABLE public.ads_campaigns ADD COLUMN IF NOT EXISTS product_code       TEXT;
ALTER TABLE public.ads_campaigns ADD COLUMN IF NOT EXISTS cpc                DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.ads_campaigns ADD COLUMN IF NOT EXISTS cpm                DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.ads_campaigns ADD COLUMN IF NOT EXISTS ctr                DECIMAL(5,2)  DEFAULT 0;
ALTER TABLE public.ads_campaigns ADD COLUMN IF NOT EXISTS conversion_rate    DECIMAL(5,2)  DEFAULT 0;
ALTER TABLE public.ads_campaigns ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ   DEFAULT NOW();

-- ── kol_records: cost + revenue fields ──────────────────────────────────────
ALTER TABLE public.kol_records ADD COLUMN IF NOT EXISTS campaign_code        TEXT;
ALTER TABLE public.kol_records ADD COLUMN IF NOT EXISTS revenue_generated    DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.kol_records ADD COLUMN IF NOT EXISTS kol_status           TEXT          DEFAULT 'Active';
ALTER TABLE public.kol_records ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ   DEFAULT NOW();

-- ── assets: qty + operational status ────────────────────────────────────────
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS qty                       INT           DEFAULT 1;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS operational_status        TEXT          DEFAULT 'Operational';
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS updated_at                TIMESTAMPTZ   DEFAULT NOW();

-- ── operational_costs: UI-specific relational fields ────────────────────────
ALTER TABLE public.operational_costs ADD COLUMN IF NOT EXISTS category       TEXT;
ALTER TABLE public.operational_costs ADD COLUMN IF NOT EXISTS campaign_code  TEXT;
ALTER TABLE public.operational_costs ADD COLUMN IF NOT EXISTS product_code   TEXT;
ALTER TABLE public.operational_costs ADD COLUMN IF NOT EXISTS platform       TEXT;
ALTER TABLE public.operational_costs ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ   DEFAULT NOW();

-- ── product_variants: color field ───────────────────────────────────────────
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS color           TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS product_name    TEXT;

-- ── cashflow_transactions: updated_at ───────────────────────────────────────
ALTER TABLE public.cashflow_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ   DEFAULT NOW();
