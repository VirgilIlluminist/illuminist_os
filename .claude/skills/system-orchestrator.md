# system-orchestrator.md

## Purpose
Act as the central decision layer above all other skills. Every incoming request passes through here first. The orchestrator determines: what type of problem this is, which skill chain to activate, what the scope is (local vs global), and in what order to execute. Without this layer, skills are disconnected tools. With it, they form a coordinated agent network.

## When to use
**Always — before invoking any other skill.**
This is the entry point. Every task — UI change, bug fix, feature build, architecture decision — passes through orchestration first. The orchestrator does not execute work itself; it routes work to the correct skill sequence and defines the execution contract.

## Core methodology

### Request classification
Every request belongs to one of six problem types. Misclassifying the type leads to activating the wrong skill chain and wasting execution cycles.

| Problem type | Signal words | Primary skill chain |
|---|---|---|
| **UI / visual** | "fix", "change", "update", "styling", "color", "tab", "modal", "input looks wrong" | design-system-enforcer → consistency-audit → frontend-review |
| **Bug / broken behavior** | "broken", "not working", "error", "doesn't save", "wrong value", "null", "crash" | bug-hunter → debug-trace (if async/complex) → qa-checklist |
| **Architecture** | "refactor", "restructure", "too messy", "duplicate code", "slow", "hard to maintain" | architect → auto-refactor-mode → code-review |
| **New feature** | "add", "build", "create", "implement", "need X feature" | feature-planner → prd-writer (if spec unclear) → architect → qa-checklist |
| **Data / graph** | "HPP", "cost calculation", "data not updating", "formula", "derived value", "connected data" | debug-visualization-mode (verify graph alive first) → graph-core-spec → debug-trace → performance |
| **Release / validation** | "ready?", "done?", "check", "verify", "before deploy", "final check" | qa-checklist → consistency-audit → frontend-review |

### Scope classification
Before activating any skill, determine scope. Wrong scope = either under-fixing or over-engineering.

```
LOCAL scope:
  - Change affects 1–2 isolated files
  - No shared component or pattern involved
  - No state, context, or data layer touched
  → Activate: targeted skill only

PATTERN scope:
  - Change involves a shared UI pattern (tabs, inputs, modals, buttons)
  - The same pattern exists in 3+ other files
  - A shared primitive in shared/ui/ is involved
  → Activate: skill + consistency-audit + auto-refactor-mode

SYSTEM scope:
  - Change touches context, ERPContext, or data layer
  - Change affects behavior across multiple business types
  - Architecture or routing is involved
  - Multiple feature modules are affected
  → Activate: architect → full skill chain → qa-checklist

DATA GRAPH scope:
  - Change involves computed values (HPP, margins, totals)
  - A value in one place should update values in other places
  - Data flows between layers (UI → service → data model)
  → Activate: graph-core-spec protocol → debug-trace if broken → performance if slow
```

### Skill dependency graph
Skills have dependencies — some must complete before others start:

```
TIER -1 — Pre-processor (runs before everything else)
  token-efficiency → classify scope → load minimum viable skill set

TIER 0 — Always first (understand before acting)
  system-orchestrator (this file) → routes to TIER 1

TIER 1 — Spec / planning (define what correct looks like)
  prd-writer        → feature-planner
  architect         → (any implementation skill)
  graph-core-spec   → (any data feature)

TIER 2 — Analysis (find what is wrong)
  bug-hunter        → debug-trace
  consistency-audit → auto-refactor-mode
  design-system-enforcer → (migration execution)

TIER 3 — Execution (make changes)
  auto-refactor-mode
  auto-design-system-compiler
  (direct file edits)

TIER 4 — Validation (verify correctness)
  frontend-review   → qa-checklist
  code-review       → qa-checklist
  performance       → qa-checklist

TIER 5 — Final gate (release readiness)
  qa-checklist (terminal — nothing runs after this)
```

Never run a TIER 3 skill before a TIER 1 or TIER 2 skill has established what "correct" means.

## Execution steps

### Step 0 — Read project-state.md FIRST (mandatory)
Before classifying or planning anything:
1. Recall the default confidence levels from `project-state.md`:
   - UI consistency: 20% | Feature completeness: 15% | Data integrity: 10%
