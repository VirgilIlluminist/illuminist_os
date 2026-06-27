# auto-design-system-compiler.md

## Purpose
Extract, canonicalize, and compile a design system from real application usage. Not from theory — from what actually exists in the codebase. The output is a component library where every UI element is a derivation of one standard, with defined structure, props, variants, states, and interaction rules. New UI is never written from scratch — it is composed from this library or it extends it first.

## When to use
- A new UI pattern is needed that has no existing standard component
- The same UI pattern appears in more than two files with different implementations
- Frontend refactor is planned and the target state needs to be defined before execution
- UI is inconsistent and the root cause is duplicate, divergent implementations
- The `shared/ui/` directory is thin while feature-level components reinvent the same patterns
- After any large batch of feature additions — compile what emerged into the system

## Core methodology

### Reality-first design system
The design system is extracted from what the application actually contains — not designed top-down from a blank canvas. Scan first. Cluster second. Canonicalize third. This produces a system that developers will actually use because it reflects real usage patterns.

### Pattern extraction engine
Every UI component in the app is raw material. Read the raw material, identify recurring shapes and behaviors, group them by similarity. Two things that look different but behave identically are the same component. Two things that look identical but behave differently are different components. Separate by behavior, not by appearance.

### Canonical component rule
Each UI category has exactly one canonical implementation. Variants are explicit props on the canonical component — not separate implementations. `Button` has `variant="primary" | "secondary" | "ghost" | "danger"`. It does not have `PrimaryButton`, `SecondaryButton`, and `DangerButton` as separate files.

### Composition over duplication
A page contains no UI logic — only compositions of canonical components. When a page contains inline styles, ad-hoc layout structures, or custom interaction patterns, those are candidates for extraction into the library. The library grows from bottom up — but it is consumed top down.

### System normalization layers
Every design system has five normalization layers. Each must be defined before components can be specified:

```
Layer 1 — Token system     (color, spacing, typography, shadow, motion)
Layer 2 — Primitive system (atom-level: input, button, icon, badge, avatar)
Layer 3 — Composite system (molecule: form field, card, tab bar, modal)
Layer 4 — Layout system    (organism: page header, sidebar, content grid)
Layer 5 — Page system      (template: composition rules per page type)
```

Changes to Layer 1 automatically propagate to all layers above it. This is why tokens must be defined first and respected absolutely.

## Execution steps

### Step 1 — UI extraction scan
Collect all raw UI patterns from the codebase:

```bash
# All existing shared components (current library state)
find src/shared/ui -name "*.tsx" | sort
find src/shared/components -name "*.tsx" | sort

# All feature-level UI (raw patterns to be extracted)
find src/features -name "*.tsx" | sort

# Count inline style blocks (each is a potential library candidate)
grep -rn "style={{" src/features --include="*.tsx" | wc -l

# Count className strings (identify pattern density)
grep -rn "className=" src/features --include="*.tsx" | wc -l

# Find all input implementations
grep -rn "<input\b" src/features --include="*.tsx" -l
grep -rn "<button\b" src/features --include="*.tsx" -l
grep -rn "modal\|Modal\|dialog\|Dialog" src/features --include="*.tsx" -l
grep -rn "tab\b\|Tab\b" src/features --include="*.tsx" -l
grep -rn "card\|Card\|surface\|Surface" src/features --include="*.tsx" -l
grep -rn "empty.*state\|EmptyState\|no.*data\|No.*data" src/features --include="*.tsx" -l
grep -rn "loading\|skeleton\|Skeleton" src/features --include="*.tsx" -l
```

Build the raw pattern inventory — one row per unique implementation found:

| Pattern | File | Line | Structure | Behavior | Visual |
|---|---|---|---|---|---|
| Input text | ProductForm.tsx | 42 | `<input type="text">` | onChange | Dark bg, border |
| Input text | MaterialForm.tsx | 88 | `<input type="text">` | onChange | Same but no focus ring |
| … | | | | | |

### Step 2 — Pattern clustering
Group raw patterns by behavioral and structural similarity:

