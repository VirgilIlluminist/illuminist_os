/**
 * routes/ai/chat.ts — AI Chat & Provider Management endpoints
 */
import { Router, Request, Response } from 'express';
import { aiGateway }       from '../../services/ai/AIGateway';
import { providerManager } from '../../services/ai/ProviderManager';
import { memoryManager }   from '../../services/ai/MemoryManager';
import { aiLimiter }       from '../../middleware/rateLimit';
import { optionalAuth }    from '../../middleware/auth';
import { ok, badRequest, serverError } from '../../utils/response';
import { logger }          from '../../utils/logger';

const router = Router();
router.use(optionalAuth);

// POST /api/ai/chat — main chat endpoint
router.post('/chat', aiLimiter, async (req: Request, res: Response) => {
  try {
    const {
      message, sessionId, erpState,
      preferredProvider, preferredModel,
    } = req.body as Record<string, unknown>;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return badRequest(res, 'message field is required');
    }

    const sid = (sessionId as string) || `session-${req.user?.userId}-${Date.now()}`;

    const result = await aiGateway.chat({
      message:           message.trim(),
      sessionId:         sid,
      userId:            req.user?.userId    || 'anonymous',
      companyId:         req.user?.companyId || 'default',
      aiLevel:           req.user?.aiLevel   || 2,
      erpState:          erpState as any,
      preferredProvider: preferredProvider as string,
      preferredModel:    preferredModel as string,
    });

    return ok(res, result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI request failed';
    logger.error('AI/chat', msg);
    return serverError(res, msg);
  }
});

// GET /api/ai/providers — list providers and status
router.get('/providers', (_req, res) => {
  return ok(res, {
    providers:       providerManager.getStatus(),
    activeProvider:  providerManager.getStatus().find(p => p.available as boolean),
    usage:           providerManager.getUsage(),
  });
});

// POST /api/ai/providers/:name/test — test a provider
router.post('/providers/:name/test', async (req, res) => {
  const result = await providerManager.testProvider(req.params.name);
  return ok(res, result);
});

// POST /api/ai/providers/active — set active provider
router.post('/providers/active', (req, res) => {
  const { provider } = req.body as { provider: string };
  if (!provider) return badRequest(res, 'provider field required');
  try {
    providerManager.setActiveProvider(provider);
    return ok(res, { activeProvider: provider }, 'Provider updated');
  } catch (err: unknown) {
    return badRequest(res, err instanceof Error ? err.message : 'Failed');
  }
});

// GET /api/ai/memory/stats — memory stats
router.get('/memory/stats', (_req, res) => {
  return ok(res, memoryManager.getStats());
});

// DELETE /api/ai/memory/:sessionId — clear session
router.delete('/memory/:sessionId', (req, res) => {
  memoryManager.clearSession(req.params.sessionId);
  return ok(res, null, 'Session cleared');
});

// POST /api/ai/memory/rules — add long-term business rule
router.post('/memory/rules', (req, res) => {
  const { rule, companyId } = req.body as { rule: string; companyId: string };
  if (!rule) return badRequest(res, 'rule field required');
  memoryManager.addBusinessRule(
    companyId || req.user?.companyId || 'default',
    rule
  );
  return ok(res, null, 'Business rule saved');
});

// GET /api/ai/stats — gateway statistics
router.get('/stats', (_req, res) => {
  return ok(res, aiGateway.getStats());
});

// GET /api/ai/logs — conversation log
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  return ok(res, aiGateway.getConversationLog(limit));
});

export default router;
