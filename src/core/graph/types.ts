// Graph Core System — Node type definitions
// Every cost entity is a typed node. Computed nodes are always derived — never manually entered.

export type GraphNodeType =
  | 'material'
  | 'labor'
  | 'overhead'
  | 'packaging'
  | 'hpp'
  | 'margin'
  | 'batch_cost'

export interface GraphNode {
  id: string
  type: GraphNodeType
  productId: string
  label: string
  isComputed: boolean
  dependencies: string[]   // IDs of nodes this node reads from
  value: number            // cached result (IDR); always re-derived from engine
  unit: 'per_unit' | 'per_batch' | 'per_month'
  updatedAt: string
}

// ─── Input nodes (manually entered) ──────────────────────────────────────────

export interface MaterialCostNode extends GraphNode {
  type: 'material'
  isComputed: false
  materialId: string
  quantityPerUnit: number  // units of material per 1 product unit
  pricePerUnit: number     // IDR per material unit
  // value = quantityPerUnit × pricePerUnit
}

export interface LaborCostNode extends GraphNode {
  type: 'labor'
  isComputed: false
  processName: string
  costPerUnit: number      // total IDR labor cost per product unit
  // value = costPerUnit
}

export interface OverheadCostNode extends GraphNode {
  type: 'overhead'
  isComputed: false
  category: string
  monthlyTotal: number     // total overhead IDR per month
  unitsPerMonth: number    // units produced per month (divisor)
  // value = monthlyTotal / unitsPerMonth
}

export interface PackagingCostNode extends GraphNode {
  type: 'packaging'
  isComputed: false
  itemName: string
  costPerUnit: number      // IDR per product unit
  // value = costPerUnit
}

// ─── Computed nodes (derived — never manually entered) ────────────────────────

export interface HPPCostNode extends GraphNode {
  type: 'hpp'
  isComputed: true
  // value = sum of all dependency node values
  breakdown: {
    materials: number
    labor: number
    overhead: number
    packaging: number
  }
}

export interface MarginNode extends GraphNode {
  type: 'margin'
  isComputed: true
  sellingPrice: number
  marginPercent: number    // (value / sellingPrice) × 100
  // value = sellingPrice - HPPCostNode.value
}

export interface BatchCostNode extends GraphNode {
  type: 'batch_cost'
  isComputed: true
  batchQuantity: number
  // value = HPPCostNode.value × batchQuantity
}

export type AnyGraphNode =
  | MaterialCostNode
  | LaborCostNode
  | OverheadCostNode
  | PackagingCostNode
  | HPPCostNode
  | MarginNode
  | BatchCostNode

export interface ProductCostBreakdown {
  productId: string
  nodes: {
    materials: MaterialCostNode[]
    labor: LaborCostNode[]
    overhead: OverheadCostNode[]
    packaging: PackagingCostNode[]
  }
  hpp: HPPCostNode | undefined
  margin: MarginNode | undefined
  batchCost: BatchCostNode | undefined
}
