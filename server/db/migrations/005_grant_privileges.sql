-- ═══════════════════════════════════════════════════════════════════════════
-- 005_grant_privileges.sql
--
-- FIX: "permission denied for table ..." — even with the service-role key.
--
-- master_schema.sql contains NO GRANT statements and relied on Supabase's
-- default privileges, which on this project did not reach `service_role`
-- (the seed JWT is a valid service_role, yet every write returns
-- "permission denied for table ..."). A grant error is evaluated BEFORE RLS,
-- so service_role's BYPASSRLS never even gets a chance.
--
-- This migration grants table/sequence privileges explicitly to the three
-- Supabase roles and sets default privileges so future tables inherit them.
--
-- Run as the table owner: Supabase Dashboard → SQL Editor → paste → Run.
-- (The SQL editor runs as `postgres`, which can grant.)
--
-- Roles:
--   service_role  → full access, bypasses RLS (used by resetAndSeed.ts)
--   authenticated → CRUD, still constrained by RLS (the logged-in app user)
--   anon          → read-only (pre-login; app gates data behind login anyway)
-- ═══════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- service_role: full access (RLS is bypassed for this role)
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- authenticated: CRUD (RLS policies still enforce company isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: read-only
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Future tables/sequences inherit the same grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
