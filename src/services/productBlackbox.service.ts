import { productBlackboxRepo } from '../repositories/productBlackbox.repository';
import type {
  ProductBatch, ProductJournalEntry, ProductAsset, AssetType,
  ChannelSalesSummary, SalesChannel, MarginResult, RestockPrediction,
  BlackboxOverview, ProductVariantBB, ProductTimelineEvent,
} from '../types/product-blackbox.types';
import type { MasterProduct, SalesRecord } from '../types';

// ─── Margin Calculator (pure function) ───────────────────────────────────────

export function calculateMargin(hpp: number, sellingPrice: number): MarginResult {
  const marginAmount  = sellingPrice - hpp;
  const marginPercent = sellingPrice > 0 ? (marginAmount / sellingPrice) * 100 : 0;
  return {
    marginAmount,
    marginPercent,
    breakEvenPrice: hpp,
    targetPrice: (targetMarginPercent: number) =>
      targetMarginPercent >= 100 ? Infinity : hpp / (1 - targetMarginPercent / 100),
  };
}

// ─── Sales aggregation ────────────────────────────────────────────────────────

function normalizeChannel(raw: string): SalesChannel {
  const lower = raw.toLowerCase();
  if (lower.includes('shopee'))     return 'shopee';
  if (lower.includes('tokopedia'))  return 'tokopedia';
  if (lower.includes('instagram'))  return 'instagram';
  if (lower.includes('direct'))     return 'direct';
  return 'other';
}

export function getSalesByChannel(sales: SalesRecord[], productId: string): ChannelSalesSummary[] {
  const filtered = sales.filter(s => s.productId === productId && s.status !== 'Cancelled');
  const map = new Map<SalesChannel, ChannelSalesSummary>();

  for (const s of filtered) {
    const ch    = normalizeChannel(s.channel);
    const gross = s.qtySold * s.pricePerPcs - (s.discount ?? 0);
    const fees  = (s.platformFee ?? 0) + (s.shippingFee ?? 0);
    const net   = gross - fees;
    const prev  = map.get(ch) ?? { channel: ch, unitsSold: 0, grossRevenue: 0, fees: 0, netRevenue: 0, averageOrderValue: 0 };
    map.set(ch, {
      channel:          ch,
      unitsSold:        prev.unitsSold + s.qtySold,
      grossRevenue:     prev.grossRevenue + gross,
      fees:             prev.fees + fees,
      netRevenue:       prev.netRevenue + net,
      averageOrderValue: 0,
    });
  }

  return Array.from(map.values()).map(s => ({
    ...s,
    averageOrderValue: s.unitsSold > 0 ? s.grossRevenue / s.unitsSold : 0,
  }));
}

// ─── Restock prediction ───────────────────────────────────────────────────────

export function predictRestock(
  currentStock: number,
  sales: SalesRecord[],
  productId: string,
  restockPoint = 10,
): RestockPrediction {
  const filtered = sales.filter(s => s.productId === productId && s.status === 'Completed');
  if (filtered.length === 0) {
    return {
      currentStock, avgDailySales: 0,
      daysUntilStockout: null, estimatedStockoutDate: null,
      recommendedRestockQuantity: restockPoint * 3,
    };
  }

  const now   = Date.now();
  const days  = 30;
  const since = new Date(now - days * 86_400_000).toISOString().slice(0, 10);
  const recent = filtered.filter(s => s.date >= since);
  const totalUnits = recent.reduce((sum, s) => sum + s.qtySold, 0);
  const avgDailySales = totalUnits / days;

  let daysUntilStockout: number | null = null;
  let estimatedStockoutDate: string | null = null;

  if (avgDailySales > 0) {
    daysUntilStockout = Math.floor(currentStock / avgDailySales);
    const stockoutDate = new Date(now + daysUntilStockout * 86_400_000);
    estimatedStockoutDate = stockoutDate.toISOString().slice(0, 10);
  }

  const recommendedRestockQuantity = Math.max(
    restockPoint * 3,
    Math.ceil(avgDailySales * 45),
  );

  return { currentStock, avgDailySales, daysUntilStockout, estimatedStockoutDate, recommendedRestockQuantity };
}

// ─── Batch number generator ───────────────────────────────────────────────────

