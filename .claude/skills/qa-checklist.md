# qa-checklist.md

## Purpose
Validate that a feature is production-ready through systematic, evidence-based testing. Assume something is broken until proven otherwise. No feature is done until this checklist passes.

## When to use
- Before any release or deployment
- After feature development is marked "complete" by the developer
- After a critical bug fix — verify the fix and check for regression
- Before moving from staging to production
- When a feature has been untouched for a long time and needs re-validation

## Core methodology

### Verify actual vs expected behavior
Do not read code and assume it works. Execute the feature as a user. Compare what happens to what is supposed to happen. The gap between those two is a bug.

### Test from user perspective, not code perspective
The user does not know how the code works. They click, type, submit, and navigate. Test exactly that. A function that returns the right value but whose button does nothing is broken.

### Assume something is broken until proven otherwise
Optimism is a QA defect. Every flow is untested until you test it. Every edge case is broken until you confirm it is not. The burden of proof is on passing, not on failing.

### Cover happy path + edge cases + failure states
A feature that only works under ideal conditions is not production-ready. Users will enter unexpected input, lose network connection, navigate away mid-flow, and submit forms twice. Test all of it.

### Regression-aware testing
Every change breaks something adjacent. Before closing a QA session, test the 3–5 features most likely affected by the change — not just the feature itself.

## Execution steps

### 1. Define what "correct" looks like
Before testing, write down the expected behavior for each flow. Without a defined expectation, there is no pass/fail — only opinion.

Source: PRD, feature spec, or user story. If none exists: document the assumed expected behavior and flag the absence of a spec as a finding.

### 2. Test core user flows end-to-end
Execute every primary user path from entry point to completion:
- Navigate to the feature
- Complete the primary action (create, update, delete, view)
- Verify the result is reflected in the UI
- Verify the result persists after page reload
- Verify the result is consistent in adjacent views

Do not skip steps. Do not substitute reading code for executing the flow.

### 3. Validate input and output behavior
For every form, field, or interactive control:

| Input type | Test case |
|---|---|
| Text field | Normal input, empty submit, max length, special characters |
| Number field | Valid number, negative, zero, decimal, non-numeric characters |
| Dropdown / select | All options selectable, default state correct |
| Date picker | Valid date, past date, future date, invalid date |
| File upload | Valid file, wrong type, oversized file |
| Submit button | Single click, rapid double-click, click while loading |

Verify: inputs are typeable, values are captured, validation fires on correct trigger (blur / submit), error messages are visible and correct.

### 4. Test edge cases and invalid inputs
- **Empty state**: what happens when there is no data to display?
- **Single item**: does the UI work with exactly one record?
- **Max data**: does the UI handle 500+ items without breaking layout or freezing?
- **Long strings**: does a 200-character name break a card, table row, or modal title?
- **Null / undefined**: does the UI crash or handle gracefully when optional data is missing?
- **Duplicate submission**: can the user submit the same form twice? What happens?
- **Concurrent actions**: what happens if the user triggers two async operations simultaneously?

### 5. Test error handling and fallback UI
- Simulate network failure: disconnect → perform action → reconnect. Does the app recover?
- Trigger a validation error: does the error message appear in the right place?
- Trigger a server error (if testable): does the UI show a meaningful error — not a blank screen or crash?
- Close a modal mid-flow: does state reset correctly?
- Navigate away mid-form: is unsaved data handled (warned or preserved)?

### 6. Test state management consistency
- After creating a record: does it appear in the list without reload?
- After updating a record: does the detail view and list both reflect the new value?
- After deleting a record: does it disappear from all views immediately?
- After switching business context: does stale data from the previous context persist incorrectly?
- After logout and login: is the state clean?

### 7. Test responsive behavior
Test at three breakpoints:
- Mobile: 375px wide
- Tablet: 768px wide
- Desktop: 1280px+ wide

Check:
- Layout does not overflow or clip
- Text does not become unreadable
- Interactive elements remain tappable (min 44×44px)
- Modals are scrollable, not cut off
- Tables have horizontal scroll, not broken layout

