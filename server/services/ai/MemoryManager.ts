/**
 * MemoryManager.ts — AI Memory System
 * Short-term: conversation history per session
 * Long-term: company preferences, business rules
 */
import { ChatMessage } from './providers/BaseProvider';

interface ConversationSession {
  sessionId:   string;
  userId:      string;
  companyId:   string;
  messages:    ChatMessage[];
  createdAt:   string;
  updatedAt:   string;
  metadata?:   Record<string, unknown>;
}

interface LongTermMemory {
  companyId:         string;
  businessRules:     string[];
  preferences:       Record<string, unknown>;
  goals:             string[];
  customInstructions:string;
  lastUpdated:       string;
}

class MemoryManager {
  // Short-term: conversation sessions (in-memory, V12: move to Redis/DB)
  private sessions: Map<string, ConversationSession> = new Map();
  // Long-term: company memory (in-memory, V12: move to DB)
  private longTerm: Map<string, LongTermMemory>      = new Map();
  private readonly MAX_HISTORY = 20;
  private readonly SESSION_TTL = 3600000; // 1 hour

  // ─── Short-term (session) ──────────────────────────────────────────────
  createSession(sessionId: string, userId: string, companyId: string): ConversationSession {
    const session: ConversationSession = {
      sessionId, userId, companyId,
      messages:  [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ConversationSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    // Check TTL
    const age = Date.now() - new Date(session.updatedAt).getTime();
    if (age > this.SESSION_TTL) {
      this.sessions.delete(sessionId);
      return undefined;
    }
    return session;
  }

  addMessage(sessionId: string, message: ChatMessage) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId, 'unknown', 'unknown');
    }
    session.messages.push(message);
    // Trim to max history
    if (session.messages.length > this.MAX_HISTORY) {
      session.messages = session.messages.slice(-this.MAX_HISTORY);
    }
    session.updatedAt = new Date().toISOString();
  }

  getHistory(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId)?.messages || [];
  }

  clearSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  // ─── Long-term (company) ───────────────────────────────────────────────
  setLongTermMemory(companyId: string, memory: Partial<LongTermMemory>) {
    const existing = this.longTerm.get(companyId) || {
      companyId,
      businessRules:      [],
      preferences:        {},
      goals:              [],
      customInstructions: '',
      lastUpdated:        new Date().toISOString(),
    };
    this.longTerm.set(companyId, {
      ...existing,
      ...memory,
      companyId,
      lastUpdated: new Date().toISOString(),
    });
  }

  getLongTermMemory(companyId: string): LongTermMemory | undefined {
    return this.longTerm.get(companyId);
  }

  addBusinessRule(companyId: string, rule: string) {
    const mem = this.getLongTermMemory(companyId) || {
      companyId, businessRules: [], preferences: {}, goals: [],
      customInstructions: '', lastUpdated: new Date().toISOString(),
    };
    if (!mem.businessRules.includes(rule)) {
      mem.businessRules.push(rule);
      this.setLongTermMemory(companyId, mem);
    }
  }

  // Format long-term memory for system prompt injection
  formatForPrompt(companyId: string): string {
    const mem = this.longTerm.get(companyId);
    if (!mem) return '';
    const parts: string[] = [];
    if (mem.customInstructions) parts.push(`Custom instructions: ${mem.customInstructions}`);
    if (mem.businessRules.length) parts.push(`Business rules:\n${mem.businessRules.map(r => `- ${r}`).join('\n')}`);
    if (mem.goals.length) parts.push(`Company goals:\n${mem.goals.map(g => `- ${g}`).join('\n')}`);
    return parts.join('\n\n');
  }

  getStats() {
    return {
      activeSessions: this.sessions.size,
      companies:      this.longTerm.size,
    };
  }
}

export const memoryManager = new MemoryManager();
