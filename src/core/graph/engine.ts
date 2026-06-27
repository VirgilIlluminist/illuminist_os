// Graph Core Engine — pure computation functions, no side effects
// Import this anywhere; it never touches React state or localStorage directly.

import type {
  GraphNode, AnyGraphNode, GraphNodeType,
  MaterialCostNode, LaborCostNode, OverheadCostNode, PackagingCostNode,
  HPPCostNode, MarginNode, BatchCostNode, ProductCostBreakdown,
} from './types'

// ─── Value computation ────────────────────────────────────────────────────────

function computeInputValue(node: AnyGraphNode): number {
  switch (node.type) {
    case 'material': {
      const n = node as MaterialCostNode
      return n.quantityPerUnit * n.pricePerUnit
    }
    case 'labor': {
      const n = node as LaborCostNode
      return n.costPerUnit
    }
    case 'overhead': {
      const n = node as OverheadCostNode
      return n.unitsPerMonth > 0 ? n.monthlyTotal / n.unitsPerMonth : 0
    }
    case 'packaging': {
      const n = node as PackagingCostNode
      return n.costPerUnit
    }
    default:
      return node.value
  }
}

export function computeNodeValue(
  node: AnyGraphNode,
  nodeMap: Record<string, AnyGraphNode>
): number {
  if (!node.isComputed) return computeInputValue(node)

  switch (node.type) {
    case 'hpp': {
      return node.dependencies.reduce((sum, depId) => {
        const dep = nodeMap[depId]
        return sum + (dep ? computeNodeValue(dep, nodeMap) : 0)
      }, 0)
    }
    case 'margin': {
      const n = node as MarginNode
      const hppDep = nodeMap[node.dependencies[0]]
      const hppVal = hppDep ? computeNodeValue(hppDep, nodeMap) : 0
      return n.sellingPrice - hppVal
    }
    case 'batch_cost': {
      const n = node as BatchCostNode
      const hppDep = nodeMap[node.dependencies[0]]
      const hppVal = hppDep ? computeNodeValue(hppDep, nodeMap) : 0
      return hppVal * n.batchQuantity
    }
    default:
      return (node as GraphNode).value
  }
}

// ─── Graph recomputation ──────────────────────────────────────────────────────

