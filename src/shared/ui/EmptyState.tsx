import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?:     string;
  message?:   string;
  icon?:      React.ReactNode;
  action?:    React.ReactNode;
  className?: string;
}

export default function EmptyState({
  title   = 'Belum Ada Data',
  message = 'Tambahkan data pertama Anda untuk memulai.',
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center space-y-3 ${className}`}>
      <div className="p-4 rounded-2xl bg-[var(--color-border-line)]">
        {icon ?? <Inbox size={28} className="text-[var(--color-text-muted)]" />}
      </div>
      <h4 className="text-sm font-display font-medium text-[var(--color-text-muted)] uppercase tracking-widest">
        {title}
      </h4>
      <p className="text-xs text-[var(--color-text-muted)] font-mono max-w-xs leading-relaxed">
        {message}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
