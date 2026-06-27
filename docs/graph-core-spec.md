# ILLUMINIST OS — Graph Core System Spec
# HPP Engine + Data Node Graph

> Living document. Owner: illuministproject@gmail.com
> Last updated: 2026-06-27
> Companion to: `docs/PRD.md`, `CLAUDE.md`, `.claude/skills/system-orchestrator.md`

---

## 1. The Problem This Solves

The current system has **UI-driven data** — values are entered per field, stored per component, and do not flow between each other. This means:

- HPP must be manually recalculated if any input changes
- There is no single source of truth for cost structure
- The spreadsheet UI cannot be reactive because there is no computation graph underneath it
- Adding a new cost factor requires editing multiple disconnected places

The solution: **a data graph where every cost entity is a node, every dependency between costs is an edge, and computed values (HPP, margin, profit) are derived automatically when upstream nodes change.**

---

## 2. Mental Model

Think of this like a spreadsheet formula engine — except the cells are typed, named, and connected by explicit dependency declarations, not by formula strings.

```
Excel analogy:
  B2 = 50000       (material cost per unit)
  C2 = 15000       (labor cost per unit)
  D2 = 10000       (overhead cost per unit)
  E2 = B2+C2+D2    (HPP — formula cell, derived)
  F2 = G2 - E2     (margin — derived from HPP and selling price)

Graph system equivalent:
  MaterialNode(id, unitCost, quantity) → contributes to HPPNode
  LaborNode(id, ratePerUnit)           → contributes to HPPNode
  OverheadNode(id, allocatedPerUnit)   → contributes to HPPNode
  HPPNode(productId)                   → computed, never manually entered
  MarginNode(productId)                → computed from HPP + selling price
```

**Rules:**
- Input nodes (Material, Labor, Overhead, Packaging) → manually entered
- Computed nodes (HPP, Margin, Profit) → never manually entered, always derived
- When an input node changes → all downstream computed nodes recalculate automatically

---

## 3. Node Schema

### 3.1 Base Node Interface

```typescript
// src/core/graph/types.ts

export type NodeType =
  | 'material'
  | 'labor'
  | 'overhead'
  | 'packaging'
  | 'hpp'        // computed — Harga Pokok Produksi per unit
  | 'margin'     // computed — selling price minus HPP
  | 'batch_cost' // computed — HPP × batch quantity

export interface GraphNode {
  id: string
  type: NodeType
  productId: string       // which product this node belongs to
  label: string           // human-readable name
  isComputed: boolean     // true = derived, false = manually entered
  dependencies: string[]  // node IDs this node reads from
  value: number           // current value (cost amount, IDR)
  unit: string            // 'per_unit' | 'per_batch' | 'per_month'
  updatedAt: string       // ISO timestamp of last change
}
```

### 3.2 Input Node Types

```typescript
export interface MaterialNode extends GraphNode {
  type: 'material'
  isComputed: false
  materialId: string      // reference to materials table
  quantityPerUnit: number // how much of this material per 1 product unit
  pricePerUnit: number    // cost per unit of material (IDR)
  // value = quantityPerUnit × pricePerUnit (auto-computed locally)
}

export interface LaborNode extends GraphNode {
  type: 'labor'
  isComputed: false
  processName: string     // e.g. "Cutting", "Sewing", "Finishing"
  minutesPerUnit: number  // labor minutes required per product unit
  ratePerMinute: number   // IDR per minute of labor
  // value = minutesPerUnit × ratePerMinute
}

export interface OverheadNode extends GraphNode {
  type: 'overhead'
  isComputed: false
  category: string        // e.g. "Rent", "Electricity", "Equipment"
  monthlyTotal: number    // total monthly overhead cost (IDR)
  unitsPerMonth: number   // how many units produced per month
  // value = monthlyTotal / unitsPerMonth (allocated per unit)
}

export interface PackagingNode extends GraphNode {
  type: 'packaging'
  isComputed: false
  itemName: string        // e.g. "Box", "Hang Tag", "Polybag"
  costPerUnit: number     // IDR per unit of packaging
  // value = costPerUnit
}
```

### 3.3 Computed Node Types

```typescript
export interface HPPNode extends GraphNode {
  type: 'hpp'
  isComputed: true
  // dependencies = IDs of all MaterialNode, LaborNode, OverheadNode, PackagingNode for this product
  // value = sum of all dependency node values
  breakdown: {
    materials: number   // sum of all MaterialNode values
    labor: number       // sum of all LaborNode values
    overhead: number    // sum of all OverheadNode values
    packaging: number   // sum of all PackagingNode values
  }
}

export interface MarginNode extends GraphNode {
  type: 'margin'
  isComputed: true
  // dependencies = [hppNodeId, sellingPrice reference]
  sellingPrice: number
  // value = sellingPrice - HPPNode.value
  marginPercent: number  // (value / sellingPrice) × 100
}

export interface BatchCostNode extends GraphNode {
  type: 'batch_cost'
  isComputed: true
  // dependencies = [hppNodeId]
  batchQuantity: number
  // value = HPPNode.value × batchQuantity
}
```

