import React, { useState, useEffect, useRef } from 'react';
import type { ProductDescription } from '../../../types/product-blackbox.types';
import { Copy, Check } from 'lucide-react';

interface Props {
  description: ProductDescription | null;
  accent:      string;
  onSave:      (data: Partial<ProductDescription>) => Promise<void>;
}

const CORE_FIELDS: { key: keyof ProductDescription; label: string; rows?: number }[] = [
  { key: 'shortDescription',  label: 'Deskripsi Singkat',   rows: 2 },
  { key: 'longDescription',   label: 'Deskripsi Lengkap',   rows: 5 },
  { key: 'specifications',    label: 'Spesifikasi Produk',   rows: 4 },
  { key: 'productStory',      label: 'Cerita Produk',        rows: 3 },
  { key: 'careInstructions',  label: 'Cara Perawatan',       rows: 2 },
];

const PLATFORM_FIELDS: { key: keyof ProductDescription; label: string; maxLen?: number }[] = [
  { key: 'shopeeDescription',    label: 'Shopee' },
  { key: 'tokopediaDescription', label: 'Tokopedia' },
  { key: 'instagramCaption',     label: 'Instagram Caption', maxLen: 2200 },
  { key: 'websiteDescription',   label: 'Website' },
];

const TEXTAREA = 'w-full bg-white/5 border border-[var(--color-border-line)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text-main)] focus:outline-none resize-none';

export default function DescriptionTab({ description, accent, onSave }: Props) {
  const [form,    setForm]    = useState<Partial<ProductDescription>>(description ?? {});
  const [saved,   setSaved]   = useState(false);
  const [copying, setCopying] = useState<string | null>(null);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (description) setForm(description); }, [description]);

  const set = (key: keyof ProductDescription, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await onSave({ [key]: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 2000);
  };

  const copyToClipboard = async (key: keyof ProductDescription) => {
    const val = form[key] as string | undefined;
    if (!val) return;
    await navigator.clipboard.writeText(val);
    setCopying(String(key));
    setTimeout(() => setCopying(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Auto-save indicator */}
      <div className="flex justify-end">
        <span className={`text-[9px] font-mono transition-opacity ${saved ? 'text-green-400 opacity-100' : 'opacity-0'}`}>
          ✓ Tersimpan
        </span>
      </div>

      {/* Core fields */}
      <div className="space-y-4">
        <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Konten Utama</p>
        {CORE_FIELDS.map(({ key, label, rows }) => (
          <div key={String(key)}>
            <label className="text-[10px] font-mono text-[var(--color-text-main)] mb-1 block">{label}</label>
            <textarea
              value={(form[key] as string) ?? ''}
              onChange={e => set(key, e.target.value)}
              rows={rows ?? 3}
              className={TEXTAREA}
            />
          </div>
        ))}
      </div>

      {/* Platform fields */}
      <div className="space-y-4">
        <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">Per Platform</p>
        {PLATFORM_FIELDS.map(({ key, label, maxLen }) => {
          const val = (form[key] as string) ?? '';
          return (
            <div key={String(key)}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-mono text-[var(--color-text-main)]">{label}</label>
                <div className="flex items-center gap-2">
                  {maxLen && <span className={`text-[8px] font-mono ${val.length > maxLen ? 'text-red-400' : 'text-[var(--color-text-muted)]'}`}>{val.length}/{maxLen}</span>}
                  <button onClick={() => copyToClipboard(key)}
                    className="flex items-center gap-1 text-[8px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] cursor-pointer">
                    {copying === String(key) ? <Check size={9} className="text-green-400"/> : <Copy size={9}/>}
                    {copying === String(key) ? 'Disalin!' : 'Copy'}
                  </button>
                </div>
              </div>
              <textarea
                value={val}
                onChange={e => set(key, e.target.value)}
                rows={4}
                className={`${TEXTAREA} ${maxLen && val.length > maxLen ? 'border-red-500/50' : ''}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
