import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="font-mono text-xs text-[var(--color-text-muted)] animate-pulse uppercase tracking-widest">
          ILLUMINIST OS · Memuat...
        </p>
      </div>
    );
  }

  const supabaseEnabled = Boolean(
    typeof import.meta !== 'undefined' && (import.meta as Record<string, any>).env?.VITE_SUPABASE_URL
  );

  if (!user && supabaseEnabled) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
