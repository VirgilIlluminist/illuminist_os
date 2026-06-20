/**
 * tools/index.ts — Central Tool Registry
 * AI can ONLY access business data through these registered tools.
 * This enforces the AI Gateway pattern from V12 architecture.
 *
 * AI → AIGateway → ToolRegistry → Business Data
 * AI NEVER accesses database/localStorage directly.
 */

export interface ToolDefinition {
  name:        string;
  description: string;
  category:    'read' | 'write' | 'analysis' | 'report';
  minLevel:    1 | 2 | 3 | 4 | 5;  // minimum AI permission level
  parameters?: ToolParam[];
  execute:     (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

export interface ToolParam {
  name:     string;
  type:     'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
}

export interface ToolContext {
  userId:    string;
  companyId: string;
  aiLevel:   number;
  erpState?: ERPStateSnapshot;
}

export interface ERPStateSnapshot {
  materials?:         unknown[];
  products?:          unknown[];
  variants?:          unknown[];
  samples?:           unknown[];
  production?:        unknown[];
  sales?:             unknown[];
  operationalCosts?:  unknown[];
  adsCampaigns?:      unknown[];
  kols?:              unknown[];
  purchaseOrders?:    unknown[];
  suppliers?:         unknown[];
  customers?:         unknown[];
  assets?:            unknown[];
  cashflow?:          unknown[];
  config?:            unknown;
}

// ─── Tool Registry ─────────────────────────────────────────────────────────
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getByLevel(minLevel: number): ToolDefinition[] {
    return Array.from(this.tools.values()).filter(t => t.minLevel <= minLevel);
  }

  async execute(
    toolName: string,
    params:   Record<string, unknown>,
    context:  ToolContext
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const tool = this.tools.get(toolName);
    if (!tool) return { success: false, error: `Tool "${toolName}" not found` };
    if (context.aiLevel < tool.minLevel) {
      return { success: false, error: `Tool "${toolName}" requires AI level ${tool.minLevel}` };
    }
    try {
      const data = await tool.execute(params, context);
      return { success: true, data };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tool execution failed';
      return { success: false, error: msg };
    }
  }

  // Format tools list for AI system prompt
  formatForPrompt(level: number): string {
    return this.getByLevel(level)
      .map(t => `- ${t.name}(${t.parameters?.map(p => p.name).join(', ') || ''}): ${t.description}`)
      .join('\n');
  }
}

export const toolRegistry = new ToolRegistry();

// ─── Register all business tools ────────────────────────────────────────────
toolRegistry.register({
  name:        'getInventoryStatus',
  description: 'Get current inventory levels, stock status, and low stock alerts for all materials',
  category:    'read',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const mats = (ctx.erpState?.materials || []) as any[];
    return {
      total:         mats.length,
      lowStock:      mats.filter(m => m.remainingQty <= m.minStock),
      outOfStock:    mats.filter(m => m.remainingQty === 0),
      healthy:       mats.filter(m => m.remainingQty > m.minStock),
      totalValue:    mats.reduce((s: number, m: any) => s + (m.remainingQty * m.costPerUnit), 0),
      materials:     mats,
    };
  },
});

toolRegistry.register({
  name:        'getProductMargins',
  description: 'Get profit margins, HPP costs, and profitability analysis for all products',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const products = (ctx.erpState?.products || []) as any[];
    return products.map((p: any) => ({
      id:           p.id,
      name:         p.name,
      sellingPrice: p.sellingPrice,
      hpp:          p.finalHPP,
      margin:       p.sellingPrice > 0 ? ((p.sellingPrice - p.finalHPP) / p.sellingPrice * 100).toFixed(1) + '%' : '0%',
      netProfit:    p.sellingPrice - p.finalHPP,
    }));
  },
});

toolRegistry.register({
  name:        'getSalesPerformance',
  description: 'Get sales data, revenue trends, channel performance, and top products',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const sales = (ctx.erpState?.sales || []) as any[];
    const totalRevenue = sales.reduce((s: number, sale: any) => s + (sale.netRevenue || 0), 0);
    const byChannel    = sales.reduce((acc: Record<string, number>, sale: any) => {
      acc[sale.channel] = (acc[sale.channel] || 0) + (sale.netRevenue || 0);
      return acc;
    }, {});
    return { totalOrders: sales.length, totalRevenue, byChannel, recentSales: sales.slice(-10) };
  },
});

toolRegistry.register({
  name:        'getCashflowSummary',
  description: 'Get cashflow summary, income vs expenses, and financial health indicators',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const cashflow = (ctx.erpState?.cashflow || []) as any[];
    const income   = cashflow.filter((c: any) => c.type === 'income').reduce((s: number, c: any) => s + c.amount, 0);
    const expenses = cashflow.filter((c: any) => c.type === 'expense').reduce((s: number, c: any) => s + c.amount, 0);
    return { totalIncome: income, totalExpenses: expenses, netCashflow: income - expenses, transactions: cashflow.length };
  },
});

toolRegistry.register({
  name:        'getAdsROAS',
  description: 'Get ads campaign performance, ROAS, and marketing efficiency',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const ads = (ctx.erpState?.adsCampaigns || []) as any[];
    return ads.map((a: any) => ({
      ...a,
      roas:    a.spend > 0 ? (a.revenue / a.spend).toFixed(2) + 'x' : '0x',
      profit:  (a.revenue || 0) - (a.spend || 0),
    }));
  },
});

toolRegistry.register({
  name:        'getSupplierRanking',
  description: 'Get supplier performance ranking, reliability scores, and risk assessment',
  category:    'read',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const suppliers = (ctx.erpState?.suppliers || []) as any[];
    return suppliers.sort((a: any, b: any) => b.performanceIndex - a.performanceIndex);
  },
});

toolRegistry.register({
  name:        'getCustomerInsights',
  description: 'Get customer segmentation, LTV analysis, and purchase patterns',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const customers = (ctx.erpState?.customers || []) as any[];
    const bySegment = customers.reduce((acc: Record<string, number>, c: any) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    }, {});
    return { total: customers.length, bySegment, customers };
  },
});

toolRegistry.register({
  name:        'getKOLPerformance',
  description: 'Get KOL influencer performance, ROI per KOL, and engagement metrics',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const kols = (ctx.erpState?.kols || []) as any[];
    return kols.map((k: any) => ({
      ...k,
      roi: k.fee > 0 ? ((k.sales || 0) / k.fee * 100).toFixed(1) + '%' : 'N/A',
    }));
  },
});

toolRegistry.register({
  name:        'getProductionStatus',
  description: 'Get production batch status, material usage, and completion rates',
  category:    'read',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const production = (ctx.erpState?.production || []) as any[];
    return {
      total:      production.length,
      byStatus:   production.reduce((acc: Record<string, number>, p: any) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
      production,
    };
  },
});

toolRegistry.register({
  name:        'getBusinessSummary',
  description: 'Get complete business performance summary across all modules',
  category:    'analysis',
  minLevel:    1,
  execute:     async (_p, ctx) => {
    const state = ctx.erpState || {};
    return {
      materials:   { count: (state.materials  as any[])?.length || 0 },
      products:    { count: (state.products   as any[])?.length || 0 },
      sales:       { count: (state.sales      as any[])?.length || 0 },
      customers:   { count: (state.customers  as any[])?.length || 0 },
      suppliers:   { count: (state.suppliers  as any[])?.length || 0 },
      production:  { count: (state.production as any[])?.length || 0 },
      assets:      { count: (state.assets     as any[])?.length || 0 },
    };
  },
});

export default toolRegistry;
