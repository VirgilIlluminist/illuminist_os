import React, { useState } from 'react';
import { calculateMargin } from '../../services/productBlackbox.service';
import NumberInput from '../../shared/ui/NumberInput';

interface Props {
  initialHpp:   number;
  initialPrice: number;
  currency:     string;
  accent:       string;
}

export default function MarginCalculator({ initialHpp, initialPrice, currency, accent }: Props) {
  const [hpp,         setHpp]         = useState(initialHpp);
  const [price,       setPrice]       = useState(initialPrice);
  const [targetPct,   setTargetPct]   = useState(40);

  const margin = calculateMargin(hpp, price);
  const target = calculateMargin(hpp, margin.targetPrice(targetPct));

  const INPUT = 'w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text-main)] focus:outline-none text-right';

  return (
    <div className="rounded-xl border border-[var(--color-border-line)] bg-white/[0.02] p-4 space-y-3">
      <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Margin Calculator</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[8px] font-mono text-[var(--color-text-muted)] mb-1 block">HPP</label>
          <NumberInput value={hpp} onChange={setHpp} className={INPUT}/>
        </div>
        <div>
          <label className="text-[8px] font-mono text-[var(--color-text-muted)] mb-1 block">Harga Jual</label>
          <NumberInput value={price} onChange={setPrice} className={INPUT}/>
        </div>
      </div>

      <div className="border-t border-[var(--color-border-line)] pt-3 space-y-1.5">
        <Row label="Margin" value={`${currency}${Math.round(margin.marginAmount).toLocaleString('id')} (${margin.marginPercent.toFixed(1)}%)`}
          color={margin.marginPercent < 20 ? 'text-red-400' : margin.marginPercent < 35 ? 'text-yellow-400' : 'text-green-400'}/>
        <Row label="Break Even" value={`${currency}${Math.round(margin.breakEvenPrice).toLocaleString('id')}`}/>
      </div>

      <div className="border-t border-[var(--color-border-line)] pt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[8px] font-mono text-[var(--color-text-muted)]">Target Margin</span>
          <NumberInput value={targetPct} onChange={setTargetPct} allowDecimal={false} min={0} max={99}
            className="w-14 bg-white/5 border border-[var(--color-border-line)] rounded-lg px-2 py-1 text-[10px] font-mono text-center text-[var(--color-text-main)] focus:outline-none"/>
          <span className="text-[8px] font-mono text-[var(--color-text-muted)]">%</span>
        </div>
        <Row
          label={`Harga minimal untuk ${targetPct}% margin`}
          value={`${currency}${Math.round(margin.targetPrice(targetPct)).toLocaleString('id')}`}
          color={price >= margin.targetPrice(targetPct) ? 'text-green-400' : 'text-yellow-400'}
          suffix={price >= margin.targetPrice(targetPct) ? '✓' : undefined}
        />
      </div>
    </div>
  );
}

function Row({ label, value, color = 'text-[var(--color-text-main)]', suffix }: {
  label: string; value: string; color?: string; suffix?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-mono text-[var(--color-text-muted)]">{label}</span>
      <span className={`text-xs font-mono font-bold ${color}`}>{value}{suffix ? ` ${suffix}` : ''}</span>
    </div>
  );
}