### 8. Test basic performance
- Does the page load without visible lag (>500ms blank screen)?
- Does the list render without freeze when populated?
- Does typing in a search/filter field respond immediately (<100ms)?
- Does a large dataset (100+ rows) cause UI freeze?
- Does navigating between pages feel instant or sluggish?

Note: do not perform a full performance audit here — flag anything that is visibly broken to the user.

### 9. Test API reliability (if applicable)
- Does the UI show a loading state while the API call is in progress?
- Does the UI handle a slow API response (>3s) without freezing?
- Does the UI handle a failed API response without crashing?
- Are API errors surfaced to the user in readable language — not raw JSON or "Error 500"?

### 10. Regression check
Test the 3–5 features most likely to be affected by this change:

Identify them by asking:
- What context, hook, or utility does this feature share with others?
- What route or layout component does this feature touch?
- What data does this feature read or mutate that other features also use?

For each: run through its primary user flow and confirm it still works.

### 11. Re-test after fixes
If bugs are found and fixed during QA:
- Re-run the exact reproduction steps for each fixed bug
- Re-run the regression check — fixes introduce their own regressions
- Do not mark fixed without executing the re-test

## Output format

```
## QA Report: [Feature / Release Name]
Date: YYYY-MM-DD
Tester: [name or "Claude"]
Build / commit: [hash or branch]

---

### Test Summary
| Area | Status |
|---|---|
| Core user flows | ✅ PASS / ❌ FAIL / 🟡 PARTIAL |
| Input validation | ✅ / ❌ / 🟡 |
| Edge cases | ✅ / ❌ / 🟡 |
| Error handling | ✅ / ❌ / 🟡 |
| State consistency | ✅ / ❌ / 🟡 |
| Responsive | ✅ / ❌ / 🟡 |
| Performance (basic) | ✅ / ❌ / 🟡 |
| API reliability | ✅ / ❌ / 🟡 / N/A |
| Regression | ✅ / ❌ / 🟡 |
| TypeScript (tsc) | ✅ 0 errors / ❌ [count] errors |

---

### Bugs Found

#### Critical — blocks release
- **BUG-01**: [Title]
  - Steps to reproduce: 1. … 2. … 3. …
  - Expected: [behavior]
  - Actual: [behavior]
  - Severity: Critical
  - Status: Open / Fixed / Verified

#### Medium — degrades experience, does not block
- **BUG-02**: [Title]
  - Steps: …
  - Expected / Actual: …
  - Status: Open / Fixed

#### Minor — polish or edge case
- **BUG-03**: [Title]
  - Note: …

---

### Edge Cases Verified
- [ ] Empty state renders correctly
- [ ] Null / missing data does not crash
- [ ] Max data does not freeze UI
- [ ] Long strings do not break layout
- [ ] Duplicate submission handled
- [ ] Network failure handled
- [ ] Mid-flow navigation handled

---

### Regression Results
- [Feature 1]: ✅ PASS / ❌ FAIL — [notes if fail]
- [Feature 2]: ✅ / ❌
- [Feature 3]: ✅ / ❌

---

### Not Tested
- [Area] — Reason: [why it could not be tested]

---

## RELEASE VERDICT

### ✅ READY FOR RELEASE
All Critical and Medium items pass. Minor items documented for follow-up.

### ❌ NOT READY — [count] Critical / [count] Medium issues open
Do not release until Critical items are resolved and re-verified.
```

## Hard rules
- Never mark READY if any Critical bug is Open
- Never test only the happy path — edge cases and error states are required
- Never assume a bug is fixed without executing the exact reproduction steps post-fix
- Never substitute reading code for executing the feature
- Never omit reproduction steps from a bug report — "it doesn't work" is not a bug report
- If an area cannot be tested: document it explicitly under "Not Tested" with a reason — do not silently skip it
- A PARTIAL status in any Critical area defaults to NOT READY unless explicitly justified
