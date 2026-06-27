# consistency-audit.md

## Purpose
Enforce global UI and logic consistency across the entire application. Every component has siblings. Every pattern has duplicates. A fix that touches one instance without touching all instances is not a fix — it is technical debt with a deadline.

## When to use
- Any UI change is being made (before and after)
- An input or form bug is reported anywhere in the app
- A feature is updated and may share patterns with other features
- User reports "this only changed partially" or "this tab is different from that tab"
- Inconsistency is visible between any two pages, tabs, or modals
- After a batch of changes — before marking the work done

## Core methodology

### Treat the system as a unified design system
Every component in the app is part of one system. A tab in ProductsView and a tab in MaterialsView are the same component category — they must behave identically. There is no "this page" vs "that page" — there is only "the app."

### Every component has siblings — update together
Before fixing any component, find every other component of the same type. Fix all of them. Never fix one input and leave 40 others broken in the same way.

### Detect pattern duplication first
Before implementing anything, identify how many implementations of the same pattern exist. Duplicate implementations are the root cause of inconsistency — two components doing the same job differently will always diverge over time.

### Propagate, do not patch
A patch fixes one instance. A propagation fixes the pattern. Always fix the pattern — then verify every instance of that pattern reflects the fix.

## Execution steps

### 1. Scan the full UI system
Before any change, map what exists:

```bash
# Find all page-level views
find src/features -name "*View.tsx" -o -name "*Page.tsx" | sort

# Find all modal components
grep -rn "modal\|Modal\|dialog\|Dialog" src --include="*.tsx" -l | sort

# Find all tab implementations
grep -rn "tab\|Tab\|activeTab\|setActiveTab" src --include="*.tsx" -l | sort

# Find all input/form implementations
grep -rn "<input\|<Input\|NumberInput\|<form\|<Form" src --include="*.tsx" -l | sort

# Find all instances of a specific pattern being changed
grep -rn "[pattern keyword]" src --include="*.tsx" | grep -v "node_modules"
```

Do not proceed until the full scope is visible.

### 2. Group components by type
Organize the findings into categories. Each category must be treated as one unit:

| Category | Components found | Consistent? |
|---|---|---|
| Tab bars | [list files] | ✅ / ❌ |
| Form inputs | [list files] | ✅ / ❌ |
| Modals | [list files] | ✅ / ❌ |
| Page headers | [list files] | ✅ / ❌ |
| Empty states | [list files] | ✅ / ❌ |
| Loading states | [list files] | ✅ / ❌ |
| Action buttons | [list files] | ✅ / ❌ |
| Cards / list rows | [list files] | ✅ / ❌ |

### 3. Identify inconsistent implementations
For each category, compare implementations side by side:

**What to compare:**
- Color / accent usage — is the same CSS var used everywhere, or are some hardcoded?
- Font — `font-mono` only on numeric output, or leaking into labels anywhere?
- Spacing — same padding/gap pattern, or varies file-by-file?
- Interaction — same hover/focus/active states?
- Input behavior — same `onChange`, `onBlur`, validation trigger?
- Error display — same error message pattern?
- Loading state — skeleton present in all, or only some?
- Empty state — handled in all, or only some?

**Red flags that signal inconsistency:**
```bash
# Hardcoded accent colors (should be 0)
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"

# font-mono on non-numeric (should be 0 outside of financial/data cells)
grep -rn "font-mono" src/features --include="*.tsx"

# Micro text (should be 0)
grep -rn 'text-\[7px\]\|text-\[8\.5px\]\|text-\[11\.5px\]' src --include="*.tsx"

# Nested backdropFilter (should be 0 inside glass-shell)
grep -rn "backdropFilter\|backdrop-blur" src/features --include="*.tsx"

# Raw input type=number (should use NumberInput primitive)
grep -rn 'type="number"\|type=.number.' src --include="*.tsx"
```

### 4. Compare old vs new behavior
For each inconsistency found:

