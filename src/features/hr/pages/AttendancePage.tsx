import React, { useState } from 'react';
import { Activity, Clock, CheckCircle, XCircle, LogIn } from 'lucide-react';
import { useERP } from '../../../app/store/ERPContext';

interface AttendanceRecord {
  id: string;
  name: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'hadir' | 'terlambat' | 'absen';
  duration: string | null;
}

export default function AttendancePage() {
  const { config } = useERP();
  const accent = config?.customAccentColor || '#7c3aed';

  const [checkingIn, setCheckingIn] = useState(false);
  const [records] = useState<AttendanceRecord[]>([]);

  const today = new Date();
  const todayLabel = today.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const hadirCount = records.filter(r => r.status === 'hadir' || r.status === 'terlambat').length;
  const absenCount = records.filter(r => r.status === 'absen').length;

  const handleCheckIn = async () => {
    setCheckingIn(true);
    await new Promise(r => setTimeout(r, 800));
    setCheckingIn(false);
  };

  const statusColor: Record<string, string> = {
    hadir: '#34c759',
    terlambat: '#ff9500',
    absen: '#ff3b30',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5 flex items-start justify-between flex-wrap gap-3">
        <div>
          <span className="text-xs tracking-widest uppercase" style={{ color: accent }}>
            HR SYSTEM
          </span>
          <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
            Absensi
          </h2>
          <p className="text-sm text-white/50 mt-1">{todayLabel}</p>
        </div>
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-40 transition-all"
          style={{ background: accent, color: '#000' }}
        >
          <LogIn size={15} />
          {checkingIn ? 'Memproses...' : 'Check In'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Hadir Hari Ini', value: hadirCount, color: '#34c759', icon: <CheckCircle size={16} /> },
          { label: 'Absen', value: absenCount, color: '#ff3b30', icon: <XCircle size={16} /> },
          { label: 'Total Karyawan', value: records.length, color: '#0071e3', icon: <Activity size={16} /> },
        ].map((card, i) => (
          <div key={i} className="glass-panel bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">{card.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}20`, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-main)] tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Attendance log */}
      <div className="glass-panel bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center gap-2">
          <Clock size={15} style={{ color: accent }} />
          <h3 className="text-sm font-semibold text-[var(--color-text-main)]">
            Log Absensi Hari Ini
          </h3>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${accent}15` }}>
              <Activity size={24} style={{ color: accent }} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-main)]">Belum ada data absensi</p>
            <p className="text-xs text-white/40 text-center max-w-xs">
              Karyawan dapat melakukan check-in menggunakan tombol di atas atau melalui aplikasi mobile.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {['Nama', 'Check In', 'Check Out', 'Status', 'Durasi'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-white/40 text-left uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[var(--color-text-main)]">{rec.name}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--color-text-main)]">
                      {rec.checkIn ?? <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-[var(--color-text-main)]">
                      {rec.checkOut ?? <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          color: statusColor[rec.status] ?? '#ffffff',
                          background: `${statusColor[rec.status] ?? '#ffffff'}18`,
                        }}>
                        {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {rec.duration ?? <span className="text-white/30">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
