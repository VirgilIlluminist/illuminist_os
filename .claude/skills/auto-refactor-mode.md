# auto-refactor-mode.md

## Purpose
Shift execution mode from local patch to system-wide coherent refactor. When a change touches a shared pattern, the entire pattern is the unit of work — not the file that was mentioned. This mode exists because repeated local fixes accumulate into a system that is inconsistent by design.

## When to use
- Change touches any shared UI pattern (tab bar, modal, form, sidebar, card, input)
- Multiple files share the same behavior that needs to change
- A local fix was applied but the problem persists elsewhere in the app
- User reports "still not consistent" after a previous fix
- Duplicated logic or UI patterns are detected during any scan
- The same bug appears in more than one component simultaneously
- After many iterative feature additions — the system has drifted from its original coherence

## Core methodology

### System over local
Every component is a node in a system. A node cannot be updated in isolation without understanding its relationship to every other node of the same type. There is no such thing as a "local" change to a shared pattern.

### Pattern first thinking
Do not think in files. Think in patterns. A "tab bar" is a pattern — it exists in 15 files. A "form input" is a pattern — it exists in 40 files. When a pattern changes, all 15 or 40 files are in scope. Identify the pattern first, then find every file that expresses it.

### Propagation rule
A change propagates to every instance of the affected pattern. Not "most instances." Not "the ones I remember." Every instance, found via grep and file scan — not from memory.

### Consistency over minimal change
In a system that has drifted into inconsistency, the minimal change is not the right change. Touching 3 files when 15 need updating creates a system that is 12/15 broken. Refactor the full pattern — this is the minimal change that actually works.

### Coherence after iteration
Systems become incoherent after many small feature additions. Each addition made sense in isolation. Together, they produce contradicting patterns. Auto-refactor mode treats this accumulation as a single structural problem — not N individual bugs.

## Execution steps

### Step 1 — Detect system boundary
Before writing any code, define what "system" this change belongs to.

Ask:
- What is the pattern being changed? (e.g., "tab active state", "form input with validation", "modal with confirm action")
- What other components share this exact pattern?
- What context, hook, or utility feeds this pattern?
- What other features would break if this pattern changes incorrectly?

```bash
# Map the system boundary
grep -rn "[pattern keyword / component name / prop name]" src --include="*.tsx" --include="*.ts" -l | sort

# Find entry points into the affected system
grep -rn "import.*[ComponentName]" src --include="*.tsx" | awk -F: '{print $1}' | sort -u
```

Do not proceed until the boundary is fully mapped.

### Step 2 — Find all instances
Find every file that expresses the pattern being changed:

```bash
# By component usage
grep -rn "<TabBar\|activeTab\|setActiveTab" src --include="*.tsx" -l

# By style pattern
grep -rn "font-mono\|backdrop-filter\|text-\[" src --include="*.tsx" -l

# By behavior pattern
grep -rn "onChange.*value\|controlled input\|NumberInput" src --include="*.tsx" -l

# By color pattern (consistency check)
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-" src --include="*.tsx"
```

Compile the complete instance list:

| Instance | File | Line | Current behavior | Needs update |
|---|---|---|---|---|
| 1 | [file] | [line] | [what it does now] | Yes / No |
| 2 | … | | | |

No instance is excluded from the scan. "I think that file is fine" is not a valid reason to skip it — check it.

### Step 3 — Root pattern design
Before updating any instance, define the single canonical implementation of the pattern:

```
Pattern: [name]

Canonical behavior:
- [Exactly what the pattern does — inputs, outputs, visual state, interaction]
- [What CSS vars it uses]
- [What props it requires]
- [What edge cases it handles]
- [What it does NOT do]

Reference implementation: [file:line of the best current implementation, or describe from scratch]
```

Every instance will be updated to match this canonical definition. If the canonical definition is unclear, resolve it before touching any file.

### Step 4 — Global refactor plan
Order the instance updates by dependency — update foundation components before consumers:

```
Phase 1 — Shared primitives / base components (if pattern lives in shared/ui/)
  [ ] [file] — [what changes]

Phase 2 — Feature-level implementations (direct implementations in features/)
  [ ] [file] — [what changes]
  [ ] [file] — [what changes]

Phase 3 — Page-level wiring (pages that compose the updated components)
  [ ] [file] — [what changes — verify props flow through correctly]

Phase 4 — Validation (no code changes — verify only)
  [ ] Run full grep checks
  [ ] Open app, navigate affected pages
  [ ] Take screenshots as evidence
```

