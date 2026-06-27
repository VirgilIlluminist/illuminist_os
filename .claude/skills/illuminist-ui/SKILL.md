---
name: illuminist-ui
description: Enforce ILLUMINIST OS UI/UX consistency — the glass theme, the single-accent color system, input/modal correctness, and typography rules. Load this WHENEVER editing any .tsx component, CSS, color, theme, or styling in this repo, or when the user reports inconsistent UI, "purple everywhere", broken inputs, or non-glass pages.
---

# ILLUMINIST OS — UI Consistency Enforcer

This skill encodes the hard-won rules for this codebase. Follow them exactly. They exist because each was a real bug that cost the user time.

## 1. THE SINGLE-ACCENT COLOR SYSTEM (most important)

There is **ONE** accent color for the whole app. The user picks it in **Settings → Tampilan → Accent Color**. It is stored as `config.customAccentColor` (ERPContext).

**How it propagates — never break this chain:**
- `config.customAccentColor` is the source of truth.
- `AppLayoutInner` runs `applyAccent(accent)` (`src/shared/theme/accent.ts`) on every change.
- `applyAccent()` writes EVERY accent CSS var: `--accent-primary`, `--accent-primary-muted/hover/glow`, `--border-accent`, `--shadow-accent`, `--text-accent`, `--bg-surface-active`, and the legacy `--color-accent-highlight/muted/border`.

**Rules when writing components:**
- ✅ Inline styles: `const accent = config?.customAccentColor || '#7c3aed';` then use `accent`, `` `${accent}2e` `` (hex opacity), etc.
- ✅ Tailwind/CSS: use `var(--accent-primary)`, `var(--color-accent-highlight)`, `var(--color-accent-muted)`, `var(--color-accent-border)`, `var(--shadow-accent)`.
- ❌ NEVER hardcode `#8b5cf6`, `#5b21b6`, `rgba(124,58,237,*)`, `bg-purple-*`, `text-purple-*`, `text-violet-*`, `border-purple-*`. These are the bug.
- ❌ NEVER use a business's `getColorForType()` / `colorHex` for page chrome (sidebar, headers, buttons, charts). Business `colorHex` is ONLY for the small business-identity chip/avatar. Chrome always follows the single accent.

**Verify after any color work:**
```bash
grep -rn "#8b5cf6\|#5b21b6\|rgba(124,58,237\|bg-purple-\|text-purple-\|text-violet-\|border-purple-" src --include="*.tsx"
```
Must return 0 (except the documented `|| '#7c3aed'` fallback string).

## 2. THE GLASS RULE (backdrop-filter)

`backdrop-filter` goes on **EXACTLY ONE** element: `.glass-shell` (the outer app wrapper in `index.css`). It also has `transform: translateZ(0)`, which creates a stacking + containing-block context.

- ❌ NEVER add `backdropFilter`/`backdrop-blur` to any inner card, panel, or modal inside the app shell. Nested blur white-washes the page AND can break pointer events on inputs.
- ✅ Inner surfaces use solid translucent fills: cards `rgba(255,255,255,0.06)`, modals `rgba(14,10,28,0.92)`.
- ✅ Glass modal pattern: overlay = `rgba(0,0,0,0.65)` NO blur; card = `rgba(14,10,28,0.92)` + `border: 1px solid rgba(255,255,255,0.12)` + NO backdropFilter.
- **Exceptions (do not touch):** `LoginPage` card (standalone, no glass-shell parent), `BackgroundStage`'s floating Wallpaper panel, and `FinancesAndAssetsView`'s intentional `blur(${tableBlur}px)` slider feature.

## 3. INPUTS MUST WORK

Before claiming an input is "broken", verify the real cause live (preview_eval):
- Check `document.elementFromPoint(centerX, centerY)` returns the input itself (not an overlay).
- Check it isn't a frozen controlled input (value set without `onChange`).
- The usual culprit historically: nested `backdropFilter` on a modal card (see Rule 2).
- Use the shared `NumberInput` primitive (`src/shared/ui/NumberInput`) for numeric fields — never raw `<input type="number">`.

## 4. TYPOGRAPHY

- `font-mono` ONLY on numeric/financial output: money (`formatMoney`), percentages, counts, code, cell addresses. NEVER on labels, headings, descriptions, tab names, empty states.
- No unreadable micro text: minimum `text-xs`. Never `text-[7px]`, `text-[8.5px]`, `text-[11.5px]`.
- Business-type icons: Lucide components via `BUSINESS_ICON_NAMES` / the `BIZ_ICONS` maps. NEVER Apple emoji in UI chrome.

## 5. ARCHITECTURE BOUNDARY (from CLAUDE.md)

UI → Repository → Service → Database. UI must not read localStorage/Supabase directly or hold business logic. Current reality: most reads go through `ERPContext` (localStorage, camelCase). Respect the existing data flow of the file you're editing; don't invent a parallel path.

## 6. WORKFLOW DISCIPLINE

- Fix the **system**, not the symptom. "Purple everywhere" was ONE broken sync, not 40 bugs. Find the source before mass-editing.
- After UI changes, run `npx tsc --noEmit` (must be 0 errors) and verify live in the preview (screenshot) before claiming done.
- Don't whack-a-mole. Grep for ALL instances of a pattern first, then fix once.
