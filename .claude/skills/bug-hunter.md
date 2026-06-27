# bug-hunter.md

## Purpose
Find the root cause of bugs through systematic analysis. Every fix must be backed by confirmed evidence. No guessing. No trial-and-error. No patching symptoms.

## When to use
- Any runtime error, crash, or unexpected behavior
- A feature stopped working after a change
- UI renders incorrectly or inconsistently
- Data is wrong, missing, or stale
- A previous fix regressed
- "It works on my machine" — environment-specific behavior

## Core methodology

### Hypothesis-driven debugging
Never touch code without a hypothesis. Form a specific, falsifiable statement: "I believe X is happening because Y." Then find evidence that confirms or refutes it. If refuted, form a new hypothesis.

### Isolate → Reproduce → Confirm
A bug that cannot be reproduced reliably cannot be fixed reliably. Before writing any code, reproduce the bug consistently. Isolation means identifying the smallest context in which the bug occurs.

### Trace data flow end-to-end
Follow data from its origin to where it fails. Most bugs live at a boundary: input→state, state→render, API→parser, event→handler. Map the full path before assuming where the break is.

### Differentiate symptom vs root cause
What the user sees is a symptom. What caused it is the root cause. Ask "why" at least 3 levels deep before writing a fix. A null pointer error is a symptom. Why was the value null? Why was it not validated? Why was there no guard? Root cause is the last "why" that has an actionable answer.

### Eliminate assumptions
Every assumption about the system state is a potential wrong turn. Verify: actual values in state, actual network response, actual DOM structure, actual execution order. Read the data — do not assume it.

## Execution steps

### 1. Collect error context
Gather all available evidence before touching code:
- **Console errors** — full message, full stack trace, file:line
- **Network** — failed requests, wrong status codes, unexpected response bodies
- **State** — what was in context/store at the moment of failure
- **UI** — exact steps to reproduce, screenshot if visual
- **Recent changes** — `git log --oneline -20` to identify what changed recently

Do not proceed until you have a complete picture of the failure context.

### 2. Reproduce consistently
Confirm the bug is real and repeatable:
- Define the exact sequence of steps that triggers it
- Confirm it happens every time with those steps, not intermittently
- If intermittent: identify the condition that makes it intermittent (race condition, empty state, timing)

A bug that cannot be reproduced on demand cannot be verified as fixed.

### 3. Isolate the layer
Determine which layer the failure originates in:

| Layer | What to check |
|---|---|
| UI / render | Component receiving wrong props? State not triggering re-render? |
| State / context | Mutation missing? Stale closure? Wrong initial value? |
| Event / handler | Handler not attached? Called with wrong arguments? Async not awaited? |
| API / network | Wrong endpoint? Wrong method? Response not parsed? Auth missing? |
| Data / DB | Wrong query? Missing record? Type mismatch? |

Check the layer closest to the failure first, then move upstream.

### 4. Identify the triggering change
If the bug is a regression:
```bash
git log --oneline -30
git diff HEAD~5 -- [suspected file]
```
Find the commit that introduced the failure. The root cause is almost always in that diff.

### 5. Form and validate a hypothesis
Write a specific hypothesis:
> "The value is null at render time because `useEffect` fetches async but the component renders synchronously before data arrives, and there is no null guard."

Then validate it:
- Add a temporary `console.log` or `preview_eval` to verify the actual value at the suspected point
- Check if removing or adding a single condition changes the behavior
- Confirm the hypothesis is true before writing a fix

If the hypothesis is wrong, form a new one. Do not fix based on an unconfirmed hypothesis.

### 6. Trace the full data path
From the failure point, trace upstream to the origin:
```
User action → event handler → state mutation → re-render → prop → child component → display
```
Mark exactly where the value diverges from expected. That boundary is the root cause location.

### 7. Implement the minimal fix
Fix only what the confirmed root cause requires. No refactoring. No cleanup. No extras. The fix should be the smallest code change that eliminates the root cause.

If the fix requires touching >3 files, re-evaluate whether the root cause is correctly identified — the real cause is usually more localized.

### 8. Re-test full flow
After the fix:
- Reproduce the original steps — confirm the bug no longer occurs
- Test the 3 adjacent features most likely affected by the change
- Run `npx tsc --noEmit` → 0 errors
- Take a live screenshot or log trace as proof

### 9. Confirm no regression
- Does the fix break any existing behavior?
- Is the fix defensive enough to handle similar edge cases, or only the exact case that was reported?
- If a similar bug could occur elsewhere: note it, but do not fix it now unless it is confirmed broken.

## Output format

```
## Bug Report

### Symptom
[Exact description of what the user sees — behavior, not cause]

### Reproduction Steps
1. …
2. …
Result: [what happens]
Expected: [what should happen]

### Evidence Collected
- Console: [error message + file:line]
- Network: [request/response if relevant]
- State: [relevant state values at failure]
- Recent change: [commit or file if regression]

### Hypothesis
[Specific, falsifiable statement of suspected cause]

### Hypothesis Validation
[What was checked to confirm or refute — actual values observed]

### Root Cause (confirmed)
[The actual source of the bug — not the symptom — with file:line reference]
Why it happened: [causal chain from root cause to symptom]

### Fix Applied
- [File:line] — [what changed and why this resolves the root cause]

### Verification
- [ ] Original bug no longer reproducible
- [ ] Adjacent features tested: [list]
- [ ] tsc 0 errors ✅ / ❌
- [ ] Live proof: [screenshot / log / trace]

### Regression Risk
[What could break and what to watch]

### Prevention
[What structural change would prevent this class of bug — note only, do not implement unless asked]
```

## Hard rules
- Never write a fix before the root cause is confirmed with evidence
- Never use "try this and see" as a debugging strategy
- Never claim fixed without re-running the exact reproduction steps
- Never patch a symptom if the root cause is visible and fixable
- Never add permanent `console.log` — remove all debug logging after fix
- If root cause cannot be determined from available evidence: state exactly what additional information is needed and why
- A fix that makes the symptom disappear without explaining why the root cause is resolved is not a fix
