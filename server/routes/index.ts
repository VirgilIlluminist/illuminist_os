/**
 * routes/index.ts — Central route aggregator
 * Semua route terdaftar di sini. server/index.ts cukup import file ini.
 *
 * Pattern: routes → controllers → services → repositories → database
 */
import { Router }            from 'express';
import { auditMiddleware }   from '../middleware/audit';
import { apiLimiter }        from '../middleware/rateLimit';
import { optionalAuth }      from '../middleware/auth';
import { ENV }               from '../config/env';

// API routes
import healthRouter    from './api/health';
import auditRouter     from './api/audit';
import materialsRouter from './api/materials';
import productsRouter  from './api/products';
import salesRouter     from './api/sales';
import suppliersRouter from './api/suppliers';
import customersRouter from './api/customers';
import financeRouter   from './api/finance';

// AI routes
import aiRouter        from './ai/chat';

const router = Router();

// ── Health (public) ─────────────────────────────────────────────────
router.use('/health', healthRouter);

// ── Global middleware untuk semua /api/* ─────────────────────────────
router.use('/api', apiLimiter);
router.use('/api', optionalAuth);
router.use('/api', auditMiddleware);

// ── AI Gateway ───────────────────────────────────────────────────────
router.use('/api/ai', aiRouter);

// ── Business API ─────────────────────────────────────────────────────
// Manual-first: bekerja tanpa Supabase (return empty, frontend pakai localStorage)
// Otomatis pakai Supabase kalau VITE_SUPABASE_URL dikonfigurasi
router.use('/api/materials',  materialsRouter);
router.use('/api/products',   productsRouter);
router.use('/api/sales',      salesRouter);
router.use('/api/suppliers',  suppliersRouter);
router.use('/api/customers',  customersRouter);
router.use('/api/finance',    financeRouter);

// ── System ───────────────────────────────────────────────────────────
router.use('/api/audit',      auditRouter);

// ── Status endpoint ──────────────────────────────────────────────────
router.get('/api/status', (_req, res) => {
  res.json({
    app:     ENV.APP_NAME,
    version: ENV.APP_VERSION,
    db:      ENV.IS_DB_ENABLED ? 'supabase' : 'localStorage',
    modules: ['materials','products','sales','suppliers','customers','finance','ai'],
  });
});

export default router;
