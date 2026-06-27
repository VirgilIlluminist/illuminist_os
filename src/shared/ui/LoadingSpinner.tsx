import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?:    'sm' | 'md' | 'lg';
  label?:   string;
  fullPage?:boolean;
}

const sizes = { sm: 14, md: 20, lg: 32 };

export default function LoadingSpinner({ size = 'md', label, fullPage = false }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader size={sizes[size]} className="animate-spin text-[var(--color-accent-highlight)]" />
      {label && <p className="text-xs font-mono text-[var(--color-text-muted)]">{label}</p>}
    </div>
  );
  if (fullPage) return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
      {content}
    </div>
  );
  return content;
}