export function nextBatchNumber(existing: ProductBatch[]): string {
  const nums = existing
    .map(b => parseInt(b.batchNumber.replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `BATCH-${String(next).padStart(3, '0')}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const productBlackboxService = {
  // ── Overview (all at once, used by header & Overview tab) ─────────────────

  async getOverview(
    companyId: string,
    product: MasterProduct,
    sales: SalesRecord[],
    sizeVariantStock: number,
  ): Promise<BlackboxOverview> {
    const [variants, batches, journal, timeline] = await Promise.all([
      productBlackboxRepo.getVariants(companyId, product.id),
      productBlackboxRepo.getBatches(companyId, product.id),
      productBlackboxRepo.getJournalEntries(companyId, product.id),
      productBlackboxRepo.getTimeline(companyId, product.id),
    ]);

    const variantStock = variants.reduce((s, v) => s + v.stock, 0);
    const totalStock   = variantStock > 0 ? variantStock : sizeVariantStock;

    const productSales = sales.filter(s => s.productId === product.id && s.status !== 'Cancelled');
    const totalUnitsSold = productSales.reduce((s, r) => s + r.qtySold, 0);
    const totalRevenue   = productSales.reduce((s, r) => s + (r.qtySold * r.pricePerPcs - (r.discount ?? 0)), 0);

    const currentBatch  = batches[0] ?? null;
    const currentHPP    = currentBatch?.hpp ?? 0;
    const currentMargin = currentHPP > 0
      ? calculateMargin(currentHPP, product.sellingPrice).marginPercent
      : 0;

    const restockPrediction = predictRestock(totalStock, sales, product.id);

    return {
      product, variants, currentBatch,
      totalStock, totalUnitsSold, totalRevenue, currentMargin,
      daysUntilStockout: restockPrediction.daysUntilStockout,
      recentJournalEntries: journal.slice(0, 3),
      recentTimelineEvents: timeline.slice(0, 5),
    };
  },

  // ── Price update (3-in-1: pricing_history + timeline + returns for ERPContext) ──

  async updateProductPrice(
    companyId: string,
    product: MasterProduct,
    newPrice: number,
    newHpp: number | null,
    reason: string,
  ): Promise<{ newPrice: number; newHpp: number | null }> {
    const now = new Date().toISOString();

    await Promise.all([
      productBlackboxRepo.recordPriceChange(companyId, {
        productId: product.id, companyId,
        oldPrice: product.sellingPrice, newPrice,
        oldHpp: undefined, newHpp: newHpp ?? undefined,
        reason, changedAt: now,
      }),
      productBlackboxRepo.addTimelineEvent(companyId, {
        productId: product.id, companyId,
        eventType: 'price_change',
        title: `Harga diubah Rp${product.sellingPrice.toLocaleString('id')} → Rp${newPrice.toLocaleString('id')}`,
        description: reason || undefined,
        eventDate: now,
      }),
    ]);

    return { newPrice, newHpp };
  },

  // ── Add production batch (batch + timeline) ───────────────────────────────

  async addProductionBatch(
    companyId: string,
    productId: string,
    data: Omit<ProductBatch, 'id' | 'createdAt'>,
  ): Promise<ProductBatch | null> {
    const batch = await productBlackboxRepo.createBatch(companyId, data);
    if (!batch) return null;

    await productBlackboxRepo.addTimelineEvent(companyId, {
      productId, companyId,
      eventType: 'batch_added',
      title: `${data.batchNumber} — ${data.quantity} pcs @ Rp${data.hpp.toLocaleString('id')}`,
      metadata: { batchId: batch.id, qty: data.quantity, hpp: data.hpp },
      eventDate: data.productionDate,
    });

    return batch;
  },

  // ── Journal + timeline ────────────────────────────────────────────────────

  async createJournalWithTimeline(
    companyId: string,
    productId: string,
    data: Omit<ProductJournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ProductJournalEntry | null> {
    const entry = await productBlackboxRepo.createJournalEntry(companyId, data);
    if (!entry) return null;

    await productBlackboxRepo.addTimelineEvent(companyId, {
      productId, companyId,
      eventType: 'journal_entry',
      title: data.title,
      description: data.content.slice(0, 120),
      metadata: { journalId: entry.id, tags: data.tags },
      eventDate: entry.createdAt,
    });

    return entry;
  },

  // ── Status change + timeline ──────────────────────────────────────────────

  async changeStatus(
    companyId: string,
    productId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    await productBlackboxRepo.addTimelineEvent(companyId, {
      productId, companyId,
      eventType: 'status_change',
      title: `Status: ${oldStatus} → ${newStatus}`,
      eventDate: new Date().toISOString(),
    });
  },

  // ── Asset upload ──────────────────────────────────────────────────────────

  async uploadAsset(
    companyId: string,
    productId: string,
    file: File,
    assetType: AssetType,
  ): Promise<ProductAsset | null> {
    return productBlackboxRepo.uploadAsset(companyId, productId, file, assetType);
  },

  // ── Seed 'created' timeline event when first viewing a product ────────────

  async ensureCreatedEvent(companyId: string, product: MasterProduct): Promise<void> {
    const timeline = await productBlackboxRepo.getTimeline(companyId, product.id);
    const hasCreated = timeline.some(e => e.eventType === 'created');
    if (!hasCreated) {
      await productBlackboxRepo.addTimelineEvent(companyId, {
        productId: product.id, companyId,
        eventType: 'created',
        title:     'Produk dibuat',
        eventDate: product.id ? new Date().toISOString() : new Date().toISOString(),
      });
    }
  },
};
