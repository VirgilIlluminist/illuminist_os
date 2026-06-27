import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase, isSupabaseEnabled } from '../../../infra/supabase/client';
import { useAuth } from '../../../app/providers/AuthProvider';
import { toast } from '../../../shared/ui/Toast';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [mode,     setMode]     = useState<Mode>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [notice,   setNotice]   = useState<string | null>(null);

  // Once the session is established (after sign-in, or if already logged in),
  // leave /login and enter the app. This is what actually "masuk"s the user —
  // the success toast alone doesn't navigate.
  if (!authLoading && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!isSupabaseEnabled || !supabase) {
      toast.error('Auth backend tidak terkonfigurasi. Hubungi admin.');
      return;
    }
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Login berhasil');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmation is required, Supabase returns a user but no session.
        if (data.session) {
          toast.success('Akun dibuat — selamat datang');
        } else {
          setNotice(`Akun dibuat. Cek email ${email} untuk konfirmasi, lalu masuk.`);
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      const friendly =
        msg === 'Invalid login credentials' ? 'Email atau password salah' :
        /already registered/i.test(msg)     ? 'Email sudah terdaftar — silakan masuk' :
        /Email not confirmed/i.test(msg)     ? 'Email belum dikonfirmasi. Cek inbox kamu.' :
        msg;
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.92)',
    fontSize: '14px', letterSpacing: '-0.01em',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 500,
    color: 'rgba(255,255,255,0.40)', letterSpacing: '-0.01em',
    marginBottom: '8px',
  };

  return (
    <>
      <style>{`
        .login-bg {
          background:
            radial-gradient(ellipse 80% 70% at 15% 10%, color-mix(in srgb, var(--accent-primary) 40%, transparent) 0%, transparent 55%),
            radial-gradient(ellipse 60% 60% at 85% 20%, color-mix(in srgb, var(--accent-primary) 25%, transparent) 0%, transparent 50%),
            linear-gradient(145deg, #0d0820 0%, #090618 40%, #0b0720 100%);
        }
        .login-glow {
          background: radial-gradient(circle, color-mix(in srgb, var(--accent-primary) 28%, transparent) 0%, transparent 70%);
        }
      `}</style>
    <div className="login-bg" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow */}
      <div className="login-glow" style={{
        position: 'absolute', top: '-5%', right: '5%', width: '500px', height: '500px',
        borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none',
      }}/>

      {/* Glass card */}
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px) saturate(130%)',
        WebkitBackdropFilter: 'blur(24px) saturate(130%)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '20px', padding: '40px 36px',
        position: 'relative', zIndex: 1,
        boxShadow: '0 32px 80px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--accent-primary)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', margin: '0 auto 18px',
            boxShadow: 'var(--shadow-accent)',
          }}>◆</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.04em', margin: '0 0 6px' }}>
            ILLUMINIST OS
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', margin: 0, letterSpacing: '-0.01em' }}>
            Multi-Business Operating System
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: '4px', padding: '4px', marginBottom: '22px',
          background: 'rgba(255,255,255,0.04)', borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setNotice(null); }}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s ease',
                letterSpacing: '-0.01em',
                background: mode === m ? 'var(--accent-primary)' : 'transparent',
                color: mode === m ? 'white' : 'rgba(255,255,255,0.45)',
                boxShadow: mode === m ? 'var(--shadow-accent)' : 'none',
              }}
            >
              {m === 'signin' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        {notice && (
          <div style={{
            marginBottom: '16px', padding: '10px 12px', borderRadius: '10px',
            background: 'var(--accent-primary-muted)', border: '1px solid var(--border-accent)',
            fontSize: '13px', letterSpacing: '-0.01em', color: 'rgba(196,181,253,0.95)', lineHeight: 1.6,
          }}>
            {notice}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="owner@illuminist.co" autoComplete="email" style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Minimal 6 karakter' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={inputStyle}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'var(--accent-primary-muted)' : 'var(--accent-primary)',
              border: 'none', borderRadius: '12px', color: 'white', fontSize: '15px', fontWeight: 600,
              letterSpacing: '-0.02em',
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px',
              boxShadow: loading ? 'none' : 'var(--shadow-accent)',
              transition: 'all 0.15s ease',
            }}
          >
            {loading
              ? (mode === 'signin' ? 'Masuk...' : 'Membuat akun...')
              : (mode === 'signin' ? 'Masuk' : 'Buat Akun Owner')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.38)', marginTop: '20px', marginBottom: 0 }}>
          {mode === 'signin' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setNotice(null); }}
            style={{ background: 'none', border: 'none', color: 'rgba(167,139,250,0.95)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0, letterSpacing: '-0.01em' }}
          >
            {mode === 'signin' ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </p>

        <p style={{ textAlign: 'center', fontSize: '12px', letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.20)', marginTop: '20px', marginBottom: 0 }}>
          ILLUMINIST OS · Protected System
        </p>
      </div>
    </div>
    </>
  );
}
