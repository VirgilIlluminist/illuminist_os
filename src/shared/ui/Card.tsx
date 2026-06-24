import React from 'react';

interface CardProps {
  children: React.ReactNode;
  padding?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

/**
 * Card — token-driven surface primitive. Uses --bg-surface / --border-subtle
 * so it adapts automatically to the active theme (midnight/ocean/forest/rose/light).
 */
export default function Card({ children, padding, onClick, hoverable, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: padding ?? 'var(--card-padding)',
        transition: hoverable ? 'var(--transition-base)' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hoverable ? e => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.background = 'var(--bg-surface-hover)';
      } : undefined}
      onMouseLeave={hoverable ? e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.background = 'var(--bg-surface)';
      } : undefined}
    >
      {children}
    </div>
  );
}
