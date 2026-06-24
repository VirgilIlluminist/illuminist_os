-- Product Blackbox Migration
-- Jalankan setelah 001_initial_schema.sql dan 002_new_tables.sql

-- Product Variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL,
  company_id      UUID NOT NULL,
  name            VARCHAR(100) NOT NULL,
  sku_suffix      VARCHAR(50),
  stock           INTEGER NOT NULL DEFAULT 0,
  hpp             DECIMAL(15,2),
  selling_price   DECIMAL(15,2),
  weight_gram     INTEGER,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Production Batches (immutable — no update/delete)
CREATE TABLE IF NOT EXISTS public.product_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL,
  company_id      UUID NOT NULL,
  batch_number    VARCHAR(50) NOT NULL,
  quantity        INTEGER NOT NULL,
  hpp             DECIMAL(15,2) NOT NULL,
  selling_price   DECIMAL(15,2) NOT NULL,
  production_date DATE NOT NULL,
  notes           TEXT,
  status          VARCHAR(20) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- Product Assets (images)
CREATE TABLE IF NOT EXISTS public.product_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL,
  company_id   UUID NOT NULL,
  url          TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  asset_type   VARCHAR(30) NOT NULL,
  label        VARCHAR(100),
  sort_order   INTEGER DEFAULT 0,
  size_bytes   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

-- Product Journal Entries (immutable — no delete)
CREATE TABLE IF NOT EXISTS public.product_journals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL,
  company_id  UUID NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  image_urls  TEXT[] DEFAULT '{}',
  tags        TEXT[] DEFAULT '{}',
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- Pricing History (immutable — no delete)
CREATE TABLE IF NOT EXISTS public.product_pricing_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL,
  company_id  UUID NOT NULL,
  old_price   DECIMAL(15,2),
  new_price   DECIMAL(15,2) NOT NULL,
  old_hpp     DECIMAL(15,2),
  new_hpp     DECIMAL(15,2),
  reason      VARCHAR(500),
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  changed_by  UUID,
  deleted_at  TIMESTAMPTZ
);

-- Product Timeline Events (immutable — no delete)
CREATE TABLE IF NOT EXISTS public.product_timeline_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL,
  company_id  UUID NOT NULL,
  event_type  VARCHAR(50) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  metadata    JSONB,
  event_date  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

-- Platform Descriptions
CREATE TABLE IF NOT EXISTS public.product_descriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID NOT NULL,
  company_id            UUID NOT NULL,
  short_description     TEXT,
  long_description      TEXT,
  specifications        TEXT,
  product_story         TEXT,
  care_instructions     TEXT,
  shopee_description    TEXT,
  tokopedia_description TEXT,
  instagram_caption     TEXT,
  website_description   TEXT,
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  UNIQUE (product_id, company_id)
);

-- Product Tags
CREATE TABLE IF NOT EXISTS public.product_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  company_id UUID NOT NULL,
  tag        VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.product_variants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_batches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_assets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_journals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_timeline_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_descriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags              ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user's own company)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'product_variants','product_batches','product_assets',
    'product_journals','product_pricing_history','product_timeline_events',
    'product_descriptions','product_tags'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "%s_company_policy" ON public.%I
       USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1))',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Columns on existing products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS restock_point INTEGER DEFAULT 10;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product  ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product   ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_journals_product  ON public.product_journals(product_id);
CREATE INDEX IF NOT EXISTS idx_product_timeline_product  ON public.product_timeline_events(product_id);
CREATE INDEX IF NOT EXISTS idx_product_assets_product    ON public.product_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_product      ON public.product_tags(product_id);
