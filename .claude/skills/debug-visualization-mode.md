# debug-visualization-mode.md

## Purpose
Runtime transparency layer untuk Graph Engine. Membuktikan bahwa setiap user action benar-benar mengalir melalui node graph → cascade recompute → UI update. Bukan untuk "debug bug satu kali" — tapi untuk mencegah false completion: kondisi di mana sistem kelihatan jalan tapi sebenarnya tidak terbukti end-to-end.

**Prinsip utama:** Kalau aliran data tidak bisa dilihat → sistem dianggap UNVERIFIED, bukan working.

---

## When to use
- Setelah membangun atau memodifikasi graph engine (node types, computeNodeValue, recomputeGraph)
- Sebelum mendeklarasikan fitur spreadsheet atau HPP "selesai"
- Setiap kali ada klaim "sudah reactive" atau "sudah cascade" yang belum dibuktikan live
- Saat user melaporkan "UI berubah tapi data lain tidak ikut"
- Ketika perlu membuktikan bahwa WRITE ke graph node benar-benar terjadi (bukan hanya READ)

**Trigger phrase:** "tunjukin flow dari input sampai output, step by step"

---

## Core methodology

### Axiom 1 — Observable system, bukan klaim sistem
Setiap perubahan data harus **terlihat alirannya**, bukan hanya diklaim sudah terjadi. Kalau tidak ada visualisasi aliran, tidak ada bukti.

### Axiom 2 — 1 action = 1 traceable event chain
```
USER EDIT CELL
    ↓ (Step 1)
NODE MUTATION CALLED  →  updateGraphNode(id, patch)
    ↓ (Step 2)
recomputeGraph() RUNS  →  cascade ke downstream
    ↓ (Step 3)
graphNodes STATE UPDATED  →  React re-render triggered
    ↓ (Step 4)
UI CELLS REFLECT NEW VALUES  →  without page reload
    ↓ (Step 5)
CROSS-TAB / CROSS-COMPONENT sync  →  related views updated
```

Kalau satu langkah tidak bisa diverifikasi → **chain dianggap broken di step itu.**

### Axiom 3 — Tiga jenis node, tiga warna visualisasi
```
INPUT node (editable)     →  user dapat mengubah nilainya
DERIVED node (computed)   →  nilai dihitung otomatis dari dependencies
AGGREGATE node (sum)      →  jumlah dari banyak node sekaligus
```

### Axiom 4 — Fail fast, bukan silent failure
Kalau downstream node tidak terupdate setelah upstream berubah → sistem langsung menandai diri sebagai BROKEN STATE, bukan diam-diam menampilkan nilai lama.

---

## Execution steps

### Step 1 — Identify what exists (TRACE BEFORE BUILDING)
Sebelum membangun komponen debug apapun, jalankan audit ini:

```javascript
// Run di preview_eval
(() => {
  const raw = localStorage.getItem('illuminist_graph_v1');
  if (!raw) return { status: 'GRAPH NOT FOUND — system cannot be verified' };
  const nodes = JSON.parse(raw);
  return {
    totalNodes: nodes.length,
    byType: nodes.reduce((acc, n) => { acc[n.type] = (acc[n.type]||0)+1; return acc; }, {}),
    productIds: [...new Set(nodes.map(n => n.productId))],
    sampleNode: nodes.find(n => n.type === 'material'),
  };
})()
```

Jika `GRAPH NOT FOUND`: **STOP.** Graph belum ada — tidak ada yang bisa divisualisasikan.

### Step 2 — Verify mutation path exists
Sebelum membangun debug UI, verifikasi bahwa `updateGraphNode` ada dan terpanggil:

```bash
# Pastikan updateGraphNode ada di ERPContext
grep -n "updateGraphNode" src/app/store/ERPContext.tsx

# Pastikan sudah diexpose ke consumer
grep -n "updateGraphNode" src/app/store/ERPContext.tsx | grep "value\|Provider"

# Pastikan consumer bisa akses
grep -rn "updateGraphNode" src --include="*.tsx" | grep -v "ERPContext\|interface\|type"
```

Kalau `updateGraphNode` belum dipakai di consumer manapun → mutation path BROKEN sebelum dimulai.

