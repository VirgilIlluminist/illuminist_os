import React from 'react';
import CurrencyInput from '../../shared/components/CurrencyInput';

interface BaseFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'date' | 'number';
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}

interface CurrencyFieldProps extends BaseFieldProps {
  type: 'currency';
  value: number;
  onChange: (v: number) => void;
}

type FormFieldProps =
  | TextFieldProps
  | SelectFieldProps
  | TextareaFieldProps
  | CurrencyFieldProps;

const labelCls = "block text-sm font-mono text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5";
const inputCls = "w-full px-3 py-2 text-sm bg-[var(--color-card-bg)] border border-[var(--color-border-line)] text-[var(--color-text-main)] rounded-lg focus:outline-none focus:border-[var(--color-accent-highlight)] transition-colors";

export default function FormField(props: FormFieldProps) {
  const { label, required, hint, error } = props;

  return (
    <div className="space-y-1">
      <label className={labelCls}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {props.type === 'select' && (
        <select
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          className={inputCls + ' cursor-pointer'}
        >
          {props.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {props.type === 'textarea' && (
        <textarea
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows || 3}
          className={inputCls + ' resize-none'}
        />
      )}

      {props.type === 'currency' && (
        <CurrencyInput
          value={props.value}
          onChange={props.onChange}
          className={inputCls}
        />
      )}

      {(props.type === 'text' || props.type === 'email' || props.type === 'date' || props.type === 'number') && (
        <input
          type={props.type}
          value={props.value as string}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          className={inputCls}
        />
      )}

      {hint && !error && (
        <p className="text-xs text-[var(--color-text-muted)] leading-tight">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 leading-tight">{error}</p>
      )}
    </div>
  );
}
