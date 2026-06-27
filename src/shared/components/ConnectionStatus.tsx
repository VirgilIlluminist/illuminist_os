import React, { useState } from 'react';
import { isSupabaseEnabled } from '../../infra/supabase/client';

interface Props {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (isSupabaseEnabled) {
    return (
      <button
        onClick={() => setExpanded(v => !v)}
        className={`relative flex items-center gap-1.5 cursor-pointer group ${className}`}
        title="Supabase Connected"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
        </span>
        {expanded && (
          <span className="text-xs text-green-400 whitespace-nowrap">Supabase</span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => setExpanded(v => !v)}
      className={`relative flex items-center gap-1.5 cursor-pointer group ${className}`}
      title="localStorage mode — Supabase not configured"
    >
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"/>
      </span>
      {expanded && (
        <span className="text-xs text-yellow-400 whitespace-nowrap">localStorage</span>
      )}
    </button>
  );
}
