/**
 * ShopeeService — orchestrasi CSV parse → fee compute → simpan settlement → push ke P&L.
 * Semua side-effects ke repository layer, UI cukup call methods di sini.
 */
import Papa from 'papaparse';
import { ShopeeFeeEngine } from './FeeEngine';
import { shopeeChannelRepo, shopeeSettlementRepo, shopeeImportBatchRepo } from './repository';
import type {
  ShopeeChannelConfig, ShopeeSettlement, ShopeeImportBatch,
  RawShopeeRow, ShopeeImportResult,
} from './types';

// ─── Column detection helpers ─────────────────────────────────────────────────

function detect(headers: string[], patterns: string[]): string | undefined {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const pat of patterns) {
    const idx = lower.findIndex(h => h.includes(pat));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v.replace(/[^0-9.-]/g, '')) || 0;
  return 0;
}

function parseDate(v: string): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const parts = v.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) return `${a}-${b.padStart(2,'0')}-${c.padStart(2,'0')}`;
    return `${c}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSV(csvText: string): { rows: RawShopeeRow[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header:           true,
    skipEmptyLines:   true,
    transformHeader:  h => h.trim(),
  });

  const headers = result.meta.fields ?? [];
  const errors: string[] = result.errors.map(e => `Row ${e.row}: ${e.message}`);

  const colOrderId     = detect(headers, ['order id','no. pesanan','nomor pesanan','order no']);
  const colDate        = detect(headers, ['tanggal','order date','order time','waktu','create time']);
  const colProduct     = detect(headers, ['nama produk','product name','item name','produk']);
  const colSku         = detect(headers, ['sku','variasi','variation','variant']);
  const colQty         = detect(headers, ['jumlah','qty','quantity','kuantitas']);
  const colUnitPrice   = detect(headers, ['harga per item','harga satuan','unit price','harga produk','price per item','harga barang']);
  const colGross       = detect(headers, ['total harga','subtotal','gross','harga kotor','total amount','order amount']);

  const rows: RawShopeeRow[] = [];

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i];
    const orderId = colOrderId ? row[colOrderId]?.trim() : '';
    if (!orderId) continue;

    const qty       = num(colQty        ? row[colQty]        : 1);
    const unitPrice = num(colUnitPrice  ? row[colUnitPrice]  : 0);
    let   gross     = num(colGross      ? row[colGross]       : 0);
    if (!gross && qty && unitPrice) gross = qty * unitPrice;

    rows.push({
      order_id:      orderId,
      order_date:    parseDate(colDate ? row[colDate]?.trim() ?? '' : ''),
      product_name:  colProduct ? row[colProduct]?.trim() ?? '' : '',
      sku:           colSku     ? row[colSku]?.trim()     ?? '' : '',
      qty,
      unit_price:    unitPrice,
      gross_revenue: gross,
    });
  }

  return { rows, errors };
}

// ─── ShopeeService ────────────────────────────────────────────────────────────

export const ShopeeService = {
  // ── Channel Config CRUD ──────────────────────────────────────────────────
  async listChannels(companyId: string): Promise<ShopeeChannelConfig[]> {
    const result = await shopeeChannelRepo().findAll(companyId, {
      orderBy: { column: 'created_at', direction: 'desc' },
    });
    return result.data;
  },

  async saveChannel(companyId: string, data: Partial<ShopeeChannelConfig>, id?: string): Promise<ShopeeChannelConfig | null> {
    const repo = shopeeChannelRepo();
    if (id) return repo.update(companyId, id, data);
    return repo.create(companyId, { ...data, is_active: true });
  },

  async deleteChannel(companyId: string, id: string): Promise<void> {
    await shopeeChannelRepo().remove(companyId, id);
  },

  // ── Import Batches ───────────────────────────────────────────────────────
  async listBatches(companyId: string): Promise<ShopeeImportBatch[]> {
    const result = await shopeeImportBatchRepo().findAll(companyId, {
      orderBy: { column: 'created_at', direction: 'desc' },
      limit: 50,
    });
    return result.data;
  },

  // ── Settlement Rows ──────────────────────────────────────────────────────
  async listSettlements(companyId: string, batchId: string): Promise<ShopeeSettlement[]> {
    const result = await shopeeSettlementRepo().findAll(companyId, {
      where: { batch_id: batchId },
      orderBy: { column: 'order_date', direction: 'desc' },
      limit: 500,
    });
    return result.data;
  },

  // ── CSV Import ───────────────────────────────────────────────────────────
  async importCSV(
    companyId: string,
    channelConfigId: string,
    filename: string,
    csvText: string,
  ): Promise<ShopeeImportResult> {
    const config = await shopeeChannelRepo().findById(companyId, channelConfigId);
    if (!config) throw new Error('Channel config tidak ditemukan');

    const { rows, errors } = parseCSV(csvText);
    if (rows.length === 0) {
      throw new Error('Tidak ada data yang bisa diparsing. Periksa format CSV.');
    }

    const batchId = `batch_${Date.now()}`;
    const now     = new Date().toISOString();

    let totalGross = 0, totalFees = 0, totalNet = 0;
    const settlements: ShopeeSettlement[] = [];

    for (const row of rows) {
      const fee = ShopeeFeeEngine.calculate(row.gross_revenue, config);
      totalGross += fee.gross;
      totalFees  += fee.total_fee;
      totalNet   += fee.net;

      const settlement = await shopeeSettlementRepo().create(companyId, {
        batch_id:          batchId,
        channel_config_id: channelConfigId,
        order_id:          row.order_id,
        order_date:        row.order_date,
        product_name:      row.product_name,
        sku:               row.sku,
        qty:               row.qty,
        unit_price:        row.unit_price,
        gross_revenue:     fee.gross,
        commission_fee:    fee.commission,
        admin_fee:         fee.admin_fee,
        transaction_fee:   fee.transaction_fee,
        ppn:               fee.ppn,
        total_fee:         fee.total_fee,
        net_earnings:      fee.net,
        status:            'pending',
      });
      if (settlement) settlements.push(settlement);
    }

    const batch = await shopeeImportBatchRepo().create(companyId, {
      id:                batchId,
      filename,
      channel_config_id: channelConfigId,
      row_count:         rows.length,
      total_gross:       totalGross,
      total_fees:        totalFees,
      total_net:         totalNet,
      imported_at:       now,
      status:            'draft',
    });

    return {
      batch:       batch!,
      settlements,
      errors,
    };
  },

  // ── Sync to P&L ─────────────────────────────────────────────────────────
  async syncToSales(
    companyId: string,
    batchId: string,
    addSale: (sale: {
      date: string; productId: string; variantSku: string; customerName: string;
      channel: string; qtySold: number; pricePerPcs: number;
      platformFee: number; shippingFee: number; discount: number; status: 'Completed';
    }) => void,
  ): Promise<number> {
    const settlements = await ShopeeService.listSettlements(companyId, batchId);
    const pending = settlements.filter(s => s.status === 'pending');

    for (const s of pending) {
      addSale({
        date:         s.order_date,
        productId:    '',
        variantSku:   s.sku || '',
        customerName: `Shopee #${s.order_id}`,
        channel:      'Shopee',
        qtySold:      s.qty,
        pricePerPcs:  s.unit_price,
        platformFee:  s.total_fee,
        shippingFee:  0,
        discount:     0,
        status:       'Completed',
      });
      await shopeeSettlementRepo().update(companyId, s.id, { status: 'synced' });
    }

    await shopeeImportBatchRepo().update(companyId, batchId, { status: 'synced_to_pl' });
    return pending.length;
  },
};
