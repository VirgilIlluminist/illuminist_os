/**
 * Toast.tsx — Non-blocking notification system
 * Menggantikan seluruh alert() dan confirm() di aplikasi.
 *
 * Cara pakai:
 *   import { toast } from '../../shared/ui/Toast';
 *   toast.success('Material berhasil ditambahkan');
 *   toast.error('Nama wajib diisi');
 *   const ok = await toast.confirm('Hapus item ini?');
 */
import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id:       string;
  type:     ToastType;
  message:  string;
  duration: number;
}

interface ConfirmItem {
  id:       string;
  message:  string;
  resolve:  (value: boolean) => void;
}

interface ToastContextValue {
  addToast:   (type: ToastType, message: string, duration?: number) => void;
  addConfirm: (message: string) => Promise<boolean>;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

// ─── Singleton API (usable outside React) ─────────────────────────────────────
let _addToast:   ToastContextValue['addToast']   | null = null;
let _addConfirm: ToastContextValue['addConfirm'] | null = null;

export const toast = {
  success: (msg: string, dur = 3500) => _addToast?.('success', msg, dur),
  error:   (msg: string, dur = 5000) => _addToast?.('error',   msg, dur),
  warning: (msg: string, dur = 4000) => _addToast?.('warning', msg, dur),
  info:    (msg: string, dur = 3500) => _addToast?.('info',    msg, dur),
  confirm: (msg: string)             => _addConfirm?.(msg) ?? Promise.resolve(false),
};

// ─── Icon + color map ─────────────────────────────────────────────────────────
const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />,
  error:   <XCircle     size={15} className="text-red-400 shrink-0" />,
  warning: <AlertTriangle size={14} className="text-yellow-500 shrink-0" />,
  info:    <Info        size={15} className="text-sky-400 shrink-0" />,
};
const BORDER: Record<ToastType, string> = {
  success: 'border-emerald-500/20',
  error:   'border-red-500/20',
  warning: 'border-yellow-500/20',
  info:    'border-sky-500/20',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts,   setToasts]   = useState<ToastItem[]>([]);
  const [confirms, setConfirms] = useState<ConfirmItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 3500) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  const addConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      const id = `c-${Date.now()}`;
      setConfirms(prev => [...prev, { id, message, resolve }]);
    });
  }, []);

  const removeToast   = (id: string) => setToasts(p => p.filter(t => t.id !== id));
  const resolveConfirm= (id: string, value: boolean) => {
    const item = confirms.find(c => c.id === id);
    if (item) { item.resolve(value); setConfirms(p => p.filter(c => c.id !== id)); }
  };

  // Register singleton
  _addToast   = addToast;
  _addConfirm = addConfirm;

  return (
    <ToastCtx.Provider value={{ addToast, addConfirm }}>
      {children}

      {/* Toast stack — bottom right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
        <AnimatePresence>
          {toasts.map(t => (
            <ToastCard key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm dialogs — centered */}
      <AnimatePresence>
        {confirms.map(c => (
          <ConfirmCard key={c.id} item={c} onResolve={resolveConfirm} />
        ))}
      </AnimatePresence>
    </ToastCtx.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, item.duration);
    return () => clearTimeout(t);
  }, [item.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1    }}
      exit={{    opacity: 0, x: 60, scale: 0.95  }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border bg-[var(--color-card-bg)] shadow-2xl backdrop-blur-md ${BORDER[item.type]}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      {ICON[item.type]}
      <span className="text-xs text-[var(--color-text-main)] flex-1 leading-relaxed">{item.message}</span>
      <button onClick={onDismiss} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer shrink-0">
        <X size={12} />
      </button>
    </motion.div>
  );
}

function ConfirmCard({ item, onResolve }: {
  item: ConfirmItem;
  onResolve: (id: string, value: boolean) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1,    y: 0  }}
        exit={{    scale: 0.92, y: 8  }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl p-6 shadow-2xl"
      >
        <div className="flex gap-3 items-start mb-5">
          <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--color-text-main)] leading-relaxed">{item.message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => onResolve(item.id, false)}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] border border-[var(--color-border-line)] rounded hover:text-[var(--color-text-main)] transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={() => onResolve(item.id, true)}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded transition-all cursor-pointer"
            style={{ background: 'var(--color-accent-highlight)', color: 'var(--color-background)' }}
          >
            Ya, Lanjutkan
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
