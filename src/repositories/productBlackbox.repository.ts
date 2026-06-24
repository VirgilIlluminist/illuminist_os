import { getRepo } from '../core/repositories';
import type { BaseRecord } from '../core/repositories';
import { supabase, isSupabaseEnabled } from '../infra/supabase/client';
import type {
  ProductVariantBB, ProductBatch, ProductAsset,
  ProductJournalEntry, PricingHistoryEntry, ProductTimelineEvent,
  ProductDescription, AssetType,
} from '../types/product-blackbox.types';

// ─── BaseRecord wrappers (snake_case ↔ camelCase) ─────────────────────────────

interface VariantRow extends BaseRecord {
  product_id: string;
  name: string;
  sku_suffix?: string;
  stock: number;
  hpp?: number;
  selling_price?: number;
  weight_gram?: number;
  is_active: boolean;
}

interface BatchRow extends BaseRecord {
  product_id: string;
  batch_number: string;
  quantity: number;
  hpp: number;
  selling_price: number;
  production_date: string;
  notes?: string;
  status: string;
}

interface AssetRow extends BaseRecord {
  product_id: string;
  url: string;
  storage_path: string;
  asset_type: string;
  label?: string;
  sort_order: number;
  size_bytes?: number;
}

interface JournalRow extends BaseRecord {
  product_id: string;
  title: string;
  content: string;
  image_urls: string[];
  tags: string[];
  created_by?: string;
}

interface PricingRow extends BaseRecord {
  product_id: string;
  old_price?: number;
  new_price: number;
  old_hpp?: number;
  new_hpp?: number;
  reason?: string;
  changed_at: string;
}

interface TimelineRow extends BaseRecord {
  product_id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  event_date: string;
}

interface DescriptionRow extends BaseRecord {
  product_id: string;
  short_description?: string;
  long_description?: string;
  specifications?: string;
  product_story?: string;
  care_instructions?: string;
  shopee_description?: string;
  tokopedia_description?: string;
  instagram_caption?: string;
  website_description?: string;
}

interface TagRow extends BaseRecord {
  product_id: string;
  tag: string;
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

function mapVariant(r: VariantRow): ProductVariantBB {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    name: r.name, skuSuffix: r.sku_suffix,
    stock: r.stock, hpp: r.hpp, sellingPrice: r.selling_price,
    weightGram: r.weight_gram, isActive: r.is_active,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapBatch(r: BatchRow): ProductBatch {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    batchNumber: r.batch_number, quantity: r.quantity,
    hpp: r.hpp, sellingPrice: r.selling_price,
    productionDate: r.production_date, notes: r.notes,
    status: r.status as ProductBatch['status'],
    createdAt: r.created_at,
  };
}

function mapAsset(r: AssetRow): ProductAsset {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    url: r.url, storagePath: r.storage_path,
    assetType: r.asset_type as AssetType,
    label: r.label, sortOrder: r.sort_order,
    sizeBytes: r.size_bytes, createdAt: r.created_at,
  };
}

function mapJournal(r: JournalRow): ProductJournalEntry {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    title: r.title, content: r.content,
    imageUrls: r.image_urls ?? [],
    tags: r.tags ?? [],
    createdBy: r.created_by,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapPricing(r: PricingRow): PricingHistoryEntry {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    oldPrice: r.old_price, newPrice: r.new_price,
    oldHpp: r.old_hpp, newHpp: r.new_hpp,
    reason: r.reason, changedAt: r.changed_at ?? r.created_at,
  };
}

function mapTimeline(r: TimelineRow): ProductTimelineEvent {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    eventType: r.event_type as ProductTimelineEvent['eventType'],
    title: r.title, description: r.description,
    metadata: r.metadata, eventDate: r.event_date,
    createdAt: r.created_at,
  };
}

