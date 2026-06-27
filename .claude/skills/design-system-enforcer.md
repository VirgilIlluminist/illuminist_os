# design-system-enforcer.md

## Purpose
Act as the internal design system compiler and enforcement layer for the entire application. Every UI component, pattern, state, and interaction must be derivable from a single canonical system — not invented per page. This skill treats inconsistency as a compile error: it must be resolved before the work is done.

## When to use
- Creating or modifying any UI component
- Adding a page, tab, sidebar, modal, or input
- Fixing any UI inconsistency anywhere in the app
- Performing any frontend refactor
- User reports "this looks different" or "this doesn't match the rest"
- Duplicate UI patterns are detected across two or more files
- Any change to design tokens (color, spacing, typography, motion)

## Core methodology

### Single source of truth
Every UI decision has one authoritative source. Colors: CSS vars from `applyAccent()` and `tokens.css`. Spacing: Tailwind scale. Typography: defined text size rules. Components: `shared/ui/` primitives. If a UI decision is not traceable to one of these sources, it is unauthorized and must be standardized.

### Component-first, not page-first
A page is not a UI. A page is a composition of components. The unit of design system enforcement is the component — not the page it appears on. A tab bar on `ProductsView` and a tab bar on `MaterialsView` are the same component in two locations. They must be identical in structure, behavior, and appearance.

### Pattern normalization
Every recurring UI pattern has exactly one correct implementation. If two files implement the same pattern differently, one of them is wrong. The canonical implementation is defined once, documented here, and enforced everywhere.

### Behavior consistency
Visual consistency is insufficient. Behavior must also be uniform:
- All inputs respond to the same events (`onChange`, `onBlur`)
- All forms validate at the same trigger (on submit, not on mount)
- All loading states render the same skeleton pattern
- All error states display in the same location relative to the triggering element
- All modals open/close with the same animation and overlay pattern

### Change propagation
When a design system token or canonical component changes, every consumer of that token or component is in scope. There is no "update the source and assume consumers will be fine." Every consumer is verified.

## Execution steps

### Step 1 — System inventory
Map every UI component in the application:

```bash
# All shared primitives (these are the design system)
find src/shared/ui -name "*.tsx" | sort

# All feature-level components
find src/features -name "*.tsx" | grep -v "pages\|View\|Page" | sort

# All page-level compositions
find src/features -name "*View.tsx" -o -name "*Page.tsx" | sort

# Count pattern usage
grep -rn "className=" src/features --include="*.tsx" | wc -l
grep -rn "style={{" src/features --include="*.tsx" | wc -l
```

Build the inventory:

| Component type | Shared primitive exists? | Files using it | Consistent? |
|---|---|---|---|
| Input (text) | `shared/ui/Input` | [N files] | ✅ / ❌ |
| Input (number) | `shared/ui/NumberInput` | [N files] | ✅ / ❌ |
| Button (primary) | [define] | [N files] | ✅ / ❌ |
| Tab bar | [define] | [N files] | ✅ / ❌ |
| Modal / dialog | [define] | [N files] | ✅ / ❌ |
| Page header | `shared/ui/PageHeader` | [N files] | ✅ / ❌ |
| Toast / notification | `shared/ui/Toast` | [N files] | ✅ / ❌ |
| Empty state | [define] | [N files] | ✅ / ❌ |
| Loading skeleton | [define] | [N files] | ✅ / ❌ |
| Card / surface | [define] | [N files] | ✅ / ❌ |
| Table row | [define] | [N files] | ✅ / ❌ |
| Form section | [define] | [N files] | ✅ / ❌ |

### Step 2 — Pattern detection
Find every place a pattern is implemented ad-hoc instead of through the design system:

```bash
# Unauthorized color values (design system violation)
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"

# Raw inputs instead of primitives
grep -rn '<input ' src/features --include="*.tsx"
grep -rn 'type="number"' src --include="*.tsx"

# Unauthorized font-mono usage (non-numeric)
grep -rn "font-mono" src/features --include="*.tsx"

# Micro text violations
grep -rn 'text-\[7px\]\|text-\[8\.5px\]\|text-\[11\.5px\]' src --include="*.tsx"

# Nested backdropFilter (glass system violation)
grep -rn "backdropFilter\|backdrop-blur" src/features --include="*.tsx"

# Inline style objects (potential unauthorized design decisions)
grep -rn "style={{" src/features --include="*.tsx" | grep -v "accent\|customAccent\|//.*intentional"

# Hardcoded spacing that should be Tailwind tokens
grep -rn "padding:\|margin:\|gap:" src/features --include="*.tsx" | grep "style={{"
```