### Step 3 — Build DebugGraphPanel component
Komponen ini adalah transparency layer yang **bisa di-toggle** (bukan selalu tampil). Struktur:

```tsx
// src/shared/debug/DebugGraphPanel.tsx

interface DebugEvent {
  timestamp: string        // ISO timestamp
  nodeId: string
  nodeType: string
  field: string            // field yang berubah (misal: pricePerUnit)
  before: number
  after: number
  cascadeIds: string[]     // downstream node IDs yang di-recompute
  cascadeResults: Record<string, { before: number; after: number }>
}

// Panel hanya tampil jika: localStorage.getItem('illuminist_debug') === 'true'
// Toggle: Ctrl+Shift+D atau button tersembunyi di settings
```

**Node status colors:**
```
🟡 MUTATED    — node yang baru saja diubah user
🔵 TRIGGERED  — downstream node yang dependencies-nya berubah  
🟢 RECOMPUTED — downstream node yang nilai barunya sudah dihitung
🔴 BROKEN     — node yang seharusnya update tapi tidak (dependency missing)
⬜ IDLE        — node yang tidak terpengaruh oleh perubahan ini
```

### Step 4 — Build NodeInspector (click-to-inspect)
Saat user mengklik cell di spreadsheet:

```
┌─────────────────────────────────────────┐
│  NODE INSPECTOR                         │
│  ID:      MAT-NODE-PROD-001             │
│  Type:    material (INPUT)              │
│  Label:   Kain Linen                    │
│  Value:   Rp 90.000                     │
│  Formula: quantityPerUnit × pricePerUnit│
│                                         │
│  INPUTS (dependencies):                 │
│  ├── quantityPerUnit: 2.0               │
│  └── pricePerUnit: 45.000              │
│                                         │
│  OUTPUTS (affected by this node):       │
│  └── HPP-NODE-PROD-001 (computed)       │
│       └── MARGIN-NODE-PROD-001          │
│                                         │
│  Last updated: 2026-06-27 14:23:01      │
└─────────────────────────────────────────┘
```

### Step 5 — Build Update Timeline view
Setiap kali mutation terjadi, catat timeline:

```
UPDATE TIMELINE — MAT-NODE-PROD-001
────────────────────────────────────────────────────────
T+0ms   USER INPUT    pricePerUnit: 45.000 → 55.000
T+1ms   NODE MUTATED  MAT-NODE-PROD-001.value: 90.000 → 110.000
T+2ms   CASCADE       HPP-NODE-PROD-001 triggered (dependency changed)
T+3ms   RECOMPUTED    HPP-NODE-PROD-001: 922.000 → 942.000
T+3ms   CASCADE       MARGIN-NODE-PROD-001 triggered
T+4ms   RECOMPUTED    MARGIN-NODE-PROD-001: 3.728.000 → 3.708.000 (79.7%)
T+5ms   REACT RENDER  3 components re-rendered
T+5ms   GRAPH SAVED   illuminist_graph_v1 updated in localStorage
────────────────────────────────────────────────────────
STATUS: ✅ COMPLETE — all 2 downstream nodes updated
```

Kalau ada node yang seharusnya di-cascade tapi tidak → baris itu tampil merah dengan keterangan: `❌ BROKEN — MAT-NODE-PROD-002 not triggered (dependency not registered)`

### Step 6 — Implement Fail-Fast Guard
Di dalam `updateGraphNode` di ERPContext, tambahkan guard:

```typescript
// Setelah recomputeGraph() selesai, verify semua downstream di-update
const verifyGraph = (productId: string, before: AnyGraphNode[], after: AnyGraphNode[]) => {
  const hppBefore = before.find(n => n.type === 'hpp' && n.productId === productId)
  const hppAfter  = after.find(n => n.type === 'hpp' && n.productId === productId)
  
  // Kalau HPP tidak berubah padahal input berubah — dependency broken
  if (hppBefore?.value === hppAfter?.value) {
    console.warn('[GRAPH INTEGRITY] HPP did not change after mutation — check dependencies')
    // In debug mode: emit event to DebugGraphPanel
  }
}
```

### Step 7 — Verify end-to-end via preview_eval
Setelah setiap mutation di UI, jalankan ini untuk konfirmasi:

