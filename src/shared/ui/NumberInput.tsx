import React, { useState, useRef, useEffect } from 'react';

/**
 * Robust numeric input.
 *
 * Fixes the classic controlled-number-input bug where `value={x===0?'':x}` +
 * re-parsing on every keystroke makes it impossible to type decimals, a leading
 * zero, or to clear the field ("0.5" would collapse to "" because parseFloat(".")
 * is NaN). We keep an internal STRING buffer so the user can type freely
 * ("", "-", "0", "0.", "0.5", "12.") and only commit a parsed number upward.
 *
 * Drop-in replacement for `<input type="number" ... />` — pass the same
 * `className`. The numeric `value` (not a string) is the source of truth.
 */
export interface NumberInputProps {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
  allowDecimal?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  onBlur?: () => void;
  'aria-label'?: string;
}

function toBuffer(v: number): string {
  if (v === 0 || v === null || v === undefined || Number.isNaN(v)) return '';
  return String(v);
}

export default function NumberInput({
  value,
  onChange,
  className = '',
  placeholder = '0',
  allowDecimal = true,
  allowNegative = false,
  min,
  max,
  suffix,
  disabled = false,
  id,
  onBlur,
  ...rest
}: NumberInputProps) {
  const [buf, setBuf] = useState<string>(toBuffer(value));
  const focused = useRef(false);

  // Sync external value changes only while the user is NOT typing, so we never
  // fight the buffer mid-entry.
  useEffect(() => {
    if (!focused.current) setBuf(toBuffer(value));
  }, [value]);

  const pattern = allowDecimal
    ? (allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/)
    : (allowNegative ? /^-?\d*$/        : /^\d*$/);

  const clamp = (n: number): number => {
    let r = n;
    if (typeof min === 'number' && r < min) r = min;
    if (typeof max === 'number' && r > max) r = max;
    return r;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw !== '' && !pattern.test(raw)) return; // reject invalid chars, keep buffer
    setBuf(raw);

    // Commit a usable number upward. Intermediate states ("", "-", ".", "0.")
    // map to 0 so dependent calcs stay stable while typing.
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      onChange(0);
      return;
    }
    const n = allowDecimal ? parseFloat(raw) : parseInt(raw, 10);
    if (!Number.isNaN(n)) onChange(clamp(n));
  };

  const handleFocus = () => { focused.current = true; };

  const handleBlur = () => {
    focused.current = false;
    // Normalize the buffer to the committed numeric value on blur.
    const n = allowDecimal ? parseFloat(buf) : parseInt(buf, 10);
    const final = Number.isNaN(n) ? 0 : clamp(n);
    if (final !== value) onChange(final);
    setBuf(toBuffer(final));
    onBlur?.();
  };

  const input = (
    <input
      id={id}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      value={buf}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      className={className}
      {...rest}
    />
  );

  if (!suffix) return input;

  return (
    <div className="relative w-full">
      {input}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-text-muted)] pointer-events-none">
        {suffix}
      </span>
    </div>
  );
}