2. Apply the default assumption: **existing code is SUSPECT until verified in this session**
3. Apply mandatory workflow: Impact Analysis → Architecture Review → Plan → Approval → Implement → Verify → Regression

Do not proceed past Step 0 if this mindset is not active.

### Step 1 — Classify the request
Read the user's request. Identify:
1. Problem type (from table above)
2. Scope (LOCAL / PATTERN / SYSTEM / DATA GRAPH)
3. Confidence in classification (high / medium / low)

If confidence is low → **STOP. Ask one focused clarifying question before proceeding.**

### Step 2 — Build the execution plan
Construct the skill chain for this specific request:

```
Request: [user's request restated in one sentence]
Type:    [UI / Bug / Architecture / Feature / Data / Release]
Scope:   [LOCAL / PATTERN / SYSTEM / DATA GRAPH]

Execution chain:
  1. [Skill A] — Purpose in this context: [why]
  2. [Skill B] — Purpose: [why, what input it receives from Skill A]
  3. [Skill C] — Purpose: [why, what gates it]

Stop conditions:
  - Stop and escalate if: [specific condition]
  - Stop and ask if: [specific ambiguity]
```

### Step 3 — Declare impact boundary
Before any skill executes, state the expected impact boundary:

```
Files that WILL change: [explicit list or pattern]
Files that MIGHT change: [adjacent areas to verify]
Files that MUST NOT change: [explicitly protected]
Data layer affected: Yes / No — [which context/store/table]
Other business types affected: Yes / No — [which ones]
```

### Step 4 — Execute skill chain in tier order
Run each skill in sequence. After each skill:
- Collect its output
- Verify it meets the skill's own definition of done
- If it does not: resolve before moving to next skill
- Pass relevant output as context to the next skill

Never run the next skill if the current skill's output contains unresolved Critical issues.

### Step 5 — Aggregate and validate
After all skills in the chain complete:
- Run the cross-cutting verification suite:
  ```bash
  grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
  npx tsc --noEmit
  ```
- Confirm scope matches what was declared in Step 3 (no unintended changes)
- Run qa-checklist if the change touches user-facing behavior

### Step 6 — Output orchestration report
Every orchestrated session produces one summary:

```
## Orchestration Report

Request: [restated]
Type: [classification]
Scope: [LOCAL / PATTERN / SYSTEM / DATA GRAPH]

Skills activated:
  1. [skill] — Status: ✅ Complete / ❌ Blocked / 🟡 Partial
  2. …

Impact:
  Files changed: [N]
  Files verified (no change needed): [N]
  Data layer touched: Yes / No

Outstanding:
  [Any unresolved items from any skill in the chain]

System status: COHERENT ✅ / NEEDS FOLLOW-UP 🟡 / BROKEN ❌
```

## Skill chain presets (common request patterns)

**"Fix this input"**
→ Scope: PATTERN (inputs are shared pattern)
→ Chain: bug-hunter → design-system-enforcer → consistency-audit → qa-checklist

**"This page looks wrong"**
→ Scope: PATTERN or SYSTEM
→ Chain: frontend-review → design-system-enforcer → consistency-audit

**"HPP not calculating correctly"**
→ Scope: DATA GRAPH
→ Chain: debug-visualization-mode (verify mutation reaches graph) → debug-trace → graph-core-spec verification → performance (if slow)

**"Add new feature X"**
→ Scope: SYSTEM
→ Chain: feature-planner → architect → (implementation) → frontend-review → qa-checklist

**"Refactor this module"**
→ Scope: SYSTEM
→ Chain: architect → auto-refactor-mode → code-review → qa-checklist

**"Something is broken but I don't know where"**
→ Scope: unknown → classify first
→ Chain: bug-hunter → debug-trace → (re-classify based on findings)

## Hard rules
- Never activate a TIER 3 execution skill without a TIER 1 or TIER 2 analysis skill completing first
- Never declare SYSTEM scope without verifying it with a grep/file scan — scope is evidence-based
- Never skip the impact boundary declaration — undefined scope is how unintended changes happen
- Never run skills in parallel when one depends on the output of another
- If a skill returns a Critical unresolved issue: the chain stops there — do not proceed to the next skill
- If the request cannot be classified with high confidence: ask before building the execution plan
