-- ═══════════════════════════════════════════════════════════════════════════
-- 006_unblock_all.sql  —  ONE-PASTE UNBLOCK
--
-- Combines 005 (grants) + 004 (companies RLS recursion fix). This is the only
-- thing standing between the app and live Supabase data.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste ALL of this → Run.
--   (The SQL editor runs as `postgres`, which owns the tables and can grant.)
--
-- Then, in the terminal:
--   npx tsx src/scripts/resetAndSeed.ts
--
-- Symptoms this fixes:
--   • "permission denied for table ..." (even with the service-role key)  → grants
--   • "infinite recursion detected in policy for relation companies"      → policy
-- ═══════════════════════════════════════════════════════════════════════════

-- ── PART 1: GRANTS ─────────────────────────────────────────────────────────
-- service_role gets "permission denied" because it lacks table privileges
-- (a grant error is checked BEFORE RLS, so BYPASSRLS never applies).

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

-- ── PART 2: companies RLS recursion fix ────────────────────────────────────
-- The old policy SELECTed from companies inside its own USING clause → recursion.
-- Move the parent/child lookup into a SECURITY DEFINER function (no recursion).

CREATE OR REPLACE FUNCTION public.visible_company_ids()
RETURNS TABLE (cid UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH me AS (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
  SELECT c.id
  FROM public.companies c, me
  WHERE c.id = me.company_id
     OR c.parent_id = me.company_id
     OR c.id = (SELECT parent_id FROM public.companies p, me WHERE p.id = me.company_id)
$$;

GRANT EXECUTE ON FUNCTION public.visible_company_ids() TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    id IN (SELECT cid FROM public.visible_company_ids())
  );

-- ── PART 3 (OPTIONAL): link YOUR login to NEVAEH ───────────────────────────
-- The in-app user runs as role `authenticated`; RLS shows only rows where
-- company_id = your profile's company_id. Point your profile at NEVAEH so the
-- seeded data is visible after login. Replace the email, then uncomment:
--
-- UPDATE public.profiles SET company_id = '00000000-0000-0000-0000-000000000002'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'illuministproject@gmail.com');