```
Cluster: TEXT_INPUT
  Members:
    - ProductForm.tsx:42   — controlled, onChange, no validation display
    - MaterialForm.tsx:88  — controlled, onChange, missing focus ring
    - SalesForm.tsx:156    — uncontrolled, no onChange ← BROKEN
    - BusinessWizard.tsx:203 — controlled, onChange, has error display
  
  Canonical target: controlled + onChange + focus ring + optional error display

Cluster: PRIMARY_BUTTON
  Members:
    - 14 files, 3 different accent color approaches:
      A) hardcoded #8b5cf6 background (violation)
      B) config.customAccentColor inline (correct)
      C) var(--accent-primary) in className (correct)
  
  Canonical target: style={{ background: accent }} with hover/active/disabled states

Cluster: TAB_BAR
  Members:
    - 8 files, 2 different active indicator approaches:
      A) border-bottom accent (correct)
      B) background pill (divergent)
  
  Canonical target: border-bottom-2 var(--accent-primary), consistent across all
```

Duplication threshold: if 3 or more files implement the same pattern differently → that pattern must be extracted into `shared/ui/`.

### Step 3 — Canonicalization
For each cluster, define the one correct implementation:

---

#### TOKEN LAYER (Layer 1) — non-negotiable

```typescript
// src/shared/theme/tokens.ts — source of truth
export const tokens = {
  color: {
    accent: 'var(--accent-primary)',           // user-picked, set by applyAccent()
    accentMuted: 'var(--accent-primary-muted)',
    accentText: 'var(--text-accent)',
    border: 'var(--border-accent)',
    shadow: 'var(--shadow-accent)',
    surface: {
      card: 'rgba(255,255,255,0.04)',
      cardHover: 'rgba(255,255,255,0.07)',
      modal: 'rgba(14,10,28,0.92)',
      overlay: 'rgba(0,0,0,0.65)',
      input: 'rgba(255,255,255,0.05)',
    },
    border_default: 'rgba(255,255,255,0.08)',
    border_subtle: 'rgba(255,255,255,0.05)',
    text: {
      primary: 'rgba(255,255,255,1)',
      secondary: 'rgba(255,255,255,0.7)',
      muted: 'rgba(255,255,255,0.4)',
      disabled: 'rgba(255,255,255,0.25)',
    },
  },
  radius: {
    sm: 'rounded-md',     // 6px — inputs, badges
    md: 'rounded-lg',     // 8px — buttons, cards
    lg: 'rounded-xl',     // 12px — panels, sections
    xl: 'rounded-2xl',    // 16px — modals, major surfaces
  },
  text: {
    // MINIMUM: text-xs. NEVER below.
    xs: 'text-xs',        // 12px — captions, labels
    sm: 'text-sm',        // 14px — body, inputs, buttons
    base: 'text-base',    // 16px — headings
    // font-mono: ONLY numbers, money, percentages, code, cell addresses
  },
}
```

---

#### PRIMITIVE LAYER (Layer 2) — canonical component specs

**`Input` — `src/shared/ui/Input.tsx`**
```
Props:    value, onChange, placeholder, disabled, error, size (sm|md)
States:   default | focus (accent border+ring) | error (red border) | disabled (opacity-50)
Behavior: controlled only, onChange required, onBlur optional for validation
Pattern:
  className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 text-sm text-white
             placeholder-white/30 focus:outline-none focus:border-[var(--border-accent)]
             focus:ring-1 focus:ring-[var(--border-accent)] transition-colors
             disabled:opacity-50 disabled:cursor-not-allowed"
Error display: text-xs text-red-400 mt-1 (below the input, not inline)
```

**`NumberInput` — `src/shared/ui/NumberInput.tsx` (EXISTING — enforce usage)**
```
Use for: ALL numeric fields — price, quantity, percentage, weight, any number
Never use: <input type="number"> directly
```

**`Button` — `src/shared/ui/Button.tsx`**
```
Props:    variant (primary|secondary|ghost|danger), size (sm|md|lg), disabled, loading, icon
States:   default | hover (opacity-90) | active (opacity-80) | disabled (opacity-40, no-pointer) | loading (spinner)
Variants:
  primary:   style={{ background: accent, boxShadow: shadowAccent }}
  secondary: className="bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
  ghost:     className="text-white/60 hover:text-white hover:bg-white/5"
  danger:    className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
```

