import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  accentColor?: string;
}

const sizes = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-2xl',
};

export default function Modal({
  open, onClose, title, subtitle, size = 'md',
  children, footer, accentColor = 'var(--color-accent-highlight)',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Tutup dengan klik overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${sizes[size]} bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-[var(--color-border-line)] shrink-0"
                 style={{ borderTopColor: accentColor, borderTopWidth: '2.5px' }}>
              <div>
                <h3 className="text-sm font-display font-semibold uppercase tracking-widest text-[var(--color-text-main)]">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors rounded cursor-pointer ml-4 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-sm text-[var(--color-text-main)]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-5 border-t border-[var(--color-border-line)] flex justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Convenience button components ────────────────────────────────────────────
export function ModalCancelBtn({ onClick, label = 'Batal' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[var(--color-text-muted)] border border-[var(--color-border-line)] rounded hover:text-[var(--color-text-main)] hover:bg-white/[0.02] transition-all cursor-pointer">
      {label}
    </button>
  );
}

export function ModalSaveBtn({
  onClick, label = 'Simpan', disabled = false, accentColor = 'var(--color-accent-highlight)'
}: { onClick: () => void; label?: string; disabled?: boolean; accentColor?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-4 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: accentColor, color: 'var(--color-background)' }}>
      {label}
    </button>
  );
}
