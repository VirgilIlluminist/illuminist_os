/**
 * AISettingsPanel.tsx — AI provider settings UI
 * Embedded in main SettingsView. Manage API keys, active provider, test connections.
 */
import React, { useState, useEffect } from 'react';
import { Bot, CheckCircle2, XCircle, Loader, Eye, EyeOff, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import aiService, { ProviderStatus } from '../../infra/api/ai.service';
import { useERP } from '../../app/store/ERPContext';

const PROVIDERS = [
  { id: 'gemini',     name: 'Google Gemini',    envKey: 'GEMINI_API_KEY',      icon: '🔵', note: 'Gratis tier tersedia' },
  { id: 'openai',     name: 'OpenAI GPT',        envKey: 'OPENAI_API_KEY',      icon: '🟢', note: 'GPT-4o, GPT-4o-mini' },
  { id: 'claude',     name: 'Anthropic Claude',  envKey: 'CLAUDE_API_KEY',      icon: '🟠', note: 'Claude Sonnet, Opus' },
  { id: 'openrouter', name: 'OpenRouter',        envKey: 'OPENROUTER_API_KEY',  icon: '⚡', note: '200+ model dalam 1 API' },
];

export default function AISettingsPanel() {
  const { config, t }        = useERP();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [testing,   setTesting]   = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latencyMs: number; error?: string }>>({});
  const [showKeys,  setShowKeys]  = useState<Record<string, boolean>>({});
  const [loading,   setLoading]   = useState(true);
  const accentHex = config?.customAccentColor || '#d4af37';

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await aiService.getProviders();
      setProviders(data.providers || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (name: string) => {
    setTesting(name);
    try {
      const result = await aiService.testProvider(name);
      setTestResults(prev => ({ ...prev, [name]: result }));
    } catch (err: unknown) {
      setTestResults(prev => ({
        ...prev,
        [name]: { ok: false, latencyMs: 0, error: err instanceof Error ? err.message : 'Failed' },
      }));
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-line)] pb-4">
        <div className="flex items-center gap-2">
          <Bot size={16} style={{ color: accentHex }} />
          <h3 className="text-sm font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)]">
            Konfigurasi AI Provider
          </h3>
        </div>
        <button onClick={loadProviders} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer transition-colors">
          <Loader size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Provider cards */}
      <div className="space-y-3">
        {PROVIDERS.map(prov => {
          const status = providers.find(p => p.name === prov.id);
          const result = testResults[prov.id];
          const isAvail = status?.available || false;

          return (
            <motion.div
              key={prov.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-all ${
                isAvail
                  ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                  : 'border-[var(--color-border-line)] bg-[var(--color-card-bg)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{prov.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-text-main)]">{prov.name}</span>
                      {isAvail
                        ? <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">AKTIF</span>
                        : <span className="text-[9px] font-mono bg-white/[0.04] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded">TIDAK AKTIF</span>
                      }
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-mono">{prov.note}</p>
                  </div>
                </div>

                <button
                  onClick={() => testProvider(prov.id)}
                  disabled={testing === prov.id || !isAvail}
                  className="text-[10px] font-mono px-2.5 py-1 border border-[var(--color-border-line)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1 shrink-0"
                >
                  {testing === prov.id ? <Loader size={10} className="animate-spin" /> : <Zap size={10} />}
                  Test
                </button>
              </div>

              {/* API Key display */}
              <div className="mt-3 p-2 bg-[var(--color-background)] rounded border border-[var(--color-border-line)] flex items-center gap-2">
                <span className="text-[9px] font-mono text-[var(--color-text-muted)] flex-1">
                  {isAvail ? (showKeys[prov.id] ? '••••••••••••••••••••' : 'API Key configured in .env') : `Set ${prov.envKey} in .env file`}
                </span>
              </div>

              {/* Test result */}
              {result && (
                <div className={`mt-2 text-[10px] font-mono flex items-center gap-1.5 ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {result.ok
                    ? <><CheckCircle2 size={10} /> Connected — {result.latencyMs}ms latency</>
                    : <><XCircle size={10} /> {result.error || 'Connection failed'}</>
                  }
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Setup guide */}
      <div className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-lg">
        <p className="text-xs font-semibold text-[var(--color-text-main)] mb-2">Cara mengaktifkan AI:</p>
        <ol className="space-y-1 text-[10.5px] text-[var(--color-text-muted)] font-mono">
          <li>1. Buka file <code className="bg-white/10 px-1 rounded">.env</code> di root project</li>
          <li>2. Tambahkan API key yang diinginkan</li>
          <li>3. Restart server: <code className="bg-white/10 px-1 rounded">npm run dev</code></li>
          <li>4. Klik Test untuk memverifikasi koneksi</li>
        </ol>
        <div className="mt-3 p-2 bg-[var(--color-background)] rounded text-[10px] font-mono text-[var(--color-text-muted)]">
          <span style={{ color: accentHex }}>GEMINI_API_KEY</span>=your_key_here<br/>
          <span style={{ color: accentHex }}>OPENAI_API_KEY</span>=sk-your_key_here
        </div>
      </div>

      {/* AI Permission Level info */}
      <div className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-lg">
        <p className="text-xs font-semibold text-[var(--color-text-main)] mb-3">Level Izin AI</p>
        {[
          [1, 'Read Only', 'Hanya membaca data'],
          [2, 'Rekomendasi', 'Analisa dan saran'],
          [3, 'Draft Aksi', 'Membuat draft untuk review'],
          [4, 'Execute + Approval', 'Eksekusi setelah disetujui'],
          [5, 'Auto Execute', 'Khusus pemilik bisnis'],
        ].map(([lvl, name, desc]) => (
          <div key={String(lvl)} className="flex items-center gap-3 py-1.5 border-b border-[var(--color-border-line)] last:border-0">
            <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-[var(--color-background)]" style={{ background: accentHex }}>
              {lvl}
            </span>
            <div>
              <span className="text-xs font-medium text-[var(--color-text-main)]">{name}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] ml-2">{desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
