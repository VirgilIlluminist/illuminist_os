import React, { useState } from 'react';
import { supabase } from '../../../infra/supabase/client';
import { toast } from '../../../shared/ui/Toast';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login berhasil');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal';
      toast.error(msg === 'Invalid login credentials'
        ? 'Email atau password salah'
        : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-4"
            style={{ background: 'var(--color-accent-highlight)', color: '#000' }}
          >
            I
          </div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-widest text-[var(--color-text-main)]">
            ILLUMINIST OS
          </h1>
          <p className="text-xs font-mono text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">
            Multi-Business Operating System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@illuminist.co"
              autoComplete="email"
              className="w-full px-4 py-3 text-sm font-mono bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none focus:border-[var(--color-accent-highlight)] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3 text-sm font-mono bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none focus:border-[var(--color-accent-highlight)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-mono font-bold uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            style={{ background: 'var(--color-accent-highlight)', color: '#000' }}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-[10px] font-mono text-[var(--color-text-muted)] mt-6">
          ILLUMINIST OS v1 · Protected System
        </p>
      </div>
    </div>
  );
}
