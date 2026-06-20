import { useState, useCallback, useRef } from 'react';
import aiService from '../../infra/api/ai.service';

export interface AIMessage {
  role:      'user' | 'assistant' | 'system';
  content:   string;
  timestamp?: string;
}

export interface UseAIOptions {
  sessionId?: string;
  erpState?:  Record<string, unknown>;
}

export function useAI(options: UseAIOptions = {}) {
  const [messages,  setMessages]  = useState<AIMessage[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const sessionRef = useRef(options.sessionId || `session-${Date.now()}`);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: AIMessage = { role:'user', content: content.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);
    try {
      const response = await aiService.chat({
        message: content, sessionId: sessionRef.current, erpState: options.erpState,
      });
      setMessages(prev => [...prev, {
        role: 'assistant', content: response.text,
        timestamp: new Date().toISOString(),
      }]);
      setIsOffline(Boolean(response.isOffline));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mendapat respons AI';
      setError(msg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Maaf, terjadi kesalahan: ${msg}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally { setLoading(false); }
  }, [loading, options]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    aiService.clearSession(sessionRef.current).catch(() => {});
    sessionRef.current = `session-${Date.now()}`;
  }, []);

  return {
    messages, loading, error, isOffline,
    sessionId: sessionRef.current,
    sendMessage, clearHistory,
    messageCount: messages.filter(m => m.role !== 'system').length,
  };
}