Every file in the instance list must appear in exactly one phase. No file is left unassigned.

### Step 5 — Apply consistent change
Execute the plan phase by phase. After each phase:
- Run `npx tsc --noEmit` → must be 0 errors before moving to next phase
- Verify the updated files match the canonical behavior defined in Step 3
- Do not start the next phase if the current phase has type errors

**During execution — no scope creep:**
If an unrelated problem is discovered during a file update: note it, do not fix it now. Stay on the refactor. Unrelated fixes break the clean before/after comparison needed to verify the refactor.

**During execution — no partial skips:**
If a file in the plan is harder to update than expected: escalate and ask for guidance. Do not quietly skip it and mark the task done.

### Step 6 — System validation
After all phases are complete:

**Automated checks — all must return 0:**
```bash
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
grep -rn "font-mono" src/features --include="*.tsx"
grep -rn 'text-\[7px\]\|text-\[8\.5px\]\|text-\[11\.5px\]' src --include="*.tsx"
grep -rn "backdropFilter\|backdrop-blur" src/features --include="*.tsx"
npx tsc --noEmit
```

**Visual validation — navigate the app:**
Open every page type affected by the refactor. The pattern must look and behave identically across all of them. Take a screenshot per page type. If any page differs: it is not done.

**Legacy behavior check:**
Search for the old pattern to confirm it no longer exists:
```bash
grep -rn "[old class / old prop / old value]" src --include="*.tsx"
# Must return 0 — no legacy instances remaining
```

**Regression check:**
Test the top 5 user flows most likely to be affected. Confirm all work correctly.

## Output format

```
## Auto-Refactor: [Pattern Name]

### Trigger
[Why this mode was activated — what inconsistency or pattern drift was detected]

### Pattern Definition
[Canonical behavior — what every instance will do after this refactor]

---

### Affected System Map
Pattern: [name]
Total instances found: [N]
Files in scope: [N]

| # | File | Current | Target | Phase |
|---|---|---|---|---|
| 1 | [file:line] | [old behavior] | [new behavior] | 1 / 2 / 3 |

---

### Refactor Plan

**Phase 1 — Base components**
- [ ] [file] — [change] — ✅ Done / ❌ Blocked: [reason]

**Phase 2 — Feature implementations**
- [ ] [file] — [change] — ✅ / ❌

**Phase 3 — Page wiring**
- [ ] [file] — [change] — ✅ / ❌

---

### System Validation

**Automated checks**
- [ ] Hardcoded purple: 0 ✅ / ❌
- [ ] font-mono leak: 0 ✅ / ❌
- [ ] Micro text: 0 ✅ / ❌
- [ ] Nested backdropFilter: 0 ✅ / ❌
- [ ] Legacy pattern: 0 ✅ / ❌
- [ ] tsc: 0 errors ✅ / ❌

**Visual validation**
| Page | Pattern consistent? | Screenshot |
|---|---|---|
| [page] | ✅ / ❌ | [ref] |

**Regression**
| Flow | Status |
|---|---|
| [flow] | ✅ PASS / ❌ FAIL |

---

### Final Report

Instances in scope: [N]
Instances updated: [N]
Instances skipped: [N] — Reason: [explicit justification per skipped instance]

Legacy behavior remaining: Yes (NOT DONE) / No ✅

**Refactor status: COMPLETE ✅ / INCOMPLETE ❌**

If INCOMPLETE: describe exactly what remains and why.
```

## Hard rules
- Never declare the refactor complete while any instance in the plan remains untouched
- Never skip an instance because it "looks fine" — verify it against the canonical definition
- Never fix an unrelated issue during a refactor pass — log it, address it separately
- Never move to Phase 2 while Phase 1 has TypeScript errors
- Never accept "probably consistent" — run the grep checks and show the output
- If the canonical pattern cannot be defined clearly before coding starts: stop and define it first
- A refactor that leaves 3 of 15 instances on the old pattern has made the system more inconsistent, not less — it is worse than no change
