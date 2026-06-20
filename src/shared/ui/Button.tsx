/**
 * Button.tsx — Standar button component
 * Menggantikan 6+ varian button di seluruh aplikasi.
 */
import React from 'react';
import { Loader } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize    = 'xs' | 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:     ButtonVariant;
  size?:        ButtonSize;
  loading?:     boolean;
  icon?:        React.ReactNode;
  accentColor?: string;
  children:     React.ReactNode;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-[10px]',
  sm: 'px-3 py-1.5 text-[10.5px]',
  md: 'px-4 py-2 text-xs',
};

export default function Button({
  variant = 'ghost',
  size    = 'sm',
  loading = false,
  icon,
  accentColor = 'var(--color-accent-highlight)',
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const base = `inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold rounded transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${SIZE_CLASSES[size]}`;

  const variantStyle: React.CSSProperties = {};
  let   variantClass = '';

  switch (variant) {
    case 'primary':
      variantStyle.background = accentColor;
      variantStyle.color      = 'var(--color-background)';
      variantClass = 'hover:opacity-90';
      break;
    case 'danger':
      variantClass = 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20';
      break;
    case 'success':
      variantClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20';
      break;
    case 'outline':
      variantClass = 'border border-[var(--color-border-line)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/[0.02]';
      break;
    case 'ghost':
    default:
      variantClass = 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/[0.03]';
      break;
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${base} ${variantClass} ${className}`}
      style={{ ...variantStyle, ...props.style }}
    >
      {loading
        ? <Loader size={11} className="animate-spin" />
        : icon && <span className="shrink-0">{icon}</span>
      }
      {children}
    </button>
  );
}
