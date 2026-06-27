import React, { useState } from 'react';
import { DollarSign, Users, Play, RefreshCw } from 'lucide-react';
import { useERP } from '../../../app/store/ERPContext';

interface PayrollRow {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  allowance: number;
  deduction: number;
  net: number;
  status: 'pending' | 'processed';
}

export default function PayrollPage() {
  const { config, formatMoney } = useERP();
  const accent = config?.customAccentColor || '#7c3aed';

  const [processing, setProcessing] = useState(false);
  const [rows] = useState<PayrollRow[]>([]);

  const now = new Date();
  const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const totalPayroll = rows.reduce((s, r) => s + r.net, 0);
  const processedCount = rows.filter(r => r.status === 'processed').length;

  const handleProcess = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    setProcessing(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <span className="text-xs tracking-widest uppercase" style={{ color: accent }}>
          HR SYSTEM
        </span>
        <h2 className="text-2xl font-display uppercase tracking-tight font-semibold text-[var(--color-text-main)] mt-1">
          Payroll
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Penggajian periode {monthLabel}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Total Karyawan',
            value: rows.length.toString(),
            icon: <Users size={16} />,
            color: '#7c3aed',
          },
          {
            label: 'Total Payroll',
            value: formatMoney(totalPayroll),
            icon: <DollarSign size={16} />,
            color: '#34c759',
          },
          {
            label: 'Sudah Diproses',
            value: `${processedCount} / ${rows.length}`,
            icon: <RefreshCw size={16} />,
            color: '#0071e3',
          },
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

      {/* Employee payroll table */}
      <div className="glass-panel bg-[var(--color-card-bg)] border border-[var(--color-border-line)] rounded-2xl">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text-main)] flex items-center gap-2">
            <Users size={15} style={{ color: accent }} />
            Daftar Penggajian
          </h3>
          <button
            onClick={handleProcess}
            disabled={processing || rows.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer disabled:opacity-40 transition-all"
            style={{ background: accent, color: '#000' }}
          >
            <Play size={14} />
            {processing ? 'Memproses...' : 'Proses Payroll'}
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `${accent}15` }}>
              <DollarSign size={24} style={{ color: accent }} />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-main)]">Belum ada data karyawan</p>
            <p className="text-xs text-white/40 text-center max-w-xs">
              Tambahkan karyawan melalui menu HR System untuk memulai proses penggajian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {['Nama', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'Neto', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-white/40 text-left uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[var(--color-text-main)]">{row.name}</td>
                    <td className="px-4 py-3 text-white/60">{row.role}</td>
                    <td className="px-4 py-3 tabular-nums text-[var(--color-text-main)]">{formatMoney(row.baseSalary)}</td>
                    <td className="px-4 py-3 tabular-nums text-[#34c759]">+{formatMoney(row.allowance)}</td>
                    <td className="px-4 py-3 tabular-nums text-[#ff3b30]">-{formatMoney(row.deduction)}</td>
                    <td className="px-4 py-3 tabular-nums font-bold text-[var(--color-text-main)]">{formatMoney(row.net)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        row.status === 'processed'
                          ? 'text-[#34c759] bg-[#34c75918]'
                          : 'text-white/50 bg-white/[0.06]'
                      }`}>
                        {row.status === 'processed' ? 'Selesai' : 'Pending'}
                      </span>
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
