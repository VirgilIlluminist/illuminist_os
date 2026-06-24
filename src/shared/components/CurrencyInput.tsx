import React, { useState, useEffect } from 'react';
import { useERP } from '../../app/store/ERPContext';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  className = '',
  placeholder = '',
  id
}: CurrencyInputProps) {
  const { config, formatMoney } = useERP();
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');

  const isIDR = config?.activeCurrency === 'IDR' || config?.currencySymbol === 'Rp';

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatMoney(value));
    }
  }, [value, isFocused, config]);

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value === 0 ? '' : String(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputValue(rawVal);
    
    let parsedValue = 0;
    if (isIDR) {
      const cleaned = rawVal.replace(/[^\d-]/g, '');
      const parsed = parseInt(cleaned, 10);
      parsedValue = isNaN(parsed) ? 0 : parsed;
    } else {
      const cleaned = rawVal.replace(/[^0-9.-]/g, '');
      const parsed = parseFloat(cleaned);
      parsedValue = isNaN(parsed) ? 0 : parsed;
    }
    onChange(parsedValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsedValue = 0;
    if (isIDR) {
      const cleaned = inputValue.replace(/[^\d-]/g, '');
      parsedValue = parseInt(cleaned, 10) || 0;
    } else {
      const cleaned = inputValue.replace(/[^0-9.-]/g, '');
      parsedValue = parseFloat(cleaned) || 0;
    }
    onChange(parsedValue);
    setInputValue(formatMoney(parsedValue));
  };

  return (
    <div className="relative w-full">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} w-full`}
      />
      {isFocused && (
        <span className="absolute left-0 -bottom-4.5 text-[9px] text-[var(--color-accent-highlight)] tracking-wider animate-fadeIn z-10 bg-[var(--color-card-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border-line)] whitespace-nowrap">
          {isIDR ? "ketik angka saja, contoh: 12000" : "ketik angka saja, contoh: 12.50"}
        </span>
      )}
    </div>
  );
}