export function recomputeGraph(
  productId: string,
  allNodes: AnyGraphNode[]
): AnyGraphNode[] {
  const nodeMap = Object.fromEntries(allNodes.map(n => [n.id, n]))
  const now = new Date().toISOString()

  return allNodes.map(node => {
    if (node.productId !== productId) return node

    const newValue = computeNodeValue(node, nodeMap)

    if (node.type === 'hpp') {
      const hppNode = node as HPPCostNode
      const deps = hppNode.dependencies.map(id => nodeMap[id])
      const breakdown = {
        materials: deps.filter(d => d?.type === 'material').reduce((s, d) => s + computeNodeValue(d!, nodeMap), 0),
        labor:     deps.filter(d => d?.type === 'labor').reduce((s, d) => s + computeNodeValue(d!, nodeMap), 0),
        overhead:  deps.filter(d => d?.type === 'overhead').reduce((s, d) => s + computeNodeValue(d!, nodeMap), 0),
        packaging: deps.filter(d => d?.type === 'packaging').reduce((s, d) => s + computeNodeValue(d!, nodeMap), 0),
      }
      return { ...hppNode, value: newValue, breakdown, updatedAt: now } as HPPCostNode
    }

    if (node.type === 'margin') {
      const hppDep = nodeMap[node.dependencies[0]]
      const hppVal = hppDep ? computeNodeValue(hppDep, nodeMap) : 0
      const n = node as MarginNode
      return {
        ...n,
        value: newValue,
        marginPercent: n.sellingPrice > 0 ? (newValue / n.sellingPrice) * 100 : 0,
        updatedAt: now,
      } as MarginNode
    }

    if (node.value === newValue) return node
    return { ...node, value: newValue, updatedAt: now }
  })
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function getProductHPP(
  productId: string,
  nodes: AnyGraphNode[]
): HPPCostNode | undefined {
  return nodes.find(n => n.type === 'hpp' && n.productId === productId) as HPPCostNode | undefined
}

export function getProductCostBreakdown(
  productId: string,
  nodes: AnyGraphNode[]
): ProductCostBreakdown {
  const productNodes = nodes.filter(n => n.productId === productId)
  return {
    productId,
    nodes: {
      materials: productNodes.filter(n => n.type === 'material') as MaterialCostNode[],
      labor:     productNodes.filter(n => n.type === 'labor') as LaborCostNode[],
      overhead:  productNodes.filter(n => n.type === 'overhead') as OverheadCostNode[],
      packaging: productNodes.filter(n => n.type === 'packaging') as PackagingCostNode[],
    },
    hpp:       productNodes.find(n => n.type === 'hpp') as HPPCostNode | undefined,
    margin:    productNodes.find(n => n.type === 'margin') as MarginNode | undefined,
    batchCost: productNodes.find(n => n.type === 'batch_cost') as BatchCostNode | undefined,
  }
}

// ─── Seed builder ─────────────────────────────────────────────────────────────

interface SeedProduct  { id: string; name: string; sellingPrice: number }
interface SeedMaterial { id: string; costPerUnit: number }
interface SeedBatch    {
  productId: string; materialId: string
  usagePerPcs: number; laborCost: number; packagingCost: number; qty: number
}

export function buildSeedGraph(
  products: SeedProduct[],
  materials: SeedMaterial[],
  batches: SeedBatch[]
): AnyGraphNode[] {
  const nodes: AnyGraphNode[] = []
  const now = new Date().toISOString()
  const matMap = Object.fromEntries(materials.map(m => [m.id, m]))

  for (const product of products) {
    const batch = batches.find(b => b.productId === product.id)
    const inputIds: string[] = []

    if (batch) {
      const mat = matMap[batch.materialId]
      const pricePerUnit = mat?.costPerUnit ?? 0

      // Material node
      const matNodeId = `MAT-NODE-${product.id}`
      const matNode: MaterialCostNode = {
        id: matNodeId, type: 'material', productId: product.id, isComputed: false,
        label: `Bahan Baku`, materialId: batch.materialId,
        quantityPerUnit: batch.usagePerPcs, pricePerUnit,
        value: batch.usagePerPcs * pricePerUnit,
        dependencies: [], unit: 'per_unit', updatedAt: now,
      }
      nodes.push(matNode)
      inputIds.push(matNodeId)

      // Labor node
      const laborNodeId = `LABOR-NODE-${product.id}`
      const laborNode: LaborCostNode = {
        id: laborNodeId, type: 'labor', productId: product.id, isComputed: false,
        label: 'Upah Produksi', processName: 'Produksi',
        costPerUnit: batch.laborCost,
        value: batch.laborCost,
        dependencies: [], unit: 'per_unit', updatedAt: now,
      }
      nodes.push(laborNode)
      inputIds.push(laborNodeId)

      // Packaging node
      const pkgNodeId = `PKG-NODE-${product.id}`
      const pkgNode: PackagingCostNode = {
        id: pkgNodeId, type: 'packaging', productId: product.id, isComputed: false,
        label: 'Packaging', itemName: 'Kemasan',
        costPerUnit: batch.packagingCost,
        value: batch.packagingCost,
        dependencies: [], unit: 'per_unit', updatedAt: now,
      }
      nodes.push(pkgNode)
      inputIds.push(pkgNodeId)
    } else {
      // No production batch — seed minimal labor node as placeholder
      const laborNodeId = `LABOR-NODE-${product.id}`
      const estimatedLabor = Math.round(product.sellingPrice * 0.08)
      const laborNode: LaborCostNode = {
        id: laborNodeId, type: 'labor', productId: product.id, isComputed: false,
        label: 'Upah Produksi (estimasi)', processName: 'Produksi',
        costPerUnit: estimatedLabor, value: estimatedLabor,
        dependencies: [], unit: 'per_unit', updatedAt: now,
      }
      nodes.push(laborNode)
      inputIds.push(laborNodeId)
    }

    // HPP node (computed)
    const hppNodeId = `HPP-NODE-${product.id}`
    const nodeMapTemp = Object.fromEntries(nodes.map(n => [n.id, n]))
    const hppValue = inputIds.reduce((sum, id) => {
      const n = nodeMapTemp[id]
      return sum + (n ? computeInputValue(n as AnyGraphNode) : 0)
    }, 0)

    const hppNode: HPPCostNode = {
      id: hppNodeId, type: 'hpp', productId: product.id, isComputed: true,
      label: 'HPP per Unit', dependencies: inputIds,
      value: hppValue, unit: 'per_unit', updatedAt: now,
      breakdown: {
        materials: (nodeMapTemp[`MAT-NODE-${product.id}`] as MaterialCostNode | undefined)?.value ?? 0,
        labor:     (nodeMapTemp[`LABOR-NODE-${product.id}`] as LaborCostNode | undefined)?.value ?? 0,
        overhead:  0,
        packaging: (nodeMapTemp[`PKG-NODE-${product.id}`] as PackagingCostNode | undefined)?.value ?? 0,
      },
    }
    nodes.push(hppNode)

    // Margin node (computed)
    const marginValue = product.sellingPrice - hppValue
    const marginNode: MarginNode = {
      id: `MARGIN-NODE-${product.id}`, type: 'margin', productId: product.id, isComputed: true,
      label: 'Margin per Unit', sellingPrice: product.sellingPrice,
      dependencies: [hppNodeId],
      value: marginValue,
      marginPercent: product.sellingPrice > 0 ? (marginValue / product.sellingPrice) * 100 : 0,
      unit: 'per_unit', updatedAt: now,
    }
    nodes.push(marginNode)
  }

  return nodes
}
