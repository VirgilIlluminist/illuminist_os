# architect.md

## Purpose
Analyze, evaluate, and improve the architecture of a web application codebase. Produce actionable diagnosis and refactor plans based on evidence — not opinion.

## When to use
- Before implementing any feature that touches >2 layers (UI, service, data)
- When the codebase feels "wrong" but the cause is unclear
- Before choosing a new tech stack or library
- When performance or scalability issues appear structural
- When onboarding to a new codebase for the first time
- Before a major refactor

## Core methodology

### System thinking
Understand the full system before touching any part. Every component exists in relation to others. A change in one layer ripples.

### Dependency mapping
Trace how data and control flow across the system:
- Where does data originate?
- How does it move between layers?
- What depends on what?
- Where are circular dependencies?

### Bottleneck detection
Find where the system is constrained:
- Which layer holds the most logic it shouldn't?
- Which module is imported by everything?
- What breaks when one piece changes?

### Scalability analysis
Evaluate against realistic growth (not hypothetical):
- What breaks at 10x current load?
- What breaks when a second business type is added?
- What breaks when a second developer joins?

### Modular design principles
- Single responsibility per module
- Explicit interfaces between layers
- No hidden coupling through shared mutable state
- Configuration over hardcoding
- Composition over inheritance

## Execution steps

### 1. Collect input
Before analyzing:
- Read `CLAUDE.md`, `docs/PRD.md`, and any existing architecture docs
- Run `find src -type f | sort` to map the full file tree
- Run `grep -rn "import" src --include="*.ts" --include="*.tsx" | grep "\.\./" | head -50` to spot cross-boundary imports
- Identify the entry points (router, providers, layout)

### 2. Read the codebase
In order:
1. Entry point → understand app boot sequence
2. State layer → how data is stored and mutated
3. UI layer → how components consume data
4. Service/API layer → how external data enters
5. Shared utilities → what is reused and by whom

For each layer, answer:
- What is the stated responsibility?
- What is the actual responsibility?
- Are they the same?

### 3. Find structural problems
Check for:
- **Layer violations** — UI reading DB directly, service calling UI state
- **God files** — single files >500 lines doing multiple jobs
- **Implicit coupling** — two modules that break when either changes
- **Duplicate logic** — same transformation written twice in different files
- **Fragile config** — hardcoded values that should be env vars or constants
- **Dead code** — imports or exports that nothing consumes
- **Circular dependencies** — A imports B, B imports A

### 4. Evaluate tech stack
For each major dependency:
- Is it solving a real problem or was it added "just in case"?
- Is it actively maintained?
- Is there a simpler native alternative?
- What is the bundle cost?

Only flag issues that have observable impact. Do not recommend changes without a concrete benefit.

### 5. Determine refactor plan
Prioritize by:
1. **Correctness** — things that are broken or will break under normal usage
2. **Coupling** — things that make every change dangerous
3. **Duplication** — things that require synchronized edits
4. **Scalability** — things that structurally cannot grow

For each issue: define the smallest refactor that fixes it. Never propose a full rewrite unless the alternative is rebuilding every feature anyway.

## Output format

```
## Architecture Diagnosis

### System Overview
[1 paragraph — what this system is and how it's structured today]

### Layer Map
[UI → State → Service → Data — describe what each currently does vs. what it should do]

### Problems Found
| # | Problem | Layer | Severity | Evidence |
|---|---------|-------|----------|----------|
| 1 | [issue] | [layer] | Critical / High / Medium / Low | [file:line or grep result] |

### Root Causes
[For each Critical/High problem — what is the underlying cause, not just the symptom]

### Recommended Structure
[Describe the target architecture. Only diverge from current if justified by evidence.]

### Refactor Plan
Phase 1 — [Lowest risk, highest impact]
- [ ] [Task] — [File(s)] — [Why first]

Phase 2 — [Structural improvements]
- [ ] [Task] — [File(s)] — [Dependency on Phase 1]

Phase 3 — [Optional / future]
- [ ] [Task] — [Only if Phase 1+2 are stable]

### Tech Stack Evaluation
| Dependency | Current use | Verdict | Reason |
|------------|-------------|---------|--------|
| [lib] | [what for] | Keep / Replace / Remove | [evidence-based reason] |

### Tradeoffs
[For any recommendation with a real alternative — state both sides]
Option A: [approach] — Pro: … Con: …
Option B: [approach] — Pro: … Con: …
Recommendation: [A or B] because [concrete reason]

### Open Questions
- [ ] [Decision that cannot be made from codebase alone — who decides]
```

## Hard rules
- Never diagnose without reading the actual code — no assumptions from file names alone
- Never recommend a technology without stating the concrete problem it solves
- Never propose a refactor larger than necessary to fix the identified problem
- Never call something "bad architecture" without specifying why and what breaks because of it
- Always provide a tradeoff when two valid options exist
- If a part of the codebase cannot be analyzed (missing context, external system): state it explicitly as "Not evaluated — reason"
- Simplicity that works beats elegance that doesn't ship
