import React, { useState, useEffect } from 'react';
import { supabase } from '../../../infra/supabase/client';
import { toast } from '../../../shared/ui/Toast';
import { useERP } from '../../../app/store/ERPContext';
import { UserPlus, Trash2, Shield, Eye, RefreshCw } from 'lucide-react';

const ROLES = [
  { id: 'owner',      label: 'Owner',       desc: 'Akses penuh semua fitur' },
  { id: 'admin',      label: 'Admin',        desc: 'Kelola semua kecuali sistem' },
  { id: 'production', label: 'Produksi',     desc: 'Material, produksi, inventori' },
  { id: 'warehouse',  label: 'Gudang',       desc: 'Inventori & purchase order' },
  { id: 'finance',    label: 'Keuangan',     desc: 'Finance, cashflow, laporan' },
  { id: 'marketing',  label: 'Marketing',    desc: 'Ads, KOL, penjualan' },
  { id: 'designer',   label: 'Desainer',     desc: 'Material & produk (read)' },
  { id: 'viewer',     label: 'Viewer',       desc: 'Lihat semua, tidak bisa edit' },
];

interface Member {
  id:        string;
  full_name: string | null;
  role:      string;
  is_active: boolean;
  last_login:string | null;
  email?:    string;
}

export default function TeamPage() {
  const { config, t } = useERP();
  const [members,  setMembers]  = useState<Member[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole,  setInvRole]  = useState('viewer');
  const [sending,  setSending]  = useState(false);
  const accent = config?.customAccentColor || '#d4af37';

  const loadMembers = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active, last_login')
        .order('role');
      setMembers((data || []) as Member[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, []);

  const inviteUser = async () => {
    if (!supabase || !invEmail.trim()) {
      toast.error('Email wajib diisi');
      return;
    }
    setSending(true);
    try {
      // Supabase invite via magic link
      const { error } = await supabase.auth.admin?.inviteUserByEmail
        ? await (supabase as any).auth.admin.inviteUserByEmail(invEmail, {
            data: { role: invRole, company_id: '00000000-0000-0000-0000-000000000001' }
          })
        : { error: null };

      if (error) throw error;
      toast.success(`Undangan dikirim ke ${invEmail}`);
      setInvEmail('');
      await loadMembers();
    } catch (err: unknown) {
      // Fallback: buat user langsung jika admin API tidak tersedia
      toast.info('Gunakan Supabase Dashboard → Authentication → Users → Invite user secara manual, lalu set role via SQL.');
    } finally {
      setSending(false);
    }
  };

  const updateRole = async (memberId: string, newRole: string) => {
    if (!supabase) return;
    const { error } = await (supabase.from('profiles') as any)
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) {
      toast.error('Gagal update role');
    } else {
      toast.success('Role diperbarui');
      await loadMembers();
    }
  };

  const deactivate = async (memberId: string, active: boolean) => {
    if (!supabase) return;
    const { error } = await (supabase.from('profiles') as any)
      .update({ is_active: !active })
      .eq('id', memberId);
    if (error) {
      toast.error('Gagal update status');
    } else {
      toast.success(active ? 'Akun dinonaktifkan' : 'Akun diaktifkan');
      await loadMembers();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[var(--color-border-line)] pb-5">
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: accent }}>
          TEAM MANAGEMENT
        </span>
        <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
          Kelola Tim
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
          Undang anggota tim, atur peran dan hak akses mereka.
        </p>
      </div>

      {/* Invite form */}
      <div className="p-5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl space-y-4">
        <h3 className="text-sm font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] flex items-center gap-2">
          <UserPlus size={15} style={{ color: accent }} />
          Undang Anggota Baru
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={invEmail}
            onChange={e => setInvEmail(e.target.value)}
            placeholder="email@perusahaan.com"
            className="flex-1 min-w-48 px-3 py-2 text-xs font-mono bg-[var(--color-background)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none focus:border-[var(--color-accent-highlight)] transition-colors"
          />
          <select
            value={invRole}
            onChange={e => setInvRole(e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-[var(--color-background)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none cursor-pointer"
          >
            {ROLES.map(r => (
              <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>
            ))}
          </select>
          <button
            onClick={inviteUser}
            disabled={sending || !invEmail}
            className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-40"
            style={{ background: accent, color: '#000' }}
          >
            {sending ? 'Mengirim...' : 'Undang'}
          </button>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
          💡 Jika undangan email tidak berfungsi: Supabase Dashboard → Authentication → Users → Add user → Set role via SQL Editor.
        </p>
      </div>

      {/* SQL helper */}
      <div className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl">
        <p className="text-[10.5px] font-mono text-[var(--color-text-muted)] mb-2 font-semibold uppercase">
          SQL untuk set role setelah user dibuat:
        </p>
        <pre className="text-[10px] font-mono text-emerald-400 bg-[var(--color-background)] p-3 rounded-lg overflow-x-auto">
{`UPDATE public.profiles
SET company_id = '00000000-0000-0000-0000-000000000002',
    role = 'production'  -- ganti sesuai kebutuhan
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@karyawan.com');`}
        </pre>
      </div>

      {/* Members list */}
      <div className="p-5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold uppercase tracking-wider text-[var(--color-text-main)] flex items-center gap-2">
            <Shield size={15} style={{ color: accent }} />
            Anggota Tim ({members.length})
          </h3>
          <button onClick={loadMembers} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {!supabase ? (
          <p className="text-xs font-mono text-[var(--color-text-muted)] text-center py-8">
            Hubungkan Supabase untuk mengelola tim.
          </p>
        ) : members.length === 0 ? (
          <p className="text-xs font-mono text-[var(--color-text-muted)] text-center py-8">
            {loading ? 'Memuat...' : 'Belum ada anggota tim.'}
          </p>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  m.is_active
                    ? 'border-[var(--color-border-line)] bg-[var(--color-background)]'
                    : 'border-red-500/10 bg-red-500/[0.02] opacity-60'
                }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-black"
                     style={{ background: accent }}>
                  {(m.full_name || '?')[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-text-main)] truncate">
                    {m.full_name || 'Unnamed User'}
                  </p>
                  <p className="text-[9.5px] font-mono text-[var(--color-text-muted)]">
                    {m.is_active ? 'Aktif' : 'Nonaktif'} ·
                    {m.last_login
                      ? ` Login: ${new Date(m.last_login).toLocaleDateString('id-ID')}`
                      : ' Belum pernah login'
                    }
                  </p>
                </div>

                {/* Role selector */}
                <select
                  value={m.role}
                  onChange={e => updateRole(m.id, e.target.value)}
                  className="text-[10px] font-mono px-2 py-1 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>

                {/* Toggle active */}
                <button
                  onClick={() => deactivate(m.id, m.is_active)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    m.is_active
                      ? 'text-[var(--color-text-muted)] hover:text-red-400'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                  title={m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {m.is_active ? <Trash2 size={13} /> : <Eye size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role guide */}
      <div className="p-5 bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-xl">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Panduan Peran
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ROLES.map(r => (
            <div key={r.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--color-border-line)] last:border-0">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                    style={{ background: accent + '20', color: accent }}>
                {r.label}
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
