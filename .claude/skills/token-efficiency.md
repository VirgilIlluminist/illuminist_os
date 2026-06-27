# token-efficiency.md

## Purpose
Pre-processor dan execution optimizer. Berjalan sebelum skill lain. Memastikan setiap token menghasilkan nilai implementasi nyata — bukan teori, bukan pengantar, bukan laporan yang tidak dipakai.

---

## When to use
**Sebelum skill apapun dijalankan.** Ini dispatcher, bukan worker.

---

## Core principles

### 1. Read only what is necessary
Sebelum membuka file, jawab dulu:
- File mana yang relevan secara langsung?
- Dependency mana yang benar-benar terlibat?

Jangan baca file yang tidak ada hubungannya dengan request.

### 2. Impact-first, file-second
Urutan wajib:
```
1. Apa yang diminta?
2. Area apa yang terdampak?
3. Skill apa yang diperlukan?
4. File mana yang perlu dibaca?
5. Baru buka file.
```
Bukan: buka semua file → analisis → baru tahu apa yang perlu dilakukan.

### 3. No duplicate thinking
Kalau analisis sudah dilakukan di task sebelumnya dalam konteks yang sama → gunakan hasilnya. Jangan ulangi dari awal.

### 4. Summary over re-read
File sudah dianalisis → pakai ringkasannya. Jangan baca ulang kecuali file berubah sejak terakhir dibaca.

### 5. Execute, don't lecture
Output prioritas:
1. Implementasi
2. Patch / fix
3. Verifikasi

Bukan: penjelasan panjang, teori, parafrase ulang request user.

---

## Execution steps

### Step 1 — Classify request
```
Bug          → bug-hunter → debug-trace → qa-checklist
Feature      → feature-planner → architect → implementation → qa-checklist
Refactor     → architect → auto-refactor-mode → code-review
UI fix       → illuminist-ui → consistency-audit → frontend-review
Performance  → performance → code-review
Architecture → architect → prd-writer (if spec needed)
Docs         → prd-writer only
```

### Step 2 — Estimate scope → assign budget
```
TINY   (1 file, clear fix)    → no analysis, implement directly, verify
SMALL  (2–3 files, 1 pattern) → quick impact check, implement, verify
MEDIUM (3–6 files, feature)   → impact analysis + plan, implement, verify + regression
LARGE  (6+ files, system)     → full 10-step workflow from project-state.md
```

**Do not use LARGE workflow for TINY tasks.** This wastes tokens and adds latency.

### Step 3 — Load only required skills
Dispatch only what the task actually needs:

| Task | Load | Don't load |
|---|---|---|
| Fix UI bug on 1 page | bug-hunter, illuminist-ui | architect, performance, prd-writer |
| HPP not calculating | debug-visualization-mode, debug-trace | auto-refactor-mode, prd-writer |
| Add new feature | feature-planner, architect, qa-checklist | consistency-audit (unless UI) |
| Style inconsistency | illuminist-ui, consistency-audit | architect, performance |
| Full system refactor | architect, auto-refactor-mode, code-review, qa-checklist | — |

### Step 4 — Load only required files
```bash
# Find directly relevant files first
grep -rn "ComponentName\|functionName\|stateKey" src --include="*.tsx" --include="*.ts" -l

# Only read files that appear in grep results
# Do NOT read all files in a directory by default
```

### Step 5 — Implement
Execute what the plan says. Nothing more.

### Step 6 — Verify
Minimum verification for each scope:
```
TINY   → tsc 0 errors
SMALL  → tsc + 1 preview check
MEDIUM → tsc + preview_eval + screenshot
LARGE  → full 5-step truth gate from TRUTH RULE
```

### Step 7 — Stop
Task complete → stop.

Do not:
- Add unrequested optimizations
- Refactor adjacent code that wasn't asked about
- Write summaries of what was just done unless asked
- Suggest next steps unless the task revealed a broken dependency

---

## Token budget table

| Scope | Reasoning | Files read | Skills loaded | Output |
|---|---|---|---|---|
| TINY | Minimal | 1–2 | 1 | Patch + tsc result |
| SMALL | Light | 2–4 | 1–2 | Fix + verify |
| MEDIUM | Structured | 4–8 | 2–3 | Plan + impl + verify |
| LARGE | Full | 8+ | 3–5 | Full 10-step workflow |
| SYSTEM | Exhaustive | All affected | Full chain | project-state.md workflow |

---

## Output style

**Format by scope:**

TINY:
```
Changed X in file:line. tsc → 0 errors.
```

SMALL:
```
Root cause: [1 sentence].
Fix: [what changed].
Verified: [evidence].
```

MEDIUM:
```
Impact: [N files].
Plan: [3–5 bullets].
Result: [what changed].
Verified: [evidence].
Unable to verify: [if any].
```

LARGE: use `## Summary / ## Verification / ## Risks / ## Next` format from CLAUDE.md.

---

## Hard rules

**Prohibited:**
- Reading the entire project without a specific target
- Calling all skills simultaneously "to be safe"
- Re-explaining code that hasn't changed
- Writing analysis reports that won't affect implementation
- Continuing to reason after root cause is confirmed and solution is clear
- Adding comments to code explaining what the code does (CLAUDE.md rule)

**Required:**
- Stop reasoning the moment the solution is clear
- Load the minimum viable skill set for the task
- Produce output proportional to task scope
- Every file opened must have a stated reason

---

## Stop condition

Stop reasoning immediately when:
- Root cause is confirmed with evidence
- The correct file and line is identified
- The implementation is clear and bounded

Do not continue thinking to produce longer output. Longer ≠ better.

---

## Dispatcher decision tree

```
Request received
      │
      ├─ Is the root cause already known? → YES → go to Step 5 (implement)
      │
      ├─ Is this UI-only? → illuminist-ui + consistency-audit
      │
      ├─ Is this a graph/data bug? → debug-visualization-mode + debug-trace
      │
      ├─ Is this a new feature? → feature-planner + architect
      │
      ├─ Is this a refactor? → architect + auto-refactor-mode
      │
      └─ Unclear? → ask ONE focused question. Don't load any skills yet.
```
