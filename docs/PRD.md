# ILLUMINIST OS — Product Requirements Document (PRD)

> Living document. Updated 2026-06-27. Owner: founder (illuministproject@gmail.com).
> Companion to `CLAUDE.md` (engineering rules) and `.claude/skills/illuminist-ui` (UI enforcer).

---

## 1. Vision

ILLUMINIST OS is a **Chief Operating System** for a founder who runs many businesses
under one holding. One owner, one login, one dashboard, many businesses.

Not a traditional ERP. Not an admin panel. Not a record-keeping app.
Quality bar: **Apple × Linear × Stripe × Arc** — minimal, premium, fast, glass-dark.

```
ILLUMINIST HOLDING
├── NEVAEH (Fashion)
├── Coffee / Cafe
├── Retail
├── Agency
├── Property
├── Personal Finance
└── Future Ventures
```

## 2. Target user

A multi-brand founder / holding owner who needs cross-business visibility (revenue,
profit, cash, payroll, inventory, AR/AP) plus per-business operational depth, with an
AI "Chief of Staff" that understands the whole picture.

## 3. Core principles

1. **One accent, one theme, total consistency.** A single user-chosen accent color
   drives the entire UI (see CLAUDE.md §Theme). Switching business never repaints chrome.
2. **Glass-dark everywhere.** One blur layer (`.glass-shell`); solid translucent inner
   surfaces. No nested blur, no purple hardcoding, no legacy "studio AI" styling.
3. **Function over facade.** Every visible control must actually work — inputs accept
   input, buttons perform actions, lists reflect real data. No mock/placeholder UI.
4. **Architecture discipline.** UI → Repository → Service → Data. No business logic in UI.

## 4. Feature map (10 business templates)

| Template | Primary modules |
|---|---|
| Fashion | Materials, BOM, Production, QC, Products, Sales, Purchasing, HPP Engine |
| Coffee / Cafe | Ingredients, Recipes, Menu Costing, Daily Closing, Waste |
| Restaurant | Sales, Operational Cost, Purchasing, Food Cost |
| Retail | Inventory, Goods Receiving, Stock Adjustment, Reorder Point |
| Agency / Studio | Clients, Projects, Timesheets, Team |
| Service | Sales, Clients, Scheduling, Payments |
| Property | Units, Tenants, Rent Collection, Maintenance |
| Personal Finance | Income, Expenses, Assets, Investments, Savings Goals |
| Investment | Portfolio, Returns, Assets, Yield |
| Holding | Consolidated cross-business Executive view |
| Custom | Configurable modules |

Cross-cutting: Finance core (Cashflow, P&L, Balance Sheet, Chart of Accounts, Journal),
HR/Payroll, Invoicing, Customers, Assets, Notifications, Smart Tables, AI Center, Tax.

## 5. Functional status (honest baseline — 2026-06-27)

Legend: ✅ works · 🟡 partial/needs verification · ❌ not functional

- ✅ Auth (Supabase sign-in/up), routing, business switching, sidebar per-type nav.
- ✅ Theme system: single-accent color (unified this session), wallpaper presets, glass shell.
- ✅ Settings (Workspace, Language/Currency, Theme) — inputs verified typeable.
- 🟡 Dashboards & Executive view — render, but data is partly seeded/derived; verify live numbers.
- 🟡 Feature pages (Materials, Products, Sales, Finance, HR, Tax, Smart Tables) — present;
  many CRUD flows, modals, and inputs need per-page functional verification.
- 🟡 BusinessWizard (create business) — opens; end-to-end create + per-page theming needs audit.
- 🟡 CSV import, Invoicing, Shopee channel — UI present, import/calc paths need verification.
- ❌ Supabase as live datastore — most reads still go through ERPContext/localStorage.
- ❌ Transaction Engine (auto double-entry on business events) — not implemented.
- ❌ Repository/Service layer enforcement — UI largely reads context directly.

**Reality:** the app currently "exists" more than it "functions end-to-end." The roadmap
below converts presence into function.

## 6. Roadmap (prioritized)

**P0 — Make it function (current focus)**
1. ✅ Unify the accent/theme color system (one pick → whole app).
2. Audit every input/modal for typeability and working `onChange` (start with create-business
   wizard + the most-used feature pages). Fix root causes, not symptoms.
3. Make each template's pages render real, consistent, glass-themed UI after a business is created.

**P1 — Data & correctness**
4. Promote Repository/Service layer; route UI reads/writes through it.
5. Activate Supabase as the live store (migration already scaffolded); keep localStorage fallback.
6. Transaction Engine: business event → inventory + double-entry + KPI + cashflow + audit log.

**P2 — Depth & intelligence**
7. Finance core completeness (Trial Balance, Balance Sheet, Cash Flow statement).
8. HR/Payroll completeness (attendance → payroll → ledger).
9. AI Chief of Staff: executive summaries, proactive alerts, forecasting across businesses.

## 7. Non-goals

Traditional ERP look, spreadsheet-dense screens, Notion clone, audit-score dashboards,
mock data, half-built components.

## 8. Definition of done (per feature)

1. Inputs accept input; controls perform their action.
2. Glass-dark + single-accent consistent (no hardcoded purple, no nested blur).
3. `npx tsc --noEmit` → 0 errors.
4. Verified live in the preview (screenshot/interaction), not just compiled.
5. Data flows through the existing context/repository path, not a new ad-hoc one.
