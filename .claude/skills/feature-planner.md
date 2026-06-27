# feature-planner.md

## Purpose
Break down a feature into the smallest executable implementation units, ordered by dependency, with clear scope and risk visibility. No ambiguity entering the build phase.

## When to use
- Before implementing any feature that touches more than one file or layer
- When a requirement is complex, multi-step, or multi-stakeholder
- When the full scope of a feature is unclear before starting
- When planning a technical roadmap or phased delivery
- When a previous implementation went wrong because planning was skipped

## Core methodology

### Clarify intent before build
A feature that is not fully understood will be built wrong. The cost of one clarifying question before coding is zero. The cost of a wrong implementation is a full rewrite.

### Break down into smallest executable units
A task is correctly sized when: one developer can complete it in one focused session, it produces a testable output, and it does not depend on unfinished work in the same batch.

### Dependency-first ordering
Tasks must be ordered so that nothing is blocked. Build data models before services, services before UI, shared components before the pages that consume them.

### Reduce ambiguity
Every assumption left unstated is a potential wrong turn. Surface assumptions explicitly and mark them for confirmation before the build starts.

### Optimize for incremental delivery
Define an MVP: the smallest version of the feature that delivers real value. Everything beyond MVP is Phase 2. Ship MVP first.

## Execution steps

### 1. Understand the requirement
Read the PRD, task description, or user request. Restate the feature goal in one sentence:
> "This feature allows [user] to [action] so that [outcome]."

If you cannot write this sentence clearly: stop and ask before proceeding.

### 2. Identify the user goal
What is the user trying to accomplish? Not the feature — the underlying goal. This determines what "done" means and what edge cases matter.

Questions to answer:
- Who uses this? (role, context)
- What triggers the need? (event, state, action)
- What does success look like for the user?
- What does failure look like?

### 3. Define scope
Be explicit. Ambiguous scope is the primary cause of overbuilt or underbuilt features.

**In scope (v1 / MVP):**
List only what is required for the feature to deliver its core value.

**Out of scope (v1):**
List everything that could be added but will not be. This prevents scope creep during implementation.

**Open questions:**
List any decision that cannot be made from the current requirement alone. Mark who needs to decide and block planning until answered.

### 4. Break into sub-features
Decompose the feature into logical sub-units. Each sub-feature should:
- Represent a distinct piece of user-visible or system-level behavior
- Be independently testable
- Map to a clear layer (data / service / UI)

Example decomposition:
```
Feature: Create Business
├── Sub-feature 1: Business type selection UI
├── Sub-feature 2: Business data form + validation
├── Sub-feature 3: Persist new business to context/DB
├── Sub-feature 4: Navigate to new business dashboard post-create
└── Sub-feature 5: Empty state handling if creation fails
```

### 5. Map dependencies
For each sub-feature, identify what it depends on:

```
Sub-feature 3 (persist) → requires Sub-feature 2 (form + validation) to be complete
Sub-feature 4 (navigate) → requires Sub-feature 3 (persist) to return a business ID
```

Use this map to determine build order. Nothing should be built that depends on incomplete work.

### 6. Identify affected areas
Before writing a single line of code, find every file and system that this feature touches:

```bash
# Find relevant existing files
grep -rn "[feature keyword]" src --include="*.ts" --include="*.tsx" | head -30
find src -name "*[feature keyword]*"
```

List: components, hooks, contexts, types, services, API routes, DB tables, constants.

### 7. Order by execution priority
Sequence tasks so each one is unblocked:
1. Types and interfaces first (no dependencies)
2. Data layer / context mutations
3. Service / repository functions
4. Shared UI components (if new ones are needed)
5. Feature page / integration
6. Edge cases, empty states, error handling

### 8. Define MVP vs full version
**MVP** — minimum that delivers the core user value. Should be shippable and testable.
**Phase 2** — enhancements, edge case handling, polish, performance optimizations.

Every task must be labeled: MVP or Phase 2. Do not build Phase 2 until MVP is verified working.

### 9. Identify risks and unknowns
For each risk:
- What could go wrong?
- How likely?
- What is the mitigation?
- What is the fallback if mitigation fails?

Flag unknowns that must be resolved before the task can start.

### 10. Validate coverage
Before handing the plan to implementation, check:
- [ ] Happy path covered
- [ ] Empty state covered
- [ ] Error state covered
- [ ] Loading state covered
- [ ] Edge cases (null, empty, duplicate, max length) identified
- [ ] Permissions / auth requirements addressed
- [ ] Responsive behavior considered
- [ ] No task is too large (>1 focused session = split further)

## Output format

```
## Feature Plan: [Feature Name]

### Goal
[One sentence: This feature allows [user] to [action] so that [outcome].]

### User Goal
[What the user is trying to accomplish — the underlying need, not the feature spec]

### Scope

**In scope (MVP):**
- …

**Out of scope (v1):**
- …

**Open questions (block until answered):**
- [ ] [Question] — Decision owner: [who]

---

### Sub-feature Breakdown
| # | Sub-feature | Layer | MVP / Phase 2 |
|---|---|---|---|
| 1 | [name] | UI / Service / Data | MVP |
| 2 | … | | |

### Dependency Map
- Sub-feature 2 → requires Sub-feature 1
- Sub-feature 3 → requires Sub-feature 2
- [Independent: Sub-features X, Y can be built in parallel]

### Affected Files
- [file path] — [why affected]
- [file path] — [what changes]

---

### Execution Plan (ordered)

**Phase 1 — MVP**
- [ ] Task 1 — [File(s)] — [Output / definition of done]
- [ ] Task 2 — [File(s)] — [Output / definition of done]
- [ ] Task 3 — …

**Phase 2 — Full version**
- [ ] Task A — [File(s)] — [Output]
- [ ] Task B — …

---

### Assumption Register
Every unknown that is being treated as true must be logged here. No silent assumptions.

| # | Assumption | Type | Risk if wrong | Validation needed | Status |
|---|---|---|---|---|---|
| A-01 | [statement treated as true] | Technical / Product / Data | [what breaks] | [how to verify] | Unvalidated / Confirmed / Rejected |

**Rule:** If an assumption cannot be validated before planning is complete, the dependent tasks must be marked as blocked until it is confirmed.

### Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | [what could go wrong] | High / Med / Low | High / Med / Low | [mitigation] |

### Edge Cases to Cover
- [ ] Empty state
- [ ] Error / failure state
- [ ] Loading / async state
- [ ] Null or missing data
- [ ] Duplicate entry
- [ ] Max length / overflow
- [ ] Permission / auth boundary
- [ ] [Feature-specific edge case]

### Definition of Done (MVP)
- [ ] [Specific, observable criteria — not "works correctly"]
- [ ] tsc 0 errors
- [ ] Live verified in preview
```

## Hard rules
- Never start implementation before scope is defined and open questions are answered
- Never create a task that cannot be completed and tested independently
- Never skip the dependency map — building in wrong order causes rework
- Never label something MVP if the feature does not deliver real value without it
- Never ignore error, empty, and loading states — they are part of the feature, not afterthoughts
- If a requirement is ambiguous: write the ambiguity explicitly and ask — do not assume and proceed
- A plan with 20 tasks is probably wrong — either the feature is too large (phase it) or the tasks are too small (merge them)
