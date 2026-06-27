# debug-trace.md

## Purpose
Perform forensic end-to-end tracing of system execution to locate the exact divergence point between expected and actual behavior. Used for bugs that cannot be found by reading code — async failures, state corruption, race conditions, and integration mismatches across frontend, backend, and database layers.

## When to use
- Bug source is unclear after initial code reading
- Error is intermittent or cannot be reproduced consistently
- UI renders correctly but data is wrong, or data is correct but UI does not reflect it
- A previous fix appeared to work but the bug returned
- Async behavior produces different results across runs
- Multiple layers are involved and the failure layer is unknown
- System "appears to work" but produces silently wrong output

## Core methodology

### Trace full lifecycle, not isolated functions
Every bug lives inside an execution chain. A function does not fail in isolation — it fails because something upstream gave it wrong input, or something downstream mishandled its correct output. Always trace the full chain.

### Treat the system as an event chain
```
User action → event trigger → handler → state mutation → API call →
response parse → context update → re-render → DOM output
```
Each arrow is a potential failure point. The failure is at the first arrow where actual behavior diverges from expected.

### Assume state changes are the root until proven otherwise
In React/context-driven apps, most UI bugs originate in a state mutation that did not fire, fired with wrong data, or fired at the wrong time. Start the trace from state — then move upstream or downstream depending on what the trace reveals.

### Track every mutation point
A value has one origin and may be transformed multiple times before it reaches the UI. Every transformation is a potential corruption point. Log the value at each mutation — not just at the end.

### Separate input / intermediate / final state
```
Input state:        value when it enters a function
Intermediate state: value mid-transformation
Final state:        value when it exits to the next layer
```
These three states should form a coherent chain. The first break in the chain is the bug.

## Execution steps

### 1. Define expected behavior (write it down before tracing)
Describe the correct system behavior step by step:
```
1. User clicks "Save"
2. Form data is validated — invalid fields show error messages
3. Valid data is sent to POST /api/products
4. API returns 200 with created product ID
5. Product is added to ERPContext.products array
6. ProductList re-renders with new item at top
7. Success toast appears
```
This is the baseline. Every step that diverges from this is evidence.

### 2. Capture actual runtime behavior
Instrument the system at each step boundary. Use targeted logs — not scattered:

```tsx
// Step boundary instrumentation pattern
console.log('[TRACE:1] user action triggered — payload:', formData)
console.log('[TRACE:2] validation result:', errors)
console.log('[TRACE:3] API call dispatched:', { url, method, body })
console.log('[TRACE:4] API response received:', { status, data })
console.log('[TRACE:5] context mutation called:', data)
console.log('[TRACE:6] context state after mutation:', products.length)
console.log('[TRACE:7] component render — items count:', items.length)
```

Prefix all trace logs with `[TRACE:N]` to distinguish from production logs. Remove all after the bug is found.

### 3. Map full execution chain
Build a complete map of every call in the chain:

```
User action (click "Save")
  └─ onClick handler (ProductForm.tsx:142)
       └─ validateForm() → returns errors object
            └─ if valid: submitProduct(formData)
                 └─ POST /api/products (server/routes/products.ts)
                      └─ DB insert (supabase.from('products').insert())
                           └─ returns { data, error }
                                └─ response parsed → product object
                                     └─ ERPContext.addProduct(product)
                                          └─ setProducts(prev => [...prev, product])
                                               └─ ProductList re-renders
                                                    └─ DOM updated
```

For each node: state what it **should** receive and what it **actually** received.

### 4. Identify the divergence point
The divergence point is the first node in the chain where actual ≠ expected.

```
[TRACE:1] payload: { name: "Kemeja", price: 150000 }   ✅ correct
[TRACE:2] validation: {}  (no errors)                   ✅ correct
[TRACE:3] API call: POST /api/products { name, price }  ✅ correct
[TRACE:4] response: 200 { id: "abc123", name: "Kemeja" } ✅ correct
[TRACE:5] context mutation called: { id: "abc123" }     ✅ correct
[TRACE:6] state after mutation: 3 items                 ✅ correct
[TRACE:7] component render: 2 items                     ❌ DIVERGENCE
```

Everything before `[TRACE:7]` is confirmed working. The bug is in the re-render step — the component is not reading the updated context value. Root cause search now narrows to: stale closure, memoization, or wrong context subscription.

### 5. Classify the failure layer

| Layer | Symptoms | Where to look |
|---|---|---|
| Frontend logic | Correct data, wrong calculation or display | Component, hook, utility function |
| State / context | Mutation fires but consumer does not update | useContext subscription, useMemo deps, stale closure |
| Async / timing | Works sometimes, fails on fast interactions | Race condition, missing await, useEffect cleanup |
| API contract | Request correct, response unexpected | Network tab, API schema, response parser |
| Backend logic | Request received correctly, wrong DB result | Server route, service function, query logic |
| Database state | Correct query, unexpected data returned | DB table content, migration state, constraint |
| Integration | Frontend and backend have different data contract | Type definitions, field names, nullable fields |

### 6. Trace async execution timeline
For async and race condition bugs, reconstruct the timeline:

```
T+0ms    onClick fires — formData captured in closure
T+0ms    submitProduct() called — async started
T+10ms   Loading state set true — component re-renders
T+10ms   Closure still holds T+0 value of formData ← stale closure risk
T+200ms  API response received
T+200ms  setState(response.data) called
T+201ms  Component already unmounted (user navigated away)
T+201ms  setState on unmounted component → React warning, state lost
```

