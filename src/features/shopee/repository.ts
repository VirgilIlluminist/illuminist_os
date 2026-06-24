import { getRepo } from '../../core/repositories';
import type { ShopeeChannelConfig, ShopeeSettlement, ShopeeImportBatch } from './types';

export const shopeeChannelRepo  = () => getRepo<ShopeeChannelConfig>('shopee_channels');
export const shopeeSettlementRepo = () => getRepo<ShopeeSettlement>('shopee_settlements');
export const shopeeImportBatchRepo = () => getRepo<ShopeeImportBatch>('shopee_import_batches');
