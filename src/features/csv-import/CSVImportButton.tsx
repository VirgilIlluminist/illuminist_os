import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import CSVImportModal from './CSVImportModal';
import type { ImportEntity, ImportResult } from './types';

interface Props {
  entity:    ImportEntity;
  onSuccess?: (result: ImportResult) => void;
  label?:    string;
  accent?:   string;
  className?: string;
}

export default function CSVImportButton({ entity, onSuccess, label, accent, className }: Props) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (result: ImportResult) => {
    onSuccess?.(result);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer ${className ?? ''}`}
      >
        <Upload size={10}/>
        {label ?? 'Import CSV'}
      </button>

      {open && (
        <CSVImportModal
          entity={entity}
          onClose={() => setOpen(false)}
          onSuccess={result => { handleSuccess(result); setOpen(false); }}
        />
      )}
    </>
  );
}
