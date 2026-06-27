# prd-writer.md

## Purpose
Write or reverse-engineer a Product Requirements Document from an existing codebase or feature. Ground every requirement in observable system behavior. Distinguish clearly between what the system does today and what it should do.

## When to use
- Codebase exists but has no PRD or the PRD is outdated
- A feature's intended behavior is unclear to the team
- Product intent and implementation are misaligned
- Gaps between expected and actual behavior need to be documented
- A system needs to be re-documented before refactoring or handoff
- A new feature needs a requirements baseline before planning starts

## Core methodology

### Reverse engineering from the system
Read the code, not the wishlist. What a system actually does is the ground truth. Start there — then compare against intent.

### Focus on user outcome, not code
Requirements describe what the user can accomplish — not how the code achieves it. "User can filter products by category" is a requirement. "ProductListView maps categoryId to filteredItems" is an implementation detail.

### Identify hidden intent from implementation
Code encodes decisions. A modal with a confirmation step implies the action is destructive. A disabled button implies a precondition. Read these signals and surface them as explicit requirements.

### Gap analysis: expected vs actual
The most valuable part of a reverse-engineered PRD is the gap list — where the system falls short of reasonable user expectations. These are unfiled bugs and unspecified requirements.

### Clarity over completeness
A PRD with 10 clear, testable requirements is more valuable than one with 50 vague ones. If a requirement cannot be verified, rewrite it until it can.

## Execution steps

### 1. Analyze the codebase or feature
Before writing anything, read:
- The feature's entry point (page component, route, modal trigger)
- The data it consumes (context, API, props)
- The mutations it performs (state updates, API calls, side effects)
- The UI states it handles (loading, empty, error, success)

```bash
# Find all files related to the feature
find src -name "*[FeatureName]*" -o -name "*[featureName]*"
grep -rn "[FeatureName]\|[featureKeyword]" src --include="*.tsx" --include="*.ts" | grep -v "node_modules"
```

### 2. Identify features that actually work
Do not document what the code intends — document what it does. For each component or flow:
- Does it render?
- Do its inputs accept input?
- Do its actions produce results?
- Does data persist after the action?

Label each: ✅ functional / 🟡 partial / ❌ broken.

### 3. Map the actual user flow
Trace the user's path through the feature step by step:
```
User lands on [page] →
Sees [UI state] →
Takes [action] →
System responds with [behavior] →
User sees [result] →
User can next do [follow-on action]
```

Map every branch: happy path, empty state, error state, edge input.

### 4. Define the problem being solved
Write one sentence: what user pain does this feature exist to eliminate?

If this cannot be stated clearly from the code — that is itself a finding. A feature without a clear problem statement is a candidate for removal or redesign.

### 5. Identify missing requirements
Compare actual behavior against reasonable user expectations:
- What should happen that currently does not?
- What error states are unhandled?
- What edge cases does the code ignore?
- What feedback is missing after a user action?
- What validation is absent?

These are gaps — document them explicitly, separately from current behavior.

### 6. Find unhandled edge cases
For every input or data-driven UI, check:
- What happens with no data (empty list, null value)?
- What happens with maximum data (1000 items, very long string)?
- What happens when two users act simultaneously?
- What happens when the network fails mid-action?
- What happens when the user navigates away mid-flow?

### 7. Define ideal product behavior
Based on the user goal and the gaps found, describe what the feature should do — not what it currently does. Mark each ideal behavior as: already implemented / gap / out of scope.

### 8. Validate consistency
Check that requirements do not contradict each other or the existing system:
- Does requirement A conflict with requirement B?
- Does this PRD match what the codebase actually supports?
- Are non-functional requirements (performance, accessibility) achievable given the current stack?

## Output format

```
## PRD: [Feature Name]
Status: Draft | Reviewed | Approved
Date: YYYY-MM-DD
Source: Reverse-engineered from codebase / New feature / Redesign

---

### Problem Statement
[One sentence: what user pain does this feature solve?]

### Target User
[Who uses this — role, context, frequency]

---

### Feature Overview
[2–3 sentences describing what the feature does at the product level]

---

### Actual System Behavior (as-is)
[What the feature currently does — based on code, not assumption]

| Behavior | Status |
|---|---|
| [observable behavior] | ✅ functional / 🟡 partial / ❌ broken |

---

### User Stories
- As a [user], I want to [action] so that [outcome].
- As a [user], when [condition], I expect [behavior].

---

### Functional Requirements
Each requirement must be testable (pass/fail observable).

**Core (must have)**
- FR-01: [Given X, when Y, then Z]
- FR-02: …

**Extended (should have)**
- FR-10: …

---

### Non-Functional Requirements
- Performance: [e.g., list renders <200ms with 500 items]
- Accessibility: [e.g., all interactive elements keyboard-navigable]
- Consistency: [e.g., follows glass-dark design system, single accent color]
- Error handling: [e.g., all async failures surface a user-readable message]

---

### Current Gaps (actual vs ideal)
| # | Gap | Impact | Priority |
|---|---|---|---|
| G-01 | [what is missing or broken] | [user impact] | High / Med / Low |

---

### Unhandled Edge Cases
- [ ] [Edge case] — [current behavior] — [expected behavior]

---

### Suggested Improvements
[Only improvements grounded in the gap analysis — no invented features]
- [Improvement] — addresses [Gap #] — Effort: S / M / L

---

### Out of Scope
[Explicitly list what this PRD does not cover — prevents scope creep]

---

### Assumption Register
Every statement treated as true without confirmed evidence must be listed here.

| # | Assumption | Evidence available | Risk if wrong | Validation needed |
|---|---|---|---|---|
| A-01 | [statement assumed to be true] | Yes / No / Partial | [what breaks if wrong] | [how to verify] |

### Open Questions
- [ ] [Question] — Decision owner: [who] — Needed by: [when]
```

## Hard rules
- Never document a feature as working without verifying it in the codebase
- Never invent requirements that have no evidence in the code or user need
- Never write a requirement that cannot be verified with a pass/fail test
- Always separate actual behavior from ideal behavior — never conflate them
- Never mark a gap as out of scope to avoid documenting it — gaps are findings, not choices
- If a feature's purpose cannot be determined from the code: state "Intent unclear — requires stakeholder input" and do not guess
- A PRD is a contract, not a wish list — every requirement must be implementable given the current stack