---

## 4. Dependency Graph

```
Product (e.g. "Kemeja Linen Putih")
│
├─── MaterialNode: Kain Linen (2m × Rp 45.000)          → Rp 90.000
├─── MaterialNode: Benang (10m × Rp 500)                → Rp 5.000
├─── MaterialNode: Kancing (8pcs × Rp 750)              → Rp 6.000
├─── LaborNode: Cutting (15min × Rp 833/min)            → Rp 12.500
├─── LaborNode: Sewing (45min × Rp 833/min)             → Rp 37.500
├─── LaborNode: Finishing (10min × Rp 833/min)          → Rp 8.333
├─── OverheadNode: Sewa (Rp 5.000.000 / 250 units)      → Rp 20.000
├─── OverheadNode: Listrik (Rp 1.500.000 / 250 units)   → Rp 6.000
├─── PackagingNode: Kantong (1pc × Rp 2.000)            → Rp 2.000
├─── PackagingNode: Hang Tag (1pc × Rp 1.500)           → Rp 1.500
│
└─── HPPNode (computed)                                  → Rp 188.833
      │
      ├─── MarginNode (selling price Rp 450.000)         → Rp 261.167 (58.1%)
      └─── BatchCostNode (batch 50 units)                → Rp 9.441.650
```

**Propagation rule:** Change kain linen price Rp 45.000 → Rp 50.000:
```
MaterialNode(kain-linen).value: 90.000 → 100.000
  → HPPNode.value: 188.833 → 198.833
    → MarginNode.value: 261.167 → 251.167 (55.8%)
    → BatchCostNode.value: 9.441.650 → 9.941.650
```
All downstream nodes recalculate in one pass. No manual update needed.

---

## 5. Computation Engine

### 5.1 Pure computation functions

```typescript
// src/core/graph/engine.ts

export function computeNodeValue(
  node: GraphNode,
  allNodes: Record<string, GraphNode>
): number {
  if (!node.isComputed) return node.value  // input nodes: return stored value

  switch (node.type) {
    case 'material': {
      const n = node as MaterialNode
      return n.quantityPerUnit * n.pricePerUnit
    }
    case 'labor': {
      const n = node as LaborNode
      return n.minutesPerUnit * n.ratePerMinute
    }
    case 'overhead': {
      const n = node as OverheadNode
      return n.unitsPerMonth > 0 ? n.monthlyTotal / n.unitsPerMonth : 0
    }
    case 'packaging': {
      const n = node as PackagingNode
      return n.costPerUnit
    }
    case 'hpp': {
      // Sum all dependency node values
      return node.dependencies.reduce((sum, depId) => {
        const dep = allNodes[depId]
        return sum + (dep ? computeNodeValue(dep, allNodes) : 0)
      }, 0)
    }
    case 'margin': {
      const n = node as MarginNode
      const hpp = allNodes[node.dependencies[0]]
      const hppValue = hpp ? computeNodeValue(hpp, allNodes) : 0
      return n.sellingPrice - hppValue
    }
    case 'batch_cost': {
      const n = node as BatchCostNode
      const hpp = allNodes[node.dependencies[0]]
      const hppValue = hpp ? computeNodeValue(hpp, allNodes) : 0
      return hppValue * n.batchQuantity
    }
    default:
      return 0
  }
}

// Recalculate all computed nodes for a product (topological order)
export function recomputeGraph(
  productId: string,
  nodes: GraphNode[]
): GraphNode[] {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  // Topological order: input nodes first, computed nodes after
  const ordered = [
    ...nodes.filter(n => !n.isComputed && n.productId === productId),
    ...nodes.filter(n => n.isComputed && n.productId === productId),
  ]

  return nodes.map(node => {
    if (!ordered.find(n => n.id === node.id)) return node  // different product
    return { ...node, value: computeNodeValue(node, nodeMap), updatedAt: new Date().toISOString() }
  })
}
```

### 5.2 React integration (ERPContext)

```typescript
// In ERPContext — add to existing store

interface ERPState {
  // ... existing state
  graphNodes: GraphNode[]
}

// Mutation: update an input node → triggers full recompute
function updateGraphNode(id: string, patch: Partial<GraphNode>) {
  setGraphNodes(prev => {
    const updated = prev.map(n => n.id === id ? { ...n, ...patch } : n)
    const changedNode = updated.find(n => n.id === id)
    if (!changedNode) return updated
    return recomputeGraph(changedNode.productId, updated)
  })
}

// Selector: get HPP for a product
function getHPP(productId: string): HPPNode | undefined {
  return graphNodes.find(n => n.type === 'hpp' && n.productId === productId) as HPPNode
}

// Selector: get full cost breakdown for spreadsheet view
function getCostBreakdown(productId: string): CostBreakdown {
  const productNodes = graphNodes.filter(n => n.productId === productId)
  const hpp = getHPP(productId)
  return {
    materials: productNodes.filter(n => n.type === 'material'),
    labor: productNodes.filter(n => n.type === 'labor'),
    overhead: productNodes.filter(n => n.type === 'overhead'),
    packaging: productNodes.filter(n => n.type === 'packaging'),
    hpp: hpp?.value ?? 0,
    breakdown: hpp?.breakdown ?? { materials: 0, labor: 0, overhead: 0, packaging: 0 },
  }
}
```

