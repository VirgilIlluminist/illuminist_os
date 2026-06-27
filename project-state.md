# PROJECT STATE — ILLUMINIST OS
# Mandatory read before ANY action. This is not a suggestion.

---

## ⚠️ CURRENT PROJECT STATUS

**DO NOT ASSUME THIS PROJECT IS COMPLETE.**

This project is in **EARLY PROTOTYPE** state.

Unless explicitly verified with evidence in this session, assume:

- Most UI is **inconsistent**
- Most interactions are **placeholders**
- Most forms are **not connected to real data**
- Most buttons **do nothing or only simulate**
- Most tables are **not functional end-to-end**
- Most calculations are **incomplete or hardcoded**
- Most data flows are **broken**
- Most pages **only simulate functionality**
- Many components have **duplicated logic**
- Many states are **inconsistent across tabs**
- Many APIs exist but are **not fully integrated**
- Many features **appear to work but are unverified**

**Never assume an existing implementation is production-ready.**

Treat every existing feature as **SUSPECT until verified live in this session.**

---

## DEFAULT CONFIDENCE — USE THESE AS PRIORS

When approaching any part of the codebase without fresh verification:

| Area | Default confidence |
|---|---|
| UI consistency | 20% |
| Feature completeness | 15% |
| Business logic correctness | 15% |
| Data integrity | 10% |
| Integration correctness (UI ↔ context ↔ DB) | 10% |
| Production readiness | 5% |

This means: **the default assumption is that something is broken until proven otherwise** — not the reverse.

When code "looks correct" or "compiles": confidence increases to 30% at most.
When verified live with evidence: confidence reaches 90–95%.

---

## MANDATORY WORKFLOW — NO EXCEPTIONS

This is the only valid sequence for any non-trivial task:

```
STEP 1 — UNDERSTAND REQUEST
  What is the user actually asking?
  Is this isolated or system-level?

STEP 2 — FIND EVERY RELATED COMPONENT
  grep for the pattern, the component, the prop, the state key.
  Map all files that share the pattern being changed.

STEP 3 — AUDIT CURRENT IMPLEMENTATION
  Read the actual file. Not memory. Not prior sessions.
  Confirm what actually exists vs what was assumed to exist.

STEP 4 — DETERMINE IMPACT SCOPE
  Explicitly list:
  - affected pages
  - affected tabs and modals
  - affected forms and inputs
  - affected calculations and derived values
  - affected API calls
  - affected reusable components (shared/ui/*)
  - affected state (ERPContext, BusinessContext, local state)
  - affected database entities (if applicable)

STEP 5 — RISK ASSESSMENT
  What can break if this change goes wrong?
  Which other features depend on this area?
  Are there edge cases not handled by the current implementation?

STEP 6 — EXECUTION PLAN
  Write the plan explicitly before touching any file.
  State: what will change, why, and what will NOT change.

STEP 7 — USER APPROVAL
  For any change touching >3 files or system-level patterns:
  present the plan and wait for confirmation before implementing.

STEP 8 — IMPLEMENTATION
  Execute only what was approved in the plan.
  Do not add unrequested changes.

STEP 9 — VERIFICATION
  Live test every change. Evidence required:
  - tsc 0 errors
  - preview screenshot or preview_eval confirming runtime behavior
  - localStorage/graph state confirmed if data layer was touched

STEP 10 — REGRESSION CHECK
  Test at least 3 adjacent flows that were NOT the focus of the change.
  Confirm no unintended side effects.
```

If steps 1–4 have not been completed: **the task has not started yet.**

If steps 9–10 have not been completed: **the task is not done.**

---

## GLOBAL PROJECT RULE

**Never treat a user request as an isolated change.**

Every request must first be interpreted as a **possible SYSTEM CHANGE**.

Before implementing, identify and explicitly state the impact on:

- All affected pages (not just the one mentioned)
- All affected tabs and panels
- All affected forms and input fields
- All affected calculations and derived values
- All affected APIs and external calls
- All affected reusable components (especially `shared/ui/*`)
- All affected state (context, useState, graph nodes)
- All affected database entities

Only after this impact map is written may implementation begin.

If the user says "fix the sidebar" — **14 components, 6 pages, 2 layouts, 11 routes, 5 modals, 3 workflows may be affected.** That list must be written before the first line of code is changed.

---

## FALSE COMPLETION RULE

**Completion is forbidden.**

Only verification may declare completion.

Valid completion vocabulary:

| Status | Meaning |
|---|---|
| ✅ VERIFIED | Confirmed live with specific evidence (screenshot, eval output, tsc, log) |
| ⚠️ PARTIALLY VERIFIED | Some steps confirmed, others explicitly stated as unverified |
| ❌ UNVERIFIED | Not tested. Evidence not collected. |
| 🔴 BROKEN | Verified to not work — failure point identified |

**Prohibited completion vocabulary:**

- "Done."
- "Fixed."
- "It should work now."
- "I've wired this up."
- "This is now reactive."
- "The feature is complete."
- "Sudah selesai."
- "Sudah berfungsi."

None of these are valid unless followed immediately by evidence.

---

## PROJECT PHILOSOPHY

The goal of this project is **NOT** to make individual pages work.

The goal is to build **ONE COHERENT OPERATING SYSTEM** for a multi-business founder.

This means:

- Every page is part of **one business workflow**
- Every table is **connected** to other tables
- Every calculation is **connected** to a source of truth
- Every entity is **connected** to related entities
- Every feature is **connected** to the system's data graph
- **Nothing exists in isolation**

When a margin percentage changes in HPP Engine, it must reflect in:
- Product cards
- Dashboard KPIs
- Financial reports
- Scenario analysis
- Any AI insight that reads it

When a material price changes, it must cascade to:
- All products that use that material
- All HPP calculations for those products
- All margin nodes downstream

**If a change does not propagate to everything it should affect — the system is broken, not complete.**

---

## WHAT THIS MEANS FOR HOW CLAUDE OPERATES

When the user sends a request:

**WRONG approach:**
> User: "Fix the HPP calculation."
> Claude: *changes HPPEngineView.tsx* → "Done."

**CORRECT approach:**
> User: "Fix the HPP calculation."
> Claude: "This touches the graph engine (engine.ts), ERPContext (graphNodes, updateGraphNode), HPPEngineView (reads graph), potentially ProductBlackboxView, DashboardView KPIs, FinancialStatementsView, and any AI insight that reads HPP. Before I implement: here is what currently exists vs what should exist, here is the impact map, here is my execution plan. Proceed?"

The first approach produces a patch.
The second approach produces a working system.

---

## ACTIVE VERIFICATION METHODS (use these, not assumptions)

```javascript
// Graph state
localStorage.getItem('illuminist_graph_v1')

// ERPContext data
localStorage.getItem('nevaeh_erp_state_v2_idr_products')

// Check a specific node
JSON.parse(localStorage.getItem('illuminist_graph_v1'))
  .find(n => n.id === 'HPP-NODE-PROD-001')

// TypeScript errors
npx tsc --noEmit

// Pattern scan before editing
grep -rn "pattern" src --include="*.tsx" --include="*.ts"
```

These are not optional. They are the minimum verification set.

---

*Last updated: 2026-06-27*
*Owner: illuministproject@gmail.com*
*This file is a living contract — update when project status changes.*
