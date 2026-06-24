-- ═══════════════════════════════════════════════════════════════════════
-- ILLUMINIST OS — Migration 002: New Feature Tables
-- Jalankan SETELAH 001_initial_schema.sql
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ── Tax Configuration ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tax_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ppn_rate         DECIMAL(5,2) NOT NULL DEFAULT 11,     -- %
  pph21_rate       DECIMAL(5,2) NOT NULL DEFAULT 5,      -- %
  pph23_rate       DECIMAL(5,2) NOT NULL DEFAULT 2,      -- %
  pph_final_rate   DECIMAL(5,2) NOT NULL DEFAULT 0.5,    -- % (PP 46)
  pkp_status       BOOLEAN NOT NULL DEFAULT false,       -- Pengusaha Kena Pajak
  tax_method       TEXT NOT NULL DEFAULT 'exclusive'
                   CHECK (tax_method IN ('inclusive','exclusive')),
  npwp             TEXT,
  tax_name         TEXT,                                 -- nama untuk laporan
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE (company_id)
);
CREATE INDEX IF NOT EXISTS idx_tax_config_company ON public.tax_config(company_id);
ALTER TABLE public.tax_config ENABLE ROW LEVEL SECURITY;

-- ── AI Usage Tracking ─────────────────────────────────────────────────
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
CREATE INDEX IF NOT EXISTS idx_ai_usage_company   ON public.ai_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date      ON public.ai_usage(company_id, date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider  ON public.ai_usage(company_id, provider);
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- ── Shopee Channel Config ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopee_channels (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  shop_id               TEXT,
  commission_rate       DECIMAL(5,2) NOT NULL DEFAULT 3,
  admin_fee_rate        DECIMAL(5,2) NOT NULL DEFAULT 0.5,
  transaction_fee_rate  DECIMAL(5,2) NOT NULL DEFAULT 1,
  ppn_rate              DECIMAL(5,2) NOT NULL DEFAULT 11,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_shopee_channels_company ON public.shopee_channels(company_id);
ALTER TABLE public.shopee_channels ENABLE ROW LEVEL SECURITY;

-- ── Shopee Import Batches ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopee_import_batches (
  id                UUID PRIMARY KEY,   -- batch_id dari service
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  channel_config_id UUID REFERENCES public.shopee_channels(id),
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
CREATE INDEX IF NOT EXISTS idx_shopee_batches_company ON public.shopee_import_batches(company_id);
ALTER TABLE public.shopee_import_batches ENABLE ROW LEVEL SECURITY;

-- ── Shopee Settlements ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shopee_settlements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_id          TEXT NOT NULL,
  channel_config_id UUID REFERENCES public.shopee_channels(id),
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
CREATE INDEX IF NOT EXISTS idx_shopee_settlements_company ON public.shopee_settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_shopee_settlements_batch   ON public.shopee_settlements(batch_id);
ALTER TABLE public.shopee_settlements ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies untuk tabel baru ─────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tax_config','ai_usage',
    'shopee_channels','shopee_import_batches','shopee_settlements'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "sel_%s" ON public.%s
       FOR SELECT USING (company_id = get_my_company())', t, t
    );
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "ins_%s" ON public.%s
       FOR INSERT WITH CHECK (company_id = get_my_company())', t, t
    );
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "upd_%s" ON public.%s
       FOR UPDATE USING (company_id = get_my_company())', t, t
    );
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "del_%s" ON public.%s
       FOR DELETE USING (
         company_id = get_my_company()
         AND get_my_role() IN (''owner'',''admin'')
       )', t, t
    );
  END LOOP;
END $$;