---

## 6. Spreadsheet UI Abstraction

The spreadsheet is a **view** of the graph — not its source of truth. Cells map to nodes.

### Cell types

```typescript
type CellType = 'input' | 'computed' | 'label' | 'section-header'

interface SpreadsheetCell {
  nodeId?: string         // undefined for label/section cells
  type: CellType
  label: string
  value: number | string
  format: 'currency' | 'number' | 'percent' | 'text'
  editable: boolean       // true only for 'input' type cells
  depth: number           // indentation level (0 = category, 1 = item)
}
```

### Row generation from graph

```typescript
function buildSpreadsheetRows(productId: string, nodes: GraphNode[]): SpreadsheetCell[][] {
  const productNodes = nodes.filter(n => n.productId === productId)
  const rows: SpreadsheetCell[][] = []

  // Section: Materials
  rows.push([{ type: 'section-header', label: 'Bahan Baku', editable: false, ... }])
  productNodes.filter(n => n.type === 'material').forEach(node => {
    const n = node as MaterialNode
    rows.push([
      { type: 'label', label: n.label, depth: 1, editable: true, ... },
      { nodeId: n.id, type: 'input', label: 'Qty/unit', value: n.quantityPerUnit, format: 'number', editable: true },
      { nodeId: n.id, type: 'input', label: 'Harga/unit', value: n.pricePerUnit, format: 'currency', editable: true },
      { nodeId: n.id, type: 'computed', label: 'Total', value: n.value, format: 'currency', editable: false },
    ])
  })

  // ... similar for Labor, Overhead, Packaging

  // Section: HPP (computed — highlighted, not editable)
  const hpp = productNodes.find(n => n.type === 'hpp') as HPPNode
  rows.push([
    { type: 'computed', label: 'HPP per Unit', value: hpp?.value ?? 0, format: 'currency', editable: false },
  ])

  return rows
}
```

### Edit propagation

When a user edits a cell in the spreadsheet:

```typescript
function onCellEdit(nodeId: string, field: keyof GraphNode, newValue: number) {
  // Update the node in the graph → triggers recompute → UI re-renders
  updateGraphNode(nodeId, { [field]: newValue })
  // All downstream computed cells (HPP, margin, batch cost) update automatically
  // No additional code needed — reactive via ERPContext
}
```

---

## 7. Agent Integration

How each skill interacts with the graph system:

| Skill | Interaction |
|---|---|
| `bug-hunter` | Traces node value divergence — expected value vs computed value at each node |
| `debug-trace` | Maps full propagation chain from mutated input node to final computed output |
| `architect` | Evaluates node schema changes — dependency graph integrity |
| `performance` | Measures recompute time for large graphs (100+ nodes) — optimize `recomputeGraph` if >16ms |
| `feature-planner` | Defines new node types when new cost categories are added |
| `qa-checklist` | Verifies that editing an input node produces correct downstream values |
| `prd-writer` | Documents expected computation behavior as acceptance criteria |

---

## 8. Implementation Roadmap

### Phase 0 — Foundation (implement first)
- [ ] `src/core/graph/types.ts` — Node type definitions
- [ ] `src/core/graph/engine.ts` — `computeNodeValue` + `recomputeGraph` pure functions
- [ ] Add `graphNodes: GraphNode[]` to ERPContext with `updateGraphNode` mutation
- [ ] Seed initial graph for existing NEVAEH products (import from current materials data)

### Phase 1 — HPP Engine
- [ ] `src/features/fashion/pages/HPPEngineView.tsx` — rewrite to read from graph, not local state
- [ ] Spreadsheet row builder from graph nodes
- [ ] Editable cells → `updateGraphNode` → reactive recompute
- [ ] Read-only computed cells with distinct visual style (no edit cursor, different bg)

### Phase 2 — Spreadsheet UI
- [ ] Excel-like table with column headers: Item, Qty, Harga, Total
- [ ] Row grouping: Materials / Labor / Overhead / Packaging / HPP summary
- [ ] Add/remove node rows inline
- [ ] Export to PDF / CSV

### Phase 3 — Cross-product intelligence
- [ ] Compare HPP across multiple products
- [ ] What-if simulation: change material price → see HPP impact across all products using that material
- [ ] Alert: margin below threshold

### Phase 4 — Supabase persistence
- [ ] `graph_nodes` table in Supabase
- [ ] Real-time subscription: node change → recompute in all connected clients
- [ ] Audit log: which node changed, when, from/to what value

---

## 9. Definition of Done (per phase)

Phase is complete when:
1. `recomputeGraph` produces correct values verified by unit tests with known inputs
2. Editing a MaterialNode price in the UI causes HPP and Margin to update without page reload
3. `npx tsc --noEmit` → 0 errors
4. Verified live in preview with at least 3 cost nodes + HPP computed correctly
5. No hardcoded values in computation — all reads from node schema
