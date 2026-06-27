# performance.md

## Purpose
Identify and eliminate performance bottlenecks in web applications through measurement-first analysis. Every optimization must be justified by data, targeted at the highest-impact layer, and verified with before/after metrics.

## When to use
- App feels slow to load or interact with
- Rendering is not smooth (jank, freeze, lag)
- API response delays are visible to the user
- Bundle size is large and load time is high
- UI freezes during data processing or state updates
- Re-renders are excessive and measurable
- Performance regressed after a recent change

## Core methodology

### Measure first, guess last
Never optimize based on intuition. Collect real numbers before touching code. A change without a before/after measurement is not an optimization — it is a guess with side effects.

### Identify bottleneck layer
Performance problems live in one of four layers. Misidentifying the layer wastes time:

| Layer | Symptoms | Tools |
|---|---|---|
| Rendering | Jank, freeze, excessive re-renders | React DevTools Profiler, preview_eval |
| Network | Slow load, API waterfall, large payloads | preview_network, DevTools Network tab |
| Compute | UI freeze during data processing | Chrome Performance tab, `console.time` |
| Storage | Slow reads from localStorage / IndexedDB | Direct timing measurement |

### Optimize highest impact first
Sort all findings by: (user-facing impact) × (frequency of occurrence). Fix the top item first. A 500ms improvement on every page load beats a 2s improvement on a rarely visited page.

### Reduce unnecessary work
The fastest code is code that doesn't run. Before optimizing how something runs, ask whether it needs to run at all — on every render, on every keystroke, on every mount.

### Improve perceived performance
Actual performance and perceived performance are different. A 1s operation with a skeleton feels faster than a 300ms operation with a blank screen. Optimize actual performance first, then perceived performance.

## Execution steps

### 1. Establish baseline
Record concrete numbers before any change:

```bash
# Bundle size
npx vite build 2>&1 | grep -E "dist/|kB|MB"

# Find large dependencies
npx vite-bundle-visualizer  # or check build output
```

For runtime:
```js
// In preview_eval — measure component render time
performance.mark('start')
// trigger action
performance.mark('end')
performance.measure('render', 'start', 'end')
console.log(performance.getEntriesByName('render')[0].duration)
```

Document: initial load time, largest bundle chunk, slowest API call, slowest component render.

### 2. Identify slow components
Check for excessive re-renders:
- Open React DevTools Profiler → record → perform the slow action → read commit durations
- Components rendering >16ms per commit are candidates for optimization
- Components re-rendering without prop changes need `React.memo` evaluation

```bash
# Find components that might be re-rendering unnecessarily
grep -rn "useContext\|useSelector\|useERP\|useBusiness" src --include="*.tsx" | wc -l
# High count = many components subscribed to large contexts = likely over-rendering
```

### 3. Check unnecessary re-renders
Root causes of excessive re-renders:

| Cause | Detection | Fix |
|---|---|---|
| Object/array created inline in JSX | `{} []` literals in render | `useMemo` or extract to constant |
| Function created inline in JSX | `() =>` in props | `useCallback` if child is memoized |
| Context value re-created on parent render | Object passed to `value=` | `useMemo` on context value |
| Missing `React.memo` on pure child | Child renders when parent does | `React.memo(Component)` |
| State too high in tree | Unrelated siblings re-render | Move state down or split context |

Apply `React.memo` / `useMemo` / `useCallback` only where the profiler confirms a problem. Do not add them preemptively.

### 4. Check network and API
```bash
# Count API calls in a page
grep -rn "fetch\|axios\|supabase\." src/features --include="*.tsx" | grep -v "//\|test"
```

Check for:
- **N+1 fetches** — fetching per item in a list instead of batching
- **Waterfalls** — sequential fetches that could be parallel (`Promise.all`)
- **Missing caching** — same data fetched on every mount with no deduplication
- **Over-fetching** — fetching full objects when only 2 fields are needed
- **No loading state** — UI waits for data with no feedback

Optimization priority: eliminate N+1 > add caching > parallelize > reduce payload.

### 5. Check bundle size and lazy loading
```bash
# Find large static imports that could be lazy-loaded
grep -rn "^import" src/features --include="*.tsx" | grep -v "from '\.\." | head -40
```

Candidates for `React.lazy()` + `Suspense`:
- Route-level components (already in `AppRouter` — verify they are lazy)
- Heavy modal or panel components loaded on demand
- Chart libraries, PDF generators, heavy utilities

```tsx
// Pattern
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))
```

Check: does the main bundle contain code that only runs after user interaction? Move it to a dynamic import.

### 6. Check expensive computations
Signs: UI freezes for >100ms during a synchronous operation.

```bash
# Find potentially expensive in-render calculations
grep -rn "\.filter\|\.map\|\.reduce\|\.sort" src/features --include="*.tsx" | grep -v "//\|import"
```

If a computation:
- Runs on every render
- Processes >100 items
- Has no dependency on UI state

→ wrap in `useMemo`. If it blocks the main thread for >50ms → move to a Web Worker.

### 7. Prioritize by impact
Score each finding:

```
Impact score = (time saved per occurrence ms) × (occurrences per session) × (% users affected)
```

Fix highest score first. Do not optimize something that runs once on a page the user visits monthly.

### 8. Implement incrementally
One optimization at a time. Each change:
1. Implement
2. Re-measure (same method as step 1)
3. Confirm improvement is real
4. Confirm no regression

Never batch multiple optimizations before re-measuring — you lose signal on which change had which effect.

### 9. Re-measure and document
After all optimizations:
- Record new baseline numbers
- Compare to original baseline
- Document what changed and why

## Output format

```
## Performance Audit: [page / feature / component]

### Baseline Metrics
| Metric | Value |
|---|---|
| Initial load time | Xms |
| Largest bundle chunk | XKB |
| Slowest API call | Xms |
| Slowest component render | Xms |

### Issues Found

#### Critical — visible to user, high frequency
- [Component/File] — [issue] — Bottleneck layer: [Rendering/Network/Compute/Storage]
  Root cause: [why it is slow]
  Fix: [what to change]
  Expected improvement: [~Xms / ~XKB reduction]

#### Medium — measurable but not immediately user-visible
- [Component/File] — [issue]
  Fix: [what to change]
  Expected improvement: [estimate]

#### Minor — low impact, fix only if trivial
- [Component/File] — [issue]
  Suggestion: [optional]

### Optimization Plan (ordered by impact)
1. [Fix] — [Expected gain] — [Risk: Low/Medium/High]
2. …

### Tradeoffs
- [Optimization] — Pro: [benefit] — Con: [cost or complexity added]

### After Metrics (post-optimization)
| Metric | Before | After | Delta |
|---|---|---|---|
| Initial load | X | Y | -Z% |
| Bundle size | X | Y | -Z% |
| API latency | X | Y | -Z% |
| Render time | X | Y | -Z% |

### Unable to Measure
[Any metric that requires production traffic, real user data, or tooling not available]
```

## Hard rules
- Never optimize without a measured baseline — "feels slow" is a symptom, not a metric
- Never add `useMemo` / `useCallback` / `React.memo` without profiler evidence it helps — they add overhead
- Never bundle-split a component that is <10KB — the async overhead costs more than it saves
- Never cache API responses without defining invalidation strategy
- Always state the tradeoff of every optimization (complexity added vs. speed gained)
- If an optimization reduces performance in edge cases: document it explicitly
- A 5% improvement with 0 complexity cost beats a 20% improvement with high maintenance cost
