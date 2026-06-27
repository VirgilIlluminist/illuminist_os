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
          style={{ background: 'rgba(0,0,0,0.65)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${sizes[size]} flex flex-col max-h-[90vh]`}
            style={{ background: 'rgba(14,10,28,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/[0.08] shrink-0">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-white">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
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
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4 text-sm text-white/80">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-white/[0.08] flex justify-end gap-3 shrink-0">
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
      className="px-4 py-2.5 text-sm font-medium text-white/50 border border-white/[0.10] rounded-xl hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
      {label}
    </button>
  );
}

export function ModalSaveBtn({
  onClick, label = 'Simpan', disabled = false, accentColor = 'var(--color-accent-highlight)'
}: { onClick: () => void; label?: string; disabled?: boolean; accentColor?: string }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: accentColor, color: '#000' }}>
      {label}
    </button>
  );
}
