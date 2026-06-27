# database-introspection.md

## Purpose
Enforce a safe, token-efficient sequence for answering "what does the database look like?" questions.
Prevents direct production database reads when the answer is derivable from code artifacts.

## When to use
Before any of the following:
- Querying which tables, columns, or indexes exist
- Checking foreign-key relationships
- Verifying enum values or constraints
- Understanding hydration / mapping logic between DB and UI models
- Planning a migration or schema change

---

## Mandatory sequence — do not skip steps

### Step 1 — SCHEMA FIRST

Read schema artifacts in this order. Stop as soon as the answer is found.

```
Priority 1: Migration files
  find . -path ./node_modules -prune -o -name "*.sql" -print
  grep -ri "create table\|alter table\|add column" server/db/migrations/ supabase/migrations/

Priority 2: Generated TypeScript types
  cat src/infra/database/types.ts   (Supabase generated types)
  cat prisma/schema.prisma          (if Prisma is used)

Priority 3: Master schema file
  cat server/db/migrations/master_schema.sql   (if present)
```

Confirm from these files:
- Which tables exist
- Column names (snake_case in DB)
- Primary keys and foreign keys
- Enum values and constraints
- Which tables have `company_id` (multi-tenant scoping)

**If Step 1 answers the question: STOP HERE. Do not proceed.**

---

### Step 2 — CODE SECOND (only if Step 1 was insufficient)

Read the repository/service layer to understand how the application maps DB ↔ UI:

```
Data-access layer:     src/app/store/erpSupabase.ts
Repository functions:  src/infra/database/
Type definitions:      src/types.ts
```

Confirm:
- camelCase UI model ↔ snake_case DB column mapping
- Which entities have save/remove functions
- FK resolution patterns (code → UUID via `uuidForCode()`)
- Which entities are localStorage-only (no DB table yet)

**If Step 1 + Step 2 answers the question: STOP HERE.**

---

### Step 3 — DATABASE LAST (requires explicit user permission)

Only reach this step if:
- The migration files are absent or incomplete
- The code layer has no type definitions for the entity
- The question is about **live data** (row counts, actual values) — not schema

**Before running any live DB query, state explicitly:**
> "Steps 1 and 2 were insufficient to answer [specific question]. I need to query the live database. Proceeding only with READ access to confirm [specific thing]."

**Permitted at this step (read-only, schema only):**
```sql
-- List tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1;

-- Describe a specific table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = '<table>' ORDER BY ordinal_position;
```

**Prohibited at Step 3:**
- Using service-role key in CLI commands (exposes secret in transcript/logs)
- Querying `SELECT *` on any table with user data
- Running DDL or DML (CREATE/ALTER/UPDATE/DELETE)
- Enumerating the entire database schema when only one table is needed

---

## Hard rules

| Rule | Rationale |
|---|---|
| Never expose service-role key in bash commands | It bypasses RLS; secret in transcript = leaked |
| Never enumerate prod schema "to be safe" | Migration files are authoritative; prod is a verification step, not a discovery step |
| Step 3 requires explicit user approval in chat | User may not want prod reads; they decide |
| If a table is in the schema file, assume it exists in prod unless evidence says otherwise | Don't probe prod to confirm what migrations already declare |

---

## This project's schema locations

```
server/db/migrations/master_schema.sql   ← full schema (authoritative)
server/db/migrations/001_initial_schema.sql
server/db/migrations/002_new_tables.sql
server/db/migrations/003_product_blackbox.sql
server/db/migrations/004_fix_companies_rls_recursion.sql
server/db/migrations/005_grant_privileges.sql
server/db/migrations/006_unblock_all.sql
server/db/migrations/007_sync_missing_columns.sql

src/app/store/erpSupabase.ts    ← UI ↔ DB mapping + all sb*.save() functions
src/infra/database/types.ts     ← Supabase-generated TypeScript types
src/types.ts                    ← UI model type definitions (camelCase)
```

---

## Failure patterns to avoid

### ❌ WRONG — Probe prod to discover schema
```bash
curl -s "$SUPABASE_URL/rest/v1/..." -H "Authorization: Bearer $SERVICE_KEY" ...
```
This exposes the service key in logs and bypasses RLS. Run Step 1 first.

### ✅ CORRECT — Read migration to confirm table exists
```bash
grep -i "create table.*materials" server/db/migrations/master_schema.sql
```
Authoritative, safe, no credentials needed.

---

## Output when schema is confirmed from files

```
Schema source: server/db/migrations/master_schema.sql (Step 1)
Table confirmed: [table_name]
Columns relevant to this task: [list]
FK dependencies: [list]
Step 2 / Step 3: NOT NEEDED — schema fully answered from files.
```
