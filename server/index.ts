/**
 * server/index.ts — ILLUMINIST OS v12 Backend
 *
 * V12 Architecture:
 * - Structured API routes (replaces monolithic server.ts)
 * - Multi-provider AI Gateway
 * - Tool Registry (AI accesses data through tools only)
 * - Memory Manager (short + long-term AI memory)
 * - Rate limiting + Audit trail
 * - Full V11 backward compatibility preserved
 *
 * V11 compatibility:
 * - All existing /api/* endpoints preserved
 * - Vite dev proxy still works
 * - localStorage data still accessible from frontend
 */
import express       from 'express';
import path          from 'path';
import { createServer as createViteServer } from 'vite';
import { ENV }       from './config/env';
import { logger }    from './utils/logger';
import routes        from './routes/index';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter }from './middleware/rateLimit';
import { auditMiddleware } from './middleware/audit';
import { optionalAuth }    from './middleware/auth';

async function startServer() {
  const app = express();

  // ── Core middleware ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS for development
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin',  '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    next();
  });

  // Auth (optional — sets req.user if token present, uses dev defaults otherwise)
  app.use(optionalAuth);

  // Global rate limiting for API routes
  app.use('/api', apiLimiter);

  // Audit middleware
  app.use('/api', auditMiddleware);

  // ── V12 Routes ───────────────────────────────────────────────────────────
  app.use(routes);

  // ── V11 Backward Compatibility Routes ─────────────────────────────────────
  // These preserve the exact endpoints from the original server.ts
  // so existing frontend code continues to work without changes.

  // V11: POST /api/gemini-chat → now routes through AI Gateway
  app.post('/api/gemini-chat', async (req, res) => {
    try {
      const { message, conversationHistory, erpDataContext } = req.body;
      const { aiGateway }    = await import('./services/ai/AIGateway');
      const { providerManager } = await import('./services/ai/ProviderManager');

      // Route to Gemini specifically for V11 compatibility
      const result = await aiGateway.chat({
        message:           message || '',
        sessionId:         `v11-session-${Date.now()}`,
        userId:            'v11-user',
        companyId:         'v11-company',
        aiLevel:           5,
        erpState:          erpDataContext,
        preferredProvider: 'gemini',
      });

      // V11 response format preserved
      res.json({ response: result.text, isOffline: result.isOffline });
    } catch {
      res.json({ response: 'AI temporarily unavailable. Your business system continues to function normally.', isOffline: true });
    }
  });

  // V11: POST /api/analyze-business → now routes through AI Gateway
  app.post('/api/analyze-business', async (req, res) => {
    try {
      const { prompt, erpDataContext } = req.body;
      const { aiGateway } = await import('./services/ai/AIGateway');

      const result = await aiGateway.chat({
        message:   prompt || 'Analyze business performance',
        sessionId: `analysis-${Date.now()}`,
        userId:    'analyst',
        companyId: 'default',
        aiLevel:   3,
        erpState:  erpDataContext,
      });

      res.json({ analysis: result.text, isOffline: result.isOffline });
    } catch {
      res.json({ analysis: 'Analysis unavailable.', isOffline: true });
    }
  });

  // ── Static / Vite Dev Server ─────────────────────────────────────────────
  if (ENV.IS_PROD) {
    // Production: serve built frontend
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    logger.info('Server', `Serving static from ${distPath}`);
  } else {
    // Development: Vite dev server with HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    logger.info('Server', 'Vite dev server middleware active');
  }

  // ── Error Handlers ──────────────────────────────────────────────────────
  app.use('*', notFoundHandler);
  app.use(errorHandler);

  // ── Start ────────────────────────────────────────────────────────────────
  app.listen(ENV.PORT, () => {
    logger.info('Server', `ILLUMINIST OS v${ENV.APP_VERSION} running on http://localhost:${ENV.PORT}`);
    logger.info('Server', `Environment: ${ENV.NODE_ENV}`);
    logger.info('Server', `AI endpoints: http://localhost:${ENV.PORT}/api/ai/chat`);
    logger.info('Server', `Health check: http://localhost:${ENV.PORT}/health`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Server', 'Unhandled promise rejection', reason);
  });

  process.on('uncaughtException', (err) => {
    logger.error('Server', 'Uncaught exception', err);
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