**`TabBar` — `src/shared/ui/TabBar.tsx`**
```
Props:    tabs [{id, label, count?}], activeTab, onTabChange
Active:   border-b-2 border-[var(--accent-primary)] text-[var(--text-accent)]
Inactive: border-b-2 border-transparent text-white/50 hover:text-white/80
Count badge: font-mono text-xs (count IS numeric — mono allowed here)
```

**`Modal` — `src/shared/ui/Modal.tsx`**
```
Props:    open, onClose, title, children, size (sm|md|lg|full)
Overlay:  fixed inset-0 z-50, background rgba(0,0,0,0.65), NO backdropFilter
Card:     background rgba(14,10,28,0.92), border rgba(255,255,255,0.12), rounded-2xl
Animation: motion/react scale 0.96→1 + opacity 0→1, 200ms ease-out
Close:    Escape key + X button + overlay click (all three)
```

**`EmptyState` — `src/shared/ui/EmptyState.tsx`**
```
Props:    icon (Lucide), title, description, action? {label, onClick}
Layout:   flex-col items-center justify-center py-16 text-center
Icon:     w-10 h-10 text-white/20 mb-3
Title:    text-sm font-medium text-white/40
Desc:     text-xs text-white/25 mt-1
Action:   Button variant="secondary" mt-4 (optional)
```

**`Skeleton` — `src/shared/ui/Skeleton.tsx`**
```
Props:    height, width, className
Pattern:  animate-pulse rounded-lg bg-white/5
Size:     matches exactly the content it replaces (not generic full-width bars)
```

**`Card` — surface wrapper**
```
Pattern:  rounded-xl p-4, background rgba(255,255,255,0.04), border rgba(255,255,255,0.08)
Hover:    hover:bg-white/6 transition-colors (only if interactive)
```

**`PageHeader` — `src/shared/ui/PageHeader.tsx` (EXISTING — enforce usage)**
```
Use for: ALL page-level headers
Never implement custom header in a feature page
```

**`Toast` — `src/shared/ui/Toast.tsx` (EXISTING — enforce usage)**
```
Use for: ALL success/error/info notifications
Never: custom inline alert divs, browser alert(), console.log as user feedback
```

---

#### COMPOSITE LAYER (Layer 3) — canonical assembly specs

**`FormField`** — label + input + error message as one unit
**`DataTable`** — table with sort, filter, pagination (use existing shared/table primitive)
**`ActionMenu`** — dropdown with action items (consistent positioning + keyboard nav)
**`StatCard`** — metric display card with label + value + optional trend

---

### Step 4 — Component library structure
The compiled library structure:

```
src/shared/
├── ui/
│   ├── Input.tsx          — text input
│   ├── NumberInput.tsx    — numeric input (existing)
│   ├── Button.tsx         — all button variants
│   ├── TabBar.tsx         — tab navigation
│   ├── Modal.tsx          — modal container
│   ├── EmptyState.tsx     — empty state display
│   ├── Skeleton.tsx       — loading placeholder
│   ├── Card.tsx           — surface wrapper
│   ├── FormField.tsx      — label+input+error unit
│   ├── PageHeader.tsx     — page header (existing)
│   ├── Toast.tsx          — notifications (existing)
│   ├── Badge.tsx          — status/label chip
│   └── index.ts           — barrel export (all primitives)
├── theme/
│   ├── accent.ts          — applyAccent() (existing)
│   ├── tokens.ts          — design tokens (to be created)
│   └── tokens.css         — CSS custom properties (existing)
└── table/
    └── (existing table primitives)
```

Every primitive exported from `shared/ui/index.ts`. Feature components import from `@/shared/ui`, never from each other's directories.

### Step 5 — Migration plan
Map every non-canonical usage to its canonical replacement:

| # | File | Line | Current (raw) | Replace with | Priority |
|---|---|---|---|---|---|
| 1 | [file] | [line] | `<input type="text"...>` | `<Input value onChange />` | High |
| 2 | [file] | [line] | custom modal div | `<Modal open onClose>` | High |
| 3 | [file] | [line] | inline tab implementation | `<TabBar tabs activeTab>` | Medium |

Migration execution order:
1. Create any missing canonical components in `shared/ui/`
2. Migrate high-priority violations (raw inputs, custom modals)
3. Migrate medium-priority violations (inline patterns)
4. Update barrel export `shared/ui/index.ts`
5. Run enforcement gates

