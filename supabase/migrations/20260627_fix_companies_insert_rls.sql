-- ═══════════════════════════════════════════════════════════════════════════
-- 20260627_fix_companies_insert_rls.sql
--
-- FIX B1: createBusiness() falls back to offline (local-* id) instead of
-- persisting to Supabase. Root cause: the live `companies_insert` RLS policy
-- is the restrictive original — an authenticated INSERT into `companies` raises
-- 42501 "new row violates row-level security policy for table companies", so
-- BusinessContext.createBusiness() catches the error and creates a local-only
-- business.
--
-- This app is SINGLE-OWNER, MULTI-BUSINESS (one login owns the whole holding),
-- so the owner may freely create + read every company. We scope the COMPANIES
-- table policies to "any authenticated user" — WITHOUT touching the per-entity
-- data-table policies, which stay company_id = get_my_company() so existing
-- NEVAEH data visibility is unchanged.
--
-- Additive / policy-only. Safe to re-run (DROP IF EXISTS + CREATE).
-- ═══════════════════════════════════════════════════════════════════════════

-- Authenticated owner can CREATE a company (was the blocker → 42501).
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
CREATE POLICY "companies_insert" ON public.companies
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated owner can SEE all their companies (so the switcher lists every
-- business and createBusiness()'s .select() readback returns the new row).
DROP POLICY IF EXISTS "companies_select" ON public.companies;
CREATE POLICY "companies_select" ON public.companies
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated owner can UPDATE a company (rename, settings, deactivate).
DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_update" ON public.companies
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- NOTE (follow-up, NOT in this migration): per-entity data tables still scope by
-- company_id = get_my_company() (the user's single profile company). A newly
-- created business persists here, but its data rows won't be RLS-visible until
-- the data-table policies are migrated to visible_company_ids(). Tracked as the
-- multi-business data-RLS work.
