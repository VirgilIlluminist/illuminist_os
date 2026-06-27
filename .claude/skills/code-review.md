# code-review.md

## Purpose
Review code for correctness, maintainability, and consistency. Find real problems with real fixes. Not style opinions — engineering decisions.

## When to use
- Before merging any non-trivial change
- After implementing a feature or fix
- When codebase feels inconsistent or fragile
- When technical debt is accumulating and needs triaging

## Core methodology

### Correctness first
Does the code do what it claims? Wrong code that is clean is still wrong. Start here before anything else.

### Simplicity over cleverness
If a reviewer needs to think twice to understand a line, it is a problem. Complexity must be justified by a real constraint — not preference.

### Consistency across codebase
One pattern per problem. If the codebase uses `useERP()` for data access, a new hook that reads `localStorage` directly is a violation — even if it works.

### Separation of concerns
Each unit (function, component, module) does one thing. Business logic in UI is a defect. Data fetching in a presentational component is a defect.

### Readability as a feature
Code is read 10x more than it is written. Naming, structure, and flow must communicate intent without comments.

## Execution steps

### 1. Understand intent
Before reading code, answer: what is this change supposed to do? Read the PR description, task, or user request. Without knowing intent, correctness cannot be evaluated.

### 2. Check logic correctness
- Does the implementation match the stated intent?
- Are all branches reachable and correct?
- Are async operations properly awaited and error-handled?
- Are mutations intentional — no accidental shared state mutation?
- Are calculations correct for boundary values (0, null, empty array, max int)?

### 3. Check edge cases
- What happens with null / undefined input?
- What happens with empty arrays or strings?
- What happens on network failure?
- What happens when the user acts faster than the async resolves?
- What happens on first render before data loads?

### 4. Check structure and modularity
- Is each function/component doing one job?
- Is business logic inside UI components?
- Are there functions longer than ~50 lines that should be split?
- Are there files longer than ~300 lines that should be modularized?
- Does this belong in `features/`, `shared/`, or `core/` — and is it there?

### 5. Check duplication
- Is there logic that already exists elsewhere?
- Is this a copy-paste of another component with minor variation?
- Can this be parameterized and unified with an existing utility?
- Run: `grep -rn "[key function name]" src --include="*.ts" --include="*.tsx"` to check for prior implementations.

### 6. Check naming clarity
- Do variable names describe what they hold, not how they are used?
- Do function names describe what they return or do — not implementation detail?
- Are booleans named as questions (`isLoading`, `hasError`, not `loading`, `error`)?
- Are types named for what they represent — not where they are used?

### 7. Check dependency cleanliness
- Are imports only from the correct layer (no UI importing from DB directly)?
- Are there unused imports?
- Are there circular dependencies introduced?
  ```bash
  # Quick circular dep check
  grep -rn "import" src/features/[module] --include="*.ts" --include="*.tsx" | grep "shared\|core"
  ```
- Is a new external package being pulled in? Justify: what does it do that a native solution cannot?

### 8. Check TypeScript correctness
- Run: `npx tsc --noEmit` → must be 0 errors
- No `any` used to silence a type error
- No `as SomeType` cast without a comment explaining why it is safe
- All function signatures have explicit return types where the return type is not obvious

### 9. Check security
- Is user input used in a query, command, or HTML render without sanitization?
- Are environment variables or secrets present in client-side code?
- Are permissions checked before data access?

## Output format

```
## Code Review: [file or feature name]

### Critical — must fix before merge
- [File:line] — [issue] — Fix: [what to do]

### Medium — should fix
- [File:line] — [issue] — Fix: [what to do]

### Minor — optional improvement
- [File:line] — [issue] — Suggestion: [what to consider]

### Verified
- [ ] Logic correct for stated intent
- [ ] Edge cases handled (null / empty / async failure)
- [ ] No business logic in UI layer
- [ ] No duplication of existing code
- [ ] No new circular dependencies
- [ ] TypeScript: tsc 0 errors ✅ / ❌
- [ ] Security: no obvious risks ✅ / ❌

### Refactor Suggestions (optional — not blocking)
- [Only if there is a clearly better structure with low migration cost]

### Not Reviewed
- [Any file or area not checked — state reason]
```

## Hard rules
- Never raise a Critical issue that is actually a style preference
- Never recommend a rewrite unless the current implementation is structurally broken
- Never flag duplication without confirming the existing alternative actually exists
- Never approve with Critical issues open
- Never invent security risks — only flag what is demonstrably exploitable
- Every issue must include: what is wrong + why it matters + what to do
- If a section cannot be reviewed (missing context, external system): state it explicitly
