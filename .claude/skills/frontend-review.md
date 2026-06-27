# frontend-review.md

## Purpose
Audit frontend code and UI for usability, consistency, and correctness. Identify real user-facing problems — not aesthetic opinions. Every finding must map to a user impact or a maintenance cost.

## When to use
- After implementing any UI feature before marking it done
- When a page or flow feels inconsistent or confusing
- Before shipping a new component to be reused elsewhere
- When a user reports confusion, errors, or broken interactions
- During design system audit across multiple pages

## Core methodology

### User-first perspective
Every issue is evaluated by its impact on the user completing a task — not by how it looks in isolation. A misaligned button that blocks task completion is Critical. A slightly off spacing that doesn't affect flow is Minor.

### Consistency over creativity
The best UI decision is the one that matches what the rest of the app already does. Deviation requires justification. If the app uses a pattern, the new component must use it too.

### Clarity over decoration
UI elements exist to communicate — not to impress. If removing a decoration makes the interface clearer, remove it. Every visual element must earn its place.

### Predictable UI behavior
Users build mental models. A button that sometimes does something and sometimes doesn't is a defect. Loading states, disabled states, and error states must behave consistently across the app.

### Accessibility by default
Accessibility is not a checklist at the end — it is a quality bar. Color contrast, keyboard navigation, and label associations are non-negotiable minimums.

## Execution steps

### 1. Check layout consistency
- Is spacing consistent with the rest of the app (padding, margin, gap)?
- Is visual hierarchy clear — does the eye land on the most important element first?
- Are elements aligned to a grid or are they placed arbitrarily?
- Does the layout hold when content is longer or shorter than expected?
- Are interactive elements large enough to tap on mobile (minimum 44×44px touch target)?

### 2. Check design system usage
- Are colors sourced from CSS vars (`var(--accent-primary)`, `var(--text-accent)`) — not hardcoded?
- Run hardcoded color check:
  ```bash
  grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
  ```
- Is `font-mono` used only on numeric/financial/code output — never on labels, headings, or descriptions?
- Is the minimum text size `text-xs`? Flag any `text-[7px]`, `text-[8.5px]`, `text-[11.5px]`.
- Are shared primitives used (`NumberInput`, `PageHeader`, `Toast`) — or were they reimplemented?
- Are Lucide icons used for business types — no Apple emoji in chrome?

### 3. Check UX flow
- Can a user complete the primary task without confusion or backtracking?
- Is the call-to-action obvious — does the user know what to do next?
- Are destructive actions (delete, reset) confirmed before execution?
- Does the form submit trigger the right action or silently fail?
- Is feedback given after every user action (success toast, error message, loading state)?
- Are there dead ends — states where the user is stuck with no clear way forward?

### 4. Check responsive behavior
- Does the layout work at mobile (375px), tablet (768px), and desktop (1280px+)?
- Do long labels truncate cleanly or overflow and break layout?
- Are modals scrollable on small screens or do they clip off-screen?
- Do tables have horizontal scroll on narrow viewports — or do they break the page width?

### 5. Check state handling
Every data-driven UI must handle all four states:

| State | Check |
|---|---|
| Loading | Is there a skeleton or spinner? Does the layout not shift on load? |
| Empty | Is there an empty state message? Does it guide the user to next action? |
| Error | Is the error surfaced to the user? Is there a retry path? |
| Success | Is confirmation shown? Does the UI update immediately? |

A component that only handles the "happy path" is incomplete.

### 6. Check accessibility basics
- Do interactive elements have accessible labels (`aria-label`, `htmlFor`)?
- Is color the only differentiator between states (e.g., red/green only)? Must also use text or icon.
- Is keyboard navigation possible for all primary actions (Tab, Enter, Escape)?
- Does contrast between text and background meet minimum 4.5:1 ratio for normal text?
- Do images and icons that carry meaning have `alt` text?

### 7. Check component reusability and duplication
- Is this component specific enough to live in `features/` or generic enough for `shared/ui/`?
- Does a nearly identical component already exist elsewhere?
  ```bash
  grep -rn "ComponentName\|similar keyword" src --include="*.tsx"
  ```
- Are props over-specified (too many one-off props that only work for one use case)?
- Are props too vague (a single `data: any` object instead of typed fields)?

### 8. Check glass rule (project-specific)
- Is `backdropFilter`/`backdrop-blur` added to any inner card, panel, or modal? Must not be.
- Modal pattern: overlay `rgba(0,0,0,0.65)` no blur + card `rgba(14,10,28,0.92)` + border `rgba(255,255,255,0.12)`.
- Inner surfaces: solid translucent fills only (`rgba(255,255,255,0.06)` for cards).

## Output format

```
## Frontend Review: [page / component / feature]

### Critical — blocks user task or breaks interface
- [File:line or component] — [issue] — User impact: [what the user cannot do]
  Fix: [what to change]

### Medium — degrades experience or consistency
- [File:line or component] — [issue] — User impact: [how it confuses or slows the user]
  Fix: [what to change]

### Minor — polish and edge cases
- [File:line or component] — [issue]
  Suggestion: [optional improvement]

### State Coverage
- [ ] Loading state ✅ / ❌ / Not applicable
- [ ] Empty state ✅ / ❌ / Not applicable
- [ ] Error state ✅ / ❌ / Not applicable
- [ ] Success feedback ✅ / ❌ / Not applicable

### Design System Compliance
- [ ] No hardcoded colors (grep: 0) ✅ / ❌
- [ ] font-mono on numeric only ✅ / ❌
- [ ] Minimum text-xs ✅ / ❌
- [ ] Shared primitives used ✅ / ❌
- [ ] No nested backdropFilter ✅ / ❌

### Accessibility
- [ ] Interactive elements labeled ✅ / ❌
- [ ] Keyboard navigable ✅ / ❌
- [ ] Color not sole differentiator ✅ / ❌

### Redesign Suggestion (optional — only if justified)
[Only if current structure fundamentally prevents usability — describe what and why, not just preference]

### Not Reviewed
[Any area not audited — state reason]
```

## Hard rules
- Never flag something as Critical because it looks wrong — only if it blocks or breaks user action
- Never comment "this doesn't look good" without explaining what user behavior it harms
- Never propose a redesign without stating what specific usability problem the current design causes
- Never ignore empty, loading, or error states — incomplete state coverage is a defect
- Never approve a component with hardcoded accent colors
- If a responsive check cannot be performed: state "Responsive behavior not verified — requires live preview"
