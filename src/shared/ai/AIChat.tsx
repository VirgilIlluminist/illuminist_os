/**
 * AIChat.tsx — Full-featured AI Chat interface
 * Supports markdown rendering, message history, offline mode.
 * Manual-first: shows clear status when AI is offline.
 */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Trash2, Bot, User, Zap, WifiOff, Loader } from 'lucide-react';
import { useAI } from '../../core/hooks/useAI';
import { useERP } from '../../app/store/ERPContext';

interface AIChatProps {
  className?:    string;
  initialPrompt?:string;
  compact?:      boolean;
}

// Simple markdown → HTML dengan XSS protection
// Hanya izinkan tag yang aman, strip semua script/event handlers
function sanitize(html: string): string {
  return html
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function renderMarkdown(text: string): string {
  const safe = sanitize(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g,   '<strong>$1</strong>')
    .replace(/`([^`]+)`/g,       '<code style="background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;font-size:11px;font-family:var(--font-mono)">$1</code>')
    .replace(/^### (.+)$/gm,     '<h3 style="font-weight:600;font-size:12px;margin:10px 0 4px;color:var(--color-accent-highlight)">$1</h3>')
    .replace(/^## (.+)$/gm,      '<h2 style="font-weight:600;font-size:14px;margin:12px 0 6px;color:var(--color-text-main)">$1</h2>')
    .replace(/^- (.+)$/gm,       '<li style="margin-left:16px;list-style-type:disc">$1</li>')
    .replace(/\n/g,              '<br/>');
}

const QUICK_PROMPTS = [
  'Analisa stok bahan baku yang kritis',
  'Produk mana yang margin terbaik?',
  'Ringkasan performa penjualan bulan ini',
  'Supplier mana yang perlu dievaluasi?',
  'Iklan mana yang ROAS tertinggi?',
];

export default function AIChat({ className = '', initialPrompt, compact = false }: AIChatProps) {
  const { computedMaterials, computedProducts, computedSales,
          computedAds, suppliers, config, t } = useERP();
  const [input, setInput] = useState('');
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const accentHex  = config?.customAccentColor || '#d4af37';

  // Build ERP state snapshot for AI context
  const erpState = {
    materials:  computedMaterials,
    products:   computedProducts,
    sales:      computedSales,
    adsCampaigns: computedAds,
    suppliers,
  };

  const { messages, loading, error, isOffline, sendMessage, clearHistory } = useAI({ erpState });

  useEffect(() => {
    if (initialPrompt) sendMessage(initialPrompt);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const chatMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className={`flex flex-col bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl overflow-hidden ${compact ? 'h-[420px]' : 'h-full min-h-[500px]'} ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-line)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ background: accentHex + '20' }}>
            <Bot size={15} style={{ color: accentHex }} />
          </div>
          <div>
            <span className="text-xs font-display font-semibold text-[var(--color-text-main)] uppercase tracking-wider">
              {t('AI Assistant')}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {isOffline
                ? <><WifiOff size={9} className="text-yellow-500" /><span className="text-[9px] font-mono text-yellow-500">OFFLINE MODE</span></>
                : <><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[9px] font-mono text-emerald-400">ONLINE</span></>
              }
            </div>
          </div>
        </div>
        {chatMessages.length > 0 && (
          <button onClick={clearHistory} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400 transition-colors cursor-pointer" title="Hapus riwayat">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-4 rounded-2xl" style={{ background: accentHex + '10' }}>
              <Zap size={28} style={{ color: accentHex }} />
            </div>
            <div>
              <p className="text-sm font-display font-medium text-[var(--color-text-main)]">
                NEVAEH AI Siap
              </p>
              <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
                Tanya apapun tentang bisnis Anda
              </p>
            </div>
            {/* Quick prompts */}
            <div className="w-full space-y-1.5">
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2 border border-[var(--color-border-line)] rounded-lg hover:bg-white/[0.03] text-[var(--color-text-muted)] transition-colors cursor-pointer">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`p-1.5 rounded-lg shrink-0 h-fit mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-white/[0.06]'
                  : ''
              }`}
                style={msg.role === 'assistant' ? { background: accentHex + '20' } : {}}>
                {msg.role === 'user'
                  ? <User size={13} className="text-[var(--color-text-muted)]" />
                  : <Bot  size={13} style={{ color: accentHex }} />
                }
              </div>
              {/* Bubble */}
              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-white/[0.05] text-[var(--color-text-main)] ml-auto'
                  : 'bg-[var(--color-background)] border border-[var(--color-border-line)] text-[var(--color-text-main)]'
              }`}>
                {msg.role === 'assistant'
                  ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} className="prose-sm" />
                  : <span>{msg.content}</span>
                }
                {msg.timestamp && (
                  <p className="text-[9px] text-[var(--color-text-muted)] font-mono mt-1.5 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="p-1.5 rounded-lg h-fit" style={{ background: accentHex + '20' }}>
              <Bot size={13} style={{ color: accentHex }} />
            </div>
            <div className="bg-[var(--color-background)] border border-[var(--color-border-line)] px-4 py-3 rounded-xl flex items-center gap-2">
              <Loader size={12} className="animate-spin text-[var(--color-text-muted)]" />
              <span className="text-xs text-[var(--color-text-muted)] font-mono">Menganalisis data bisnis...</span>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--color-border-line)] shrink-0">
        {error && (
          <p className="text-[10px] text-red-400 font-mono mb-2 px-1">{error}</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanya tentang inventori, penjualan, keuangan..."
            rows={1}
            className="flex-1 resize-none text-xs font-sans px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none transition-all max-h-28"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ background: accentHex, color: '#000' }}
          >
            <Send size={15} />
          </button>
        </div>
        <p className="text-[9.5px] text-[var(--color-text-muted)] font-mono mt-1.5 text-center">
          Enter kirim • Shift+Enter baris baru
        </p>
      </div>
    </div>
  );
}