### Step 6 — Enforcement rules
After the library is compiled:

**For new UI:**
- Cannot write a new UI pattern without checking if a canonical component exists
- If a canonical component exists: use it — no exceptions
- If no canonical component exists: add it to `shared/ui/` first, then use it
- No inline implementation of a pattern that has a shared component

**For existing UI:**
- Every PR that adds UI must be checked against the component library
- If the PR creates a new inline pattern instead of using/extending a shared component: it does not merge until corrected

**Enforcement grep suite (run before closing any UI task):**
```bash
grep -rn '<input ' src/features --include="*.tsx"
grep -rn 'type="number"' src --include="*.tsx"
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
grep -rn "backdropFilter\|backdrop-blur" src/features --include="*.tsx"
grep -rn 'text-\[7px\]\|text-\[8\.5px\]\|text-\[11\.5px\]' src --include="*.tsx"
npx tsc --noEmit
```
All must return 0 (or only known exceptions).

## Output format

```
## Design System Compilation Report

### Token Layer Status
- [ ] Color tokens: defined in tokens.ts ✅ / ❌
- [ ] applyAccent() wired in AppLayout ✅ / ❌
- [ ] No hardcoded hex values: 0 violations ✅ / ❌ ([N] found)

---

### Pattern Inventory
| Cluster | Raw implementations | Canonical component | Location |
|---|---|---|---|
| Text input | [N] | `Input` | shared/ui/Input.tsx ✅ / missing ❌ |
| Number input | [N] | `NumberInput` | shared/ui/NumberInput.tsx ✅ |
| Button | [N] | `Button` | shared/ui/Button.tsx ✅ / missing ❌ |
| Tab bar | [N] | `TabBar` | shared/ui/TabBar.tsx ✅ / missing ❌ |
| Modal | [N] | `Modal` | shared/ui/Modal.tsx ✅ / missing ❌ |
| Empty state | [N] | `EmptyState` | shared/ui/EmptyState.tsx ✅ / missing ❌ |
| Loading | [N] | `Skeleton` | shared/ui/Skeleton.tsx ✅ / missing ❌ |

---

### Duplicate Report
| Pattern | Files with divergent implementations | Canonical chosen |
|---|---|---|
| [pattern] | [file list] | [file:line or description] |

---

### Component Library (compiled)
**Existing (enforce usage):**
- NumberInput ✅
- PageHeader ✅
- Toast ✅

**Need to create:**
- [ ] Input.tsx
- [ ] Button.tsx
- [ ] TabBar.tsx
- [ ] Modal.tsx
- [ ] EmptyState.tsx
- [ ] Skeleton.tsx

---

### Migration Plan
High priority ([N] items — raw inputs / custom modals):
- [ ] [file:line] → [canonical component]

Medium priority ([N] items — inline patterns):
- [ ] [file:line] → [canonical component]

---

### Enforcement Gates (post-compilation)
- [ ] Raw <input> in features: 0 ✅ / ❌ ([N] remaining)
- [ ] Raw type=number: 0 ✅ / ❌
- [ ] Hardcoded colors: 0 ✅ / ❌
- [ ] Nested backdropFilter: 0 ✅ / ❌
- [ ] tsc: 0 errors ✅ / ❌
- [ ] Barrel export updated ✅ / ❌

---

### Library Status

Components compiled: [N]
Violations resolved: [N]
Violations remaining: [N]

**System status: COMPILED ✅ / IN PROGRESS 🟡 / NOT STARTED ❌**
```

## Hard rules
- Never write a new UI pattern in a feature file when a canonical component exists in `shared/ui/`
- Never create a variant by duplicating a component — add a `variant` prop to the canonical component
- Never migrate partially — if `Input.tsx` is created, all raw `<input>` in features must be replaced before the task is done
- Never define a canonical component without specifying: props, all states, interaction behavior, and which layer it belongs to
- Never treat "looks similar" as "same component" — cluster by behavior, verify by structure
- The library grows from real usage — never add a component to `shared/ui/` that is not used by at least two feature files
- If a pattern appears in only one file: leave it there until a second file needs it, then extract