Each result is a design system violation. Every violation must be resolved — not noted and left.

### Step 3 — Define canonical system
For each UI pattern category, define the single correct implementation:

---

#### TOKENS (non-negotiable — never override)

**Color — accent:**
```
Source: config.customAccentColor → applyAccent() → CSS vars
Use: var(--accent-primary) / var(--accent-primary-muted) / var(--border-accent) / var(--shadow-accent)
Inline fallback: const accent = config?.customAccentColor || '#7c3aed'
NEVER: #8b5cf6 / bg-purple-* / text-violet-* or any hardcoded hex
```

**Color — surfaces:**
```
Page background:  managed by BackgroundStage (do not set manually)
Card surface:     rgba(255,255,255,0.06)
Modal card:       rgba(14,10,28,0.92)
Modal overlay:    rgba(0,0,0,0.65)  — NO backdropFilter
Border default:   rgba(255,255,255,0.08)
Border accent:    var(--border-accent)
```

**Typography:**
```
Minimum size:     text-xs (12px)  — never below
font-mono:        ONLY on numbers / money / percentages / code / cell addresses
                  NEVER on labels / headings / descriptions / tabs / empty states
Headings:         font-semibold or font-bold — never font-mono
```

**Spacing:**
Use Tailwind scale only. No arbitrary values except where explicitly justified in code comment.

---

#### COMPONENT CANONICAL DEFINITIONS

**Input (text):**
```tsx
// Canonical pattern
<input
  type="text"
  value={value}
  onChange={e => setValue(e.target.value)}
  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white
             placeholder-white/30 focus:outline-none focus:border-[var(--border-accent)]
             focus:ring-1 focus:ring-[var(--border-accent)] transition-colors"
  placeholder="..."
/>
// States: default / focus (accent border + ring) / disabled (opacity-50 cursor-not-allowed) / error (border-red-500)
```

**Input (number):**
```tsx
// ALWAYS use the shared primitive — never raw <input type="number">
import { NumberInput } from '@/shared/ui/NumberInput'
<NumberInput value={value} onChange={setValue} />
```

**Button (primary):**
```tsx
<button
  style={{ background: accent, boxShadow: `0 0 20px ${accent}40` }}
  className="px-4 py-2 rounded-lg text-sm font-medium text-white
             hover:opacity-90 active:opacity-80 transition-all
             disabled:opacity-40 disabled:cursor-not-allowed"
>
  Label
</button>
```

**Button (secondary / ghost):**
```tsx
<button
  className="px-4 py-2 rounded-lg text-sm font-medium
             bg-white/5 border border-white/10 text-white/70
             hover:bg-white/10 hover:text-white transition-all"
>
  Label
</button>
```

**Tab bar:**
```tsx
// Active tab: bottom border accent + text accent
// Inactive tab: text-white/50 hover:text-white/80
<button
  className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
    active
      ? 'border-[var(--accent-primary)] text-[var(--text-accent)]'
      : 'border-transparent text-white/50 hover:text-white/80'
  }`}
>
  Tab Name
</button>
```

**Modal:**
```tsx
// Overlay: no backdropFilter — solid dim
<div className="fixed inset-0 z-50 flex items-center justify-center"
     style={{ background: 'rgba(0,0,0,0.65)' }}>
  // Card: solid dark — no backdropFilter inside glass-shell
  <div className="rounded-2xl p-6 w-full max-w-lg"
       style={{ background: 'rgba(14,10,28,0.92)', border: '1px solid rgba(255,255,255,0.12)' }}>
    {/* content */}
  </div>
</div>
```

**Empty state:**
```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <Icon className="w-10 h-10 text-white/20 mb-3" />
  <p className="text-sm font-medium text-white/40">[No items yet]</p>
  <p className="text-xs text-white/25 mt-1">[Guidance text]</p>
  {/* Optional: primary action button */}
</div>
```

**Loading skeleton:**
```tsx
<div className="animate-pulse rounded-lg bg-white/5 h-[Xpx] w-full" />
// Size matches the content it is replacing — do not use a generic spinner for list items
```

**Toast / notification:**
```tsx
// Use shared/ui/Toast — never implement ad-hoc notification
import { useToast } from '@/shared/ui/Toast'
const { toast } = useToast()
toast({ title: '...', variant: 'success' | 'error' | 'info' })
```

**Card / surface:**
```tsx
<div className="rounded-xl p-4"
     style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