Instruments for async tracing:
```tsx
// Detect unmount during async
const mounted = useRef(true)
useEffect(() => () => { mounted.current = false }, [])

fetchData().then(result => {
  console.log('[TRACE] async resolved, mounted:', mounted.current)
  if (!mounted.current) return  // abort update
  setState(result)
})

// Detect race condition
const requestId = useRef(0)
const fetchWithRace = async () => {
  const thisId = ++requestId.current
  const result = await fetchData()
  if (thisId !== requestId.current) {
    console.log('[TRACE] stale response discarded — requestId mismatch')
    return
  }
  setState(result)
}
```

### 7. Trace state mutation integrity
Verify that a mutation produces the correct new state and that consumers receive it:

```tsx
// In context provider
const updateProduct = (id: string, patch: Partial<Product>) => {
  console.log('[TRACE] mutation input — id:', id, 'patch:', patch)
  setProducts(prev => {
    const next = prev.map(p => p.id === id ? { ...p, ...patch } : p)
    console.log('[TRACE] mutation output — affected:', next.filter(p => p.id === id))
    return next
  })
}

// In consumer component
useEffect(() => {
  console.log('[TRACE] products updated in consumer:', products.length)
}, [products])
```

Check: mutation fires → produces correct next state → consumer's useEffect detects the change → component re-renders with new value.

### 8. Trace event propagation failures
Verify the event chain is not broken by an overlay or blocked propagation:

```tsx
// Check what element actually receives the click
// In preview_eval:
document.addEventListener('click', e => {
  console.log('[TRACE] click target:', e.target, 'propagation stopped:', e.cancelBubble)
}, { capture: true })

// Check pointer event blocking
const el = document.querySelector('[data-testid="save-button"]')
console.log('[TRACE] pointerEvents:', getComputedStyle(el).pointerEvents)
console.log('[TRACE] elementAtPoint:', document.elementFromPoint(x, y))
```

```bash
# Check for propagation stoppers in codebase
grep -rn "stopPropagation\|preventDefault\|pointer-events: none\|pointerEvents.*none" src --include="*.tsx" --include="*.css"
```

### 9. Reproduce under controlled conditions
Once the divergence point is identified:
- Reproduce the bug using the minimum steps required
- Confirm the `[TRACE]` log shows the divergence at the identified point every time
- Vary one condition at a time to confirm what triggers vs prevents the bug

A bug that cannot be reproduced on demand is not yet understood.

### 10. Validate root cause hypothesis
Write the hypothesis as a falsifiable statement:
> "The component re-renders with the old item count because `ProductList` is wrapped in `React.memo` and its `items` prop reference does not change when context updates, because the array is mutated in place instead of replaced."

Validate by:
1. Checking the memo dependency — does the array reference actually change after mutation?
2. Temporarily removing `React.memo` — does the bug disappear?
3. Confirming the context mutation uses spread (`[...prev, item]`) not `push`

If the hypothesis is wrong: form a new one. Never fix based on an unvalidated hypothesis.

### 11. Implement minimal fix and re-trace
Fix only what the confirmed root cause requires. After fixing:
1. Re-run the full trace from step 1
2. Confirm all `[TRACE]` logs now show expected values
3. Remove all `[TRACE]` instrumentation
4. Run `npx tsc --noEmit` → 0 errors
5. Re-test the original reproduction steps — confirm the bug is gone
6. Test 3 adjacent flows for regression

## Output format

```
## Debug Trace: [Bug Title]

### Failure Statement
When [user action], [system] produces [actual wrong result] instead of [expected result].

---

### Expected Flow
1. [step] → [expected state]
2. [step] → [expected state]
3. …

### Actual Flow (captured)
1. [step] → [actual state] ✅
2. [step] → [actual state] ✅
3. [step] → [actual state] ❌ ← DIVERGENCE POINT

---

### Divergence Point
Between step [N] and step [N+1]:
- Expected: [value / behavior]
- Actual:   [value / behavior]
- Evidence: [TRACE:N log output or network/state snapshot]

---

### Failure Layer
[ ] Frontend logic
[ ] State / context mutation
[ ] Async / race condition
[ ] API contract mismatch
[ ] Backend logic
[ ] Database state
[ ] Integration contract

---

### Root Cause (confirmed)
[Exact technical cause — file:line — why it produces the wrong result]

Causal chain:
[Action] → [because X] → [which causes Y] → [which produces wrong output Z]

---

### Async Timeline (if applicable)
T+0ms   [event] — value: [observed]
T+Xms   [event] — value: [observed]  ← failure

---

### Fix Applied
- [File:line] — [what changed] — [why this resolves the confirmed root cause]

---

### Re-trace After Fix
1. [step] → ✅ [expected value confirmed]
2. [step] → ✅
3. …
All steps: ✅ / ❌ [note if any still wrong]

---

### Verification
- [ ] Original reproduction steps re-executed — bug absent ✅ / ❌
- [ ] All [TRACE] logs removed ✅ / ❌
- [ ] tsc 0 errors ✅ / ❌
- [ ] 3 adjacent flows tested — no regression ✅ / ❌

### Assumptions Made
| # | Assumption | Validated by |
|---|---|---|
| A-01 | [statement] | [evidence or "not yet validated"] |

### Unable to Determine
[Anything that could not be confirmed — state exactly what additional data or access is required]
```

## Hard rules
- Never identify a root cause without a confirmed divergence point from trace evidence
- Never fix before the root cause hypothesis is validated by observed data — not code reading
- Never claim a race condition without demonstrating the timing overlap in the trace
- Never leave `[TRACE]` logs in the codebase after the investigation is complete
- Never skip the re-trace after fixing — a fix that removes the symptom without fixing the root cause will regress
- If the divergence point cannot be narrowed with available instrumentation: state "trace incomplete — requires [specific additional data/access]" and stop
- One bug, one divergence point — if multiple divergence points are found, they are separate bugs; document and fix independently
