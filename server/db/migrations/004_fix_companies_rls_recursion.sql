-- ═══════════════════════════════════════════════════════════════════════════
-- 004_fix_companies_rls_recursion.sql
--
-- FIX: "infinite recursion detected in policy for relation companies".
--
-- The original companies_select policy (master_schema.sql) referenced the
-- companies table INSIDE its own USING clause:
--
--   id = (SELECT parent_id FROM public.companies WHERE id = get_my_company())
--
-- A SELECT policy on `companies` that itself SELECTs from `companies` recurses
-- infinitely. This blocks every read of companies — which breaks the app's
-- BusinessContext load AND the ERPContext Supabase hydration.
--
-- The fix moves the parent/child resolution into a SECURITY DEFINER function so
-- the inner lookup runs WITHOUT re-triggering the policy.
--
-- Jalankan: Supabase Dashboard → SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════════

-- Returns the set of company ids the current user may see: their own company,
-- its parent, and its children. SECURITY DEFINER bypasses RLS inside the body,
-- so reading companies/profiles here does NOT recurse.
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
  WHERE c.id = me.company_id              -- own company
     OR c.parent_id = me.company_id       -- children
     OR c.id = (SELECT parent_id FROM public.companies p, me
                WHERE p.id = me.company_id) -- parent
$$;

GRANT EXECUTE ON FUNCTION public.visible_company_ids() TO authenticated, anon;

-- Replace the recursive policy with a non-recursive one.
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT USING (
    id IN (SELECT cid FROM public.visible_company_ids())
  );
