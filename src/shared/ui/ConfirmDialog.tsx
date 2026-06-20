import React from 'react';
import Modal, { ModalCancelBtn, ModalSaveBtn } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const colors = {
  danger:  '#ef4444',
  warning: '#f59e0b',
  info:    'var(--color-accent-highlight)',
};

export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = 'Konfirmasi',
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel  = 'Batal',
  variant      = 'danger',
}: ConfirmDialogProps) {
  const color = colors[variant];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      accentColor={color}
      footer={
        <>
          <ModalCancelBtn onClick={onClose} label={cancelLabel} />
          <ModalSaveBtn
            onClick={() => { onConfirm(); onClose(); }}
            label={confirmLabel}
            accentColor={color}
          />
        </>
      }
    >
      <div className="flex gap-3 items-start">
        <AlertTriangle size={20} className="shrink-0 mt-0.5" style={{ color }} />
        <p className="text-sm text-[var(--color-text-main)] leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}