```

---

### Step 4 — Migration plan
For every violation found in Step 2, create an ordered migration plan:

```
Priority 1 — Token violations (color, typography)
  These affect the entire app visually. Fix first.
  [ ] [file:line] — [violation] → [canonical replacement]

Priority 2 — Primitive violations (raw inputs, custom modals)
  These affect behavior consistency. Fix second.
  [ ] [file:line] — [violation] → [use shared/ui/X]

Priority 3 — Pattern inconsistencies (ad-hoc layouts, custom states)
  These affect UX consistency. Fix third.
  [ ] [file:line] — [violation] → [canonical pattern]
```

Order within each priority: by frequency of user exposure (high-traffic pages first).

### Step 5 — Enforcement
Execute the migration plan:
- Fix all Priority 1 items — run grep checks after each file — must return 0 before next file
- Fix all Priority 2 items — verify behavior in live preview after each primitive replacement
- Fix all Priority 3 items — visual check after each pattern update
- Run `npx tsc --noEmit` after every 3–5 file edits — never accumulate type errors

**Enforcement gate:** Do not mark any category done until its grep check returns 0.

### Step 6 — Final consistency check
After all migration is complete:

**Automated enforcement gates (all must pass):**
```bash
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
# → 0 results

grep -rn 'type="number"' src/features --include="*.tsx"
# → 0 results (all replaced by NumberInput)

grep -rn "font-mono" src/features --include="*.tsx"
# → only numeric/financial output

grep -rn 'text-\[7px\]\|text-\[8\.5px\]\|text-\[11\.5px\]' src --include="*.tsx"
# → 0 results

grep -rn "backdropFilter\|backdrop-blur" src/features --include="*.tsx"
# → 0 results (only allowed exceptions: LoginPage, BackgroundStage, FinancesAndAssetsView slider)

npx tsc --noEmit
# → 0 errors
```

**Visual enforcement (navigate the app):**
Open every page type. Verify:
- Tab bars look and behave identically
- Inputs look and behave identically
- Modals use the same overlay and card pattern
- Empty states use the same layout
- Loading states use the same skeleton pattern
- Accent color is consistent (pick a non-default color in Settings → Tampilan → Accent Color, navigate all pages — all must update)

## Output format

```
## Design System Enforcement Report

### System Inventory
| Component type | Primitive | Files | Consistent |
|---|---|---|---|
| [type] | [shared/ui/X or None] | [N] | ✅ / ❌ |

---

### Violations Found
| # | Type | File:line | Violation | Canonical replacement |
|---|---|---|---|---|
| 1 | Token | [file:line] | [what is wrong] | [what to use instead] |
| 2 | Primitive | … | | |
| 3 | Pattern | … | | |

Total violations: [N]

---

### Migration Plan
Priority 1 — Token violations ([N] items)
- [ ] [file:line] — [fix]

Priority 2 — Primitive violations ([N] items)
- [ ] [file:line] — [fix]

Priority 3 — Pattern violations ([N] items)
- [ ] [file:line] — [fix]

---

### Enforcement Gates (post-migration)
- [ ] Hardcoded purple: 0 ✅ / ❌
- [ ] Raw type=number: 0 ✅ / ❌
- [ ] font-mono leak: 0 ✅ / ❌
- [ ] Micro text: 0 ✅ / ❌
- [ ] Nested backdropFilter: 0 ✅ / ❌
- [ ] tsc: 0 errors ✅ / ❌

### Visual Consistency
| Page | Tabs | Inputs | Modals | Accent follows pick |
|---|---|---|---|---|
| [page] | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

---

### Final Status

Violations before: [N]
Violations resolved: [N]
Violations remaining: [N] — Reason per item: [explicit]

**Design system status: ENFORCED ✅ / VIOLATIONS REMAINING ❌**
```

## Hard rules
- Never create a UI implementation outside the canonical system without a documented exception and justification
- Never treat "close enough" as compliant — the canonical definition is binary: it matches or it does not
- Never skip an enforcement gate because "that grep probably returns 0" — run it and show the output
- Never leave a partial migration — every violation found must be resolved or explicitly deferred with a documented reason
- Never add a new shared primitive without updating this skill's canonical definitions
- Never use a component's visual appearance as the only consistency check — behavior must also be verified live
- If a violation cannot be fixed without a larger architectural change: document it as a deferred item with the blocker stated — do not silently leave it in place