```
Pattern: [e.g., "tab active state indicator"]

Old behavior (inconsistent instances):
  - ProductsView: uses border-bottom with var(--accent-primary)
  - MaterialsView: uses background-color with hardcoded #8b5cf6
  - SalesView:     uses no visual indicator (broken)

New behavior (target — applied to all):
  - All tab bars: border-bottom 2px solid var(--accent-primary) + text var(--text-accent)
```

Document every divergence before touching code.

### 5. Propagate fix to all instances
Fix the pattern once — then apply it everywhere:

```bash
# After identifying the canonical correct implementation,
# find every file that needs the same update
grep -rn "[old pattern / class / prop]" src --include="*.tsx" -l
```

Update every file in the list. No exceptions. If a file is skipped, document why explicitly.

**Update order:**
1. Fix the shared/reusable component if one exists
2. If no shared component: fix the most-referenced instance first
3. Apply the same change to all remaining instances
4. Verify each file after update

### 6. Validate full system consistency
After all instances are updated:

```bash
# Re-run all consistency checks — all must return 0
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
grep -rn "font-mono" src/features --include="*.tsx"
grep -rn 'text-\[7px\]\|text-\[8\.5px\]\|text-\[11\.5px\]' src --include="*.tsx"
grep -rn "backdropFilter\|backdrop-blur" src/features --include="*.tsx"
npx tsc --noEmit
```

Open the app. Navigate through every affected page type. Confirm the pattern looks and behaves identically across all instances. Take a screenshot per page type as evidence.

### 7. Run regression check across full flow
Test the top user flows end-to-end — not just the changed components:

- Business switching → does every page type update correctly?
- Create flow → does the wizard → detail page transition remain consistent?
- Form submit flow → does the pattern hold across all forms tested?
- Tab navigation → does every tabbed page behave the same?

## Output format

```
## Consistency Audit: [Change / Feature / Bug]

### Scope Scan
Files scanned: [count]
Pattern instances found: [count]
Consistent before audit: [count] ✅
Inconsistent before audit: [count] ❌

---

### Inconsistency Map

| # | Pattern | Files affected | Issue |
|---|---|---|---|
| 1 | [pattern name] | [file list] | [what differs] |
| 2 | … | | |

---

### Fix Propagation Plan
| # | File | Change required | Status |
|---|---|---|---|
| 1 | [file:line] | [what to change] | Pending / Done |
| 2 | … | | |

---

### Consistency Checks (post-fix)
- [ ] Hardcoded purple: 0 results ✅ / ❌
- [ ] font-mono on non-numeric: 0 results ✅ / ❌
- [ ] Micro text: 0 results ✅ / ❌
- [ ] Nested backdropFilter: 0 results ✅ / ❌
- [ ] Raw type=number inputs: 0 results ✅ / ❌
- [ ] tsc: 0 errors ✅ / ❌

### Visual Consistency (live check)
| Page / Component | Before | After | Consistent with system? |
|---|---|---|---|
| [page] | [screenshot ref] | [screenshot ref] | ✅ / ❌ |

### Regression Results
| Flow | Status |
|---|---|
| [user flow] | ✅ PASS / ❌ FAIL |

---

### Final Consistency Report

**Instances found:** [N]
**Instances updated:** [N]
**Instances skipped:** [N] — Reason: [why]

**System consistency status: CONSISTENT ✅ / INCONSISTENT ❌**

If INCONSISTENT: list remaining gaps and why they were not resolved in this pass.
```

## Hard rules
- Never fix one instance of a pattern without finding and fixing all instances
- Never close a consistency audit with skipped instances unless each skip is explicitly documented with a reason
- Never treat a grep result of 0 as passing without actually running the grep — state the command and output
- Never mark CONSISTENT without a live visual check across at least 3 different pages using the pattern
- If a pattern has too many instances to fix in one pass: split into phases, document phase 1 scope explicitly, and mark the audit as PARTIAL — not done
- Speed is not a valid reason to skip instances — an inconsistent system is harder to maintain than a slow fix
