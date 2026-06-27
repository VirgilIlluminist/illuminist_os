/**
 * Tabs.tsx — Standar tab navigation untuk seluruh aplikasi
 * Menggantikan 5 implementasi tab berbeda di views.
 *
 * Cara pakai:
 *   <Tabs
 *     tabs={[{ id:'products', label:'Produk', count:12 }]}
 *     active={activeTab}
 *     onChange={setActiveTab}
 *   />
 */
import React from 'react';
import { motion } from 'motion/react';

export interface TabItem {
  id:       string;
  label:    string;
  count?:   number | null;
  icon?:    React.ReactNode;
  disabled?:boolean;
}

interface TabsProps {
  tabs:       TabItem[];
  active:     string;
  onChange:   (id: string) => void;
  accentColor?:string;
  size?:      'sm' | 'md';
  className?: string;
  layoutId?:  string;
}

export default function Tabs({
  tabs, active, onChange,
  accentColor = 'var(--color-accent-highlight)',
  size = 'md',
  className = '',
  layoutId = 'tab-indicator',
}: TabsProps) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-sm';

  return (
    <div className={`flex gap-0.5 overflow-x-auto border-b border-[var(--color-border-line)] ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 font-mono uppercase tracking-wider whitespace-nowrap transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${textSize} ${
              isActive
                ? 'text-[var(--color-text-main)] font-bold'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                isActive
                  ? 'bg-[var(--color-border-line)] text-[var(--color-text-main)]'
                  : 'bg-[var(--color-border-line)] text-[var(--color-text-muted)]'
              }`}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: accentColor }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