function mapDescription(r: DescriptionRow): ProductDescription {
  return {
    id: r.id, productId: r.product_id, companyId: r.company_id,
    shortDescription: r.short_description,
    longDescription: r.long_description,
    specifications: r.specifications,
    productStory: r.product_story,
    careInstructions: r.care_instructions,
    shopeeDescription: r.shopee_description,
    tokopediaDescription: r.tokopedia_description,
    instagramCaption: r.instagram_caption,
    websiteDescription: r.website_description,
    updatedAt: r.updated_at,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const productBlackboxRepo = {
  // ── Variants ──────────────────────────────────────────────────────────────

  async getVariants(companyId: string, productId: string): Promise<ProductVariantBB[]> {
    const repo = getRepo<VariantRow>('product_variants');
    const { data } = await repo.findAll(companyId, { where: { product_id: productId } });
    return data.filter(r => !r.deleted_at).map(mapVariant);
  },

  async createVariant(companyId: string, data: Omit<ProductVariantBB, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariantBB | null> {
    const repo = getRepo<VariantRow>('product_variants');
    const row: Partial<VariantRow> = {
      product_id: data.productId, name: data.name,
      sku_suffix: data.skuSuffix, stock: data.stock,
      hpp: data.hpp, selling_price: data.sellingPrice,
      weight_gram: data.weightGram, is_active: data.isActive,
    };
    const r = await repo.create(companyId, row);
    return r ? mapVariant(r) : null;
  },

  async updateVariant(companyId: string, id: string, data: Partial<ProductVariantBB>): Promise<ProductVariantBB | null> {
    const repo = getRepo<VariantRow>('product_variants');
    const row: Partial<VariantRow> = {
      ...(data.name        !== undefined && { name:         data.name }),
      ...(data.stock       !== undefined && { stock:        data.stock }),
      ...(data.hpp         !== undefined && { hpp:          data.hpp }),
      ...(data.sellingPrice!== undefined && { selling_price:data.sellingPrice }),
      ...(data.isActive    !== undefined && { is_active:    data.isActive }),
    };
    const r = await repo.update(companyId, id, row);
    return r ? mapVariant(r) : null;
  },

  async deleteVariant(companyId: string, id: string): Promise<boolean> {
    return getRepo<VariantRow>('product_variants').remove(companyId, id);
  },

  // ── Batches (immutable) ───────────────────────────────────────────────────

  async getBatches(companyId: string, productId: string): Promise<ProductBatch[]> {
    const repo = getRepo<BatchRow>('product_batches');
    const { data } = await repo.findAll(companyId, {
      where: { product_id: productId },
      orderBy: { column: 'created_at', direction: 'desc' },
    });
    return data.map(mapBatch);
  },

  async createBatch(companyId: string, data: Omit<ProductBatch, 'id' | 'createdAt'>): Promise<ProductBatch | null> {
    const repo = getRepo<BatchRow>('product_batches');
    const row: Partial<BatchRow> = {
      product_id: data.productId, batch_number: data.batchNumber,
      quantity: data.quantity, hpp: data.hpp,
      selling_price: data.sellingPrice, production_date: data.productionDate,
      notes: data.notes, status: data.status,
    };
    const r = await repo.create(companyId, row);
    return r ? mapBatch(r) : null;
  },

  // ── Assets ────────────────────────────────────────────────────────────────

  async getAssets(companyId: string, productId: string): Promise<ProductAsset[]> {
    const repo = getRepo<AssetRow>('product_assets');
    const { data } = await repo.findAll(companyId, {
      where: { product_id: productId },
      orderBy: { column: 'sort_order', direction: 'asc' },
    });
    return data.filter(r => !r.deleted_at).map(mapAsset);
  },

  async uploadAsset(
    companyId: string,
    productId: string,
    file: File,
    assetType: AssetType,
  ): Promise<ProductAsset | null> {
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `product-assets/${companyId}/${productId}/${assetType}/${Date.now()}.${ext}`;

    let url = '';
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.storage.from('product-assets').upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabase.storage.from('product-assets').getPublicUrl(path);
      url = urlData.publicUrl;
    } else {
      // Fallback: base64 data URL for localStorage mode
      url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const repo = getRepo<AssetRow>('product_assets');
    const existing = await this.getAssets(companyId, productId);
    const row: Partial<AssetRow> = {
      product_id: productId, url, storage_path: path,
      asset_type: assetType, sort_order: existing.length,
      size_bytes: file.size,
    };
    const r = await repo.create(companyId, row);
    return r ? mapAsset(r) : null;
  },

  async deleteAsset(companyId: string, assetId: string): Promise<boolean> {
    const repo   = getRepo<AssetRow>('product_assets');
    const asset  = await repo.findById(companyId, assetId);
    if (!asset) return false;
    if (isSupabaseEnabled && supabase) {
      await supabase.storage.from('product-assets').remove([asset.storage_path]);
    }
    return repo.remove(companyId, assetId);
  },

  async reorderAssets(companyId: string, orderedIds: string[]): Promise<void> {
    const repo = getRepo<AssetRow>('product_assets');
    await Promise.all(orderedIds.map((id, i) => repo.update(companyId, id, { sort_order: i } as Partial<AssetRow>)));
  },

  // ── Journal (no delete) ───────────────────────────────────────────────────

  async getJournalEntries(companyId: string, productId: string): Promise<ProductJournalEntry[]> {
    const repo = getRepo<JournalRow>('product_journals');
    const { data } = await repo.findAll(companyId, {
      where: { product_id: productId },
      orderBy: { column: 'created_at', direction: 'desc' },
    });
    return data.filter(r => !r.deleted_at).map(mapJournal);
  },

  async createJournalEntry(companyId: string, data: Omit<ProductJournalEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductJournalEntry | null> {
    const repo = getRepo<JournalRow>('product_journals');
    const row: Partial<JournalRow> = {
      product_id: data.productId, title: data.title, content: data.content,
      image_urls: data.imageUrls, tags: data.tags, created_by: data.createdBy,
    };
    const r = await repo.create(companyId, row);
    return r ? mapJournal(r) : null;
  },

  async updateJournalEntry(companyId: string, id: string, data: Partial<ProductJournalEntry>): Promise<ProductJournalEntry | null> {
    const repo = getRepo<JournalRow>('product_journals');
    const row: Partial<JournalRow> = {
      ...(data.title     !== undefined && { title:      data.title }),
      ...(data.content   !== undefined && { content:    data.content }),
      ...(data.imageUrls !== undefined && { image_urls: data.imageUrls }),
      ...(data.tags      !== undefined && { tags:       data.tags }),
    };
    const r = await repo.update(companyId, id, row);
    return r ? mapJournal(r) : null;
  },

  // ── Pricing History (no delete) ───────────────────────────────────────────

  async getPricingHistory(companyId: string, productId: string): Promise<PricingHistoryEntry[]> {
    const repo = getRepo<PricingRow>('product_pricing_history');
    const { data } = await repo.findAll(companyId, {
      where: { product_id: productId },
      orderBy: { column: 'changed_at', direction: 'desc' },
    });
    return data.map(mapPricing);
  },

  async recordPriceChange(companyId: string, data: Omit<PricingHistoryEntry, 'id'>): Promise<PricingHistoryEntry | null> {
    const repo = getRepo<PricingRow>('product_pricing_history');
    const row: Partial<PricingRow> = {
      product_id: data.productId, old_price: data.oldPrice,
      new_price: data.newPrice, old_hpp: data.oldHpp, new_hpp: data.newHpp,
      reason: data.reason, changed_at: data.changedAt,
    };
    const r = await repo.create(companyId, row);
    return r ? mapPricing(r) : null;
  },

  // ── Timeline (no delete) ──────────────────────────────────────────────────

  async getTimeline(companyId: string, productId: string): Promise<ProductTimelineEvent[]> {
    const repo = getRepo<TimelineRow>('product_timeline_events');
    const { data } = await repo.findAll(companyId, {
      where: { product_id: productId },
      orderBy: { column: 'event_date', direction: 'desc' },
      limit: 100,
    });
    return data.map(mapTimeline);
  },

  async addTimelineEvent(companyId: string, data: Omit<ProductTimelineEvent, 'id' | 'createdAt'>): Promise<ProductTimelineEvent | null> {
    const repo = getRepo<TimelineRow>('product_timeline_events');
    const row: Partial<TimelineRow> = {
      product_id: data.productId, event_type: data.eventType,
      title: data.title, description: data.description,
      metadata: data.metadata, event_date: data.eventDate,
    };
    const r = await repo.create(companyId, row);
    return r ? mapTimeline(r) : null;
  },

  // ── Description ───────────────────────────────────────────────────────────

  async getDescription(companyId: string, productId: string): Promise<ProductDescription | null> {
    const repo = getRepo<DescriptionRow>('product_descriptions');
    const { data } = await repo.findAll(companyId, { where: { product_id: productId }, limit: 1 });
    return data[0] ? mapDescription(data[0]) : null;
  },

  async upsertDescription(companyId: string, productId: string, update: Partial<ProductDescription>): Promise<ProductDescription | null> {
    const repo    = getRepo<DescriptionRow>('product_descriptions');
    const existing = await this.getDescription(companyId, productId);
    const row: Partial<DescriptionRow> = {
      product_id:            productId,
      short_description:     update.shortDescription,
      long_description:      update.longDescription,
      specifications:        update.specifications,
      product_story:         update.productStory,
      care_instructions:     update.careInstructions,
      shopee_description:    update.shopeeDescription,
      tokopedia_description: update.tokopediaDescription,
      instagram_caption:     update.instagramCaption,
      website_description:   update.websiteDescription,
    };
    const r = existing
      ? await repo.update(companyId, existing.id, row)
      : await repo.create(companyId, row);
    return r ? mapDescription(r) : null;
  },

  // ── Tags ──────────────────────────────────────────────────────────────────

  async getTags(companyId: string, productId: string): Promise<string[]> {
    const repo = getRepo<TagRow>('product_tags');
    const { data } = await repo.findAll(companyId, { where: { product_id: productId } });
    return data.filter(r => !r.deleted_at).map(r => r.tag);
  },

  async updateTags(companyId: string, productId: string, tags: string[]): Promise<void> {
    const repo = getRepo<TagRow>('product_tags');
    const existing = await repo.findAll(companyId, { where: { product_id: productId } });
    await Promise.all(existing.data.map(r => repo.remove(companyId, r.id)));
    await Promise.all(tags.map(tag => repo.create(companyId, { product_id: productId, tag } as Partial<TagRow>)));
  },
};
