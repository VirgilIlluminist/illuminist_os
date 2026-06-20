/**
 * routes/api/health.ts — Health check and system status
 */
import { Router } from 'express';
import { providerManager } from '../../services/ai/ProviderManager';
import { ENV }             from '../../config/env';
import { ok }              from '../../utils/response';

const router = Router();

router.get('/', (_req, res) => {
  const providers = providerManager.getStatus();
  const aiStatus  = providers.some(p => p.available) ? 'online' : 'offline';

  return ok(res, {
    status:    'ok',
    name:      ENV.APP_NAME,
    version:   ENV.APP_VERSION,
    env:       ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
    ai: {
      status:         aiStatus,
      activeProviders:providers.filter(p => p.available).map(p => p.name),
    },
    modules: [
      'materials', 'products', 'sales', 'finance',
      'production', 'suppliers', 'customers', 'analytics',
    ],
  });
});

export default router;