```javascript
// STEP 2 verification: graph actually mutated
(() => {
  const nodes = JSON.parse(localStorage.getItem('illuminist_graph_v1') || '[]');
  const mat = nodes.find(n => n.id === 'MAT-NODE-PROD-001');
  const hpp = nodes.find(n => n.type === 'hpp' && n.productId === 'PROD-001');
  return {
    materialValue: mat?.value,
    hppValue: hpp?.value,
    hppBreakdown: hpp?.breakdown,
    lastUpdated: hpp?.updatedAt,
  };
})()
```

Kalau `materialValue` berubah tapi `hppValue` tidak → **cascade broken. Fix sebelum lanjut.**

---

## Output format

Setiap sesi debug harus menghasilkan:

```
## Debug Visualization Report — [Feature/Component]

### Graph State Before
Total nodes: N
Affected product: [productId]
Key values:
  MAT-NODE-[id]:   Rp [value]
  HPP-NODE-[id]:   Rp [value]
  MARGIN-NODE-[id]: [%]

### Action Performed
User [action] — expected: updateGraphNode([id], { [field]: [newValue] })

### Mutation Trace (verified via preview_eval)
Step 1 — UI action triggered:           ✅ / ❌
Step 2 — updateGraphNode() called:      ✅ / ❌ — evidence: [eval result]
Step 3 — recomputeGraph() ran:          ✅ / ❌ — evidence: [downstream value changed]
Step 4 — React re-render:               ✅ / ❌ — evidence: [screenshot]
Step 5 — Cross-component consistency:   ✅ / ❌

### Graph State After
  MAT-NODE-[id]:   Rp [before] → Rp [after]   ✅ / ❌
  HPP-NODE-[id]:   Rp [before] → Rp [after]   ✅ / ❌ (cascade)
  MARGIN-NODE-[id]: [before]% → [after]%       ✅ / ❌ (cascade)

### System Status
VERIFIED ✅ — all 5 steps confirmed, all downstream nodes updated
PARTIAL ⚠️  — steps 1-3 verified, step [N] unconfirmed
BROKEN ❌    — divergence at step [N]: [what failed]

### If BROKEN: Root Cause
[Exact file:line where cascade breaks]
[Why dependency is not registered / not triggered]
```

---

## Hard rules

- **Tidak boleh klaim "reactive" atau "cascade" tanpa menjalankan Step 7 verification** (preview_eval setelah mutation)
- **Tidak boleh declare VERIFIED jika satu langkah dalam 5-step chain unconfirmed**
- **Jika node cascade tidak terjadi — STOP dan fix dependency sebelum lanjut apapun**
- **Debug panel WAJIB bisa dimatikan** — tidak boleh tampil di production (guard: `localStorage.getItem('illuminist_debug') === 'true'`)
- **Timeline log WAJIB di-clear setelah sesi debug** — tidak boleh ada `[TRACE]` atau `console.warn` di production build
- **Warna node harus konsisten** — 🟡 mutated, 🔵 triggered, 🟢 recomputed, 🔴 broken, ⬜ idle — tidak ada warna lain
- **Satu mutation = satu trace event** — tidak boleh batch beberapa mutation ke satu trace
- **Kalau `illuminist_graph_v1` tidak berubah setelah UI interaction** → berarti mutation tidak masuk ke graph → ini adalah BROKEN STATE, bukan "belum diimplementasi"

---

## Integration dengan skill lain

| Skill | Hubungan dengan debug-visualization-mode |
|---|---|
| `debug-trace` | debug-trace untuk bug logic; debug-visualization untuk membuktikan graph alive |
| `qa-checklist` | Semua HPP/graph features wajib lewat debug-visualization sebelum QA |
| `bug-hunter` | Graph anomaly (node tidak update) dideteksi via visualization, lalu ditelusuri via bug-hunter |
| `performance` | Update timeline dipakai untuk mengukur recompute latency (target: <16ms per cascade) |
| `consistency-audit` | Debug panel menunjukkan cross-component state — dipakai oleh consistency-audit |
| `system-orchestrator` | Request type "Data / graph" → chain dimulai dengan debug-visualization-mode verification |
